"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { ADMIN_EMAIL } from "@/lib/admin";
import type { SessionPayload } from "@/lib/session";

interface MobileMenuProps {
  session: SessionPayload | null;
}

export default function MobileMenu({ session }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const isAdmin = session?.email.toLowerCase() === ADMIN_EMAIL;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="p-2 rounded-button text-text-primary hover:bg-surface transition"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-card shadow-card-hover flex flex-col py-2 z-50">
          {/* Use `session !== null` directly so TypeScript narrows the type
              inside each branch — a derived `isLoggedIn: boolean` variable
              breaks the correlation and makes session.email a type error. */}
          {session !== null ? (
            <>
              {/* User context — shows masked email so user knows who is logged in */}
              {session.email && (
                <div className="px-4 py-2 border-b border-border mb-1">
                  <p className="text-xs text-text-muted truncate">{session.email}</p>
                </div>
              )}

              <Link
                href="/sell"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light transition"
              >
                + Sell something
              </Link>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface transition"
              >
                My profile
              </Link>
              {isAdmin ? (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-danger hover:bg-red-50 transition"
                >
                  Admin dashboard
                </Link>
              ) : null}

              {/* T-13: Logout button — separated visually, styled as destructive action */}
              <div className="px-3 pt-1 mt-1 border-t border-border">
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-sm font-semibold
                               text-danger border border-danger/30 rounded-button
                               hover:bg-red-50 transition"
                    aria-label="Log out"
                  >
                    {/* Logout icon */}
                    <svg
                      className="h-4 w-4 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6
                           a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Log Out
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
