import type { ListingStatus } from "@/lib/validators/listings";

export type { ListingStatus };

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: "New" | "Like New" | "Good" | "Fair" | "Poor";
  category: string;
  thumbnail_url: string | null;
  seller_id: string;
  seller_average_rating?: number;
  seller_rating_count?: number;
  created_at: string;
  view_count: number;
  /** Present on GET /api/listings/:id — ordered by `listing_photos.position`. */
  photo_urls?: string[];
  /** Present on GET /api/listings/:id when the column exists. */
  status?: ListingStatus;
};

export type NearbyListing = Listing & {
  distance_meters: number;
  distance_km: number;
  distance_miles: number;
};
