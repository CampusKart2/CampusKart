export type Condition = 'New' | 'Like New' | 'Good' | 'Fair';

export type CategoryType = 'Textbooks' | 'Furniture' | 'Electronics' | 'Clothing' | 'Dorm Essentials';

export interface Review {
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export interface Listing {
  id: number;
  title: string;
  price: number;
  category: CategoryType;
  campus: string;
  description: string;
  condition: Condition;
  sellerName: string;
  sellerRating: number;
  sellerAvatar: string;
  image: string;
  rating: number;
  reviews: Review[];
  viewCount: number;
  priceHistory: PriceHistoryPoint[];
  datePosted: string;
  isFree?: boolean;
  isTrending?: boolean;
  isHotDeal?: boolean;
}

const REVIEWS: Record<number, Review[]> = {
  1: [
    { author: 'Jordan K.', rating: 5, text: 'Exactly as described. Met at library, super smooth.', date: '2025-02-18' },
    { author: 'Sam T.', rating: 4.5, text: 'Great condition, minimal highlighting. Thanks!', date: '2025-02-15' },
  ],
  2: [
    { author: 'Morgan L.', rating: 5, text: 'Comfy chair, no stains. Perfect for my dorm.', date: '2025-02-19' },
    { author: 'Alex R.', rating: 5, text: 'Quick pickup. Seller was really nice.', date: '2025-02-14' },
  ],
  3: [
    { author: 'Casey M.', rating: 5, text: 'iPad works perfectly. Came with charger.', date: '2025-02-17' },
    { author: 'Riley J.', rating: 4.5, text: 'Minor scratch on back but screen is flawless.', date: '2025-02-12' },
  ],
  4: [
    { author: 'Quinn P.', rating: 4.5, text: 'Fridge keeps everything cold. Good deal.', date: '2025-02-16' },
    { author: 'Taylor W.', rating: 5, text: 'Like new! So glad I found this.', date: '2025-02-11' },
  ],
  5: [{ author: 'Avery S.', rating: 4, text: 'Some highlighting but pages are intact.', date: '2025-02-15' }],
  6: [{ author: 'Jordan B.', rating: 4.5, text: 'Sturdy frame. Easy to assemble.', date: '2025-02-14' }],
  7: [
    { author: 'Sam K.', rating: 5, text: 'Fast MacBook. Battery health 98%.', date: '2025-02-18' },
    { author: 'Morgan D.', rating: 5, text: 'Best purchase this semester.', date: '2025-02-10' },
  ],
  8: [{ author: 'Alex C.', rating: 4.5, text: 'Warm parka. Size runs a bit large.', date: '2025-02-17' }],
  9: [{ author: 'Riley N.', rating: 4, text: 'Bright lamp. Good for late-night studying.', date: '2025-02-13' }],
  10: [{ author: 'Casey L.', rating: 4.5, text: 'Clean book. No missing pages.', date: '2025-02-16' }],
  11: [{ author: 'Quinn H.', rating: 4.5, text: 'Sturdy shelf. Fits all my textbooks.', date: '2025-02-12' }],
  12: [{ author: 'Taylor F.', rating: 4, text: 'Good sound. Case included.', date: '2025-02-15' }],
  13: [{ author: 'Avery G.', rating: 5, text: 'Perfect for my stats class.', date: '2025-02-19' }],
  14: [{ author: 'Jordan V.', rating: 4.5, text: 'Comfy and in great shape.', date: '2025-02-14' }],
  15: [{ author: 'Sam Z.', rating: 5, text: 'Works like new. Great price.', date: '2025-02-18' }],
  16: [{ author: 'Morgan X.', rating: 4, text: 'Cute design. Fits true to size.', date: '2025-02-11' }],
  17: [{ author: 'Alex Q.', rating: 5, text: 'Super soft. Washed once, perfect.', date: '2025-02-17' }],
  18: [{ author: 'Riley P.', rating: 4.5, text: 'Organizes my desk well.', date: '2025-02-16' }],
  19: [{ author: 'Casey W.', rating: 5, text: 'No stains. Great quality.', date: '2025-02-15' }],
  20: [{ author: 'Quinn M.', rating: 4.5, text: 'Holds a lot. Fits under bed.', date: '2025-02-13' }],
  21: [{ author: 'Taylor R.', rating: 5, text: 'Essential for chem lab.', date: '2025-02-19' }],
  22: [{ author: 'Avery T.', rating: 4, text: 'Good monitor. No dead pixels.', date: '2025-02-12' }],
  23: [{ author: 'Jordan Y.', rating: 4.5, text: 'Comfy and warm.', date: '2025-02-18' }],
  24: [{ author: 'Sam U.', rating: 5, text: 'Keeps drinks cold all day.', date: '2025-02-14' }],
  25: [{ author: 'Morgan I.', rating: 4.5, text: 'Clean and works great.', date: '2025-02-17' }],
  26: [
    { author: 'Jordan K.', rating: 4.5, text: 'Free and in good shape. Thanks!', date: '2025-02-18' },
    { author: 'Sam T.', rating: 5, text: 'Perfect for intro courses.', date: '2025-02-16' },
  ],
  27: [{ author: 'Morgan L.', rating: 4.5, text: 'Sturdy and easy to put together.', date: '2025-02-17' }],
  28: [
    { author: 'Alex R.', rating: 5, text: 'Keyboard works great. No issues.', date: '2025-02-19' },
    { author: 'Casey M.', rating: 4.5, text: 'Good for programming.', date: '2025-02-15' },
  ],
  29: [{ author: 'Riley J.', rating: 4, text: 'Warm and comfy. Size as described.', date: '2025-02-14' }],
  30: [
    { author: 'Quinn P.', rating: 4.5, text: 'Handy for organizing. Good quality.', date: '2025-02-13' },
    { author: 'Taylor W.', rating: 5, text: 'Exactly what I needed for my dorm.', date: '2025-02-12' },
  ],
};

function priceHistory(basePrice: number, points = 5): PriceHistoryPoint[] {
  const now = new Date();
  const out: PriceHistoryPoint[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 4);
    const variation = (Math.random() - 0.5) * 0.15 * basePrice;
    out.push({ date: d.toISOString().slice(0, 10), price: Math.round(Math.max(0, basePrice + variation)) });
  }
  return out;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 1,
    title: 'Calculus Textbook - 8th Edition',
    price: 45,
    category: 'Textbooks',
    campus: 'North Campus',
    description: 'Excellent condition calculus textbook, 8th edition. Minimal highlighting. Perfect for Calculus I and II. Includes practice problems and solutions.',
    condition: 'Like New',
    sellerName: 'Alex M.',
    sellerRating: 4.9,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    image: 'https://images.unsplash.com/photo-1711613160734-11caf3ce151d?w=800&q=80',
    rating: 4.8,
    reviews: REVIEWS[1] ?? [],
    viewCount: 72,
    priceHistory: priceHistory(45),
    datePosted: daysAgo(5),
    isTrending: true,
  },
  {
    id: 2,
    title: 'Modern IKEA Desk Chair',
    price: 30,
    category: 'Furniture',
    campus: 'West Dorms',
    description: 'Ergonomic desk chair from IKEA. Light use, no stains. Perfect for long study sessions.',
    condition: 'Good',
    sellerName: 'Jordan P.',
    sellerRating: 4.8,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
    image: 'https://images.unsplash.com/photo-1762423992354-4a11c971bf91?w=800&q=80',
    rating: 5.0,
    reviews: REVIEWS[2] ?? [],
    viewCount: 88,
    priceHistory: priceHistory(30),
    datePosted: daysAgo(3),
    isHotDeal: true,
  },
  {
    id: 3,
    title: 'Apple iPad Pro 11"',
    price: 350,
    category: 'Electronics',
    campus: 'Engineering Quad',
    description: 'iPad Pro 11" 128GB WiFi. Includes charger and case. Screen protector applied.',
    condition: 'Like New',
    sellerName: 'Sam R.',
    sellerRating: 5.0,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam',
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&q=80',
    rating: 4.9,
    reviews: REVIEWS[3] ?? [],
    viewCount: 120,
    priceHistory: priceHistory(350),
    datePosted: daysAgo(2),
    isTrending: true,
  },
  {
    id: 4,
    title: 'Mini Fridge - Like New',
    price: 60,
    category: 'Dorm Essentials',
    campus: 'South Campus',
    description: 'Compact mini fridge, 3.2 cu ft. Perfect for dorm. Cleaned and ready to use.',
    condition: 'Like New',
    sellerName: 'Morgan L.',
    sellerRating: 4.7,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan',
    image: 'https://images.unsplash.com/photo-1759772238095-d1ed3f036ad5?w=800&q=80',
    rating: 4.7,
    reviews: REVIEWS[4] ?? [],
    viewCount: 95,
    priceHistory: priceHistory(60),
    datePosted: daysAgo(7),
    isHotDeal: true,
  },
  {
    id: 5,
    title: 'Organic Chemistry 2nd Ed',
    price: 55,
    category: 'Textbooks',
    campus: 'Science Building',
    description: 'Organic Chemistry 2nd edition. Some highlighting in first 5 chapters. Solutions manual not included.',
    condition: 'Good',
    sellerName: 'Casey T.',
    sellerRating: 4.5,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
    rating: 4.5,
    reviews: REVIEWS[5] ?? [],
    viewCount: 45,
    priceHistory: priceHistory(55),
    datePosted: daysAgo(10),
  },
  {
    id: 6,
    title: 'Twin XL Bed Frame',
    price: 80,
    category: 'Furniture',
    campus: 'East Dorms',
    description: 'Metal twin XL bed frame. Sturdy, easy to assemble. No box spring needed.',
    condition: 'Good',
    sellerName: 'Riley N.',
    sellerRating: 4.6,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80',
    rating: 4.6,
    reviews: REVIEWS[6] ?? [],
    viewCount: 62,
    priceHistory: priceHistory(80),
    datePosted: daysAgo(6),
  },
  {
    id: 7,
    title: 'MacBook Air M1',
    price: 650,
    category: 'Electronics',
    campus: 'Library',
    description: 'MacBook Air M1 256GB. Battery cycle count under 100. Comes with original box and charger.',
    condition: 'Like New',
    sellerName: 'Quinn W.',
    sellerRating: 5.0,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    rating: 5.0,
    reviews: REVIEWS[7] ?? [],
    viewCount: 110,
    priceHistory: priceHistory(650),
    datePosted: daysAgo(4),
    isTrending: true,
  },
  {
    id: 8,
    title: 'Winter Parka Size M',
    price: 40,
    category: 'Clothing',
    campus: 'North Campus',
    description: 'Heavy-duty winter parka. Waterproof, hood included. Worn one season.',
    condition: 'Like New',
    sellerName: 'Avery J.',
    sellerRating: 4.8,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avery',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80',
    rating: 4.8,
    reviews: REVIEWS[8] ?? [],
    viewCount: 38,
    priceHistory: priceHistory(40),
    datePosted: daysAgo(8),
  },
  {
    id: 9,
    title: 'Desk Lamp LED',
    price: 25,
    category: 'Dorm Essentials',
    campus: 'West Dorms',
    description: 'Adjustable LED desk lamp. 3 brightness levels. USB port for charging.',
    condition: 'Good',
    sellerName: 'Taylor K.',
    sellerRating: 4.4,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    rating: 4.4,
    reviews: REVIEWS[9] ?? [],
    viewCount: 55,
    priceHistory: priceHistory(25),
    datePosted: daysAgo(1),
    isHotDeal: true,
  },
  {
    id: 10,
    title: 'Physics for Scientists',
    price: 50,
    category: 'Textbooks',
    campus: 'Engineering Quad',
    description: 'Physics for Scientists and Engineers. 9th edition. Clean, no writing.',
    condition: 'Like New',
    sellerName: 'Jordan F.',
    sellerRating: 4.7,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan2',
    image: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&q=80',
    rating: 4.7,
    reviews: REVIEWS[10] ?? [],
    viewCount: 48,
    priceHistory: priceHistory(50),
    datePosted: daysAgo(9),
  },
  {
    id: 11,
    title: 'Bookshelf 5-Tier',
    price: 45,
    category: 'Furniture',
    campus: 'South Campus',
    description: 'Wood laminate 5-tier bookshelf. Easy to assemble. Holds textbooks and more.',
    condition: 'Good',
    sellerName: 'Sam D.',
    sellerRating: 4.5,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam2',
    image: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800&q=80',
    rating: 4.5,
    reviews: REVIEWS[11] ?? [],
    viewCount: 52,
    priceHistory: priceHistory(45),
    datePosted: daysAgo(11),
  },
  {
    id: 12,
    title: 'Wireless Earbuds',
    price: 35,
    category: 'Electronics',
    campus: 'North Campus',
    description: 'Wireless earbuds with case. Good battery life. No visible wear.',
    condition: 'Like New',
    sellerName: 'Morgan H.',
    sellerRating: 4.6,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan2',
    image: 'https://images.unsplash.com/photo-1598331668826-20cecc596b86?w=800&q=80',
    rating: 4.6,
    reviews: REVIEWS[12] ?? [],
    viewCount: 68,
    priceHistory: priceHistory(35),
    datePosted: daysAgo(5),
  },
  {
    id: 13,
    title: 'Statistics Textbook',
    price: 18,
    category: 'Textbooks',
    campus: 'East Dorms',
    description: 'Intro to Statistics. 6th edition. Few highlighted sections.',
    condition: 'Good',
    sellerName: 'Casey V.',
    sellerRating: 4.9,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey2',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    rating: 4.8,
    reviews: REVIEWS[13] ?? [],
    viewCount: 42,
    priceHistory: priceHistory(18),
    datePosted: daysAgo(2),
    isHotDeal: true,
  },
  {
    id: 14,
    title: 'Bean Bag Chair',
    price: 22,
    category: 'Furniture',
    campus: 'West Dorms',
    description: 'Large bean bag chair. Gray fabric. Small tear on bottom (not visible when seated).',
    condition: 'Fair',
    sellerName: 'Riley B.',
    sellerRating: 4.4,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley2',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    rating: 4.5,
    reviews: REVIEWS[14] ?? [],
    viewCount: 78,
    priceHistory: priceHistory(22),
    datePosted: daysAgo(4),
  },
  {
    id: 15,
    title: 'Gaming Headset',
    price: 45,
    category: 'Electronics',
    campus: 'Engineering Quad',
    description: 'RGB gaming headset. Wired, 3.5mm. Mic works great. Used one semester.',
    condition: 'Like New',
    sellerName: 'Quinn S.',
    sellerRating: 4.8,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn2',
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80',
    rating: 4.7,
    reviews: REVIEWS[15] ?? [],
    viewCount: 85,
    priceHistory: priceHistory(45),
    datePosted: daysAgo(3),
  },
  {
    id: 16,
    title: 'Vintage Denim Jacket S',
    price: 28,
    category: 'Clothing',
    campus: 'South Campus',
    description: 'Light wash denim jacket. Size S. Broken in, no rips.',
    condition: 'Good',
    sellerName: 'Avery L.',
    sellerRating: 4.6,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avery2',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
    rating: 4.5,
    reviews: REVIEWS[16] ?? [],
    viewCount: 35,
    priceHistory: priceHistory(28),
    datePosted: daysAgo(7),
  },
  {
    id: 17,
    title: 'Fleece Blanket',
    price: 15,
    category: 'Clothing',
    campus: 'North Campus',
    description: 'Soft fleece throw blanket. Navy blue. Machine washable.',
    condition: 'Like New',
    sellerName: 'Taylor M.',
    sellerRating: 4.9,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor2',
    image: 'https://images.unsplash.com/photo-1631889993959-41b4e9c6e5c5?w=800&q=80',
    rating: 4.8,
    reviews: REVIEWS[17] ?? [],
    viewCount: 44,
    priceHistory: priceHistory(15),
    datePosted: daysAgo(1),
  },
  {
    id: 18,
    title: 'Desk Organizer Set',
    price: 12,
    category: 'Dorm Essentials',
    campus: 'East Dorms',
    description: 'Bamboo desk organizer. Pen holder, tray, phone stand. Minimal use.',
    condition: 'Like New',
    sellerName: 'Jordan R.',
    sellerRating: 4.7,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan3',
    image: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800&q=80',
    rating: 4.6,
    reviews: REVIEWS[18] ?? [],
    viewCount: 30,
    priceHistory: priceHistory(12),
    datePosted: daysAgo(6),
  },
  {
    id: 19,
    title: 'Yoga Mat',
    price: 0,
    category: 'Clothing',
    campus: 'West Dorms',
    description: 'Free yoga mat. Slight wear, still grippy. Pick up only.',
    condition: 'Good',
    sellerName: 'Sam G.',
    sellerRating: 4.8,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam3',
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80',
    rating: 4.7,
    reviews: REVIEWS[19] ?? [],
    viewCount: 90,
    priceHistory: [{ date: daysAgo(14), price: 10 }, { date: daysAgo(7), price: 5 }, { date: daysAgo(0), price: 0 }],
    datePosted: daysAgo(2),
    isFree: true,
  },
  {
    id: 20,
    title: 'Under-Bed Storage Bins',
    price: 18,
    category: 'Dorm Essentials',
    campus: 'South Campus',
    description: 'Set of 2 under-bed storage bins. Clear plastic with wheels.',
    condition: 'Like New',
    sellerName: 'Morgan C.',
    sellerRating: 4.5,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan3',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    rating: 4.5,
    reviews: REVIEWS[20] ?? [],
    viewCount: 41,
    priceHistory: priceHistory(18),
    datePosted: daysAgo(8),
  },
  {
    id: 21,
    title: 'Chemistry Lab Coat',
    price: 0,
    category: 'Clothing',
    campus: 'Science Building',
    description: 'Free lab coat. Size M. Washed and ready. Great for gen chem.',
    condition: 'Good',
    sellerName: 'Casey N.',
    sellerRating: 4.9,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey3',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
    rating: 4.9,
    reviews: REVIEWS[21] ?? [],
    viewCount: 58,
    priceHistory: [{ date: daysAgo(5), price: 0 }, { date: daysAgo(0), price: 0 }],
    datePosted: daysAgo(1),
    isFree: true,
  },
  {
    id: 22,
    title: '24" Monitor 1080p',
    price: 120,
    category: 'Electronics',
    campus: 'Engineering Quad',
    description: '24 inch 1080p monitor. HDMI and VGA. No dead pixels. Stand included.',
    condition: 'Like New',
    sellerName: 'Riley X.',
    sellerRating: 4.7,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley3',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
    rating: 4.6,
    reviews: REVIEWS[22] ?? [],
    viewCount: 72,
    priceHistory: priceHistory(120),
    datePosted: daysAgo(10),
  },
  {
    id: 23,
    title: 'Knit Sweater Size L',
    price: 22,
    category: 'Clothing',
    campus: 'North Campus',
    description: 'Cozy knit sweater. Neutral gray. Gently used.',
    condition: 'Good',
    sellerName: 'Quinn A.',
    sellerRating: 4.5,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn3',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80',
    rating: 4.5,
    reviews: REVIEWS[23] ?? [],
    viewCount: 28,
    priceHistory: priceHistory(22),
    datePosted: daysAgo(5),
  },
  {
    id: 24,
    title: 'Insulated Water Bottle',
    price: 8,
    category: 'Dorm Essentials',
    campus: 'East Dorms',
    description: '32oz insulated bottle. Keeps cold 24hr. Minor dent on bottom.',
    condition: 'Fair',
    sellerName: 'Avery P.',
    sellerRating: 4.4,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avery3',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
    rating: 4.4,
    reviews: REVIEWS[24] ?? [],
    viewCount: 36,
    priceHistory: priceHistory(8),
    datePosted: daysAgo(12),
  },
  {
    id: 25,
    title: 'Graphing Calculator',
    price: 55,
    category: 'Electronics',
    campus: 'Library',
    description: 'TI-84 Plus. Works perfectly. Case and batteries included.',
    condition: 'Like New',
    sellerName: 'Taylor Z.',
    sellerRating: 4.8,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor3',
    image: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&q=80',
    rating: 4.7,
    reviews: REVIEWS[25] ?? [],
    viewCount: 65,
    priceHistory: priceHistory(55),
    datePosted: daysAgo(3),
  },
  {
    id: 26,
    title: 'Introduction to Psychology (Free)',
    price: 0,
    category: 'Textbooks',
    campus: 'North Campus',
    description: 'Free intro psych textbook. Previous edition but same content. Pick up at library.',
    condition: 'Good',
    sellerName: 'Avery S.',
    sellerRating: 4.7,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Avery4',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
    rating: 4.6,
    reviews: REVIEWS[26] ?? [],
    viewCount: 98,
    priceHistory: [{ date: daysAgo(10), price: 15 }, { date: daysAgo(3), price: 0 }, { date: daysAgo(0), price: 0 }],
    datePosted: daysAgo(1),
    isFree: true,
  },
  {
    id: 27,
    title: 'Study Desk with Drawer',
    price: 55,
    category: 'Furniture',
    campus: 'South Campus',
    description: 'Compact study desk with single drawer. Wood finish. Minor scratches on top.',
    condition: 'Good',
    sellerName: 'Jordan F.',
    sellerRating: 4.6,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan4',
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80',
    rating: 4.5,
    reviews: REVIEWS[27] ?? [],
    viewCount: 48,
    priceHistory: priceHistory(55),
    datePosted: daysAgo(4),
  },
  {
    id: 28,
    title: 'Mechanical Keyboard',
    price: 45,
    category: 'Electronics',
    campus: 'Engineering Quad',
    description: 'RGB mechanical keyboard. Cherry MX style switches. Used one semester.',
    condition: 'Like New',
    sellerName: 'Sam H.',
    sellerRating: 4.8,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam4',
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800&q=80',
    rating: 4.7,
    reviews: REVIEWS[28] ?? [],
    viewCount: 76,
    priceHistory: priceHistory(45),
    datePosted: daysAgo(2),
    isTrending: true,
  },
  {
    id: 29,
    title: 'Hoodie Size M',
    price: 18,
    category: 'Clothing',
    campus: 'West Dorms',
    description: 'University hoodie. Navy blue. Soft fleece inside. Light wear.',
    condition: 'Good',
    sellerName: 'Morgan E.',
    sellerRating: 4.5,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan4',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
    rating: 4.4,
    reviews: REVIEWS[29] ?? [],
    viewCount: 32,
    priceHistory: priceHistory(18),
    datePosted: daysAgo(6),
  },
  {
    id: 30,
    title: 'Storage Caddy for Shower',
    price: 10,
    category: 'Dorm Essentials',
    campus: 'East Dorms',
    description: 'Hanging shower caddy. Rust-resistant. Fits over showerhead.',
    condition: 'Like New',
    sellerName: 'Casey O.',
    sellerRating: 4.7,
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Casey4',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    rating: 4.6,
    reviews: REVIEWS[30] ?? [],
    viewCount: 25,
    priceHistory: priceHistory(10),
    datePosted: daysAgo(3),
  },
];

export function getListingById(id: number): Listing | undefined {
  return MOCK_LISTINGS.find((l) => l.id === id);
}

export function getDealOfTheDay(): Listing {
  const day = new Date().getDate();
  const index = day % MOCK_LISTINGS.length;
  return MOCK_LISTINGS[index];
}

export function getSimilarListings(listing: Listing, limit = 4): Listing[] {
  const delta = listing.price * 0.3;
  const minPrice = listing.price - delta;
  const maxPrice = listing.price + delta;
  const sameCategory = MOCK_LISTINGS.filter(
    (l) => l.id !== listing.id && l.category === listing.category
  );
  const withinPrice = sameCategory.filter(
    (l) => Math.abs(l.price - listing.price) <= delta
  );
  if (withinPrice.length >= limit) return withinPrice.slice(0, limit);
  return [...withinPrice, ...sameCategory.filter((l) => !withinPrice.includes(l))].slice(0, limit);
}

const STORAGE_KEY_RECENT = 'campuskart_recently_viewed';
const MAX_RECENT = 10;

export function getRecentlyViewedIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENT);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as number[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(id: number): void {
  const current = getRecentlyViewedIds();
  const next = [id, ...current.filter((x) => x !== id)].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(next));
}
