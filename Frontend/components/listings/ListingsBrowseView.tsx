import { Suspense } from "react";
import SearchBar from "@/components/listings/SearchBar";
import ListingCardSkeleton from "@/components/listings/ListingCardSkeleton";
import FilterSidebarClientWrapper from "@/components/listings/FilterSidebarClientWrapper";
import MobileFilterButtonWrapper from "@/components/listings/MobileFilterButtonWrapper";
import ActiveFilterChips from "@/components/listings/ActiveFilterChips";
import ListingsDiscoveryPanel from "@/components/listings/ListingsDiscoveryPanel";
import type { Listing } from "@/lib/types/listing";
import type { ListingCondition } from "@/lib/validators/listings";

export interface ListingsBrowseViewProps {
  listings: Listing[];
  q: string;
  activeCategory: string | null;
  priceMin: number | null;
  priceMax: number | null;
  condition: ListingCondition | null;
  includeSold: boolean;
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

/**
 * Shared browse view for /search and /listings. Renders filter sidebar, search bar,
 * active filter chips, and results grid. URL is the source of truth (handled by
 * client wrappers via router.push); this component only displays the current state.
 */
export function ListingsBrowseView({
  listings,
  q,
  activeCategory,
  priceMin,
  priceMax,
  condition,
  includeSold,
}: ListingsBrowseViewProps) {
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
            includeSold={includeSold}
          />
        </Suspense>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-surface">
        <div className="max-w-screen-xl mx-auto px-4 py-5 space-y-4">
          {/* Search bar row */}
          <div className="flex items-center gap-3">
            <div className="block md:hidden">
              <Suspense fallback={null}>
                <MobileFilterButtonWrapper
                  activeCategory={activeCategory}
                  priceMin={priceMin}
                  priceMax={priceMax}
                  condition={condition}
                  includeSold={includeSold}
                />
              </Suspense>
            </div>
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
          </div>

          <Suspense fallback={null}>
            <ActiveFilterChips
              q={q}
              category={activeCategory}
              priceMin={priceMin}
              priceMax={priceMax}
              condition={condition}
              includeSold={includeSold}
            />
          </Suspense>

          <Suspense fallback={<SkeletonGrid />}>
            <ListingsDiscoveryPanel listings={listings} q={q} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
