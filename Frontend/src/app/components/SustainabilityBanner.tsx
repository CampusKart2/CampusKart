import React from 'react';
import { Leaf } from 'lucide-react';

export function SustainabilityBanner() {
  const handleExploreClick = (): void => {
    console.log('Explore listings clicked');
    document.querySelector('#featured')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="bg-gradient-to-r from-[#059669] to-[#10B981] py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <p className="text-2xl font-semibold text-white">
              Save Money. Reduce Waste. Support Your Campus Community.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExploreClick}
            className="px-8 py-3.5 bg-white text-[#059669] rounded-lg hover:bg-gray-50 hover:scale-105 hover:shadow-xl transition-all duration-300 shadow-lg font-semibold"
          >
            Explore Listings
          </button>
        </div>
      </div>
    </section>
  );
}
