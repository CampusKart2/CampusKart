import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { BookmarkProvider } from './context/BookmarkContext';
import { ChatProvider } from './context/ChatContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { DealOfTheDaySection } from './components/DealOfTheDaySection';
import { Categories } from './components/Categories';
import { RecentlyViewedSection } from './components/RecentlyViewedSection';
import { HowItWorks } from './components/HowItWorks';
import { TrustSafety } from './components/TrustSafety';
import { FeaturedListings } from './components/FeaturedListings';
import { SustainabilityBanner } from './components/SustainabilityBanner';
import { Footer } from './components/Footer';
import { BrowsePage } from './components/BrowsePage';
import { CategoryPage } from './components/CategoryPage';
import { ListingDetailPage } from './components/ListingDetailPage';
import { SavesPage } from './components/SavesPage';
import { CreateListingPage } from './components/CreateListingPage';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { HowItWorksPage } from './components/HowItWorksPage';
import { CampusVerificationPage } from './components/CampusVerificationPage';
import { ContactPage } from './components/ContactPage';
import { FAQPage } from './components/FAQPage';
import { SafetyPage } from './components/SafetyPage';
import { ChatPage } from './components/ChatPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home';
      setCurrentPage(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderPage = () => {
    if (currentPage === 'home' || currentPage === '') {
      return (
        <>
          <Hero />
          <DealOfTheDaySection />
          <Categories />
          <RecentlyViewedSection />
          <HowItWorks />
          <TrustSafety />
          <FeaturedListings />
          <SustainabilityBanner />
        </>
      );
    }
    if (currentPage === 'browse') return <BrowsePage />;
    if (currentPage === 'saves') return <SavesPage />;
    if (currentPage === 'chat' || currentPage.startsWith('chat/')) {
      const chatMatch = currentPage.match(/^chat\/(.+)$/);
      const sub = chatMatch ? chatMatch[1] : null;
      let conversationId: string | null = null;
      let isNewWithListingId: number | null = null;
      if (sub === 'new') {
        const listingParam = typeof window !== 'undefined' && window.location.hash.includes('listing=')
          ? new URLSearchParams(window.location.hash.split('?')[1] || '').get('listing')
          : null;
        isNewWithListingId = listingParam ? parseInt(listingParam, 10) : null;
        if (!isNewWithListingId || Number.isNaN(isNewWithListingId)) isNewWithListingId = null;
      } else if (sub) {
        conversationId = sub;
      }
      return <ChatPage conversationId={conversationId} isNewWithListingId={isNewWithListingId} />;
    }
    if (currentPage.startsWith('category/')) {
      const categoryName = decodeURIComponent(currentPage.slice('category/'.length));
      return <CategoryPage categoryName={categoryName} />;
    }
    if (currentPage.startsWith('listing/')) {
      const listingId = currentPage.slice('listing/'.length);
      return <ListingDetailPage listingId={listingId} />;
    }
    if (currentPage === 'create-listing') return <CreateListingPage />;
    if (currentPage === 'login') return <LoginPage />;
    if (currentPage === 'signup') return <SignupPage />;
    if (currentPage === 'how-it-works') return <HowItWorksPage />;
    if (currentPage === 'campus-verification') return <CampusVerificationPage />;
    if (currentPage === 'contact') return <ContactPage />;
    if (currentPage === 'faq') return <FAQPage />;
    if (currentPage === 'safety') return <SafetyPage />;
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-20 text-center text-[#6B7280]">
        Page &quot;{currentPage}&quot; not found.
      </div>
    );
  };

  return (
    <BookmarkProvider>
      <ChatProvider>
      <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Toaster position="top-right" richColors />
        <Header />
        <main>
          {renderPage()}
        </main>
        <Footer />
      </div>
      </ChatProvider>
    </BookmarkProvider>
  );
}
