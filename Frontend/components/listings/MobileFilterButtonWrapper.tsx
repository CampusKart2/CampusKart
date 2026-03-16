"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import FilterDrawer from "@/components/ui/FilterDrawer";
import type { ListingCondition } from "@/lib/validators/listings";
import { applySearchParams } from "@/lib/search-params";

export interface MobileFilterButtonWrapperProps {
  activeCategory: string | null;
  priceMin: number | null;
  priceMax: number | null;
  condition: ListingCondition | null;
}

/**
 * Mobile filter button and bottom drawer. On Apply, syncs filters to URL so that:
 * - Links are sharable; back button restores previous state (router.push adds history).
 */
export default function MobileFilterButtonWrapper({
  activeCategory,
  priceMin,
  priceMax,
  condition,
}: MobileFilterButtonWrapperProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const onApply = (filters: {
    category: string | null;
    priceMin: number | null;
    priceMax: number | null;
    condition: ListingCondition | null;
  }) => {
    const params = applySearchParams(searchParams, {
      category: filters.category,
      price_min: filters.priceMin,
      price_max: filters.priceMax,
      condition: filters.condition,
    });
    router.push(`?${params.toString()}`, { scroll: false });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open filters"
        className="flex items-center justify-center w-10 h-10 rounded-input bg-card border border-border text-text-secondary hover:bg-surface transition-colors flex-shrink-0"
      >
        <SlidersHorizontal size={18} />
      </button>

      <FilterDrawer
        open={open}
        onClose={() => setOpen(false)}
        activeCategory={activeCategory}
        priceMin={priceMin}
        priceMax={priceMax}
        condition={condition}
        onApply={onApply}
      />
    </>
  );
}
