"use client";

import Image from "next/image";
import { Camera, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import SoldBannerOverlay from "@/components/listings/SoldBannerOverlay";

interface ListingImageCarouselProps {
  /** Ordered image URLs. Empty/invalid entries are ignored. */
  images: readonly (string | null | undefined)[];
  /** Used as alt text and for placeholder state. */
  title: string;
  /** Whether the listing is sold and should show a banner. */
  isSold?: boolean;
}

export default function ListingImageCarousel({
  images,
  title,
  isSold = false,
}: ListingImageCarouselProps) {
  const cleaned = useMemo(
    () => images.filter((u): u is string => typeof u === "string" && u.length > 0),
    [images]
  );

  const [index, setIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [failedUrls, setFailedUrls] = useState<ReadonlySet<string>>(
    () => new Set<string>()
  );
  const displayImages = useMemo(
    () => cleaned.filter((url) => !failedUrls.has(url)),
    [cleaned, failedUrls]
  );
  const count = displayImages.length;

  const canCycle = count > 1;
  const safeIndex = count === 0 ? 0 : Math.min(index, count - 1);
  const src = displayImages[safeIndex] ?? null;

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("overflow-hidden");

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("overflow-hidden");
    };
  }, [isLightboxOpen]);

  const prev = () => {
    if (!canCycle) return;
    setIndex((i) => (i - 1 + count) % count);
  };
  const next = () => {
    if (!canCycle) return;
    setIndex((i) => (i + 1) % count);
  };

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-card border border-border bg-gray-50">
      <div className="relative h-full w-full overflow-hidden bg-gray-50">
        {isSold ? <SoldBannerOverlay /> : null}
        {src ? (
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="relative h-full w-full cursor-zoom-in bg-gray-50"
            aria-label={`Open larger image of ${title}`}
          >
            <Image
              src={src}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              className="h-full w-full bg-gray-50 object-contain"
              onError={() => {
                setFailedUrls((previous) => new Set(previous).add(src));
              }}
              priority
            />
          </button>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-100 text-gray-400">
            <Camera className="h-12 w-12" strokeWidth={1.5} aria-hidden="true" />
            <div className="text-sm font-medium text-gray-500">
              No image available
            </div>
          </div>
        )}
      </div>

      {src && isLightboxOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Expanded image of ${title}`}
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-gray-900 shadow-lg transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Close image"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>

          <div
            className="relative h-full max-h-[90vh] w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={src}
              alt={title}
              fill
              sizes="100vw"
              className="h-full w-full object-contain"
              priority
            />
          </div>
        </div>
      ) : null}

      {/* Controls */}
      {canCycle && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-card/90 backdrop-blur border border-border px-3 py-2 text-sm font-semibold text-text-primary hover:bg-card transition"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-card/90 backdrop-blur border border-border px-3 py-2 text-sm font-semibold text-text-primary hover:bg-card transition"
          >
            ›
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
            {displayImages.map((_u, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === safeIndex}
                className={[
                  "h-2.5 w-2.5 rounded-full border transition",
                  i === safeIndex
                    ? "bg-primary border-primary"
                    : "bg-card/80 border-border hover:bg-card",
                ].join(" ")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

