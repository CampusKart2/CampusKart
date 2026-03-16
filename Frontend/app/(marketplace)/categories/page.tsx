import Link from "next/link";
import { getCategoryDisplay } from "@/lib/category-display";

/** Category returned by GET /api/categories (with listing_count). */
interface CategoryWithCount {
  id: number;
  slug: string;
  name: string;
  listing_count: number;
}

async function fetchCategories(): Promise<CategoryWithCount[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/categories`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { categories?: CategoryWithCount[] };
  return data.categories ?? [];
}

function formatItemCount(count: number): string {
  return count === 1 ? "1 item" : `${count.toLocaleString("en-US")} items`;
}

/**
 * Category landing page: icon grid with each card showing icon + name + item count.
 * Links to /listings?category=slug for browsing listings in that category.
 */
export default async function CategoriesPage() {
  const categories = await fetchCategories();

  return (
    <div className="bg-surface min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
          Browse by category
        </h1>
        <p className="text-text-secondary mb-8">
          Choose a category to see all listings.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const { Icon, bg, fg } = getCategoryDisplay(cat.slug);
            return (
              <Link
                key={cat.slug}
                href={`/listings?category=${encodeURIComponent(cat.slug)}`}
                className="flex flex-col items-center gap-3 p-5 md:p-6 bg-card rounded-card shadow-card hover:shadow-card-hover hover:scale-[1.02] transition-all text-center"
              >
                <span
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center flex-shrink-0 ${bg} ${fg}`}
                  aria-hidden
                >
                  <Icon size={28} aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-text-primary line-clamp-2">
                  {cat.name}
                </span>
                <span className="text-xs text-text-muted">
                  {formatItemCount(cat.listing_count)}
                </span>
              </Link>
            );
          })}
        </div>

        {categories.length === 0 && (
          <p className="text-text-muted text-center py-12">
            No categories available yet.
          </p>
        )}
      </div>
    </div>
  );
}
