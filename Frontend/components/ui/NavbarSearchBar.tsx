"use client";

import { useState } from "react";
import { Search } from "lucide-react";

export default function NavbarSearchBar() {
  const [value, setValue] = useState("");

  return (
    <div className="relative flex items-center w-full max-w-xl">
      <Search
        className="absolute left-3 text-text-muted pointer-events-none"
        size={16}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search CampusKart..."
        className="w-full bg-surface border border-border rounded-input pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
      />
    </div>
  );
}
