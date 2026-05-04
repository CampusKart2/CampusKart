import type { Metadata } from "next";
import { notFound } from "next/navigation";

import SellerProfileView from "@/components/sellers/SellerProfileView";
import { getSession } from "@/lib/auth";
import { hasUserBlocked } from "@/lib/blocking";
import { fetchSellerProfile, fetchSellerReviews } from "@/lib/seller-profile";
import {
  sellerProfileQuerySchema,
  userIdParamsSchema,
  userReviewsQuerySchema,
} from "@/lib/validators/users";

export const metadata: Metadata = {
  title: "Seller profile | CampusKart",
  description: "View a seller's ratings and active listings on CampusKart.",
};

interface SellerProfilePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; limit?: string; reviewsPage?: string }>;
}

export default async function SellerProfilePage({
  params,
  searchParams,
}: SellerProfilePageProps) {
  const rawParams = await params;
  const parsedParams = userIdParamsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    notFound();
  }

  const rawSearch = await searchParams;
  const parsedQuery = sellerProfileQuerySchema.safeParse({
    page: rawSearch.page,
    limit: rawSearch.limit,
  });

  const { page, limit } = parsedQuery.success
    ? parsedQuery.data
    : { page: 1, limit: 12 };

  const parsedReviewsQuery = userReviewsQuerySchema.safeParse({
    page: rawSearch.reviewsPage,
  });
  const reviewsPage = parsedReviewsQuery.success
    ? parsedReviewsQuery.data.page
    : 1;

  const userId = parsedParams.data.id;

  const [data, reviewsData, session] = await Promise.all([
    fetchSellerProfile(userId, { page, limit }),
    fetchSellerReviews(userId, { page: reviewsPage }),
    getSession(),
  ]);
  if (!data || !reviewsData) {
    notFound();
  }

  const viewerUserId = session?.userId ?? null;
  const initialIsBlocked =
    viewerUserId && viewerUserId !== userId
      ? await hasUserBlocked(viewerUserId, userId)
      : false;

  return (
    <SellerProfileView
      userId={userId}
      data={data}
      reviewsData={reviewsData}
      viewerUserId={viewerUserId}
      initialIsBlocked={initialIsBlocked}
    />
  );
}
