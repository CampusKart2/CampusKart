import { notFound } from "next/navigation";

import { appUrl } from "@/lib/routes";
import type { Listing } from "@/lib/types/listing";

export type ListingWithSeller = Listing & {
  seller: { id: string; name: string };
};

/**
 * Loads a single listing for App Router Server Components.
 * Uses the app origin so the internal listings API runs with the same
 * cookie context as the browser (view tracking, etc.).
 */
export async function fetchListingById(
  id: string
): Promise<ListingWithSeller> {
  const res = await fetch(appUrl(`/api/listings/${encodeURIComponent(id)}`), {
    cache: "no-store",
  });

  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to fetch listing (${res.status}).`);

  const data = (await res.json()) as { listing?: ListingWithSeller };
  if (!data.listing) throw new Error("Malformed listing response.");
  return data.listing;
}
