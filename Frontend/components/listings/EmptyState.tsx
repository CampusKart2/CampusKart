import { PackageSearch } from "lucide-react";

interface EmptyStateProps {
  query?: string;
}

export default function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-surface mb-5">
        <PackageSearch size={40} className="text-text-muted" />
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-1">
        {query ? `No results for "${query}"` : "No listings found"}
      </h2>
      <p className="text-sm text-text-secondary">
        Try a different search or category.
      </p>
    </div>
  );
}
