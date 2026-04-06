"use client";

import ListingCard from "./ListingCard";
import ListingCardSkeleton from "./ListingCardSkeleton";
import EmptyState from "./EmptyState";
import type { Listing, NearbyListing } from "@/lib/types/listing";

interface ListingsGridProps {
  listings: Array<Listing | NearbyListing>;
  loading?: boolean;
  query?: string;
}

// Keep skeleton count aligned with the default page size (20) so the loading
// state matches the eventual number of items shown per page.
const SKELETON_COUNT = 20;

export default function ListingsGrid({
  listings,
  loading = false,
  query,
}: ListingsGridProps) {
  const gridClass =
    "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4";

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return <EmptyState query={query} />;
  }

  return (
    <div className={gridClass}>
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
