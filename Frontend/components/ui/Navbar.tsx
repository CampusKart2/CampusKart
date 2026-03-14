import Link from "next/link";
import NavbarSearchBar from "./NavbarSearchBar";
import MobileMenu from "./MobileMenu";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";
import type { SessionPayload } from "@/lib/session";

export default async function Navbar() {
  // getSession() now returns SessionPayload | null
  const session = await getSession();
  const isLoggedIn = session !== null;

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      {/* Desktop navbar — 56px tall */}
      <div className="flex items-center h-14 px-4 gap-4 max-w-screen-xl mx-auto">
        {/* Left: Logo */}
        <Link
          href="/"
          className="flex-shrink-0 text-xl font-bold text-primary tracking-tight"
        >
          CampusKart
        </Link>

        {/* Center: Search (hidden on mobile, shown md+) */}
        <div className="hidden md:flex flex-1 justify-center">
          <NavbarSearchBar />
        </div>

        {/* Right: Auth buttons (hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-2 flex-shrink-0">
          {isLoggedIn ? (
            <>
              <Link
                href="/sell"
                className="px-4 py-2 text-sm font-semibold text-primary border border-primary rounded-button hover:bg-primary-light transition"
              >
                + Sell
              </Link>
              {/* T-13: Logout button — clearly bordered so it reads as a button */}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold
                             text-text-secondary border border-border rounded-button
                             hover:border-danger hover:text-danger bg-card transition"
                  aria-label="Log out"
                >
                  {/* Logout icon */}
                  <svg
                    className="h-4 w-4"
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
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-primary border border-primary rounded-button hover:bg-primary-light transition"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-button hover:bg-primary-dark transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>

        {/* Mobile: hamburger (shown below md) */}
        <div className="flex md:hidden ml-auto">
          {/* Pass the full session so MobileMenu can show user context + logout */}
          <MobileMenu session={session as SessionPayload | null} />
        </div>
      </div>

      {/* Mobile search bar — shown below md */}
      <div className="flex md:hidden px-4 pb-3">
        <NavbarSearchBar />
      </div>
    </header>
  );
}
