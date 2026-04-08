"use client";

import { useEffect, useRef, useState } from "react";
import ListingsGrid from "@/components/listings/ListingsGrid";
import type { Listing, NearbyListing } from "@/lib/types/listing";

type BrowseMode = "search" | "nearby";
type GeoState = "idle" | "requesting" | "granted" | "denied" | "unsupported" | "error";

interface NearbyListingsResponse {
  listings: NearbyListing[];
  radius_km: number;
  count: number;
}

interface ListingsDiscoveryPanelProps {
  listings: Listing[];
  q: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const DEFAULT_NEARBY_RADIUS_KM = 10;
const MIN_NEARBY_RADIUS_KM = 1;
const MAX_NEARBY_RADIUS_KM = 50;
function formatNearbyCount(count: number): string {
  return `${count.toLocaleString("en-US")} nearby result${count === 1 ? "" : "s"}`;
}

function formatRadiusLabel(radiusKm: number): string {
  return `${radiusKm} km (${(radiusKm * 0.621371).toFixed(1)} mi)`;
}

export default function ListingsDiscoveryPanel({
  listings,
  q,
}: ListingsDiscoveryPanelProps) {
  const [mode, setMode] = useState<BrowseMode>("search");
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [radiusKm, setRadiusKm] = useState(DEFAULT_NEARBY_RADIUS_KM);
  const [nearbyListings, setNearbyListings] = useState<NearbyListing[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const [requestAttempt, setRequestAttempt] = useState(0);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (mode !== "nearby" || hasRequestedRef.current) {
      return;
    }

    if (!("geolocation" in navigator)) {
      setGeoState("unsupported");
      setNearbyError("Location is not supported in this browser. You can keep browsing all listings instead.");
      hasRequestedRef.current = true;
      return;
    }

    hasRequestedRef.current = true;
    setGeoState("requesting");
    setNearbyError(null);
    setIsLoadingNearby(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setGeoState("granted");
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location access was denied. Nearby listings need your browser location permission."
            : error.code === error.POSITION_UNAVAILABLE
              ? "Your location could not be determined right now."
              : error.code === error.TIMEOUT
                ? "Location request timed out. Please try again."
                : "Unable to access your location.";

        setGeoState(error.code === error.PERMISSION_DENIED ? "denied" : "error");
        setNearbyError(`${message} You can continue browsing all listings instead.`);
        setCoordinates(null);
        setNearbyListings([]);
        setIsLoadingNearby(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 5 * 60 * 1_000,
      }
    );
  }, [mode, requestAttempt]);

  useEffect(() => {
    if (mode !== "nearby" || coordinates == null) {
      return;
    }

    let cancelled = false;

    const fetchNearbyListings = async () => {
      setIsLoadingNearby(true);
      setNearbyError(null);

      try {
        const params = new URLSearchParams({
          lat: String(coordinates.lat),
          lng: String(coordinates.lng),
          radius: String(radiusKm),
        });

        const response = await fetch(`/api/listings/nearby?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(data?.error ?? "Unable to load nearby listings.");
        }

        const data = (await response.json()) as NearbyListingsResponse;
        if (cancelled) {
          return;
        }

        setNearbyListings(data.listings);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to load nearby listings.";
        setGeoState("error");
        setNearbyError(`${message} You can continue browsing all listings instead.`);
        setNearbyListings([]);
      } finally {
        if (!cancelled) {
          setIsLoadingNearby(false);
        }
      }
    };

    void fetchNearbyListings();

    return () => {
      cancelled = true;
    };
  }, [coordinates, mode, radiusKm]);

  const handleRetryNearby = () => {
    hasRequestedRef.current = false;
    setCoordinates(null);
    setNearbyListings([]);
    setNearbyError(null);
    setGeoState("idle");
    setRequestAttempt((current) => current + 1);
    setMode("nearby");
  };

  const resultSummary =
    mode === "nearby"
      ? isLoadingNearby
        ? "Finding listings near you..."
        : nearbyError
          ? "Nearby listings unavailable"
          : formatNearbyCount(nearbyListings.length)
      : listings.length === 0
        ? q
          ? `No results for "${q}"`
          : "No listings found"
        : `${listings.length.toLocaleString("en-US")} result${listings.length !== 1 ? "s" : ""}${q ? ` for "${q}"` : ""}`;

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-border bg-card p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setMode("search")}
            className={[
              "rounded-card px-4 py-2 text-sm font-semibold transition-colors",
              mode === "search"
                ? "bg-primary text-white shadow-card"
                : "text-text-secondary hover:bg-surface",
            ].join(" ")}
            aria-pressed={mode === "search"}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setMode("nearby")}
            className={[
              "rounded-card px-4 py-2 text-sm font-semibold transition-colors",
              mode === "nearby"
                ? "bg-primary text-white shadow-card"
                : "text-text-secondary hover:bg-surface",
            ].join(" ")}
            aria-pressed={mode === "nearby"}
          >
            Nearby
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-text-secondary">{resultSummary}</p>

        {mode === "nearby" ? (
          <div className="space-y-4">
            <div className="rounded-card border border-border bg-card px-4 py-3">
              <p className="text-sm font-medium text-text-primary">
                {geoState === "requesting"
                  ? "Your browser should ask for location permission so we can find nearby listings."
                  : geoState === "granted"
                    ? `Showing listings within ${formatRadiusLabel(radiusKm)} of your current location.`
                    : "Nearby listings use your browser location and never require typing an address."}
              </p>
              {geoState === "granted" && !nearbyError ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label
                      htmlFor="nearby-radius"
                      className="text-sm font-medium text-text-primary"
                    >
                      Nearby radius
                    </label>
                    <span className="text-sm text-text-secondary">
                      {formatRadiusLabel(radiusKm)}
                    </span>
                  </div>
                  <input
                    id="nearby-radius"
                    type="range"
                    min={MIN_NEARBY_RADIUS_KM}
                    max={MAX_NEARBY_RADIUS_KM}
                    step={1}
                    value={radiusKm}
                    onChange={(event) =>
                      setRadiusKm(Number.parseInt(event.target.value, 10))
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface accent-primary"
                  />
                </div>
              ) : null}
              {nearbyError ? (
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-text-secondary">{nearbyError}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRetryNearby}
                      className="rounded-card border border-border px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface"
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("search")}
                      className="rounded-card bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      Back to Search
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <ListingsGrid
              listings={nearbyListings}
              loading={isLoadingNearby}
              query={undefined}
            />
          </div>
        ) : (
          <ListingsGrid listings={listings} query={q} />
        )}
      </div>
    </div>
  );
}
