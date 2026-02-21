import React from 'react';
import type { Listing } from '../data/mockListings';

const BADGE_STYLE = 'text-white text-xs px-2 py-1 rounded-full font-bold';

function isNew(datePosted: string): boolean {
  const posted = new Date(datePosted).getTime();
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  return posted >= threeDaysAgo;
}

export function ListingBadges({ listing }: { listing: Listing }) {
  const badges: { label: string; className: string }[] = [];
  if (listing.isFree ?? listing.price === 0) badges.push({ label: '💰 FREE', className: `bg-green-500 ${BADGE_STYLE}` });
  if (listing.isHotDeal) badges.push({ label: '🔥 Hot Deal', className: `bg-red-500 ${BADGE_STYLE}` });
  if (listing.isTrending) badges.push({ label: '📈 Trending', className: `bg-purple-500 ${BADGE_STYLE}` });
  if (isNew(listing.datePosted)) badges.push({ label: '⚡ New', className: `bg-blue-500 ${BADGE_STYLE}` });

  if (badges.length === 0) return null;

  return (
    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
      {badges.map((b) => (
        <span key={b.label} className={`${b.className} shadow-md`}>
          {b.label}
        </span>
      ))}
    </div>
  );
}
