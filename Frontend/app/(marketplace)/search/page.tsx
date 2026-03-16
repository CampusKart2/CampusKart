import { Suspense } from "react";
import SearchBar from "@/components/listings/SearchBar";
import ListingsGrid from "@/components/listings/ListingsGrid";
import ListingCardSkeleton from "@/components/listings/ListingCardSkeleton";
import FilterSidebarClientWrapper from "@/components/listings/FilterSidebarClientWrapper";
import MobileFilterButtonWrapper from "@/components/listings/MobileFilterButtonWrapper";
import ActiveFilterChips from "@/components/listings/ActiveFilterChips";
import type { Listing } from "@/lib/types/listing";
import { SEARCH_PARAM_KEYS } from "@/lib/search-params";
import {
  LISTING_CONDITIONS,
  type ListingCondition,
} from "@/lib/validators/listings";

/**
 * Search/listings page. URL query params are the source of truth so that:
 * - Filter state is synced to the URL on every change (sharable links).
 * - Back/forward restores state (client uses router.push; server reads searchParams on load).
 */
interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    price_min?: string;
    price_max?: string;
    condition?: string;
  }>;
}

interface FetchListingsParams {
  q: string;
  category: string;
  priceMin: number | null;
  priceMax: number | null;
  condition: ListingCondition | null;
}

async function fetchListings({
  q,
  category,
  priceMin,
  priceMax,
  condition,
}: FetchListingsParams): Promise<Listing[]> {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (priceMin != null) params.set("price_min", String(priceMin));
  if (priceMax != null) params.set("price_max", String(priceMax));
  if (condition) params.set("condition", condition);
  params.set("page", "1");
  params.set("limit", "20");

  const res = await fetch(`${base}/api/listings?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) return [];
  const data = (await res.json()) as { listings?: Listing[] } | Listing[];
  return Array.isArray(data) ? data : (data.listings ?? []);
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

function formatCount(n: number) {
  return n.toLocaleString("en-US");
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const raw = await searchParams;
  const q = raw[SEARCH_PARAM_KEYS.q] ?? "";
  const category = raw[SEARCH_PARAM_KEYS.category] ?? "";
  const priceMin = parseOptionalNumber(raw[SEARCH_PARAM_KEYS.price_min]);
  const priceMax = parseOptionalNumber(raw[SEARCH_PARAM_KEYS.price_max]);
  const condition = parseCondition(raw[SEARCH_PARAM_KEYS.condition]);

  const listings = await fetchListings({
    q,
    category,
    priceMin,
    priceMax,
    condition,
  });

  const activeCategory = category || null;

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* ── Filter sidebar — desktop only ── */}
      <div className="hidden md:block h-full overflow-y-auto flex-shrink-0">
        <Suspense fallback={null}>
          <FilterSidebarClientWrapper
            activeCategory={activeCategory}
            priceMin={priceMin}
            priceMax={priceMax}
            condition={condition}
          />
        </Suspense>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-surface">
        <div className="max-w-screen-xl mx-auto px-4 py-5 space-y-4">
          {/* Search bar row */}
          <div className="flex items-center gap-3">
            {/* Mobile filter button and bottom drawer */}
            <div className="block md:hidden">
              <Suspense fallback={null}>
                <MobileFilterButtonWrapper
                  activeCategory={activeCategory}
                  priceMin={priceMin}
                  priceMax={priceMax}
                  condition={condition}
                />
              </Suspense>
            </div>
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
          </div>

          {/* Active filter chips — each chip has a remove button; clearing updates URL */}
          <Suspense fallback={null}>
            <ActiveFilterChips
              q={q}
              category={activeCategory}
              priceMin={priceMin}
              priceMax={priceMax}
              condition={condition}
            />
          </Suspense>

          {/* Results count */}
          <p className="text-sm text-text-secondary">
            {listings.length === 0
              ? q
                ? `No results for "${q}"`
                : "No listings found"
              : `${formatCount(listings.length)} result${listings.length !== 1 ? "s" : ""}${q ? ` for "${q}"` : ""}`}
          </p>

          {/* Grid */}
          <Suspense fallback={<SkeletonGrid />}>
            <ListingsGrid listings={listings} query={q} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

