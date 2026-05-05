import { Star, StarHalf } from "lucide-react";

interface SellerRatingStarsProps {
  /** Average rating in [0, 5] (from `users.average_rating`). */
  average: number;
  /** Number of ratings received (`users.rating_count`). */
  count: number;
  size?: "sm" | "md";
  showAverage?: boolean;
  className?: string;
}

/**
 * Visual 5-star display with half-star support; pairs with a numeric average for screen readers.
 */
export default function SellerRatingStars({
  average,
  count,
  size = "md",
  showAverage = true,
  className = "",
}: SellerRatingStarsProps) {
  const clamped = Math.min(5, Math.max(0, average));
  const roundedToHalf = Math.round(clamped * 2) / 2;
  const iconClass =
    size === "sm" ? "w-3.5 h-3.5 sm:w-4 sm:h-4" : "w-5 h-5 sm:w-6 sm:h-6";
  const textClass = size === "sm" ? "text-xs" : "text-sm";
  const label =
    count === 0
      ? "No ratings yet"
      : `${clamped.toFixed(1)} out of 5 stars, ${count} rating${count === 1 ? "" : "s"}`;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="sr-only">{label}</span>
      <div
        className="flex items-center gap-0.5"
        aria-hidden="true"
      >
        {[1, 2, 3, 4, 5].map((position) => {
          if (roundedToHalf >= position) {
            return (
              <Star
                key={position}
                className={`${iconClass} fill-amber-400 text-amber-400 shrink-0`}
                strokeWidth={0}
              />
            );
          }
          if (roundedToHalf >= position - 0.5) {
            return (
              <StarHalf
                key={position}
                className={`${iconClass} fill-amber-400 text-amber-400 shrink-0`}
                strokeWidth={0}
              />
            );
          }
          return (
            <Star
              key={position}
              className={`${iconClass} text-border fill-none shrink-0`}
              strokeWidth={1.5}
            />
          );
        })}
      </div>
      <span className={`${textClass} text-text-secondary tabular-nums`}>
        {count === 0 ? (
          <span className="text-text-muted">No ratings yet</span>
        ) : (
          <>
            {showAverage ? (
              <span className="font-semibold text-text-primary">
                {clamped.toFixed(1)}
              </span>
            ) : null}
            <span className="text-text-muted">
              {showAverage ? " " : ""}
              ({count} rating{count === 1 ? "" : "s"})
            </span>
          </>
        )}
      </span>
    </div>
  );
}
