export const CATEGORIES = ['Textbooks', 'Furniture', 'Electronics', 'Clothing', 'Dorm Essentials'] as const;

export type PriceFilterKey = 'all' | 'free' | 'under20' | 'under50' | '50to100' | '100plus';

export const PRICE_FILTERS: { key: PriceFilterKey; label: string; test: (price: number) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'free', label: 'Free', test: (p) => p === 0 },
  { key: 'under20', label: 'Under $20', test: (p) => p > 0 && p <= 20 },
  { key: 'under50', label: 'Under $50', test: (p) => p > 0 && p < 50 },
  { key: '50to100', label: '$50-$100', test: (p) => p >= 50 && p <= 100 },
  { key: '100plus', label: '$100+', test: (p) => p > 100 },
];

export const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'] as const;
