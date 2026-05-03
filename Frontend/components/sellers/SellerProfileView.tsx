import Image from "next/image";
import Link from "next/link";

import ListingCard from "@/components/listings/ListingCard";
import ReviewForm from "@/components/sellers/ReviewForm";
import SellerProfileActionMenu from "@/components/sellers/SellerProfileActionMenu";
import SellerRatingStars from "@/components/sellers/SellerRatingStars";
import type { Listing } from "@/lib/types/listing";
import type { SellerProfileApiResponse } from "@/lib/types/seller-profile";

interface SellerProfileViewProps {
  userId: string;
  data: SellerProfileApiResponse;
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

function buildPageHref(sellerId: string, page: number): string {
  const path = `/sellers/${sellerId}`;
  if (page <= 1) return path;
  return `${path}?page=${page}`;
}

export default function SellerProfileView({
  userId,
  data,
  viewerUserId,
  initialIsBlocked,
}: SellerProfileViewProps) {
  const { profile, pagination } = data;
  const { name, avatar_url, rating, join_date, listings } = profile;
  const { page, limit, total, total_pages } = pagination;
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
    created_at: item.created_at,
    view_count: item.view_count,
  }));

  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

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
                  href={buildPageHref(userId, page - 1)}
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
                  href={buildPageHref(userId, page + 1)}
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
