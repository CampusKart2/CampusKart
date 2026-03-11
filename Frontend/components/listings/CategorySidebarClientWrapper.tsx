"use client";

import { useRouter, useSearchParams } from "next/navigation";
import CategorySidebar from "@/components/ui/CategorySidebar";

interface Props {
  activeCategory: string | null;
}

export default function CategorySidebarClientWrapper({ activeCategory }: Props) {
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
    <CategorySidebar
      activeCategory={activeCategory}
      onCategorySelect={handleSelect}
    />
  );
}
