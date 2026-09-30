import React from 'react';
import { ChevronRight } from 'lucide-react';
import { ListingCategory } from '../../types/marketplace';
import { CATEGORY_DEFINITIONS } from './categoryDefinitions';

interface CategorySectionProps {
  selectedCategory: string;
  onSelectCategory: (category: ListingCategory | 'All') => void;
  categoryCounts: Record<string, number>;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts
}) => {
  return (
    <section className="py-12 sm:py-16 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
              Explore by Resource Type
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Agricultural Resource Categories
            </h2>
          </div>
          <button
            onClick={() => onSelectCategory('All')}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Categories</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {CATEGORY_DEFINITIONS.map(cat => {
            const isSelected = selectedCategory === cat.category;
            const count = categoryCounts[cat.category] || 0;

            return (
              <div
                key={cat.category}
                onClick={() => onSelectCategory(cat.category)}
                className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer p-4 flex flex-col justify-between min-h-[160px] shadow-2xs hover:shadow-md ${
                  isSelected
                    ? 'border-emerald-700 ring-2 ring-emerald-600/20 bg-emerald-50/30'
                    : 'border-stone-200 hover:border-emerald-600/60'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center mb-3 group-hover:bg-emerald-50 transition-colors">
                    {cat.icon}
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm group-hover:text-emerald-800 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-stone-400">
                  <span>{count} Available</span>
                  <ChevronRight size={13} className="text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
