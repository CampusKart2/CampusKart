"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Toggle menu"
        className="p-2 rounded-button text-text-primary hover:bg-surface transition"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-card shadow-card-hover flex flex-col py-2 z-50">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light transition"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="mx-3 mt-1 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-button hover:bg-primary-dark transition text-center"
          >
            Sign Up
          </Link>
        </div>
      )}
    </div>
  );
}
