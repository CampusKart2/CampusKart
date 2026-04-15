"use client";

import {
  BookOpen,
  Cpu,
  Home,
  Shirt,
  Package,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import type { ListingCondition } from "@/lib/validators/listings";

interface Category {
  label: string;
  slug: string | null;
  Icon: LucideIcon;
}

const CATEGORIES: Category[] = [
  { label: "All Categories", slug: null, Icon: LayoutGrid },
  { label: "Books", slug: "books", Icon: BookOpen },
  { label: "Electronics", slug: "electronics", Icon: Cpu },
  { label: "Furniture", slug: "furniture", Icon: Home },
  { label: "Clothing", slug: "clothing", Icon: Shirt },
  { label: "Other", slug: "other", Icon: Package },
];

export interface FilterSidebarProps {
  activeCategory: string | null;
  priceMin: number | null;
  priceMax: number | null;
  condition: ListingCondition | null;
  includeSold: boolean;
  onCategorySelect: (slug: string | null) => void;
  onPriceChange: (min: number | null, max: number | null) => void;
  onConditionSelect: (condition: ListingCondition | null) => void;
  onIncludeSoldChange: (include: boolean) => void;
}

const SECTION_HEADING =
  "text-xs font-semibold uppercase tracking-widest text-text-secondary mb-3 px-1";

/** Shared filter form content for sidebar and drawer. */
export function FilterFormContent({
  activeCategory,
  priceMin,
  priceMax,
  condition,
  includeSold,
  onCategorySelect,
  onPriceChange,
  onConditionSelect,
  onIncludeSoldChange,
}: FilterSidebarProps) {
  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    const nextMin = raw === "" ? null : Number.parseFloat(raw);
    if (raw !== "" && Number.isNaN(nextMin)) return;
    onPriceChange(nextMin, priceMax);
  };

  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    const nextMax = raw === "" ? null : Number.parseFloat(raw);
    if (raw !== "" && Number.isNaN(nextMax)) return;
    onPriceChange(priceMin, nextMax);
  };

  return (
    <div className="p-4 space-y-6">
        {/* Categories */}
        <section>
          <h2 className={SECTION_HEADING}>Category</h2>
          <nav className="flex flex-col gap-0.5" aria-label="Filter by category">
            {CATEGORIES.map(({ label, slug, Icon }) => {
              const isActive = activeCategory === slug;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onCategorySelect(slug)}
                  className={[
                    "flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium transition-colors text-left rounded-input border-l-2",
                    isActive
                      ? "bg-primary-light text-primary border-primary"
                      : "border-transparent text-text-primary hover:bg-surface",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0",
                      isActive ? "bg-primary/10" : "bg-surface",
                    ].join(" ")}
                  >
                    <Icon
                      size={18}
                      className={
                        isActive ? "text-primary" : "text-text-secondary"
                      }
                    />
                  </span>
                  {label}
                </button>
              );
            })}
          </nav>
        </section>

        {/* Price range */}
        <section>
          <h2 className={SECTION_HEADING}>Price range</h2>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="filter-price-min">
              Minimum price ($)
            </label>
            <input
              id="filter-price-min"
              type="number"
              min={0}
              step={1}
              placeholder="Min"
              value={priceMin ?? ""}
              onChange={handlePriceMinChange}
              aria-label="Minimum price in dollars"
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <span className="text-text-muted text-sm flex-shrink-0">–</span>
            <label className="sr-only" htmlFor="filter-price-max">
              Maximum price ($)
            </label>
            <input
              id="filter-price-max"
              type="number"
              min={0}
              step={1}
              placeholder="Max"
              value={priceMax ?? ""}
              onChange={handlePriceMaxChange}
              aria-label="Maximum price in dollars"
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </section>

        {/* Condition */}
        <section>
          <h2 className={SECTION_HEADING}>Condition</h2>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter by condition"
          >
            <button
              type="button"
              onClick={() => onConditionSelect(null)}
              className={[
                "px-3 py-1.5 text-sm font-medium rounded-input border transition-colors",
                condition === null
                  ? "bg-primary-light text-primary border-primary"
                  : "border-border text-text-secondary hover:bg-surface hover:text-text-primary",
              ].join(" ")}
            >
              Any
            </button>
            {(["New", "Like New", "Good", "Fair", "Poor"] as const).map(
              (c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onConditionSelect(c)}
                  className={[
                    "px-3 py-1.5 text-sm font-medium rounded-input border transition-colors",
                    condition === c
                      ? "bg-primary-light text-primary border-primary"
                      : "border-border text-text-secondary hover:bg-surface hover:text-text-primary",
                  ].join(" ")}
                >
                  {c}
                </button>
              )
            )}
          </div>
        </section>

        {/* Sold listings toggle */}
        <section>
          <h2 className={SECTION_HEADING}>Listing status</h2>
          <label className="flex items-center gap-3 rounded-input border border-border bg-surface px-3 py-2.5 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={includeSold}
              onChange={(event) => onIncludeSoldChange(event.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            Include sold listings
          </label>
        </section>
    </div>
  );
}

export default function FilterSidebar(props: FilterSidebarProps) {
  return (
    <aside className="w-[280px] sm:w-[320px] flex-shrink-0 bg-card border-r border-border h-full overflow-y-auto">
      <FilterFormContent {...props} />
    </aside>
  );
}
