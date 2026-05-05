import Link from "next/link";
import { redirect } from "next/navigation";

import ListingCard from "@/components/listings/ListingCard";
import ProfileEditor from "@/components/profile/ProfileEditor";
import SellerRatingStars from "@/components/sellers/SellerRatingStars";
import { ADMIN_EMAIL } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import type { Listing } from "@/lib/types/listing";

export const dynamic = "force-dynamic";

type ProfileUserRow = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  average_rating: string;
  rating_count: number;
  created_at: string;
};

type UserListingRow = {
  id: string;
  title: string;
  description: string;
  price: string;
  condition: Listing["condition"];
  category_slug: string;
  thumbnail_url: string | null;
  seller_id: string;
  created_at: string;
  view_count: number;
  status: Listing["status"];
};

function formatJoinDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?from=/profile");
  }

  const userRows = await query<ProfileUserRow>(
    `
    SELECT id, full_name, email, avatar_url, average_rating, rating_count, created_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [session.userId]
  );

  const user = userRows[0];
  if (!user) {
    redirect("/login?from=/profile");
  }

  const listingRows = await query<UserListingRow>(
    `
    SELECT
      l.id,
      l.title,
      l.description,
      l.price,
      l.condition,
      c.slug AS category_slug,
      (
        SELECT lp.url
        FROM listing_photos lp
        WHERE lp.listing_id = l.id AND lp.position = 0
        LIMIT 1
      ) AS thumbnail_url,
      l.seller_id,
      l.created_at,
      l.view_count,
      l.status
    FROM listings l
    JOIN categories c ON c.id = l.category_id
    WHERE l.seller_id = $1
      AND l.status = 'active'
    ORDER BY l.created_at DESC
    `,
    [user.id]
  );

  const averageRating = Number(user.average_rating);
  const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL;
  const listings: Listing[] = listingRows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    condition: row.condition,
    category: row.category_slug,
    thumbnail_url: row.thumbnail_url,
    seller_id: row.seller_id,
    seller_average_rating: averageRating,
    seller_rating_count: user.rating_count,
    created_at: row.created_at,
    view_count: row.view_count,
    status: row.status,
  }));

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-screen-xl px-4 py-6 sm:py-8">
        <div className="mb-5">
          <Link
            href="/listings"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Back to listings
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ProfileEditor
            initialUser={{
              id: user.id,
              full_name: user.full_name,
              email: user.email,
              avatar_url: user.avatar_url,
            }}
          />

          <aside className="rounded-card border border-border bg-card p-4 shadow-card sm:p-6">
            {isAdmin ? (
              <Link
                href="/admin"
                className="mb-5 inline-flex min-h-11 w-full items-center justify-center rounded-button bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Admin dashboard
              </Link>
            ) : null}

            <p className="text-sm font-semibold text-text-secondary">
              Member since
            </p>
            <p className="mt-1 text-lg font-bold text-text-primary">
              {formatJoinDate(user.created_at)}
            </p>

            <div className="mt-5 border-t border-border pt-5">
              <p className="text-sm font-semibold text-text-secondary">
                Seller rating
              </p>
              <SellerRatingStars
                average={averageRating}
                count={user.rating_count}
                className="mt-2"
              />
            </div>
          </aside>
        </div>

        <section className="mt-8" aria-labelledby="my-listings-heading">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="my-listings-heading"
                className="text-xl font-bold text-text-primary"
              >
                My active listings
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {listings.length} active listing{listings.length === 1 ? "" : "s"}
              </p>
            </div>
            <Link
              href="/sell"
              className="inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Create listing
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="rounded-card border border-dashed border-border bg-card px-6 py-12 text-center text-text-secondary">
              You do not have any active listings right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
