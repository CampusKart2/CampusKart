import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import CreateListingWizard from "@/components/listings/CreateListingWizard";
import { getSession } from "@/lib/auth";
import { fetchListingById } from "@/lib/fetch-listing-detail";
import type { ListingStatus } from "@/lib/validators/listings";

const paramsSchema = z.object({
  id: z.string().uuid("Listing id must be a valid UUID."),
});

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const rawParams = await params;
  const parsed = paramsSchema.safeParse(rawParams);
  if (!parsed.success) notFound();

  const { id } = parsed.data;

  const session = await getSession();
  if (!session) {
    redirect(`/login?from=${encodeURIComponent(`/listings/${id}/edit`)}`);
  }

  const listing = await fetchListingById(id);

  if (listing.seller_id !== session.userId) {
    redirect(`/listings/${id}`);
  }

  const status: ListingStatus = listing.status ?? "active";

  return (
    <main className="bg-surface min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-6">
          <Link
            href={`/listings/${id}`}
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← Back to listing
          </Link>
        </div>

        <CreateListingWizard
          mode="edit"
          listingId={listing.id}
          initialData={{
            title: listing.title,
            description: listing.description,
            price: listing.price,
            condition: listing.condition,
            category: listing.category,
            photoUrls: listing.photo_urls ?? [],
            status,
          }}
        />
      </div>
    </main>
  );
}
