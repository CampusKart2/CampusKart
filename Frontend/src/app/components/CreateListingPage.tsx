import React, { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Upload } from 'lucide-react';

const CATEGORIES = ['Textbooks', 'Furniture', 'Electronics', 'Clothing', 'Dorm Essentials'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

export function CreateListingPage() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  const handleBackToHome = (): void => {
    console.log('Back to home clicked');
    window.location.hash = '';
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    console.log('Create listing submit (disabled)');
    toast.info('Submit listing coming in Sprint 1');
  };

  const handleFieldBlur = (field: string, value: string): void => {
    if (value.trim()) {
      console.log(`Field filled: ${field}`);
      toast.info(`"${field}" filled`);
    }
  };

  const inputClass = 'w-full h-12 pl-4 pr-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent focus:shadow-md transition-all duration-300';

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

        <h1 className="text-4xl font-semibold text-[#111827] mb-8">Create Listing</h1>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[#111827] mb-2">Item Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleFieldBlur('Item Title', title)}
              placeholder="e.g. Calculus Textbook 8th Ed"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-[#111827] mb-2">Price ($)</label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onBlur={() => handleFieldBlur('Price', price)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-[#111827] mb-2">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onBlur={() => handleFieldBlur('Category', category)}
              className={inputClass}
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-[#111827] mb-2">Condition</label>
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              onBlur={() => handleFieldBlur('Condition', condition)}
              className={inputClass}
            >
              <option value="">Select condition</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[#111827] mb-2">Description</label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleFieldBlur('Description', description)}
              placeholder="Describe your item..."
              className={`${inputClass} h-32 resize-none pt-3`}
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-[#111827] mb-2">Location</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onBlur={() => handleFieldBlur('Location', location)}
              placeholder="e.g. North Campus Dorms"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2">Image Upload</label>
            <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 bg-[#F9FAFB] flex flex-col items-center justify-center gap-2">
              <Upload className="w-10 h-10 text-[#6B7280]" />
              <input type="file" disabled className="hidden" />
              <p className="text-sm text-[#6B7280]">Coming in Sprint 1</p>
            </div>
          </div>

          <button
            type="submit"
            disabled
            className="w-full px-6 py-3.5 bg-[#1E3A8A] text-white rounded-lg opacity-60 cursor-not-allowed font-semibold"
          >
            Submit Listing (Coming in Sprint 1)
          </button>
        </form>
      </div>
    </div>
  );
}
