"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { FilterFormContent } from "./FilterSidebar";
import type { ListingCondition } from "@/lib/validators/listings";

export interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  activeCategory: string | null;
  priceMin: number | null;
  priceMax: number | null;
  condition: ListingCondition | null;
  onApply: (filters: {
    category: string | null;
    priceMin: number | null;
    priceMax: number | null;
    condition: ListingCondition | null;
  }) => void;
}

/** Mobile-only bottom drawer for filters. Syncs local state from URL when opened. */
export default function FilterDrawer({
  open,
  onClose,
  activeCategory,
  priceMin,
  priceMax,
  condition,
  onApply,
}: FilterDrawerProps) {
  const [localCategory, setLocalCategory] = useState<string | null>(activeCategory);
  const [localPriceMin, setLocalPriceMin] = useState<number | null>(priceMin);
  const [localPriceMax, setLocalPriceMax] = useState<number | null>(priceMax);
  const [localCondition, setLocalCondition] = useState<ListingCondition | null>(
    condition
  );

  // When drawer opens, seed form from current URL params.
  useEffect(() => {
    if (open) {
      setLocalCategory(activeCategory);
      setLocalPriceMin(priceMin);
      setLocalPriceMax(priceMax);
      setLocalCondition(condition);
    }
  }, [open, activeCategory, priceMin, priceMax, condition]);

  const handleApply = () => {
    onApply({
      category: localCategory,
      priceMin: localPriceMin,
      priceMax: localPriceMax,
      condition: localCondition,
    });
    onClose();
  };

  const handleClear = () => {
    setLocalCategory(null);
    setLocalPriceMin(null);
    setLocalPriceMax(null);
    setLocalCondition(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={[
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Bottom drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter listings"
        className={[
          "fixed left-0 right-0 bottom-0 z-50 bg-card rounded-t-2xl shadow-card-hover flex flex-col max-h-[85vh] transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
      >
        {/* Drag handle (visual affordance for bottom sheet) */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-text-primary">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="p-1.5 rounded-button text-text-secondary hover:bg-surface transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable filter form */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <FilterFormContent
            activeCategory={localCategory}
            priceMin={localPriceMin}
            priceMax={localPriceMax}
            condition={localCondition}
            onCategorySelect={setLocalCategory}
            onPriceChange={(min, max) => {
              setLocalPriceMin(min);
              setLocalPriceMax(max);
            }}
            onConditionSelect={setLocalCondition}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-4 py-4 border-t border-border flex-shrink-0 bg-card">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 py-2.5 text-sm font-semibold rounded-button border border-border text-text-primary bg-card hover:bg-surface transition"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 text-sm font-semibold rounded-button text-white bg-primary hover:bg-primary-dark transition"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
