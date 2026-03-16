import {
  BookOpen,
  Cpu,
  Home,
  Shirt,
  Package,
  type LucideIcon,
} from "lucide-react";

/**
 * Display config for a category (icon + Tailwind classes).
 * Used by the category landing page and any UI that shows category cards.
 */
export interface CategoryDisplayConfig {
  Icon: LucideIcon;
  /** Background class for the icon circle (e.g. bg-blue-50). */
  bg: string;
  /** Text/icon color class (e.g. text-blue-600). */
  fg: string;
}

/** Slug → display config. Must match categories in DB (books, electronics, furniture, clothing, other). */
const SLUG_TO_DISPLAY: Record<string, CategoryDisplayConfig> = {
  books: { Icon: BookOpen, bg: "bg-blue-50", fg: "text-blue-600" },
  electronics: { Icon: Cpu, bg: "bg-violet-50", fg: "text-violet-600" },
  furniture: { Icon: Home, bg: "bg-emerald-50", fg: "text-emerald-600" },
  clothing: { Icon: Shirt, bg: "bg-pink-50", fg: "text-pink-600" },
  other: { Icon: Package, bg: "bg-orange-50", fg: "text-orange-600" },
};

/**
 * Returns icon + styles for a category slug. Fallback for unknown slugs so
 * new DB categories still render (with default icon).
 */
export function getCategoryDisplay(slug: string): CategoryDisplayConfig {
  return (
    SLUG_TO_DISPLAY[slug] ?? {
      Icon: Package,
      bg: "bg-surface",
      fg: "text-text-secondary",
    }
  );
}
