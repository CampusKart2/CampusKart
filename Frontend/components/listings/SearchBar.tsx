"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(() => searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync input if the URL ?q= changes externally (e.g. browser back/forward)
  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const pushQuery = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) {
        params.set("q", q);
      } else {
        params.delete("q");
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushQuery(next);
    }, 300);
  };

  const handleClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setValue("");
    pushQuery("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="relative flex items-center w-full h-10">
      {/* Search icon */}
      <Search
        size={16}
        className="absolute left-3 text-text-muted pointer-events-none flex-shrink-0"
        aria-hidden="true"
      />

      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Search CampusKart..."
        aria-label="Search listings"
        className={[
          "w-full h-full rounded-card bg-surface border border-transparent pl-9 text-sm text-text-primary placeholder:text-text-muted",
          "focus:outline-none focus:bg-card focus:border-primary transition-colors duration-150",
          value ? "pr-9" : "pr-4",
        ].join(" ")}
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-text-muted/20 hover:bg-text-muted/40 transition-colors"
        >
          <X size={12} className="text-text-primary" />
        </button>
      )}
    </div>
  );
}
