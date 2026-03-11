"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import MobileCategoryDrawer from "@/components/ui/MobileCategoryDrawer";

interface Props {
  activeCategory: string | null;
}

export default function MobileFilterButtonWrapper({ activeCategory }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Browse categories"
        className="flex items-center justify-center w-10 h-10 rounded-input bg-card border border-border text-text-secondary hover:bg-surface transition-colors flex-shrink-0"
      >
        <SlidersHorizontal size={18} />
      </button>

      <MobileCategoryDrawer
        open={open}
        onClose={() => setOpen(false)}
        activeCategory={activeCategory}
        onCategorySelect={handleSelect}
      />
    </>
  );
}
