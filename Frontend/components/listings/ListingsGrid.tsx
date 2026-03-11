"use client";

import ListingCard from "./ListingCard";
import ListingCardSkeleton from "./ListingCardSkeleton";
import EmptyState from "./EmptyState";
import type { Listing } from "@/lib/types/listing";

interface ListingsGridProps {
  listings: Listing[];
  loading?: boolean;
  query?: string;
}

const SKELETON_COUNT = 12;

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
