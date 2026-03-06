'use client';

import { useRef } from 'react';

export interface Category {
  value: string;
  label: string;
  icon?: string;
}

interface CategoryFilterProps {
  categories: ReadonlyArray<Category>;
  onSelect: (categoryValue: string) => void;
  selectedCategory?: string;
  showAllOption?: boolean;
  selected?: string;
}

export default function CategoryFilter({
  categories,
  onSelect,
  selectedCategory = '',
  showAllOption = true,
  selected,
}: CategoryFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use 'selected' prop if provided, otherwise use 'selectedCategory'
  const currentSelected = selected !== undefined ? selected : selectedCategory;

  const allCategories = showAllOption
    ? [{ value: '', label: 'All', icon: '' }, ...categories]
    : categories;

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 300;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative flex items-center gap-4">
      {/* Left scroll button */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-gray-50"
        aria-label="Scroll categories left"
      >
        <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Categories container */}
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto px-8 py-2 scrollbar-hide"
      >
        {allCategories.map((category) => (
          <button
            key={category.value}
            onClick={() => onSelect(category.value)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
              currentSelected === category.value
                ? 'bg-saffron-500 text-white shadow-sm'
                : 'border border-gray-300 bg-white text-gray-700 hover:border-saffron-300 hover:text-saffron-600'
            }`}
          >
            {category.icon && <span className="text-base">{category.icon}</span>}
            {category.label}
          </button>
        ))}
      </div>

      {/* Right scroll button */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-gray-50"
        aria-label="Scroll categories right"
      >
        <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
