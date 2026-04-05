import { Star, StarHalf } from "lucide-react";

interface SellerRatingStarsProps {
  /** Average rating in [0, 5] (from `users.average_rating`). */
  average: number;
  /** Number of ratings received (`users.rating_count`). */
  count: number;
}

/**
 * Visual 5-star display with half-star support; pairs with a numeric average for screen readers.
 */
export default function SellerRatingStars({
  average,
  count,
}: SellerRatingStarsProps) {
  const clamped = Math.min(5, Math.max(0, average));
  const label =
    count === 0
      ? "No ratings yet"
      : `${clamped.toFixed(1)} out of 5 stars, ${count} rating${count === 1 ? "" : "s"}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="sr-only">{label}</span>
      <div
        className="flex items-center gap-0.5"
        aria-hidden="true"
      >
        {[1, 2, 3, 4, 5].map((position) => {
          if (clamped >= position) {
            return (
              <Star
                key={position}
                className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-400 text-amber-400 shrink-0"
                strokeWidth={0}
              />
            );
          }
          if (clamped >= position - 0.5) {
            return (
              <StarHalf
                key={position}
                className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-400 text-amber-400 shrink-0"
                strokeWidth={0}
              />
            );
          }
          return (
            <Star
              key={position}
              className="w-5 h-5 sm:w-6 sm:h-6 text-border fill-none shrink-0"
              strokeWidth={1.5}
            />
          );
        })}
      </div>
      <span className="text-sm text-text-secondary tabular-nums">
        {count === 0 ? (
          <span className="text-text-muted">No reviews yet</span>
        ) : (
          <>
            <span className="font-semibold text-text-primary">
              {clamped.toFixed(1)}
            </span>
            <span className="text-text-muted">
              {" "}
              ({count} review{count === 1 ? "" : "s"})
            </span>
          </>
        )}
      </span>
    </div>
  );
}
