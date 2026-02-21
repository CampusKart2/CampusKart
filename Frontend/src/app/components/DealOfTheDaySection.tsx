import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getDealOfTheDay } from '../data/mockListings';

export function DealOfTheDaySection() {
  const deal = getDealOfTheDay();

  const handleViewDeal = (): void => {
    console.log('Deal of the Day clicked:', deal.id);
    window.location.hash = `#listing/${deal.id}`;
  };

  return (
    <section className="bg-[#F9FAFB] py-12">
      <div className="max-w-[1200px] mx-auto px-6">
        <div
          role="button"
          tabIndex={0}
          onClick={handleViewDeal}
          onKeyDown={(e) => e.key === 'Enter' && handleViewDeal()}
          className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border-4 border-transparent bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#1E3A8A] p-1 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group"
        >
          <div className="bg-white rounded-xl overflow-hidden flex flex-col md:flex-row">
            <div className="relative w-full md:w-2/5 aspect-[4/3] md:aspect-auto md:min-h-[280px] bg-gray-100 overflow-hidden">
              <ImageWithFallback
                src={deal.image}
                alt={deal.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              <span className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-red-500 text-white text-sm font-bold shadow-lg">
                🔥 Deal of the Day
              </span>
            </div>
            <div className="flex-1 p-8 flex flex-col justify-center">
              <h2 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2">{deal.title}</h2>
              <p className="text-[#6B7280] mb-4 line-clamp-2">{deal.description}</p>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-sm font-medium text-[#6B7280]">Special Price</span>
                <span className="text-4xl font-bold text-[#1E3A8A]">
                  {deal.price === 0 ? 'Free' : `$${deal.price}`}
                </span>
              </div>
              <p className="text-sm text-[#6B7280] mb-6">Ends at midnight</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDeal();
                }}
                className="w-full md:w-auto px-8 py-3.5 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] font-semibold transition-all duration-300 hover:scale-105 shadow-md"
              >
                View Deal
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
