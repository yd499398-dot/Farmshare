import React, { useState } from 'react';
import { Search, MapPin, Calendar, Tractor, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/designSystem';

interface MarketplaceHeroProps {
  onSearch: (query: string, location: string, date: string) => void;
  onSelectCategory: (category: string) => void;
}

export const MarketplaceHero: React.FC<MarketplaceHeroProps> = ({ onSearch, onSelectCategory }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, location, date);
  };

  return (
    <div className="relative bg-gradient-to-b from-emerald-900 via-stone-900 to-stone-950 text-white overflow-hidden">
      {/* Background imagery with subtle overlay */}
      <div className="absolute inset-0 opacity-25 mix-blend-luminosity">
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=80"
          alt="Agriculture Field"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
        <div className="max-w-3xl">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles size={14} className="text-emerald-400" />
            <span>India's Dedicated Agricultural Equipment & Land Marketplace</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-4">
            Rent the farm resources <br className="hidden sm:inline" />
            <span className="text-emerald-400">you need.</span>
          </h1>

          <p className="text-lg sm:text-xl text-stone-300 font-medium leading-relaxed mb-8 max-w-2xl">
            Find tractors, farm vehicles, equipment, land and agricultural services near you from verified local farmers and providers.
          </p>
        </div>

        {/* Search Bar Container */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-2xl border border-stone-200/50 max-w-4xl text-stone-900">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
            {/* Search Query */}
            <div className="md:col-span-5 flex items-center gap-3 px-3 py-2 border-b md:border-b-0 md:border-r border-stone-200">
              <Search size={20} className="text-emerald-700 shrink-0" />
              <div className="w-full">
                <label className="block text-[11px] font-bold uppercase text-stone-400 tracking-wider">What do you need?</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tractor, Combine, Rotavator, Land..."
                  className="w-full font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Location */}
            <div className="md:col-span-4 flex items-center gap-3 px-3 py-2 border-b md:border-b-0 md:border-r border-stone-200">
              <MapPin size={20} className="text-emerald-700 shrink-0" />
              <div className="w-full">
                <label className="block text-[11px] font-bold uppercase text-stone-400 tracking-wider">Where?</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Nashik, Karnal, Indore..."
                  className="w-full font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Date Range / Search Button */}
            <div className="md:col-span-3 flex items-center gap-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full shadow-md"
                icon={<ArrowRight size={18} />}
              >
                Search
              </Button>
            </div>
          </form>

          {/* Quick Filter Chips */}
          <div className="pt-3 mt-3 border-t border-stone-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-stone-400 font-semibold text-[11px]">Popular:</span>
            {[
              { label: '50 HP Tractors', cat: 'Tractors' },
              { label: 'Farmland Plots', cat: 'Land' },
              { label: 'Combine Harvesters', cat: 'Harvesting Equipment' },
              { label: '7-Ft Rotavators', cat: 'Agricultural Machinery' },
              { label: 'Solar Water Pumps', cat: 'Irrigation Equipment' }
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => onSelectCategory(item.cat)}
                className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 text-stone-700 font-medium transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Key Marketplace Guarantees (Clean, unboxed typography) */}
        <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-stone-300">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">1,400+</div>
            <div className="text-xs sm:text-sm text-stone-400 font-medium mt-0.5">Verified farm resources</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">2.5%</div>
            <div className="text-xs sm:text-sm text-stone-400 font-medium mt-0.5">Transparent platform fee</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">₹0</div>
            <div className="text-xs sm:text-sm text-stone-400 font-medium mt-0.5">Free listing registration</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">100%</div>
            <div className="text-xs sm:text-sm text-stone-400 font-medium mt-0.5">Escrow payment security</div>
          </div>
        </div>
      </div>
    </div>
  );
};
