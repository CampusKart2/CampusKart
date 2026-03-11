import { Suspense } from "react";
import SearchBar from "@/components/listings/SearchBar";
import ListingsGrid from "@/components/listings/ListingsGrid";
import ListingCardSkeleton from "@/components/listings/ListingCardSkeleton";
import CategorySidebarClientWrapper from "@/components/listings/CategorySidebarClientWrapper";
import MobileFilterButtonWrapper from "@/components/listings/MobileFilterButtonWrapper";
import type { Listing } from "@/lib/types/listing";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

async function fetchListings(q: string, category: string): Promise<Listing[]> {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "", category = "" } = await searchParams;
  const listings = await fetchListings(q, category);
  const activeCategory = category || null;

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* ── Left sidebar — desktop only ── */}
      <div className="hidden md:block h-full overflow-y-auto flex-shrink-0">
        <Suspense fallback={null}>
          <CategorySidebarClientWrapper activeCategory={activeCategory} />
        </Suspense>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-surface">
        <div className="max-w-screen-xl mx-auto px-4 py-5 space-y-4">
          {/* Search bar row */}
          <div className="flex items-center gap-3">
            {/* Mobile filter button */}
            <div className="block md:hidden">
              <Suspense fallback={null}>
                <MobileFilterButtonWrapper activeCategory={activeCategory} />
              </Suspense>
            </div>
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
          </div>

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

