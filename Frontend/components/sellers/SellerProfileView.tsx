import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import ListingCard from "@/components/listings/ListingCard";
import ReviewForm from "@/components/sellers/ReviewForm";
import SellerProfileActionMenu from "@/components/sellers/SellerProfileActionMenu";
import SellerRatingStars from "@/components/sellers/SellerRatingStars";
import type { Listing } from "@/lib/types/listing";
import type { SellerProfileApiResponse } from "@/lib/types/seller-profile";
import type { SellerReviewsApiResponse } from "@/lib/types/seller-reviews";

interface SellerProfileViewProps {
  userId: string;
  data: SellerProfileApiResponse;
  reviewsData: SellerReviewsApiResponse;
  viewerUserId: string | null;
  initialIsBlocked: boolean;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatJoinDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildProfileHref(
  sellerId: string,
  query: { listingPage: number; listingLimit: number; reviewsPage: number }
): string {
  const path = `/sellers/${sellerId}`;
  const params = new URLSearchParams();

  if (query.listingPage > 1) {
    params.set("page", String(query.listingPage));
  }
  if (query.listingLimit !== 12) {
    params.set("limit", String(query.listingLimit));
  }
  if (query.reviewsPage > 1) {
    params.set("reviewsPage", String(query.reviewsPage));
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

function CompactRatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((position) => (
        <Star
          key={position}
          className={
            position <= rating
              ? "w-4 h-4 fill-amber-400 text-amber-400 shrink-0"
              : "w-4 h-4 fill-none text-border shrink-0"
          }
          strokeWidth={position <= rating ? 0 : 1.5}
        />
      ))}
    </div>
  );
}

export default function SellerProfileView({
  userId,
  data,
  reviewsData,
  viewerUserId,
  initialIsBlocked,
}: SellerProfileViewProps) {
  const { profile, pagination } = data;
  const { name, avatar_url, rating, join_date, listings } = profile;
  const { page, limit, total, total_pages } = pagination;
  const { reviews, pagination: reviewPagination } = reviewsData;
  const canManageBlock = viewerUserId !== null && viewerUserId !== userId;

  const listingCards: Listing[] = listings.map((item) => ({
    id: item.id,
    title: item.title,
    description: "",
    price: item.price,
    condition: item.condition,
    category: item.category,
    thumbnail_url: item.thumbnail_url,
    seller_id: userId,
    seller_average_rating: rating.average,
    seller_rating_count: rating.count,
    created_at: item.created_at,
    view_count: item.view_count,
  }));

  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);
  const reviewRangeStart =
    reviewPagination.total === 0
      ? 0
      : (reviewPagination.page - 1) * reviewPagination.limit + 1;
  const reviewRangeEnd = Math.min(
    reviewPagination.page * reviewPagination.limit,
    reviewPagination.total
  );

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-screen-xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <Link
            href="/listings"
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← Back to listings
          </Link>
        </div>

        {/* Header: avatar, name, stars, member since */}
        <header className="bg-card border border-border rounded-card shadow-card p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            <div className="shrink-0 flex justify-center sm:justify-start">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-primary-light border-2 border-border ring-2 ring-white shadow-card">
                {avatar_url ? (
                  <Image
                    src={avatar_url}
                    alt={`${name} profile photo`}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl font-bold text-primary bg-primary-light"
                    aria-hidden="true"
                  >
                    {initialsFromName(name)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary break-words">
                  {name}
                </h1>
                {canManageBlock ? (
                  <SellerProfileActionMenu
                    sellerId={userId}
                    sellerName={name}
                    initialIsBlocked={initialIsBlocked}
                  />
                ) : null}
              </div>
              <div className="mt-3 flex justify-center sm:justify-start">
                <SellerRatingStars average={rating.average} count={rating.count} />
              </div>
              <p className="mt-3 text-sm text-text-secondary">
                Member since{" "}
                <time dateTime={join_date}>{formatJoinDate(join_date)}</time>
              </p>
            </div>
          </div>
        </header>

        <section aria-labelledby="seller-reviews-heading" className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
            <h2
              id="seller-reviews-heading"
              className="text-xl font-bold text-text-primary"
            >
              Reviews
            </h2>
            {reviewPagination.total > 0 ? (
              <p className="text-sm text-text-secondary tabular-nums">
                Showing {reviewRangeStart}–{reviewRangeEnd} of{" "}
                {reviewPagination.total}
              </p>
            ) : null}
          </div>

          <div className="rounded-card border border-border bg-card p-4 sm:p-5 shadow-card mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-text-secondary">
                  Seller rating
                </p>
                <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
                  <span className="text-4xl font-bold leading-none text-text-primary tabular-nums">
                    {reviewsData.averageRating.toFixed(1)}
                  </span>
                  <span className="pb-1 text-sm font-semibold text-text-secondary">
                    out of 5
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2">
                <SellerRatingStars
                  average={reviewsData.averageRating}
                  count={reviewsData.ratingCount}
                />
                <p className="text-sm text-text-secondary">
                  Based on {reviewsData.ratingCount} rating
                  {reviewsData.ratingCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="rounded-card border border-dashed border-border bg-card px-6 py-10 text-center text-text-secondary">
              No reviews yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-card border border-border bg-card p-4 shadow-card"
                >
                  <div className="flex gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary-light border border-border">
                      {review.reviewer.avatarUrl ? (
                        <Image
                          src={review.reviewer.avatarUrl}
                          alt={`${review.reviewer.name} profile photo`}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary"
                          aria-hidden="true"
                        >
                          {initialsFromName(review.reviewer.name)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <p className="font-semibold text-text-primary break-words">
                          {review.reviewer.name}
                        </p>
                        <time
                          dateTime={review.createdAt}
                          className="text-sm text-text-secondary shrink-0"
                        >
                          {formatReviewDate(review.createdAt)}
                        </time>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <CompactRatingStars rating={review.rating} />
                        <span className="text-sm font-semibold text-text-secondary tabular-nums">
                          {review.rating}/5
                        </span>
                      </div>

                      {review.comment ? (
                        <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-text-secondary">
                          {review.comment}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {reviewPagination.total > 0 && reviewPagination.totalPages > 1 && (
            <nav
              className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
              aria-label="Review pages"
            >
              {reviewPagination.page > 1 ? (
                <Link
                  href={buildProfileHref(userId, {
                    listingPage: page,
                    listingLimit: limit,
                    reviewsPage: reviewPagination.page - 1,
                  })}
                  className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-semibold rounded-button border border-border bg-card text-text-primary hover:bg-surface transition"
                >
                  Previous
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-semibold rounded-button border border-border bg-surface text-text-muted cursor-not-allowed">
                  Previous
                </span>
              )}

              <span className="text-sm text-text-secondary tabular-nums">
                Page {reviewPagination.page} of {reviewPagination.totalPages}
              </span>

              {reviewPagination.page < reviewPagination.totalPages ? (
                <Link
                  href={buildProfileHref(userId, {
                    listingPage: page,
                    listingLimit: limit,
                    reviewsPage: reviewPagination.page + 1,
                  })}
                  className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-semibold rounded-button border border-border bg-card text-text-primary hover:bg-surface transition"
                >
                  Next
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-semibold rounded-button border border-border bg-surface text-text-muted cursor-not-allowed">
                  Next
                </span>
              )}
            </nav>
          )}
        </section>

        <section aria-labelledby="seller-listings-heading">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
            <h2
              id="seller-listings-heading"
              className="text-xl font-bold text-text-primary"
            >
              Active listings
            </h2>
            {total > 0 && (
              <p className="text-sm text-text-secondary tabular-nums">
                Showing {rangeStart}–{rangeEnd} of {total}
              </p>
            )}
          </div>

          {listingCards.length === 0 ? (
            <div className="rounded-card border border-dashed border-border bg-card px-6 py-12 text-center text-text-secondary">
              No active listings right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {listingCards.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > 0 && total_pages > 1 && (
            <nav
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
              aria-label="Listing pages"
            >
              {page > 1 ? (
                <Link
                  href={buildProfileHref(userId, {
                    listingPage: page - 1,
                    listingLimit: limit,
                    reviewsPage: reviewPagination.page,
                  })}
                  className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-semibold rounded-button border border-border bg-card text-text-primary hover:bg-surface transition"
                >
                  Previous
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-semibold rounded-button border border-border bg-surface text-text-muted cursor-not-allowed">
                  Previous
                </span>
              )}

              <span className="text-sm text-text-secondary tabular-nums">
                Page {page} of {total_pages}
              </span>

              {page < total_pages ? (
                <Link
                  href={buildProfileHref(userId, {
                    listingPage: page + 1,
                    listingLimit: limit,
                    reviewsPage: reviewPagination.page,
                  })}
                  className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-semibold rounded-button border border-border bg-card text-text-primary hover:bg-surface transition"
                >
                  Next
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-semibold rounded-button border border-border bg-surface text-text-muted cursor-not-allowed">
                  Next
                </span>
              )}
            </nav>
          )}
        </section>

        {/* Review form — only visible to logged-in users who are not the seller */}
        {viewerUserId !== null && viewerUserId !== userId && (
          <section aria-labelledby="leave-review-heading" className="mt-8">
            <h2
              id="leave-review-heading"
              className="text-xl font-bold text-text-primary mb-4"
            >
              Leave a Review
            </h2>
            <ReviewForm sellerId={userId} sellerName={name} />
          </section>
        )}
      </div>
    </div>
  );
}
