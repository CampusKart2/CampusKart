import {
  fetchListingsForBrowse,
  parseListingsSearchParams,
} from "@/lib/listings-browse";
import { ListingsBrowseView } from "@/components/listings/ListingsBrowseView";

/**
 * Search page at /search. Shares the same browse view and URL semantics as
 * /listings; category clicks across the app use /listings?category=X for
 * filtered results.
 */
interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    price_min?: string;
    price_max?: string;
    condition?: string;
    include_sold?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const raw = await searchParams;
  const params = parseListingsSearchParams(raw);
  const listings = await fetchListingsForBrowse(params);
  const activeCategory = params.category || null;

  return (
    <ListingsBrowseView
      listings={listings}
      q={params.q}
      activeCategory={activeCategory}
      priceMin={params.priceMin}
      priceMax={params.priceMax}
      condition={params.condition}
      includeSold={params.includeSold}
    />
  );
}

