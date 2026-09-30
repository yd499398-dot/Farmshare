import React from 'react';
import { MapPin, Star, Heart, ShieldCheck, Truck, Check, Eye } from 'lucide-react';
import { Listing } from '../../types/marketplace';
import { VerificationBadge } from '../ui/designSystem';

interface ListingCardProps {
  listing: Listing;
  currency: 'INR' | 'USD';
  exchangeRate?: number;
  onSelect: (listing: Listing) => void;
  isSaved?: boolean;
  onToggleSave?: (id: string, e: React.MouseEvent) => void;
  layout?: 'grid' | 'list';
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  currency,
  exchangeRate = 83,
  onSelect,
  isSaved = false,
  onToggleSave,
  layout = 'grid'
}) => {
  const formatPrice = (amountINR: number) => {
    if (currency === 'USD') {
      const usd = amountINR / exchangeRate;
      return `$${Math.round(usd).toLocaleString('en-US')}`;
    }
    return `₹${amountINR.toLocaleString('en-IN')}`;
  };

  const isList = layout === 'list';

  return (
    <div
      onClick={() => onSelect(listing)}
      className={`group bg-white rounded-2xl border border-stone-200 hover:border-emerald-600/70 hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer flex ${
        isList ? 'flex-col sm:flex-row' : 'flex-col'
      }`}
    >
      {/* Image Container */}
      <div className={`relative overflow-hidden ${isList ? 'sm:w-72 sm:h-auto h-48 shrink-0' : 'w-full h-52'}`}>
        <img
          src={listing.coverImage}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Category Tag (unboxed or subtle badge) */}
        <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-md">
          {listing.category}
        </div>

        {/* Save Heart Button */}
        {onToggleSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(listing.id, e);
            }}
            className={`absolute top-3 right-3 p-2 rounded-full transition-all cursor-pointer ${
              isSaved
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white/80 hover:bg-white text-stone-700 hover:text-rose-600 backdrop-blur-xs'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save listing'}
          >
            <Heart size={16} className={isSaved ? 'fill-white' : ''} />
          </button>
        )}

        {/* Verification Pill on image if verified */}
        {listing.isListingVerified && (
          <div className="absolute bottom-3 left-3">
            <VerificationBadge type="listing" size="sm" />
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Location & Rating Header */}
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5 gap-2">
            <span className="flex items-center gap-1 font-medium truncate">
              <MapPin size={13} className="text-emerald-700 shrink-0" />
              <span className="truncate">{listing.location}</span>
            </span>

            <span className="flex items-center gap-1 font-bold text-stone-800 shrink-0">
              <Star size={13} className="text-amber-500 fill-amber-500" />
              <span>{listing.ownerRating.toFixed(1)}</span>
              <span className="text-stone-400 font-normal text-[11px]">({listing.ownerReviewCount})</span>
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-base text-stone-900 leading-snug group-hover:text-emerald-800 transition-colors line-clamp-2 mb-2">
            {listing.title}
          </h3>

          {/* Key Specifications Preview */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 mb-3">
            {listing.vehicleSpecs?.hp && (
              <span><strong>{listing.vehicleSpecs.hp} HP</strong> Engine</span>
            )}
            {listing.landSpecs?.area && (
              <span><strong>{listing.landSpecs.area} {listing.landSpecs.areaUnit}s</strong></span>
            )}
            {listing.landSpecs?.waterAvailability && (
              <span>· {listing.landSpecs.waterAvailability} water</span>
            )}
            {listing.deliveryAvailable && (
              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                <Truck size={12} /> Delivery available
              </span>
            )}
          </div>
        </div>

        {/* Price & Action Button Footer */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-stone-900">
                {formatPrice(listing.pricePerDay)}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                /{listing.pricingUnit === 'acre/month' ? 'acre/mo' : listing.pricingUnit}
              </span>
            </div>
            <div className="text-[10px] text-stone-400 font-medium">
              + 2.5% platform fee
            </div>
          </div>

          <button
            onClick={() => onSelect(listing)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>View Details</span>
            <Eye size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
