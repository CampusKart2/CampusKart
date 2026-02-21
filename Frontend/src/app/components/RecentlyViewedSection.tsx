import React, { useEffect, useState } from 'react';
import { Star, MapPin } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MOCK_LISTINGS, getRecentlyViewedIds } from '../data/mockListings';
import { ListingBadges } from './ListingBadges';
import { ConditionBadge } from './ConditionBadge';

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
    console.log('Recently viewed item clicked:', id);
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
              <div
                key={listing.id}
                onClick={() => handleListingClick(listing.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleListingClick(listing.id)}
                className="flex-shrink-0 w-72 bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-in-out cursor-pointer group shadow-sm"
              >
                <div className="relative w-full h-56 bg-gray-100 overflow-hidden">
                  <ImageWithFallback
                    src={listing.image}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                  />
                  <ListingBadges listing={listing} />
                  <div className="absolute bottom-2 right-2 z-10">
                    <ConditionBadge condition={listing.condition} />
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="font-semibold text-[#111827] text-lg leading-tight">{listing.title}</h3>
                  <div className="text-3xl font-bold text-[#1E3A8A]">
                    {listing.price === 0 ? 'Free' : `$${listing.price}`}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#FBBF24] fill-[#FBBF24]" />
                      <span className="text-sm font-semibold text-[#111827]">{listing.rating}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#F9FAFB] px-3 py-1.5 rounded-full">
                      <MapPin className="w-3.5 h-3.5 text-[#6B7280]" />
                      <span className="text-sm text-[#6B7280] font-medium">{listing.campus}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
