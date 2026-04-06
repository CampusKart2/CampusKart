export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: "New" | "Like New" | "Good" | "Fair" | "Poor";
  category: string;
  thumbnail_url: string | null;
  seller_id: string;
  created_at: string;
  view_count: number;
};

export type NearbyListing = Listing & {
  distance_meters: number;
  distance_km: number;
  distance_miles: number;
};
