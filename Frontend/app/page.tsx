import Link from "next/link";
import {
  BookOpen,
  Cpu,
  Home,
  Shirt,
  Package,
  LayoutGrid,
  ArrowRight,
  Camera,
  MessageCircle,
  MapPin,
  LogIn,
} from "lucide-react";
import ListingCard from "@/components/listings/ListingCard";
import HeroSearchBar from "@/components/home/HeroSearchBar";
import { getSession } from "@/lib/auth";
import type { Listing } from "@/lib/types/listing";

const CATEGORIES = [
  { label: "Books", slug: "books", Icon: BookOpen, bg: "bg-blue-50", fg: "text-blue-600" },
  { label: "Electronics", slug: "electronics", Icon: Cpu, bg: "bg-violet-50", fg: "text-violet-600" },
  { label: "Furniture", slug: "furniture", Icon: Home, bg: "bg-emerald-50", fg: "text-emerald-600" },
  { label: "Clothing", slug: "clothing", Icon: Shirt, bg: "bg-pink-50", fg: "text-pink-600" },
  { label: "Other", slug: "other", Icon: Package, bg: "bg-orange-50", fg: "text-orange-600" },
  { label: "All Items", slug: null, Icon: LayoutGrid, bg: "bg-surface", fg: "text-text-secondary" },
] as const;

const HOW_IT_WORKS = [
  {
    step: "1",
    Icon: Camera,
    title: "Post your item",
    desc: "Snap a photo, set a price, and list in under 60 seconds — no fees.",
  },
  {
    step: "2",
    Icon: MessageCircle,
    title: "Connect with buyers",
    desc: "Chat directly with interested students. No middlemen, no commissions.",
  },
  {
    step: "3",
    Icon: MapPin,
    title: "Meet on campus",
    desc: "Exchange safely at a familiar campus spot you both know.",
  },
] as const;

async function fetchRecentListings(): Promise<Listing[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/listings?limit=8`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { listings?: Listing[] } | Listing[];
    return Array.isArray(data) ? data : (data.listings ?? []);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const isLoggedIn = await getSession();
  const listings = isLoggedIn ? await fetchRecentListings() : [];

  return (
    <div className="bg-surface min-h-screen">
      {/* ── Hero ── */}
      <section className="bg-card border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center gap-6">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight max-w-2xl leading-tight">
            Buy &amp; sell on campus —{" "}
            <span className="text-primary">the easy way.</span>
          </h1>
          <p className="text-base md:text-lg text-text-secondary max-w-xl">
            CampusKart is the student marketplace for Pace University. Find
            textbooks, electronics, furniture, and more from people you already
            go to school with.
          </p>
          <HeroSearchBar />
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              href="/listings"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-button hover:bg-primary-dark transition"
            >
              Browse listings
            </Link>
            <Link
              href="/sell"
              className="px-5 py-2.5 text-sm font-semibold text-primary border border-primary rounded-button hover:bg-primary-light transition"
            >
              Sell something
            </Link>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="max-w-screen-xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-text-primary">
            Browse by category
          </h2>
          <Link
            href="/categories"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CATEGORIES.map(({ label, slug, Icon, bg, fg }) => (
            <Link
              key={label}
              href={slug ? `/listings?category=${slug}` : "/listings"}
              className="flex flex-col items-center gap-2.5 p-4 bg-card rounded-card shadow-card hover:shadow-card-hover hover:scale-[1.02] transition-all text-center"
            >
              <span
                className={`w-12 h-12 rounded-full flex items-center justify-center ${bg} ${fg}`}
              >
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold text-text-primary">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent Listings (logged-in users) ── */}
      {isLoggedIn && listings.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-text-primary">
              Recent listings
            </h2>
            <Link
              href="/listings"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              View all <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* ── Auth nudge (logged-out users) ── */}
      {!isLoggedIn && (
        <section className="max-w-screen-xl mx-auto px-4 pb-12">
          <div className="bg-card border border-border rounded-card shadow-card px-8 py-10 flex flex-col items-center text-center gap-4">
            <span className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center">
              <LogIn size={24} className="text-primary" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Sign in to browse listings
              </h2>
              <p className="mt-1 text-sm text-text-secondary max-w-md">
                Create a free account with your Pace email to see what
                students near you are buying and selling.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <Link
                href="/signup"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-button hover:bg-primary-dark transition"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-semibold text-primary border border-primary rounded-button hover:bg-primary-light transition"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section className="bg-card border-t border-border">
        <div className="max-w-screen-xl mx-auto px-4 py-14">
          <h2 className="text-xl font-bold text-text-primary text-center mb-10">
            How CampusKart works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map(({ step, Icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center gap-3">
                <span className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center">
                  <Icon size={24} className="text-primary" aria-hidden="true" />
                </span>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">
                  Step {step}
                </p>
                <h3 className="text-base font-bold text-text-primary">{title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
