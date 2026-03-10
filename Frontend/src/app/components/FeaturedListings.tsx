import React from 'react';
import { toast } from 'sonner';
import { MOCK_LISTINGS } from '../data/mockListings';
import { useBookmarks } from '../context/BookmarkContext';
import { ListingCard } from './ListingCard';

const FEATURED = MOCK_LISTINGS.slice(0, 4);

export function FeaturedListings() {
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const handleBookmark = (e: React.MouseEvent, id: number): void => {
    e.stopPropagation();
    const currentlyBookmarked = isBookmarked(id);
    toggleBookmark(id);
    toast.success(currentlyBookmarked ? '📌 Removed bookmark' : '⭐ Added bookmark');
  };

  const handleListingClick = (listing: (typeof MOCK_LISTINGS)[0]): void => {
    window.location.hash = `#listing/${listing.id}`;
  };

  return (
    <section id="featured" className="bg-[#F9FAFB] py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 className="text-4xl font-bold text-[#111827] mb-12">Trending Near You</h2>

        <div className="overflow-x-auto -mx-6 px-6 scroll-smooth">
          <div className="flex gap-6 pb-4">
            {FEATURED.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClick={() => handleListingClick(listing)}
                onBookmark={(e) => handleBookmark(e, listing.id)}
                isBookmarked={isBookmarked(listing.id)}
                className="flex-shrink-0 w-72"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
