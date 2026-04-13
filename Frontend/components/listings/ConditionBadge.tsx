// Server component — no interactivity needed, purely presentational.
import type { ListingCondition } from "@/lib/validators/listings";

// Maps each condition to standard Tailwind color classes (green → red scale).
// Using built-in palette classes so they are always included in the CSS bundle.
const CONDITION_CLASSES: Record<ListingCondition, string> = {
  New: "bg-green-500 text-white",
  "Like New": "bg-green-700 text-white",
  Good: "bg-yellow-400 text-gray-900",
  Fair: "bg-orange-500 text-white",
  Poor: "bg-red-500 text-white",
};

type Size = "sm" | "md";

interface ConditionBadgeProps {
  condition: ListingCondition;
  /** "sm" = listing card (compact), "md" = detail page (slightly larger). Defaults to "sm". */
  size?: Size;
}

export default function ConditionBadge({
  condition,
  size = "sm",
}: ConditionBadgeProps) {
  const sizeClasses =
    size === "md"
      ? "px-2.5 py-1 text-xs font-bold tracking-wide"
      : "px-1.5 py-0.5 text-xs font-semibold";

  return (
    <span
      className={[
        "inline-block rounded-badge",
        sizeClasses,
        CONDITION_CLASSES[condition],
      ].join(" ")}
    >
      {condition}
    </span>
  );
}
