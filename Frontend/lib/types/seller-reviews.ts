export type SellerReview = {
  id: string;
  reviewerId: string;
  reviewer: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  sellerId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type SellerReviewsApiResponse = {
  averageRating: number;
  ratingCount: number;
  reviews: SellerReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
