import React from 'react';
import { ArrowLeft, Shield, Users, Ban, Tag } from 'lucide-react';

const benefits = [
  { icon: Shield, title: 'Trust & Safety', description: 'Only verified students can buy and sell. Reduces fraud and keeps the marketplace secure.' },
  { icon: Users, title: 'Verified Community', description: 'Everyone you meet has a .edu email tied to their university. Real students, real deals.' },
  { icon: Ban, title: 'No Scammers', description: '.edu verification blocks most scammers who don\'t have access to university email systems.' },
  { icon: Tag, title: 'Campus-Only Deals', description: 'Find local buyers and sellers. No shipping hassle—meet on campus and swap in person.' },
];

const verificationSteps = [
  'Sign up with your university email (.edu or equivalent)',
  'Check your inbox for the verification email from CampusKart',
  'Click the verification link in the email',
  'Start buying and selling on your campus marketplace',
];

const universities = [
  'State University',
  'Tech Institute',
  'Liberal Arts College',
  'Community College',
  'Research University',
  'Metro State',
  'Pacific Coast University',
  'Midwest College',
];

export function CampusVerificationPage() {
  const handleBackToHome = (): void => {
    console.log('Back to home clicked');
    window.location.hash = '';
  };

  const handleGetStarted = (): void => {
    console.log('Get Started clicked');
    window.location.hash = '#signup';
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

        <h1 className="text-4xl font-semibold text-[#111827] mb-6">Campus Verification</h1>

        {/* Why we require .edu */}
        <section className="mb-12">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="text-xl font-semibold text-[#111827] mb-3">Why we require .edu verification</h2>
            <p className="text-[#6B7280] leading-relaxed">
              CampusKart is built for students, by students. Requiring a university email (.edu or your school’s equivalent) ensures that only current students, faculty, or staff can join. This keeps the marketplace safe, reduces spam and scams, and helps you find buyers and sellers right on your campus.
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#111827] mb-6">Benefits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 bg-[#EFF6FF] rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#1E3A8A]" />
                  </div>
                  <h3 className="font-semibold text-[#111827] mb-2">{benefit.title}</h3>
                  <p className="text-[#6B7280] text-sm leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Verification steps */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#111827] mb-6">Verification steps</h2>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <ol className="space-y-4">
              {verificationSteps.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-[#1E3A8A] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-[#111827] pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Universities supported */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-[#111827] mb-6">Universities supported</h2>
          <p className="text-[#6B7280] mb-4">We support .edu and other official university email domains. Examples of supported institutions:</p>
          <div className="flex flex-wrap gap-3">
            {universities.map((name, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[#111827] font-medium text-sm"
              >
                {name}
              </span>
            ))}
          </div>
          <p className="text-[#6B7280] text-sm mt-4">Don’t see your school? If you have a valid .edu (or equivalent) email, you can still sign up and verify.</p>
        </section>

        {/* CTA */}
        <section>
          <div className="bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border border-[#BFDBFE] rounded-2xl p-8 text-center">
            <h2 className="text-xl font-semibold text-[#111827] mb-2">Ready to join?</h2>
            <p className="text-[#6B7280] mb-6">Verify with your .edu email and start buying or selling on your campus.</p>
            <button
              type="button"
              onClick={handleGetStarted}
              className="px-8 py-3.5 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 font-semibold"
            >
              Get Started
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
