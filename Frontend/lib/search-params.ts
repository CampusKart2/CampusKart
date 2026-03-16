/**
 * Search page URL query param keys.
 * Single source of truth so filter state stays in sync with the URL for:
 * - Sharable links (copy URL = share current filters + query)
 * - Back/forward (router.push adds history entries; server reads searchParams on load)
 */
export const SEARCH_PARAM_KEYS = {
  q: "q",
  category: "category",
  price_min: "price_min",
  price_max: "price_max",
  condition: "condition",
  page: "page",
  limit: "limit",
} as const;

export type SearchParamKey = keyof typeof SEARCH_PARAM_KEYS;

/** Apply filter updates to current URLSearchParams; preserves all other params. */
export function applySearchParams(
  current: URLSearchParams,
  updates: {
    q?: string | null;
    category?: string | null;
    price_min?: number | null;
    price_max?: number | null;
    condition?: string | null;
  }
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  if (updates.q !== undefined) {
    if (updates.q) next.set(SEARCH_PARAM_KEYS.q, updates.q);
    else next.delete(SEARCH_PARAM_KEYS.q);
  }
  if (updates.category !== undefined) {
    if (updates.category) next.set(SEARCH_PARAM_KEYS.category, updates.category);
    else next.delete(SEARCH_PARAM_KEYS.category);
  }
  if (updates.price_min !== undefined) {
    if (updates.price_min != null)
      next.set(SEARCH_PARAM_KEYS.price_min, String(updates.price_min));
    else next.delete(SEARCH_PARAM_KEYS.price_min);
  }
  if (updates.price_max !== undefined) {
    if (updates.price_max != null)
      next.set(SEARCH_PARAM_KEYS.price_max, String(updates.price_max));
    else next.delete(SEARCH_PARAM_KEYS.price_max);
  }
  if (updates.condition !== undefined) {
    if (updates.condition) next.set(SEARCH_PARAM_KEYS.condition, updates.condition);
    else next.delete(SEARCH_PARAM_KEYS.condition);
  }
  return next;
}
