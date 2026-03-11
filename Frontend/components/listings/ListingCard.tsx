import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/types/listing";

const CONDITION_CLASSES: Record<Listing["condition"], string> = {
  New: "bg-badge-new text-white",
  "Like New": "bg-badge-likenew text-white",
  Good: "bg-badge-good text-white",
  Fair: "bg-badge-fair text-white",
  Poor: "bg-badge-poor text-white",
};

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const { id, title, price, condition, category, thumbnail_url } = listing;

  return (
    <Link
      href={`/listings/${id}`}
      className="group block bg-card rounded-card shadow-card hover:shadow-card-hover hover:scale-[1.01] transition-all duration-200 overflow-hidden"
    >
      {/* Thumbnail — 16:9 */}
      <div className="relative aspect-video w-full bg-surface overflow-hidden">
        {thumbnail_url ? (
          <Image
            src={thumbnail_url}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <svg
              className="w-10 h-10 text-border"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5A.75.75 0 0121 3.75v16.5a.75.75 0 01-.75.75H3.75A.75.75 0 013 20.25V3.75A.75.75 0 013.75 3z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2">
        {/* Price */}
        <p
          className={[
            "text-base font-bold leading-tight",
            price === 0 ? "text-success" : "text-text-primary",
          ].join(" ")}
        >
          {price === 0 ? "Free" : `$${price.toFixed(2)}`}
        </p>

        {/* Title — 2-line clamp */}
        <p className="mt-0.5 text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
          {title}
        </p>

        {/* Bottom row: condition badge + category */}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span
            className={[
              "inline-block text-xs font-semibold px-1.5 py-0.5 rounded-badge",
              CONDITION_CLASSES[condition],
            ].join(" ")}
          >
            {condition}
          </span>
          <span className="text-xs text-text-muted truncate">{category}</span>
        </div>
      </div>
    </Link>
  );
}
