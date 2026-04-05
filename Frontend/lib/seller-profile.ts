import type { SellerProfileApiResponse } from "@/lib/types/seller-profile";

/**
 * Loads public seller profile JSON (used by the seller profile page and metadata).
 * Returns null when the user does not exist (404).
 */
export async function fetchSellerProfile(
  userId: string,
  query: { page: number; limit: number }
): Promise<SellerProfileApiResponse | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const url = new URL(
    `${base}/api/users/${encodeURIComponent(userId)}/profile`
  );
  url.searchParams.set("page", String(query.page));
  url.searchParams.set("limit", String(query.limit));

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Failed to load seller profile (${res.status}).`);
  }

  return res.json() as Promise<SellerProfileApiResponse>;
}
