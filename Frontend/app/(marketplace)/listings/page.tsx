import {
  fetchListingsForBrowse,
  parseListingsSearchParams,
} from "@/lib/listings-browse";
import { ListingsBrowseView } from "@/components/listings/ListingsBrowseView";

/**
 * Listings browse page at /listings. URL query params (e.g. ?category=X) are the
 * source of truth; category clicks across the app navigate here so the URL is
 * /listings?category=X and results are scoped correctly.
 */
interface ListingsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    price_min?: string;
    price_max?: string;
    condition?: string;
    include_sold?: string;
  }>;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
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
