import React from 'react';
import { Book, Sofa, Laptop, Shirt, Home } from 'lucide-react';

const categories = [
  { name: 'Textbooks', icon: Book },
  { name: 'Furniture', icon: Sofa },
  { name: 'Electronics', icon: Laptop },
  { name: 'Clothing', icon: Shirt },
  { name: 'Dorm Essentials', icon: Home },
];

export function Categories() {
  const handleCategoryClick = (categoryName: string): void => {
    console.log(`Category clicked: ${categoryName}`);
    window.location.hash = `#category/${encodeURIComponent(categoryName)}`;
  };

  return (
    <section id="categories" className="bg-white py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2 className="text-4xl font-bold text-[#111827] mb-14">Popular Categories</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div
                key={category.name}
                role="button"
                tabIndex={0}
                onClick={() => handleCategoryClick(category.name)}
                onKeyDown={(e) => e.key === 'Enter' && handleCategoryClick(category.name)}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-8 hover:shadow-xl hover:-translate-y-2 hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer group shadow-sm"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] rounded-2xl flex items-center justify-center group-hover:from-[#1E3A8A] group-hover:to-[#3B82F6] transition-all duration-300">
                    <Icon className="w-10 h-10 text-[#1E3A8A] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <span className="text-[#111827] font-semibold text-center">
                    {category.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
