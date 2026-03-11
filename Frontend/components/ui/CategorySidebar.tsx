"use client";

import { BookOpen, Cpu, Home, Shirt, Package, LayoutGrid } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

interface CategorySidebarProps {
  activeCategory: string | null;
  onCategorySelect: (slug: string | null) => void;
}

export default function CategorySidebar({
  activeCategory,
  onCategorySelect,
}: CategorySidebarProps) {
  return (
    <aside className="w-[360px] flex-shrink-0 bg-card border-r border-border h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-3 px-1">
          Categories
        </h2>
        <nav className="flex flex-col gap-0.5">
          {CATEGORIES.map(({ label, slug, Icon }) => {
            const isActive = activeCategory === slug;
            return (
              <button
                key={label}
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
                    className={isActive ? "text-primary" : "text-text-secondary"}
                  />
                </span>
                {label}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
