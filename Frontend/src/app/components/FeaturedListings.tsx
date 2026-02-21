import React from 'react';
import { toast } from 'sonner';
import { Star, MapPin, Bookmark } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MOCK_LISTINGS } from '../data/mockListings';
import { useBookmarks } from '../context/BookmarkContext';
import { ListingBadges } from './ListingBadges';
import { ConditionBadge } from './ConditionBadge';

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
    console.log('Featured listing clicked:', listing.id);
    window.location.hash = `#listing/${listing.id}`;
  };

  return (
    <section id="featured" className="bg-[#F9FAFB] py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 className="text-4xl font-bold text-[#111827] mb-12">Trending Near You</h2>

        <div className="overflow-x-auto -mx-6 px-6 scroll-smooth">
          <div className="flex gap-6 pb-4">
            {FEATURED.map((listing) => (
              <div
                key={listing.id}
                onClick={() => handleListingClick(listing)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleListingClick(listing)}
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
                  <button
                    type="button"
                    onClick={(e) => handleBookmark(e, listing.id)}
                    className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 active:scale-95"
                  >
                    <Bookmark
                      className={`w-5 h-5 transition-all duration-300 ${isBookmarked(listing.id) ? 'text-blue-600' : 'text-gray-600'}`}
                      fill={isBookmarked(listing.id) ? 'currentColor' : 'none'}
                    />
                  </button>
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
