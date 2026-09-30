import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Grid,
  List as ListIcon,
  X,
  MapPin,
  Check,
  Star,
  Truck,
  RotateCcw
} from 'lucide-react';
import { Listing, ListingCategory } from '../../types/marketplace';
import { ListingCard } from './ListingCard';
import { Button, EmptyState } from '../ui/designSystem';
import { CATEGORY_DEFINITIONS } from './categoryDefinitions';

interface MarketplaceSearchProps {
  listings: Listing[];
  initialCategory?: string;
  initialQuery?: string;
  initialLocation?: string;
  currency: 'INR' | 'USD';
  exchangeRate?: number;
  onSelectListing: (listing: Listing) => void;
  savedIds: string[];
  onToggleSave: (id: string, e: React.MouseEvent) => void;
}

export const MarketplaceSearch: React.FC<MarketplaceSearchProps> = ({
  listings,
  initialCategory = 'All',
  initialQuery = '',
  initialLocation = '',
  currency,
  exchangeRate = 83,
  onSelectListing,
  savedIds,
  onToggleSave
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [locationQuery, setLocationQuery] = useState(initialLocation);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [deliveryOnly, setDeliveryOnly] = useState(false);
  const [operatorOnly, setOperatorOnly] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterDrawerOpen, setMobileFilterDrawerOpen] = useState(false);

  // Filter listings
  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Category filter
    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter(l => l.category === selectedCategory);
    }

    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        (l.vehicleSpecs?.brand && l.vehicleSpecs.brand.toLowerCase().includes(q))
      );
    }

    // Location query
    if (locationQuery.trim()) {
      const loc = locationQuery.toLowerCase();
      result = result.filter(l =>
        l.location.toLowerCase().includes(loc) ||
        l.city.toLowerCase().includes(loc) ||
        l.state.toLowerCase().includes(loc)
      );
    }

    // Price range
    if (minPrice !== '') {
      result = result.filter(l => l.pricePerDay >= Number(minPrice));
    }
    if (maxPrice !== '') {
      result = result.filter(l => l.pricePerDay <= Number(maxPrice));
    }

    // Verified
    if (verifiedOnly) {
      result = result.filter(l => l.isListingVerified || l.isOwnerVerified);
    }

    // Delivery
    if (deliveryOnly) {
      result = result.filter(l => l.deliveryAvailable);
    }

    // Operator
    if (operatorOnly) {
      result = result.filter(l => l.operatorAvailable);
    }

    // Rating
    if (minRating > 0) {
      result = result.filter(l => l.ownerRating >= minRating);
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.pricePerDay - a.pricePerDay);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.ownerRating - a.ownerRating);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [
    listings,
    selectedCategory,
    searchQuery,
    locationQuery,
    minPrice,
    maxPrice,
    verifiedOnly,
    deliveryOnly,
    operatorOnly,
    minRating,
    sortBy
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setSelectedCategory('All');
    setMinPrice('');
    setMaxPrice('');
    setVerifiedOnly(false);
    setDeliveryOnly(false);
    setOperatorOnly(false);
    setMinRating(0);
    setSortBy('relevance');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    locationQuery !== '' ||
    selectedCategory !== 'All' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    verifiedOnly ||
    deliveryOnly ||
    operatorOnly ||
    minRating > 0;

  return (
    <div className="bg-stone-50 min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-6 flex items-center gap-3 px-3 py-2 bg-stone-50 rounded-xl border border-stone-200">
              <Search size={18} className="text-emerald-700 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tractors, harvesters, land..."
                className="w-full bg-transparent text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-stone-400 hover:text-stone-600">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Location Input */}
            <div className="md:col-span-4 flex items-center gap-3 px-3 py-2 bg-stone-50 rounded-xl border border-stone-200">
              <MapPin size={18} className="text-emerald-700 shrink-0" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Filter location (city / district)..."
                className="w-full bg-transparent text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none"
              />
              {locationQuery && (
                <button onClick={() => setLocationQuery('')} className="text-stone-400 hover:text-stone-600">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Mobile Filter Button */}
            <div className="md:col-span-2 flex items-center gap-2">
              <button
                onClick={() => setMobileFilterDrawerOpen(true)}
                className="lg:hidden w-full py-2.5 px-3 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-bold text-stone-800 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Filter size={15} />
                <span>Filters {hasActiveFilters && '(Active)'}</span>
              </button>
            </div>
          </div>

          {/* Quick Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-4 mt-4 border-t border-stone-100 pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              All Resources
            </button>
            {CATEGORY_DEFINITIONS.map(cat => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.category
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Controls (Count, Sort & View Mode) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              {filteredListings.length} {filteredListings.length === 1 ? 'Resource' : 'Resources'} Found
            </h2>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs text-stone-500 font-semibold">
              <span className="hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {/* Grid vs List View Toggle */}
            <div className="flex items-center bg-white p-0.5 rounded-xl border border-stone-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-emerald-700 text-white' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Grid view"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-emerald-700 text-white' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="List view"
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Layout: Sidebar + Listings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-emerald-700" />
                <span>Filter Marketplace</span>
              </h3>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="text-[11px] font-bold text-red-600 hover:underline">
                  Clear
                </button>
              )}
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Daily Price Range ({currency === 'INR' ? '₹' : '$'})
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs font-semibold p-2 border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs font-semibold p-2 border border-stone-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Verification & Trust */}
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
                Trust & Verification
              </label>
              <label className="flex items-center gap-2.5 text-xs text-stone-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Verified owners & listings only</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-stone-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliveryOnly}
                  onChange={(e) => setDeliveryOnly(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Delivery available to farm</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-stone-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={operatorOnly}
                  onChange={(e) => setOperatorOnly(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Driver / Operator available</span>
              </label>
            </div>

            {/* Minimum Rating */}
            <div className="pt-4 border-t border-stone-100">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Minimum Owner Rating
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[0, 3, 4, 4.5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setMinRating(rating)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      minRating === rating
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>{rating === 0 ? 'Any' : `${rating}+`}</span>
                    {rating > 0 && <Star size={10} className="fill-current" />}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Listings Results Grid */}
          <main className="lg:col-span-9">
            {filteredListings.length === 0 ? (
              <EmptyState
                title="No farm resources matched your filters"
                description="Try loosening your search terms, changing the location, or clearing specific price constraints."
                actionText="Reset All Filters"
                onAction={resetFilters}
              />
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'flex flex-col gap-4'
                }
              >
                {filteredListings.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    currency={currency}
                    exchangeRate={exchangeRate}
                    onSelect={onSelectListing}
                    isSaved={savedIds.includes(listing.id)}
                    onToggleSave={onToggleSave}
                    layout={viewMode}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <div
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setMobileFilterDrawerOpen(false)}
          />
          <div className="relative w-full max-w-xs bg-white h-full p-6 overflow-y-auto z-10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-lg font-bold text-stone-900">Filters</h3>
              <button onClick={() => setMobileFilterDrawerOpen(false)} className="p-1 text-stone-500">
                <X size={20} />
              </button>
            </div>

            {/* Mobile Category */}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs font-bold p-2.5 border border-stone-200 rounded-xl bg-white"
              >
                <option value="All">All Categories</option>
                {CATEGORY_DEFINITIONS.map(c => (
                  <option key={c.category} value={c.category}>{c.title}</option>
                ))}
              </select>
            </div>

            {/* Mobile Price */}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Price Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs font-semibold p-2 border border-stone-200 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs font-semibold p-2 border border-stone-200 rounded-lg"
                />
              </div>
            </div>

            {/* Mobile Toggles */}
            <div className="space-y-3 pt-3 border-t border-stone-100">
              <label className="flex items-center gap-2.5 text-xs text-stone-700 font-medium">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded text-emerald-700 w-4 h-4"
                />
                <span>Verified only</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-stone-700 font-medium">
                <input
                  type="checkbox"
                  checked={deliveryOnly}
                  onChange={(e) => setDeliveryOnly(e.target.checked)}
                  className="rounded text-emerald-700 w-4 h-4"
                />
                <span>Delivery available</span>
              </label>
            </div>

            <div className="pt-6">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setMobileFilterDrawerOpen(false)}
              >
                Apply Filters ({filteredListings.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
