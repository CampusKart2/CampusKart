"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { applySearchParams } from "@/lib/search-params";
import type { ListingCondition } from "@/lib/validators/listings";

/** Slug → display label for category chips (must match FilterSidebar categories). */
const CATEGORY_LABELS: Record<string, string> = {
  books: "Books",
  electronics: "Electronics",
  furniture: "Furniture",
  clothing: "Clothing",
  other: "Other",
};

function categoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug;
}

export interface ActiveFilterChipsProps {
  q: string;
  category: string | null;
  priceMin: number | null;
  priceMax: number | null;
  condition: ListingCondition | null;
  includeSold: boolean;
}

/**
 * Renders dismissible chips for each active filter above results.
 * Removing a chip updates the URL (clears that filter) so state stays in sync.
 */
export default function ActiveFilterChips({
  q,
  category,
  priceMin,
  priceMax,
  condition,
  includeSold,
}: ActiveFilterChipsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const removeFilter = (updates: {
    q?: null;
    category?: null;
    price_min?: null;
    price_max?: null;
    condition?: null;
    include_sold?: null;
  }) => {
    const params = applySearchParams(searchParams, updates);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const chips: { id: string; label: string; onRemove: () => void }[] = [];

  if (q.trim()) {
    chips.push({
      id: "q",
      label: q.length > 24 ? `${q.slice(0, 24)}…` : q,
      onRemove: () => removeFilter({ q: null }),
    });
  }
  if (category) {
    chips.push({
      id: "category",
      label: categoryLabel(category),
      onRemove: () => removeFilter({ category: null }),
    });
  }
  if (priceMin != null || priceMax != null) {
    const priceLabel =
      priceMin != null && priceMax != null
        ? `$${priceMin} – $${priceMax}`
        : priceMin != null
          ? `Min $${priceMin}`
          : `Max $${priceMax}`;
    chips.push({
      id: "price",
      label: priceLabel,
      onRemove: () => removeFilter({ price_min: null, price_max: null }),
    });
  }
  if (condition) {
    chips.push({
      id: "condition",
      label: condition,
      onRemove: () => removeFilter({ condition: null }),
    });
  }
  if (includeSold) {
    chips.push({
      id: "include_sold",
      label: "Including sold",
      onRemove: () => removeFilter({ include_sold: null }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" role="list" aria-label="Active filters">
      {chips.map(({ id, label, onRemove }) => (
        <span
          key={id}
          role="listitem"
          className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border pl-3 pr-1.5 py-1.5 text-sm text-text-primary"
        >
          <span className="truncate max-w-[180px] sm:max-w-[240px]">{label}</span>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label} filter`}
            className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-surface text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
          >
            <X size={14} aria-hidden />
          </button>
        </span>
      ))}
    </div>
  );
}
