import { NextRequest, NextResponse } from "next/server";
import type { Listing } from "@/lib/types/listing";

const MOCK_LISTINGS: Listing[] = [
  {
    id: "1",
    title: "Calculus: Early Transcendentals 8th Edition",
    price: 35,
    condition: "Good",
    category: "books",
    thumbnail_url: null,
    seller_id: "u1",
    created_at: "2026-03-01T10:00:00Z",
    view_count: 42,
  },
  {
    id: "2",
    title: "MacBook Pro 14-inch 2023 (M2 Pro)",
    price: 1100,
    condition: "Like New",
    category: "electronics",
    thumbnail_url: null,
    seller_id: "u2",
    created_at: "2026-03-02T14:00:00Z",
    view_count: 120,
  },
  {
    id: "3",
    title: "IKEA MALM Desk — White",
    price: 60,
    condition: "Good",
    category: "furniture",
    thumbnail_url: null,
    seller_id: "u3",
    created_at: "2026-03-03T09:00:00Z",
    view_count: 18,
  },
  {
    id: "4",
    title: "Patagonia Better Sweater Fleece (M)",
    price: 45,
    condition: "Like New",
    category: "clothing",
    thumbnail_url: null,
    seller_id: "u4",
    created_at: "2026-03-04T11:00:00Z",
    view_count: 9,
  },
  {
    id: "5",
    title: "Organic Chemistry 2nd Ed. — Klein",
    price: 25,
    condition: "Fair",
    category: "books",
    thumbnail_url: null,
    seller_id: "u5",
    created_at: "2026-03-05T08:00:00Z",
    view_count: 33,
  },
  {
    id: "6",
    title: "Sony WH-1000XM5 Headphones",
    price: 180,
    condition: "Good",
    category: "electronics",
    thumbnail_url: null,
    seller_id: "u6",
    created_at: "2026-03-05T15:00:00Z",
    view_count: 87,
  },
  {
    id: "7",
    title: "Mini Fridge — 3.2 cu ft",
    price: 50,
    condition: "Good",
    category: "furniture",
    thumbnail_url: null,
    seller_id: "u7",
    created_at: "2026-03-06T10:30:00Z",
    view_count: 25,
  },
  {
    id: "8",
    title: "Nike Dri-FIT Running Shorts (L)",
    price: 0,
    condition: "Good",
    category: "clothing",
    thumbnail_url: null,
    seller_id: "u8",
    created_at: "2026-03-06T13:00:00Z",
    view_count: 5,
  },
  {
    id: "9",
    title: "TI-84 Plus CE Graphing Calculator",
    price: 70,
    condition: "Like New",
    category: "electronics",
    thumbnail_url: null,
    seller_id: "u9",
    created_at: "2026-03-07T09:00:00Z",
    view_count: 60,
  },
  {
    id: "10",
    title: "Introduction to Algorithms (CLRS) 4th Ed.",
    price: 40,
    condition: "New",
    category: "books",
    thumbnail_url: null,
    seller_id: "u10",
    created_at: "2026-03-07T11:00:00Z",
    view_count: 14,
  },
  {
    id: "11",
    title: "Ergonomic Office Chair",
    price: 90,
    condition: "Good",
    category: "furniture",
    thumbnail_url: null,
    seller_id: "u11",
    created_at: "2026-03-08T10:00:00Z",
    view_count: 31,
  },
  {
    id: "12",
    title: "Hydro Flask 32 oz Wide Mouth Bottle",
    price: 20,
    condition: "Like New",
    category: "other",
    thumbnail_url: null,
    seller_id: "u12",
    created_at: "2026-03-08T12:00:00Z",
    view_count: 22,
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = (searchParams.get("q") ?? "").toLowerCase().trim();
  const category = (searchParams.get("category") ?? "").toLowerCase().trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  let results = MOCK_LISTINGS;

  if (q) {
    results = results.filter((l) => l.title.toLowerCase().includes(q));
  }
  if (category) {
    results = results.filter((l) => l.category === category);
  }

  const start = (page - 1) * limit;
  const paginated = results.slice(start, start + limit);

  return NextResponse.json({
    listings: paginated,
    total: results.length,
    page,
    limit,
  });
}
