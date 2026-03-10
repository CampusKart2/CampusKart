import React, { useEffect, useState } from 'react';
import { MOCK_LISTINGS, getRecentlyViewedIds } from '../data/mockListings';
import { ListingCard } from './ListingCard';

const MAX_DISPLAY = 6;

export function RecentlyViewedSection() {
  const [recentIds, setRecentIds] = useState<number[]>([]);

  useEffect(() => {
    setRecentIds(getRecentlyViewedIds());
  }, []);

  const listings = recentIds
    .map((id) => MOCK_LISTINGS.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => !!l)
    .slice(0, MAX_DISPLAY);

  const handleListingClick = (id: number): void => {
    window.location.hash = `#listing/${id}`;
  };

  if (listings.length === 0) {
    return (
      <section className="bg-white py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-4xl font-bold text-[#111827] mb-8">Recently Viewed</h2>
          <p className="text-[#6B7280] text-lg">Browse items to see your history.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 className="text-4xl font-bold text-[#111827] mb-8">Recently Viewed</h2>
        <div className="overflow-x-auto -mx-6 px-6 scroll-smooth">
          <div className="flex gap-6 pb-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClick={() => handleListingClick(listing.id)}
                className="flex-shrink-0 w-72"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
