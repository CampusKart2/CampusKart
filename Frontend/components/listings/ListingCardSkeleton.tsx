export default function ListingCardSkeleton() {
  return (
    <div className="bg-card rounded-card shadow-card overflow-hidden animate-pulse">
      {/* Thumbnail placeholder — 16:9 */}
      <div className="aspect-video w-full bg-surface" />

      {/* Content placeholders */}
      <div className="p-2 space-y-2">
        {/* Price */}
        <div className="h-5 w-16 bg-surface rounded-badge" />
        {/* Title line 1 */}
        <div className="h-4 w-full bg-surface rounded-badge" />
        {/* Title line 2 */}
        <div className="h-4 w-3/4 bg-surface rounded-badge" />
        {/* Badge + category row */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="h-4 w-14 bg-surface rounded-badge" />
          <div className="h-3 w-16 bg-surface rounded-badge" />
        </div>
      </div>
    </div>
  );
}
