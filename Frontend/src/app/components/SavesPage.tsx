import React from 'react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';
import { MOCK_LISTINGS } from '../data/mockListings';
import { ListingCard } from './ListingCard';

export function SavesPage() {
  const { bookmarkedIds, toggleBookmark, isBookmarked } = useBookmarks();
  const listings = bookmarkedIds
    .map((id) => MOCK_LISTINGS.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => !!l);

  const handleBackToBrowse = (): void => {
    window.location.hash = '#browse';
  };

  const handleListingClick = (id: number): void => {
    window.location.hash = `#listing/${id}`;
  };

  const handleRemoveBookmark = (e: React.MouseEvent, id: number): void => {
    e.stopPropagation();
    toggleBookmark(id);
    toast.success('Removed from saved items');
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
            <ListingCard
              key={listing.id}
              listing={listing}
              onClick={() => handleListingClick(listing.id)}
              onBookmark={(e) => handleRemoveBookmark(e, listing.id)}
              isBookmarked={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
