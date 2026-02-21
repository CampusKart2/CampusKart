import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function Hero() {
  const handleStartBrowsing = (): void => {
    console.log('Start browsing clicked');
    window.location.hash = '#browse';
    document.querySelector('#categories')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleListItem = (): void => {
    console.log('List item clicked');
    window.location.hash = '#create-listing';
  };

  return (
    <section className="relative bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE] overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#3B82F6] opacity-10 rounded-full blur-3xl animate-[pulse-soft_4s_ease-in-out_infinite]" />
      <div className="absolute top-1/2 -left-20 w-80 h-80 bg-[#1E3A8A] opacity-10 rounded-full blur-3xl animate-[pulse-soft_5s_ease-in-out_infinite]" />
      <div className="absolute -bottom-20 right-1/3 w-64 h-64 bg-[#10B981] opacity-10 rounded-full blur-3xl animate-[pulse-soft_4.5s_ease-in-out_infinite]" />
      <div className="max-w-[1200px] mx-auto px-6 py-24 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left side - Content */}
          <div className="space-y-8 animate-[fadeIn_0.6s_ease-out]">
            <h1 className="text-5xl md:text-6xl font-bold text-[#111827] leading-tight">
              Buy & Sell Safely Within Your Campus
            </h1>
            <p className="text-xl text-[#6B7280] leading-relaxed">
              A verified .edu marketplace for affordable textbooks, dorm furniture, electronics and more.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                type="button"
                onClick={handleStartBrowsing}
                className="px-8 py-3.5 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105 font-semibold"
              >
                Start Browsing
              </button>
              <button
                type="button"
                onClick={handleListItem}
                className="px-8 py-3.5 bg-white text-[#1E3A8A] border-2 border-[#1E3A8A] rounded-lg hover:bg-[#F9FAFB] transition-all duration-300 hover:scale-105 hover:shadow-lg font-semibold"
              >
                List an Item
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex gap-6 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                <span className="text-sm text-[#6B7280] font-medium">.edu Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                <span className="text-sm text-[#6B7280] font-medium">Rated Sellers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                <span className="text-sm text-[#6B7280] font-medium">On-Campus Exchange</span>
              </div>
            </div>
          </div>

          {/* Right side - Illustration */}
          <div className="relative animate-[slideUp_0.6s_ease-out_0.1s_both]">
            <div className="rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758270703733-3663d99c9dd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHVuaXZlcnNpdHklMjBzdHVkZW50cyUyMGNhbXB1cyUyMG91dGRvb3J8ZW58MXx8fHwxNzcxMjgxNjk2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Students exchanging items on campus"
                className="w-full h-[500px] object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#10B981] opacity-20 rounded-full blur-3xl" />
            <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-[#3B82F6] opacity-20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
