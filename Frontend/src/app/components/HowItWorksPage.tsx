import React from 'react';
import { Mail, ShoppingCart, Handshake, ArrowLeft, ChevronDown } from 'lucide-react';

const steps = [
  { icon: Mail, title: 'Verify with .edu Email', description: 'Sign up with your university email address to join your campus community' },
  { icon: ShoppingCart, title: 'Buy or List Items', description: 'Browse listings or post your own items for sale with just a few clicks' },
  { icon: Handshake, title: 'Meet on Campus & Rate', description: 'Complete transactions safely on campus and build your seller reputation' },
];

const faqs = [
  { q: 'How do I verify my email?', a: 'After signing up with your .edu email, we send a verification link. Click it within 24 hours to verify your account. Check your spam folder if you don\'t see it.' },
  { q: 'Is CampusKart free to use?', a: 'Yes! Listing items and browsing are free. We may introduce optional premium features in the future, but core buying and selling will remain free for students.' },
  { q: 'How do I report suspicious activity?', a: 'Use the "Report" button on any listing or profile, or contact us at safety@campuskart.edu. We review all reports and take action against policy violations.' },
  { q: 'What items are not allowed?', a: 'Prohibited items include alcohol, drugs, weapons, stolen goods, and anything that violates your university\'s code of conduct or local laws. See our full policy for details.' },
];

export function HowItWorksPage() {
  const handleBackToHome = (): void => {
    console.log('Back to home clicked');
    window.location.hash = '';
  };

  return (
    <div className="bg-[#F9FAFB] min-h-screen py-8">
      <div className="max-w-[1200px] mx-auto px-6">
        <button
          type="button"
          onClick={handleBackToHome}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#1E3A8A] font-medium mb-6 transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to home
        </button>

        <h1 className="text-4xl font-bold text-[#111827] mb-12 text-center">How CampusKart Works</h1>

        {/* 3 steps at top */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex flex-col items-center text-center p-6 rounded-2xl border border-[#E5E7EB] bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-24 h-24 bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <Icon className="w-12 h-12 text-[#1E3A8A]" />
                </div>
                <h2 className="text-xl font-semibold text-[#111827] mb-3">{step.title}</h2>
                <p className="text-[#6B7280] leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>

        {/* Detailed Guide */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-[#111827] mb-6">Detailed Guide</h2>
          <div className="space-y-6">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-[#1E3A8A] mb-3">Step 1: How to verify your .edu email</h3>
              <p className="text-[#6B7280] mb-4 leading-relaxed">
                We only accept university-issued .edu (or equivalent) email addresses to keep the marketplace safe and campus-only. After you sign up, we send a verification link to your email.
              </p>
              <p className="text-[#111827] font-medium mb-2">Example:</p>
              <p className="text-[#6B7280] text-sm bg-[#F9FAFB] rounded-lg p-3 border border-[#E5E7EB] font-mono">
                student@university.edu → Check inbox → Click &quot;Verify my CampusKart account&quot; → Done!
              </p>
              <p className="text-[#6B7280] mt-3 text-sm">Verification links expire in 24 hours. If you don&apos;t see the email, check spam or request a new link from your account settings.</p>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-[#1E3A8A] mb-3">Step 2: How to browse and list items</h3>
              <p className="text-[#6B7280] mb-4 leading-relaxed">
                Use the search bar and category filters to find textbooks, furniture, electronics, and more. To sell, click &quot;List an Item&quot; and fill in the title, price, condition, and description.
              </p>
              <p className="text-[#111827] font-medium mb-2">Tips:</p>
              <ul className="list-disc list-inside text-[#6B7280] space-y-1 text-sm">
                <li>Add clear photos and an honest condition description to sell faster</li>
                <li>Set a fair price by checking similar listings first</li>
                <li>Use campus location (e.g. North Dorms) so buyers know where to meet</li>
              </ul>
            </div>

            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-[#1E3A8A] mb-3">Step 3: How to meet safely on campus</h3>
              <p className="text-[#6B7280] mb-4 leading-relaxed">
                We recommend meeting in public, well-lit spots on campus—library lobby, student center, or dorm common areas. Always complete the exchange in person and rate the other party after the transaction.
              </p>
              <p className="text-[#111827] font-medium mb-2">Safety tips:</p>
              <ul className="list-disc list-inside text-[#6B7280] space-y-1 text-sm">
                <li>Meet during daytime when possible</li>
                <li>Bring a friend or tell someone where you&apos;re going</li>
                <li>Don&apos;t share personal payment apps until you&apos;ve met and verified the item</li>
                <li>Report any suspicious behavior to CampusKart and your campus security</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-semibold text-[#111827] mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
                <h3 className="text-[#111827] font-semibold flex items-center gap-2">
                  <ChevronDown className="w-5 h-5 text-[#1E3A8A] flex-shrink-0" />
                  {faq.q}
                </h3>
                <p className="text-[#6B7280] mt-3 pl-7 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
