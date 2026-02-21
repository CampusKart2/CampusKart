import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Star, MapPin, Bookmark, ArrowLeft } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MOCK_LISTINGS } from '../data/mockListings';
import { useBookmarks } from '../context/BookmarkContext';
import { ListingBadges } from './ListingBadges';
import { ConditionBadge } from './ConditionBadge';

const CATEGORIES = ['Textbooks', 'Furniture', 'Electronics', 'Clothing', 'Dorm Essentials'] as const;
const SORT_OPTIONS = ['Recent', 'Price Low-High', 'Price High-Low', 'Rating'] as const;

type PriceFilterKey = 'all' | 'free' | 'under20' | 'under50' | '50to100' | '100plus';

const PRICE_FILTERS: { key: PriceFilterKey; label: string; test: (price: number) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'free', label: 'Free', test: (p) => p === 0 },
  { key: 'under20', label: 'Under $20', test: (p) => p > 0 && p <= 20 },
  { key: 'under50', label: 'Under $50', test: (p) => p > 0 && p < 50 },
  { key: '50to100', label: '$50-$100', test: (p) => p >= 50 && p <= 100 },
  { key: '100plus', label: '$100+', test: (p) => p > 100 },
];

export function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<PriceFilterKey>('all');
  const [sortBy, setSortBy] = useState<string>(SORT_OPTIONS[0]);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  useEffect(() => {
    try {
      const q = sessionStorage.getItem('campuskart_search_query');
      if (q) {
        setSearchQuery(q);
        sessionStorage.removeItem('campuskart_search_query');
      }
    } catch (_) {}
  }, []);

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    console.log('Browse search:', searchQuery);
  };

  const handleBackToHome = (): void => {
    console.log('Back to home clicked');
    window.location.hash = '';
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

  const filteredBySearchAndCategory = useMemo(() => {
    return MOCK_LISTINGS.filter((l) => {
      const matchSearch = !searchQuery.trim() || l.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = !selectedCategory || l.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [searchQuery, selectedCategory]);

  const priceFilterCounts = useMemo(() => {
    const counts: Record<PriceFilterKey, number> = {
      all: filteredBySearchAndCategory.length,
      free: 0,
      under20: 0,
      under50: 0,
      '50to100': 0,
      '100plus': 0,
    };
    filteredBySearchAndCategory.forEach((l) => {
      if (l.price === 0) counts.free++;
      else if (l.price <= 20) counts.under20++;
      else if (l.price < 50) counts.under50++;
      else if (l.price >= 50 && l.price <= 100) counts['50to100']++;
      else counts['100plus']++;
    });
    return counts;
  }, [filteredBySearchAndCategory]);

  const filteredAndSorted = useMemo(() => {
    const priceTest = PRICE_FILTERS.find((f) => f.key === priceFilter)?.test ?? (() => true);
    let list = filteredBySearchAndCategory.filter((l) => priceTest(l.price));
    if (sortBy === 'Price Low-High') list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === 'Price High-Low') list = [...list].sort((a, b) => b.price - a.price);
    else if (sortBy === 'Rating') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [filteredBySearchAndCategory, priceFilter, sortBy]);

  return (
    <div className="bg-[#F9FAFB] min-h-screen py-8">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="sticky top-0 z-10 bg-[#F9FAFB]/95 backdrop-blur-sm -mx-6 px-6 py-4 mb-6 border-b border-[#E5E7EB]">
          <button
            type="button"
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-[#6B7280] hover:text-[#1E3A8A] font-medium mb-4 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to home
          </button>

          <h1 className="text-4xl font-bold text-[#111827] mb-4">
            {searchQuery.trim() ? `Search results for: "${searchQuery}"` : 'Browse Listings'}
          </h1>

          <form onSubmit={handleSearch} className="relative max-w-2xl mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] animate-[pulse-soft_2s_ease-in-out_infinite]" />
            <input
              type="text"
              placeholder="Search textbooks, furniture, electronics…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white border border-[#E5E7EB] rounded-full text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent focus:shadow-md transition-all duration-300"
            />
          </form>

          {/* Price filter chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {PRICE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setPriceFilter(f.key);
                  console.log('Price filter:', f.key);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                  priceFilter === f.key
                    ? 'bg-[#1E3A8A] text-white shadow-md'
                    : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                }`}
              >
                {f.label} ({priceFilterCounts[f.key]})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(selectedCategory === cat ? null : cat);
                  console.log('Category filter:', cat);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 ${
                  selectedCategory === cat
                    ? 'bg-[#1E3A8A] text-white shadow-md'
                    : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:border-[#1E3A8A] hover:text-[#1E3A8A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#6B7280]">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                console.log('Sort changed:', e.target.value);
              }}
              className="h-10 pl-4 pr-10 bg-white border border-[#E5E7EB] rounded-lg text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:shadow-md transition-all duration-300"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredAndSorted.map((listing, index) => (
            <div
              key={listing.id}
              onClick={() => handleListingClick(listing)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleListingClick(listing)}
              className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-in-out cursor-pointer group shadow-sm"
              style={{ animationDelay: `${index * 50}ms` }}
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
        {filteredAndSorted.length === 0 && (
          <p className="text-center text-[#6B7280] py-12">No listings match your filters.</p>
        )}
      </div>
    </div>
  );
}
