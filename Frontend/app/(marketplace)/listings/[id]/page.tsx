import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import ListingImageCarousel from "@/components/listings/ListingImageCarousel";
import MessageSellerCta from "@/components/listings/MessageSellerCta";
import type { Listing } from "@/lib/types/listing";

const paramsSchema = z.object({
  id: z.string().uuid("Listing id must be a valid UUID."),
});

type ListingWithSeller = Listing & { seller: { id: string; name: string } };

async function fetchListing(id: string): Promise<ListingWithSeller> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/listings/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to fetch listing (${res.status}).`);

  const data = (await res.json()) as { listing?: ListingWithSeller };
  if (!data.listing) throw new Error("Malformed listing response.");
  return data.listing;
}

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
  const listing = await fetchListing(id);

  const images = listing.thumbnail_url ? [listing.thumbnail_url] : [];

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Link
            href="/listings"
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← Back to listings
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Images */}
          <ListingImageCarousel images={images} title={listing.title} />

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
                <div className="mt-0.5 text-sm font-semibold text-text-primary">
                  {listing.condition}
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

            <MessageSellerCta sellerName={listing.seller.name} />

            <div className="mt-4">
              <h2 className="text-sm font-bold text-text-primary">Description</h2>
              <p className="mt-1.5 text-sm text-text-secondary whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

