import type { Listing } from "@/lib/types/listing";
import { SEARCH_PARAM_KEYS } from "@/lib/search-params";
import {
  LISTING_CONDITIONS,
  type ListingCondition,
} from "@/lib/validators/listings";

/** Parsed search params for the listings browse page (search or /listings). */
export interface ListingsBrowseParams {
  q: string;
  category: string;
  priceMin: number | null;
  priceMax: number | null;
  condition: ListingCondition | null;
  includeSold: boolean;
}

/** Raw searchParams from the page (e.g. from searchParams Promise). */
export type RawSearchParams = Record<string, string | undefined>;

export function parseListingsSearchParams(
  raw: RawSearchParams
): ListingsBrowseParams {
  const category = raw[SEARCH_PARAM_KEYS.category] ?? "";
  const priceMin = parseOptionalNumber(raw[SEARCH_PARAM_KEYS.price_min]);
  const priceMax = parseOptionalNumber(raw[SEARCH_PARAM_KEYS.price_max]);
  const condition = parseCondition(raw[SEARCH_PARAM_KEYS.condition]);
  const includeSold = parseBoolean(raw[SEARCH_PARAM_KEYS.include_sold]);
  return {
    q: raw[SEARCH_PARAM_KEYS.q] ?? "",
    category,
    priceMin,
    priceMax,
    condition,
    includeSold,
  };
}

function parseCondition(value: string | undefined): ListingCondition | null {
  if (!value) return null;
  return LISTING_CONDITIONS.includes(value as ListingCondition)
    ? (value as ListingCondition)
    : null;
}

function parseOptionalNumber(value: string | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number.parseFloat(value);
  return Number.isNaN(n) ? null : n;
}

function parseBoolean(value: string | undefined): boolean {
  return value === "true";
}

/**
 * Fetches listings from GET /api/listings with the given filters.
 * Used by both /search and /listings browse pages.
 */
export async function fetchListingsForBrowse(
  params: ListingsBrowseParams
): Promise<Listing[]> {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.category) searchParams.set("category", params.category);
  if (params.priceMin != null)
    searchParams.set("price_min", String(params.priceMin));
  if (params.priceMax != null)
    searchParams.set("price_max", String(params.priceMax));
  if (params.condition) searchParams.set("condition", params.condition);
  if (params.includeSold) searchParams.set("include_sold", "true");
  searchParams.set("page", "1");
  searchParams.set("limit", "20");

  const res = await fetch(`${base}/api/listings?${searchParams.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) return [];
  const data = (await res.json()) as { listings?: Listing[] } | Listing[];
  return Array.isArray(data) ? data : (data.listings ?? []);
}

export function formatListingsCount(n: number): string {
  return n.toLocaleString("en-US");
}
