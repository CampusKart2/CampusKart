import React from 'react';
import { ArrowLeft, MapPin, ShieldAlert, CreditCard, User, Phone } from 'lucide-react';

const SECTIONS = [
  {
    icon: MapPin,
    title: 'Meeting Safely',
    tips: [
      'Meet in a public, well-lit place (library, student center, campus café).',
      'Prefer daylight hours when possible.',
      'Tell a friend where you\'re going and when you expect to be back.',
      'Don\'t share your dorm room or personal address until you\'re comfortable.',
      'If something feels off, leave and report it.',
    ],
  },
  {
    icon: ShieldAlert,
    title: 'Recognizing Scams',
    tips: [
      'Be wary of buyers or sellers who refuse to meet in person.',
      'Don\'t send money in advance or use gift cards as payment.',
      'Watch for fake .edu emails or profiles that look new or empty.',
      'Report listings that seem too good to be true or ask for payment off-platform.',
    ],
  },
  {
    icon: CreditCard,
    title: 'Payment Safety',
    tips: [
      'Prefer cash or a secure person-to-person method when meeting in person.',
      'Never share banking or card details over messages.',
      'Avoid wiring money or sending crypto before you have the item.',
      'Use campus escrow or a trusted method if your school offers one.',
    ],
  },
  {
    icon: User,
    title: 'Personal Information',
    tips: [
      'Only share what\'s needed to complete the transaction.',
      'Use the in-app chat rather than giving out your phone or email too early.',
      'Don\'t share your student ID, SSN, or passwords with anyone.',
      'Verify the other person is campus-verified before sharing location.',
    ],
  },
  {
    icon: Phone,
    title: 'Emergency Contacts',
    tips: [
      'Campus Safety: (555) 000-0000',
      'Report suspicious activity via Contact Us or the report button on listings.',
      'In an emergency, call 911 or your campus emergency line.',
    ],
  },
];

export function SafetyPage() {
  const handleBack = () => {
    window.location.hash = '';
  };

  return (
    <div className="bg-[#F9FAFB] dark:bg-gray-900 min-h-screen py-12">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-[#6B7280] dark:text-gray-400 hover:text-[#1E3A8A] dark:hover:text-blue-400 font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to home
        </button>

        <h1 className="text-4xl font-bold text-[#111827] dark:text-white mb-2">
          Campus Safety Guidelines
        </h1>
        <p className="text-[#6B7280] dark:text-gray-400 mb-10">
          Stay safe while buying and selling on campus. Follow these tips and report anything that doesn’t feel right.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {SECTIONS.map((section, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 border border-[#E5E7EB] dark:border-gray-700 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#EFF6FF] dark:bg-blue-900/30 flex items-center justify-center">
                  <section.icon className="w-6 h-6 text-[#1E3A8A] dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-semibold text-[#111827] dark:text-white">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-2">
                {section.tips.map((tip, j) => (
                  <li
                    key={j}
                    className="flex gap-2 text-[#6B7280] dark:text-gray-400 text-sm"
                  >
                    <span className="text-[#1E3A8A] dark:text-blue-400 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] font-medium transition-colors"
          >
            Report suspicious activity
          </a>
        </div>
      </div>
    </div>
  );
}
