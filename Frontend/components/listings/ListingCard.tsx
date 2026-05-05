import Link from "next/link";
import Image from "next/image";
import { Camera } from "lucide-react";
import type { Listing, NearbyListing } from "@/lib/types/listing";
import ConditionBadge from "@/components/listings/ConditionBadge";
import SoldBannerOverlay from "@/components/listings/SoldBannerOverlay";
import SellerRatingStars from "@/components/sellers/SellerRatingStars";

interface ListingCardProps {
  listing: Listing | NearbyListing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const {
    id,
    title,
    price,
    condition,
    category,
    thumbnail_url,
    status,
    seller_average_rating,
    seller_rating_count,
  } = listing;
  const distanceLabel =
    "distance_miles" in listing ? `${listing.distance_miles.toFixed(1)} mi away` : null;
  const isSold = status === "sold";
  const sellerRatingCount = seller_rating_count ?? 0;

  return (
    <Link
      href={`/listings/${id}`}
      className="group block bg-card rounded-card shadow-card hover:shadow-card-hover hover:scale-[1.01] transition-all duration-200 overflow-hidden"
    >
      {/* Thumbnail — 16:9 */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-gray-50">
        {thumbnail_url ? (
          <Image
            src={thumbnail_url}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
            <Camera className="h-10 w-10" strokeWidth={1.5} aria-hidden="true" />
            <span className="sr-only">No listing photo available</span>
          </div>
        )}

        {distanceLabel ? (
          <div className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-text-primary shadow-sm backdrop-blur">
            {distanceLabel}
          </div>
        ) : null}
        {isSold ? <SoldBannerOverlay className={distanceLabel ? "top-10" : ""} /> : null}
      </div>

      {/* Content */}
      <div className="p-2">
        {/* Price */}
        {price === 0 ? (
          <div className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">
            Free
          </div>
        ) : (
          <p className="text-base font-bold leading-tight text-text-primary">
            ${price.toFixed(2)}
          </p>
        )}

        {/* Title — 2-line clamp */}
        <p className="mt-0.5 text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
          {title}
        </p>

        <SellerRatingStars
          average={seller_average_rating ?? 0}
          count={sellerRatingCount}
          size="sm"
          showAverage={sellerRatingCount > 0}
          className="mt-1 min-h-5"
        />

        {/* Bottom row: condition badge + category */}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <ConditionBadge condition={condition} size="sm" />
          <span className="text-xs text-text-muted truncate">{category}</span>
        </div>
      </div>
    </Link>
  );
}
