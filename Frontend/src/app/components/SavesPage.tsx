import React from 'react';
import { toast } from 'sonner';
import { Star, MapPin, ArrowLeft, Bookmark } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useBookmarks } from '../context/BookmarkContext';
import { MOCK_LISTINGS } from '../data/mockListings';
import { ListingBadges } from './ListingBadges';
import { ConditionBadge } from './ConditionBadge';

export function SavesPage() {
  const { bookmarkedIds, toggleBookmark, isBookmarked } = useBookmarks();
  const listings = bookmarkedIds
    .map((id) => MOCK_LISTINGS.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => !!l);

  const handleBackToBrowse = (): void => {
    console.log('Back to browse from Saves');
    window.location.hash = '#browse';
  };

  const handleListingClick = (id: number): void => {
    console.log('Saved listing clicked:', id);
    window.location.hash = `#listing/${id}`;
  };

  const handleRemoveBookmark = (e: React.MouseEvent, id: number): void => {
    e.stopPropagation();
    toggleBookmark(id);
    toast.success('Removed from saved items');
    console.log('Remove bookmark:', id);
  };

  if (listings.length === 0) {
    return (
      <div className="bg-[#F9FAFB] min-h-screen py-8">
        <div className="max-w-[1200px] mx-auto px-6">
          <button
            type="button"
            onClick={handleBackToBrowse}
            className="flex items-center gap-2 text-[#6B7280] hover:text-[#1E3A8A] font-medium mb-6 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to browse
          </button>
          <h1 className="text-4xl font-bold text-[#111827] mb-6">My Saves</h1>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center">
            <p className="text-[#6B7280] text-lg">No saved items yet. Start browsing!</p>
            <a
              href="#browse"
              className="inline-block mt-4 px-6 py-3 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] transition-all duration-300 font-medium"
            >
              Continue Browsing
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9FAFB] min-h-screen py-8">
      <div className="max-w-[1200px] mx-auto px-6">
        <button
          type="button"
          onClick={handleBackToBrowse}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#1E3A8A] font-medium mb-6 transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to browse
        </button>
        <h1 className="text-4xl font-bold text-[#111827] mb-8">My Saves</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              onClick={() => handleListingClick(listing.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleListingClick(listing.id)}
              className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-in-out cursor-pointer group shadow-sm"
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
                  onClick={(e) => handleRemoveBookmark(e, listing.id)}
                  className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-red-50 hover:scale-110 transition-all duration-300 active:scale-95 text-red-600"
                  aria-label="Remove from saved"
                >
                  <Bookmark className="w-5 h-5" fill="currentColor" />
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
  );
}
