import Link from "next/link";
import NavbarSearchBar from "./NavbarSearchBar";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
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
        </nav>

        {/* Mobile: hamburger (shown below md) */}
        <div className="flex md:hidden ml-auto">
          <MobileMenu />
        </div>
      </div>

      {/* Mobile search bar — shown below md */}
      <div className="flex md:hidden px-4 pb-3">
        <NavbarSearchBar />
      </div>
    </header>
  );
}
