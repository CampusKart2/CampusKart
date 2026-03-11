"use client";

import { X } from "lucide-react";
import CategorySidebar from "./CategorySidebar";

interface MobileCategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  activeCategory: string | null;
  onCategorySelect: (slug: string | null) => void;
}

export default function MobileCategoryDrawer({
  open,
  onClose,
  activeCategory,
  onCategorySelect,
}: MobileCategoryDrawerProps) {
  const handleSelect = (slug: string | null) => {
    onCategorySelect(slug);
    onClose();
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

      {/* Slide-in drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Browse categories"
        className={[
          "fixed left-0 top-0 h-full z-50 bg-card shadow-card-hover flex flex-col transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <span className="font-semibold text-text-primary">Browse</span>
          <button
            onClick={onClose}
            aria-label="Close categories"
            className="p-1.5 rounded-button text-text-secondary hover:bg-surface transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar content — remove right border when inside drawer */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <CategorySidebar
              activeCategory={activeCategory}
              onCategorySelect={handleSelect}
            />
          </div>
        </div>
      </div>
    </>
  );
}
