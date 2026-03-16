"use client";

import { useRouter, useSearchParams } from "next/navigation";
import FilterSidebar from "@/components/ui/FilterSidebar";
import type { ListingCondition } from "@/lib/validators/listings";
import { applySearchParams } from "@/lib/search-params";

export interface FilterSidebarClientWrapperProps {
  activeCategory: string | null;
  priceMin: number | null;
  priceMax: number | null;
  condition: ListingCondition | null;
}

/**
 * Desktop filter sidebar. Syncs filter state to URL on every change so that:
 * - Links are sharable (URL encodes full filter state).
 * - Back button restores previous state (router.push adds history entries).
 */
export default function FilterSidebarClientWrapper({
  activeCategory,
  priceMin,
  priceMax,
  condition,
}: FilterSidebarClientWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParams = (updates: {
    category?: string | null;
    price_min?: number | null;
    price_max?: number | null;
    condition?: ListingCondition | null;
  }) => {
    const params = applySearchParams(searchParams, updates);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const onCategorySelect = (slug: string | null) => {
    setParams({ category: slug });
  };

  const onPriceChange = (min: number | null, max: number | null) => {
    setParams({ price_min: min, price_max: max });
  };

  const onConditionSelect = (c: ListingCondition | null) => {
    setParams({ condition: c });
  };

  return (
    <FilterSidebar
      activeCategory={activeCategory}
      priceMin={priceMin}
      priceMax={priceMax}
      condition={condition}
      onCategorySelect={onCategorySelect}
      onPriceChange={onPriceChange}
      onConditionSelect={onConditionSelect}
    />
  );
}
