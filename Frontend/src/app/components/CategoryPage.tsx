import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Star, MapPin, Bookmark, ArrowLeft } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MOCK_LISTINGS } from '../data/mockListings';
import { useBookmarks } from '../context/BookmarkContext';
import { ListingBadges } from './ListingBadges';
import { ConditionBadge } from './ConditionBadge';

type PriceFilterKey = 'all' | 'free' | 'under20' | 'under50' | '50to100' | '100plus';

const PRICE_FILTERS: { key: PriceFilterKey; label: string; test: (price: number) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'free', label: 'Free', test: (p) => p === 0 },
  { key: 'under20', label: 'Under $20', test: (p) => p > 0 && p <= 20 },
  { key: 'under50', label: 'Under $50', test: (p) => p > 0 && p < 50 },
  { key: '50to100', label: '$50-$100', test: (p) => p >= 50 && p <= 100 },
  { key: '100plus', label: '$100+', test: (p) => p > 100 },
];

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
    console.log('Back to browse clicked');
    window.location.hash = '#browse';
  };

  const handleBookmark = (e: React.MouseEvent, id: number): void => {
    e.stopPropagation();
    const currentlyBookmarked = isBookmarked(id);
    toggleBookmark(id);
    toast.success(currentlyBookmarked ? '📌 Removed bookmark' : '⭐ Added bookmark');
  };

  const handleListingClick = (listing: (typeof MOCK_LISTINGS)[0]): void => {
    console.log('Listing clicked:', listing);
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
              onClick={() => {
                setPriceFilter(f.key);
                console.log('Category price filter:', f.key);
              }}
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
            <div
              key={listing.id}
              onClick={() => handleListingClick(listing)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleListingClick(listing)}
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
                  onClick={(e) => handleBookmark(e, listing.id)}
                  className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 active:scale-95"
                >
                  <Bookmark
                    className={`w-5 h-5 ${isBookmarked(listing.id) ? 'text-blue-600' : 'text-gray-600'}`}
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
        {listings.length === 0 && (
          <p className="text-center text-[#6B7280] py-12">No listings in this category.</p>
        )}
      </div>
    </div>
  );
}
