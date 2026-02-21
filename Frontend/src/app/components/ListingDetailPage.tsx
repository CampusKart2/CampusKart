import React, { useEffect } from 'react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Star, MapPin, Bookmark, ArrowLeft, MessageCircle, Share2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  getListingById,
  addRecentlyViewed,
  MOCK_LISTINGS,
  type Listing,
} from '../data/mockListings';
import { useBookmarks } from '../context/BookmarkContext';
import { useChat } from '../context/ChatContext';
import { ConditionBadge } from './ConditionBadge';

type ListingDetailPageProps = { listingId: string };

function StarRating({ value }: { value: number }) {
  const full = Math.floor(value);
  const hasHalf = value % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= full ? 'text-[#FBBF24] fill-[#FBBF24]' : i === full + 1 && hasHalf ? 'text-[#FBBF24] fill-[#FBBF24]' : 'text-gray-300'
          }`}
          fill={i <= full || (i === full + 1 && hasHalf) ? '#FBBF24' : 'none'}
        />
      ))}
    </div>
  );
}

export function ListingDetailPage({ listingId }: ListingDetailPageProps) {
  const id = parseInt(listingId, 10);
  const listing = Number.isNaN(id) ? undefined : getListingById(id);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { findConversationByListingId } = useChat();

  useEffect(() => {
    if (listing) {
      addRecentlyViewed(listing.id);
      console.log('Recently viewed updated:', listing.id);
    }
  }, [listing?.id]);

  const handleBackToBrowse = (): void => {
    console.log('Back to browse clicked');
    window.location.hash = '#browse';
  };

  const handleBookmark = (): void => {
    if (!listing) return;
    const currentlyBookmarked = isBookmarked(listing.id);
    toggleBookmark(listing.id);
    toast.success(currentlyBookmarked ? '📌 Removed bookmark' : '⭐ Added bookmark');
  };

  const handleContactSeller = (): void => {
    if (!listing) return;
    console.log('Contact seller clicked for listing', listing.id);
    const existing = findConversationByListingId(listing.id);
    if (existing) {
      window.location.hash = `#chat/${existing.id}`;
    } else {
      window.location.hash = `#chat/new?listing=${listing.id}`;
    }
  };

  const handleShare = async (): Promise<void> => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      console.log('Share: link copied', url);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleWriteReview = (): void => {
    toast.info('Review feature coming soon!');
    console.log('Write review clicked');
  };

  const handleSimilarClick = (item: Listing): void => {
    console.log('Similar item clicked:', item.id);
    window.location.hash = `#listing/${item.id}`;
  };

  if (!listing) {
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
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center">
            <h2 className="text-xl font-semibold text-[#111827] mb-2">Listing not found</h2>
            <p className="text-[#6B7280]">This item may have been removed or the link is invalid.</p>
            <a
              href="#browse"
              className="inline-block mt-4 px-6 py-3 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] transition-all duration-300 font-medium"
            >
              Browse Listings
            </a>
          </div>
        </div>
      </div>
    );
  }

  const similarItems = (() => {
    const delta = listing.price * 0.3;
    const sameCategory = MOCK_LISTINGS.filter(
      (l) => l.id !== listing.id && l.category === listing.category
    );
    const withinPrice = sameCategory.filter(
      (l) => Math.abs(l.price - listing.price) <= delta
    );
    if (withinPrice.length >= 4) return withinPrice.slice(0, 4);
    return [...withinPrice, ...sameCategory.filter((l) => !withinPrice.includes(l))].slice(0, 4);
  })();
  const reviews = listing.reviews ?? [];
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : listing.rating;

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="rounded-2xl overflow-hidden bg-white border border-[#E5E7EB] shadow-md hover:shadow-xl transition-shadow duration-300 group">
            <div className="aspect-[4/3] bg-[#F9FAFB] overflow-hidden">
              <ImageWithFallback
                src={listing.image}
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-[#111827]">{listing.title}</h1>
            <div className="text-4xl font-bold text-[#1E3A8A]">
              {listing.price === 0 ? 'Free' : `$${listing.price}`}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-[#FBBF24] fill-[#FBBF24]" />
                <span className="font-semibold text-[#111827]">{listing.rating}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#F9FAFB] px-3 py-1.5 rounded-full">
                <MapPin className="w-4 h-4 text-[#6B7280]" />
                <span className="text-[#6B7280] font-medium">{listing.campus}</span>
              </div>
              {listing.condition && <ConditionBadge condition={listing.condition} />}
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <h3 className="font-semibold text-[#111827] mb-2">Seller</h3>
              <p className="text-[#111827] font-medium">{listing.sellerName}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 text-[#FBBF24] fill-[#FBBF24]" />
                <span className="text-sm text-[#6B7280]">{listing.sellerRating} rating</span>
              </div>
              <button
                type="button"
                onClick={handleContactSeller}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] transition-all font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                Contact Seller
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBookmark}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-[#1E3A8A] text-[#1E3A8A] rounded-lg hover:bg-[#F9FAFB] hover:scale-105 transition-all duration-300 font-semibold"
              >
                <Bookmark
                  className={`w-5 h-5 ${isBookmarked(listing.id) ? 'text-blue-600 fill-current' : ''}`}
                  fill={isBookmarked(listing.id) ? 'currentColor' : 'none'}
                />
                {isBookmarked(listing.id) ? 'Bookmarked' : 'Bookmark'}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-[#E5E7EB] text-[#111827] rounded-lg hover:bg-[#F9FAFB] transition-all duration-300 font-semibold"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
              <button
                type="button"
                onClick={handleContactSeller}
                className="flex-1 px-6 py-3 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] hover:scale-105 hover:shadow-lg transition-all duration-300 font-semibold"
              >
                Contact Seller
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mb-12 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-[#111827] mb-3 dark:text-white">Description</h2>
          <p className="text-[#6B7280] leading-relaxed dark:text-gray-300">{listing.description}</p>
        </div>

        {/* Price History */}
        {listing.priceHistory && listing.priceHistory.length > 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mb-12 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <h2 className="text-xl font-semibold text-[#111827] dark:text-white">
                Price Trend (Last 30 Days)
              </h2>
              {(() => {
                const minPrice = Math.min(...listing.priceHistory.map((p) => p.price));
                const isLowest = listing.price <= minPrice;
                return isLowest ? (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium dark:bg-green-900/30 dark:text-green-400">
                    Lowest: ${minPrice}
                  </span>
                ) : null;
              })()}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={listing.priceHistory.map(({ date, price }) => ({ date, price }))}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `$${v}`}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <Tooltip
                    formatter={(value: number) => [`$${value}`, 'Price']}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #fff)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#1E3A8A"
                    strokeWidth={2}
                    dot={{ fill: '#1E3A8A' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 mb-12">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <h2 className="text-xl font-semibold text-[#111827]">
              Reviews {reviews.length > 0 && `(${reviews.length})`}
            </h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <StarRating value={avgRating} />
                <span className="text-sm font-medium text-[#6B7280]">
                  {avgRating.toFixed(1)} avg
                </span>
              </div>
            )}
          </div>
          {reviews.length === 0 ? (
            <p className="text-[#6B7280] mb-4">No reviews yet. Be the first!</p>
          ) : (
            <ul className="space-y-4">
              {reviews.slice(0, 5).map((r, i) => (
                <li key={i} className="border-b border-[#E5E7EB] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-[#111827]">{r.author}</span>
                    <StarRating value={r.rating} />
                    <span className="text-sm text-[#6B7280]">{r.date}</span>
                  </div>
                  <p className="text-[#6B7280] text-sm">{r.text}</p>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={handleWriteReview}
            className="mt-4 px-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#111827] font-medium hover:bg-[#E5E7EB] transition-all duration-300"
          >
            Write a Review
          </button>
        </div>

        {/* Similar Items */}
        {similarItems.length > 0 && (
          <>
            <h2 className="text-2xl font-semibold text-[#111827] mb-4">Similar Items You Might Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSimilarClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSimilarClick(item)}
                  className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group shadow-sm"
                >
                  <div className="w-full h-40 bg-gray-100 overflow-hidden">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[#111827] leading-tight">{item.title}</h3>
                    <div className="text-xl font-bold text-[#1E3A8A] mt-1">
                      {item.price === 0 ? 'Free' : `$${item.price}`}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-[#FBBF24] fill-[#FBBF24]" />
                      <span className="text-sm text-[#111827]">{item.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
