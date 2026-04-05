import type { Listing } from "./listing";

/** One active listing row returned inside GET /api/users/:id/profile */
export type SellerProfileListing = Pick<
  Listing,
  | "id"
  | "title"
  | "price"
  | "condition"
  | "thumbnail_url"
  | "created_at"
  | "view_count"
> & {
  category: string;
};

/** JSON body for GET /api/users/:id/profile */
export type SellerProfileApiResponse = {
  profile: {
    name: string;
    avatar_url: string | null;
    rating: {
      average: number;
      count: number;
    };
    join_date: string;
    listings: SellerProfileListing[];
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};
