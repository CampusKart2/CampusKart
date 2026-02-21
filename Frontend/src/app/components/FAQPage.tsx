import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';

const FAQ_ITEMS = [
  {
    q: 'How do I verify my .edu email?',
    a: 'Go to Campus Verification in the header, enter your .edu email, and we\'ll send you a one-time code. Enter the code to get verified. Only current students and staff with a valid .edu address can verify.',
  },
  {
    q: 'Is CampusKart free to use?',
    a: 'Yes. Listing items and browsing are free. We don\'t charge any fees for buying or selling. You only pay the seller for the item.',
  },
  {
    q: 'How do I report suspicious activity?',
    a: 'Use the "Report" option on a listing or conversation, or go to Contact Us and submit a report. For urgent safety concerns, call Campus Safety at (555) 123-4567.',
  },
  {
    q: 'What items are not allowed?',
    a: 'Prohibited items include alcohol, weapons, illegal substances, counterfeit goods, and anything that violates your campus code of conduct. When in doubt, check our Safety Tips page.',
  },
  {
    q: 'How do I meet buyers safely?',
    a: 'Meet in a public, well-lit place on campus (e.g. library, student center). Prefer daylight. Don\'t share your dorm room or personal address until you\'re comfortable. See our Safety Tips for more.',
  },
  {
    q: 'Can I edit my listing?',
    a: 'Yes. Open the listing and use the "Edit" option (when logged in). You can change price, description, and photos. Edits are visible to buyers.',
  },
  {
    q: 'How do refunds work?',
    a: 'CampusKart doesn\'t process payments. Refunds are between you and the buyer. We recommend agreeing on condition and price before meeting. For disputes, contact support.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Account Settings (when logged in), then "Delete account." This removes your profile and listings. Active conversations may be retained for safety records.',
  },
  {
    q: 'Can I sell from off-campus?',
    a: 'CampusKart is meant for campus-based exchange. Listings are shown to users at your school. Pickup is usually on or near campus.',
  },
  {
    q: 'Who can see my listings?',
    a: 'Only users with a verified .edu email from your campus (or campuses we support) can see and message you about listings.',
  },
];

export function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_ITEMS;
    const q = searchQuery.toLowerCase();
    return FAQ_ITEMS.filter(
      (item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleBack = () => {
    window.location.hash = '';
  };

  return (
    <div className="bg-[#F9FAFB] dark:bg-gray-900 min-h-screen py-12">
      <div className="max-w-[800px] mx-auto px-6 sm:px-8">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-[#6B7280] dark:text-gray-400 hover:text-[#1E3A8A] dark:hover:text-blue-400 font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to home
        </button>

        <h1 className="text-4xl font-bold text-[#111827] dark:text-white mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-[#6B7280] dark:text-gray-400 mb-8">
          Find answers to common questions about CampusKart.
        </p>

        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search FAQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-full border border-[#E5E7EB] dark:border-gray-600 bg-white dark:bg-gray-800 text-[#111827] dark:text-gray-100 placeholder:text-[#6B7280] dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          />
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {filteredItems.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-xl px-4"
            >
              <AccordionTrigger className="text-left text-[#111827] dark:text-white font-medium hover:no-underline hover:text-[#1E3A8A] dark:hover:text-blue-400 py-4">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-[#6B7280] dark:text-gray-400 pb-4">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredItems.length === 0 && (
          <p className="text-center text-[#6B7280] dark:text-gray-400 py-8">
            No questions match your search.
          </p>
        )}

        <div className="mt-12 text-center">
          <p className="text-[#6B7280] dark:text-gray-400 mb-4">Still need help?</p>
          <a
            href="#contact"
            className="inline-block px-6 py-3 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] font-medium transition-colors"
          >
            Contact us
          </a>
        </div>
      </div>
    </div>
  );
}
