import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import ListingImageCarousel from "@/components/listings/ListingImageCarousel";
import MessageSellerCta from "@/components/listings/MessageSellerCta";
import ConditionBadge from "@/components/listings/ConditionBadge";
import MarkAsSoldButton from "@/components/listings/MarkAsSoldButton";
import DeleteListingButton from "@/components/listings/DeleteListingButton";
import ReportListingButton from "@/components/listings/ReportListingButton";
import { fetchListingById } from "@/lib/fetch-listing-detail";
import { getSession } from "@/lib/auth";

const paramsSchema = z.object({
  id: z.string().uuid("Listing id must be a valid UUID."),
});

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({
  params,
}: ListingDetailPageProps) {
  const rawParams = await params;
  const parsed = paramsSchema.safeParse(rawParams);
  if (!parsed.success) notFound();

  const { id } = parsed.data;
  const [listing, session] = await Promise.all([
    fetchListingById(id),
    getSession(),
  ]);

  const images =
    listing.photo_urls && listing.photo_urls.length > 0
      ? listing.photo_urls
      : listing.thumbnail_url
        ? [listing.thumbnail_url]
        : [];

  // Edit is server-rendered only for the seller; no session or another user → no button in the DOM.
  const isOwner = session != null && listing.seller_id === session.userId;

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/listings"
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← Back to listings
          </Link>
          {isOwner ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Link
                href={`/listings/${id}/edit`}
                className="inline-flex w-full items-center justify-center rounded-button border border-primary bg-card px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary-light sm:w-fit"
              >
                Edit
              </Link>
              <MarkAsSoldButton
                listingId={id}
                initialStatus={listing.status}
              />
              <DeleteListingButton listingId={id} />
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Images */}
          <div className="h-80 overflow-hidden rounded-card">
            <ListingImageCarousel
              images={images}
              title={listing.title}
              isSold={listing.status === "sold"}
            />
          </div>

          {/* Details */}
          <div className="bg-card border border-border rounded-card shadow-card p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
                {listing.title}
              </h1>
              <div className="shrink-0 text-right">
                <div
                  className={[
                    "text-xl sm:text-2xl font-extrabold",
                    listing.price === 0 ? "text-success" : "text-text-primary",
                  ].join(" ")}
                >
                  {listing.price === 0 ? "Free" : `$${listing.price.toFixed(2)}`}
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  Views: {listing.view_count.toLocaleString("en-US")}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-card border border-border bg-surface p-3">
                <div className="text-xs font-semibold text-text-muted">
                  Condition
                </div>
                <div className="mt-1.5">
                  <ConditionBadge condition={listing.condition} size="md" />
                </div>
              </div>
              <div className="rounded-card border border-border bg-surface p-3">
                <div className="text-xs font-semibold text-text-muted">
                  Category
                </div>
                <div className="mt-0.5 text-sm font-semibold text-text-primary">
                  {listing.category}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-card border border-border bg-surface p-3">
              <div className="text-xs font-semibold text-text-muted">Seller</div>
              <div className="mt-0.5 text-sm font-semibold text-text-primary">
                <Link
                  href={`/sellers/${listing.seller.id}`}
                  className="text-primary hover:underline"
                >
                  {listing.seller.name}
                </Link>
              </div>
            </div>

            <MessageSellerCta
              sellerName={listing.seller.name}
              sellerId={listing.seller.id}
              listingId={id}
              listingTitle={listing.title}
            />

            <div className="mt-4">
              <h2 className="text-sm font-bold text-text-primary">Description</h2>
              <p className="mt-1.5 text-sm text-text-secondary whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Report is only available to other authenticated users, not the seller.
                The server computes isOwner so the button is never in the DOM for owners. */}
            {!isOwner ? <ReportListingButton listingId={id} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
