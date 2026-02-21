import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Heart,
  MessageCircle,
  Moon,
  Sun,
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  BookOpen,
  MessageSquare,
  Shield,
  ShoppingCart,
} from 'lucide-react';
import { useBookmarks } from '../context/BookmarkContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../hooks/useTheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { cn } from './ui/utils';

const CATEGORIES = [
  { name: 'Textbooks', emoji: '📚' },
  { name: 'Furniture', emoji: '🪑' },
  { name: 'Electronics', emoji: '📱' },
  { name: 'Clothing', emoji: '👕' },
  { name: 'Dorm Essentials', emoji: '🛏️' },
] as const;

export function Header() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const { bookmarkedIds } = useBookmarks();
  const { totalUnreadCount } = useChat();
  const [theme, toggleTheme] = useTheme();

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    console.log('Header search:', searchQuery);
    if (searchQuery.trim()) {
      try {
        sessionStorage.setItem('campuskart_search_query', searchQuery.trim());
        toast.success(`Searching for: ${searchQuery.trim()}`);
      } catch (_) {}
    }
    window.location.hash = 'browse';
  };

  const handleLogin = (): void => {
    console.log('Login clicked');
    window.location.hash = '#login';
  };

  const handleSignup = (): void => {
    console.log('Signup clicked');
    window.location.hash = '#signup';
  };

  const handleLogoClick = (): void => {
    window.location.hash = '';
  };

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = (): void => {
    setIsMobileMenuOpen(false);
  };

  const navBtnClass =
    'flex items-center gap-2 px-4 py-2 rounded-lg text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-white hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors font-medium text-sm whitespace-nowrap';

  return (
    <header className="sticky top-0 z-50 h-20 flex flex-col justify-center bg-white dark:bg-gray-900 backdrop-blur-md border-b border-[#E5E7EB] dark:border-gray-700 shadow-sm">
      <div className="max-w-[1400px] mx-auto w-full px-6 sm:px-8 py-4">
        {/* Desktop: single row */}
        <div className="hidden lg:flex items-center justify-between gap-6">
          {/* Logo */}
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex items-center gap-2 shrink-0 cursor-pointer bg-transparent border-none p-0"
            aria-label="Go to homepage"
          >
            <div className="w-10 h-10 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-[#111827] dark:text-white">
              CampusKart
            </span>
          </button>

          {/* Search bar - prominent, flex-1 max-w-3xl */}
          <form
            onSubmit={handleSearch}
            className="relative flex-1 max-w-3xl"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search textbooks, furniture, electronics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full h-12 pl-12 pr-4 rounded-full text-base',
                'bg-[#F9FAFB] dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-600',
                'text-[#111827] dark:text-gray-100 placeholder:text-[#6B7280] dark:placeholder:text-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200'
              )}
            />
          </form>

          {/* Center nav: Categories, Messages, Sell, Help */}
          <nav className="flex items-center gap-4 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={navBtnClass}>
                  Categories
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 rounded-xl border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1"
              >
                {CATEGORIES.map((cat) => (
                  <DropdownMenuItem key={cat.name} asChild>
                    <a
                      href={`#category/${encodeURIComponent(cat.name)}`}
                      className="flex items-center gap-2 cursor-pointer px-3 py-2.5 text-[#111827] dark:text-gray-100 focus:bg-[#F9FAFB] dark:focus:bg-gray-700"
                    >
                      <span>{cat.emoji}</span>
                      {cat.name}
                    </a>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild>
                  <a
                    href="#browse"
                    className="flex items-center gap-2 cursor-pointer px-3 py-2.5 text-[#1E3A8A] dark:text-blue-400 font-medium focus:bg-[#F9FAFB] dark:focus:bg-gray-700"
                  >
                    View All Categories →
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <a href="#chat" className={cn(navBtnClass)}>
              <MessageCircle className="w-4 h-4" />
              Messages
              {totalUnreadCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </a>

            <a href="#create-listing" className={cn(navBtnClass, 'font-semibold text-[#1E3A8A] dark:text-blue-400')}>
              Sell
            </a>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={navBtnClass}>
                  Help
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 rounded-xl border border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1"
              >
                <DropdownMenuItem asChild>
                  <a
                    href="#how-it-works"
                    className="flex items-center gap-2 cursor-pointer px-3 py-2.5 text-[#111827] dark:text-gray-100 focus:bg-[#F9FAFB] dark:focus:bg-gray-700"
                  >
                    <BookOpen className="w-4 h-4" />
                    How It Works
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href="#campus-verification"
                    className="flex items-center gap-2 cursor-pointer px-3 py-2.5 text-[#111827] dark:text-gray-100 focus:bg-[#F9FAFB] dark:focus:bg-gray-700"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Campus Verification
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href="#contact"
                    className="flex items-center gap-2 cursor-pointer px-3 py-2.5 text-[#111827] dark:text-gray-100 focus:bg-[#F9FAFB] dark:focus:bg-gray-700"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Contact Us
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href="#faq"
                    className="flex items-center gap-2 cursor-pointer px-3 py-2.5 text-[#111827] dark:text-gray-100 focus:bg-[#F9FAFB] dark:focus:bg-gray-700"
                  >
                    <HelpCircle className="w-4 h-4" />
                    FAQ
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href="#safety"
                    className="flex items-center gap-2 cursor-pointer px-3 py-2.5 text-[#111827] dark:text-gray-100 focus:bg-[#F9FAFB] dark:focus:bg-gray-700"
                  >
                    <Shield className="w-4 h-4" />
                    Safety Tips
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={toggleTheme}
                  className="flex items-center gap-2 cursor-pointer px-3 py-2.5 text-[#111827] dark:text-gray-100 focus:bg-[#F9FAFB] dark:focus:bg-gray-700"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right: divider, My Saves, Log In, Sign Up */}
          <div className="flex items-center gap-3 pl-4 border-l border-[#E5E7EB] dark:border-gray-700 shrink-0">
            <a
              href="#saves"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-white hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors font-medium text-sm"
            >
              <Heart
                className="w-4 h-4"
                fill={bookmarkedIds.length > 0 ? 'currentColor' : 'none'}
              />
              My Saves
              {bookmarkedIds.length > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold">
                  {bookmarkedIds.length}
                </span>
              )}
            </a>
            <button
              type="button"
              onClick={handleLogin}
              className="px-4 py-2 text-[#1E3A8A] dark:text-blue-400 hover:text-[#1E40AF] dark:hover:text-blue-300 font-medium text-sm transition-colors rounded-lg"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={handleSignup}
              className="px-5 py-2.5 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] font-medium text-sm transition-all duration-200 shadow-sm hover:shadow"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Mobile: row 1 - Menu, Logo, Cart */}
        <div className="lg:hidden flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="p-2.5 rounded-lg text-[#111827] dark:text-white hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <button
            type="button"
            onClick={handleLogoClick}
            className="flex items-center gap-2 shrink-0 cursor-pointer bg-transparent border-none p-0"
          >
            <div className="w-9 h-9 bg-[#1E3A8A] rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-[#111827] dark:text-white">CampusKart</span>
          </button>

          <a
            href="#saves"
            className="relative p-2.5 rounded-lg text-[#111827] dark:text-white hover:bg-[#F9FAFB] dark:hover:bg-gray-800 transition-colors"
            aria-label="My Saves"
          >
            <ShoppingCart className="w-6 h-6" />
            {bookmarkedIds.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold">
                {bookmarkedIds.length}
              </span>
            )}
          </a>
        </div>

        {/* Mobile: row 2 - Search bar full width */}
        <form onSubmit={handleSearch} className="lg:hidden mt-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search textbooks, furniture, electronics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full h-12 pl-12 pr-4 rounded-full text-base',
                'bg-[#F9FAFB] dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-600',
                'text-[#111827] dark:text-gray-100 placeholder:text-[#6B7280] dark:placeholder:text-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent'
              )}
            />
          </div>
        </form>
      </div>

      {/* Mobile menu panel */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5E7EB] dark:border-gray-700 bg-white dark:bg-gray-900">
          <nav className="max-w-[1400px] mx-auto px-6 sm:px-8 py-4 flex flex-col gap-1">
            <p className="text-xs font-semibold text-[#6B7280] dark:text-gray-500 uppercase tracking-wider mb-2 px-2">
              Shop
            </p>
            <a href="#browse" onClick={closeMobileMenu} className="py-3 px-4 rounded-lg text-[#111827] dark:text-gray-100 font-medium hover:bg-[#F9FAFB] dark:hover:bg-gray-800">
              Browse All
            </a>
            {CATEGORIES.map((cat) => (
              <a
                key={cat.name}
                href={`#category/${encodeURIComponent(cat.name)}`}
                onClick={closeMobileMenu}
                className="py-3 px-4 rounded-lg flex items-center gap-2 text-[#111827] dark:text-gray-100 font-medium hover:bg-[#F9FAFB] dark:hover:bg-gray-800"
              >
                <span>{cat.emoji}</span>
                {cat.name}
              </a>
            ))}
            <div className="border-t border-[#E5E7EB] dark:border-gray-700 my-2" />
            <a href="#create-listing" onClick={closeMobileMenu} className="py-3 px-4 rounded-lg text-[#1E3A8A] dark:text-blue-400 font-semibold hover:bg-[#F9FAFB] dark:hover:bg-gray-800">
              Sell
            </a>
            <a href="#chat" onClick={closeMobileMenu} className="py-3 px-4 rounded-lg flex items-center gap-2 text-[#111827] dark:text-gray-100 font-medium hover:bg-[#F9FAFB] dark:hover:bg-gray-800">
              <MessageCircle className="w-4 h-4" />
              Messages
              {totalUnreadCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </a>
            <a href="#saves" onClick={closeMobileMenu} className="py-3 px-4 rounded-lg flex items-center gap-2 text-[#111827] dark:text-gray-100 font-medium hover:bg-[#F9FAFB] dark:hover:bg-gray-800">
              <Heart className="w-4 h-4" fill={bookmarkedIds.length > 0 ? 'currentColor' : 'none'} />
              My Saves
              {bookmarkedIds.length > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold">
                  {bookmarkedIds.length}
                </span>
              )}
            </a>
            <div className="border-t border-[#E5E7EB] dark:border-gray-700 my-2" />
            <p className="text-xs font-semibold text-[#6B7280] dark:text-gray-500 uppercase tracking-wider mb-2 px-2">
              Help
            </p>
            <a href="#how-it-works" onClick={closeMobileMenu} className="py-3 px-4 rounded-lg flex items-center gap-2 text-[#6B7280] dark:text-gray-400 font-medium hover:bg-[#F9FAFB] dark:hover:bg-gray-800">
              <HelpCircle className="w-4 h-4" />
              How It Works
            </a>
            <a href="#campus-verification" onClick={closeMobileMenu} className="py-3 px-4 rounded-lg flex items-center gap-2 text-[#6B7280] dark:text-gray-400 font-medium hover:bg-[#F9FAFB] dark:hover:bg-gray-800">
              <ShieldCheck className="w-4 h-4" />
              Campus Verification
            </a>
            <a href="#contact" onClick={closeMobileMenu} className="py-3 px-4 rounded-lg flex items-center gap-2 text-[#6B7280] dark:text-gray-400 font-medium hover:bg-[#F9FAFB] dark:hover:bg-gray-800">
              Contact Us
            </a>
            <a href="#faq" onClick={closeMobileMenu} className="py-3 px-4 rounded-lg flex items-center gap-2 text-[#6B7280] dark:text-gray-400 font-medium hover:bg-[#F9FAFB] dark:hover:bg-gray-800">
              FAQ
            </a>
            <a href="#safety" onClick={closeMobileMenu} className="py-3 px-4 rounded-lg flex items-center gap-2 text-[#6B7280] dark:text-gray-400 font-medium hover:bg-[#F9FAFB] dark:hover:bg-gray-800">
              Safety Tips
            </a>
            <button
              type="button"
              onClick={() => { toggleTheme(); closeMobileMenu(); }}
              className="py-3 px-4 rounded-lg flex items-center gap-2 text-[#6B7280] dark:text-gray-400 font-medium hover:bg-[#F9FAFB] dark:hover:bg-gray-800 text-left w-full"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <div className="border-t border-[#E5E7EB] dark:border-gray-700 my-2" />
            <button
              type="button"
              onClick={() => { handleLogin(); closeMobileMenu(); }}
              className="py-3 px-4 rounded-lg text-[#1E3A8A] dark:text-blue-400 font-medium text-left w-full"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { handleSignup(); closeMobileMenu(); }}
              className="mt-2 py-3 px-4 rounded-lg bg-[#1E3A8A] text-white font-medium w-full"
            >
              Sign Up
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
