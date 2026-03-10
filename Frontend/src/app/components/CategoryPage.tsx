import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { MOCK_LISTINGS } from '../data/mockListings';
import { useBookmarks } from '../context/BookmarkContext';
import { ListingCard } from './ListingCard';
import { PRICE_FILTERS, type PriceFilterKey } from '../data/constants';

type CategoryPageProps = { categoryName: string };

export function CategoryPage({ categoryName }: CategoryPageProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [priceFilter, setPriceFilter] = useState<PriceFilterKey>('all');
  const categoryListings = useMemo(
    () => MOCK_LISTINGS.filter((l) => l.category === categoryName),
    [categoryName]
  );
  const priceFilterCounts = useMemo(() => {
    const counts: Record<PriceFilterKey, number> = {
      all: categoryListings.length,
      free: 0,
      under20: 0,
      under50: 0,
      '50to100': 0,
      '100plus': 0,
    };
    categoryListings.forEach((l) => {
      if (l.price === 0) counts.free++;
      else if (l.price <= 20) counts.under20++;
      else if (l.price < 50) counts.under50++;
      else if (l.price >= 50 && l.price <= 100) counts['50to100']++;
      else counts['100plus']++;
    });
    return counts;
  }, [categoryListings]);
  const listings = useMemo(() => {
    const test = PRICE_FILTERS.find((f) => f.key === priceFilter)?.test ?? (() => true);
    return categoryListings.filter((l) => test(l.price));
  }, [categoryListings, priceFilter]);

  const handleBackToBrowse = (): void => {
    window.location.hash = '#browse';
  };

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

        <h1 className="text-4xl font-bold text-[#111827] mb-4">{categoryName}</h1>

        <div className="flex flex-wrap gap-2 mb-6">
          {PRICE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setPriceFilter(f.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                priceFilter === f.key ? 'bg-[#1E3A8A] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'
              }`}
            >
              {f.label} ({priceFilterCounts[f.key]})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onClick={() => handleListingClick(listing)}
              onBookmark={(e) => handleBookmark(e, listing.id)}
              isBookmarked={isBookmarked(listing.id)}
            />
          ))}
        </div>
        {listings.length === 0 && (
          <p className="text-center text-[#6B7280] py-12">No listings in this category.</p>
        )}
      </div>
    </div>
  );
}
