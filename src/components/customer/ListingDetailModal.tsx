import React, { useState } from 'react';
import {
  X,
  MapPin,
  Star,
  ShieldCheck,
  Calendar,
  Truck,
  CheckCircle2,
  Info,
  Clock,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Share2,
  Heart
} from 'lucide-react';
import { Listing, PriceBreakdown, Review } from '../../types/marketplace';
import { Button, VerificationBadge } from '../ui/designSystem';

interface ListingDetailModalProps {
  listing: Listing | null;
  onClose: () => void;
  currency: 'INR' | 'USD';
  exchangeRate?: number;
  onProceedToCheckout: (
    listing: Listing,
    startDate: string,
    endDate: string,
    days: number,
    deliverySelected: boolean,
    quantity: number
  ) => void;
  reviews: Review[];
  isSaved?: boolean;
  onToggleSave?: (id: string, e: React.MouseEvent) => void;
  onOpenOwnerMessage?: (ownerId: string, ownerName: string) => void;
  similarListings: Listing[];
  onSelectSimilar: (listing: Listing) => void;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  onClose,
  currency,
  exchangeRate = 83,
  onProceedToCheckout,
  reviews,
  isSaved = false,
  onToggleSave,
  onOpenOwnerMessage,
  similarListings,
  onSelectSimilar
}) => {
  if (!listing) return null;

  // Selected dates default: tomorrow to 3 days later
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const threeDaysLater = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(tomorrow);
  const [endDate, setEndDate] = useState(threeDaysLater);
  const [deliverySelected, setDeliverySelected] = useState(listing.deliveryAvailable);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'policies' | 'reviews'>('overview');

  // Compute days
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const diffDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));

  // Platform calculations (2.5% standard platform fee)
  const basePrice = listing.pricePerDay * diffDays;
  const deliveryFee = deliverySelected ? listing.deliveryFee : 0;
  const securityDeposit = listing.securityDeposit || 0;
  const platformFee = Math.round(basePrice * 0.025);
  const taxFee = Math.round(platformFee * 0.18);
  const totalPayable = basePrice + deliveryFee + securityDeposit + platformFee + taxFee;

  const formatPrice = (amountINR: number) => {
    if (currency === 'USD') {
      const usd = amountINR / exchangeRate;
      return `$${Math.round(usd).toLocaleString('en-US')}`;
    }
    return `₹${amountINR.toLocaleString('en-IN')}`;
  };

  const images = listing.images.length > 0 ? listing.images : [listing.coverImage];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Sticky Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
              {listing.category}
            </span>
            {listing.isListingVerified && <VerificationBadge type="listing" size="sm" />}
          </div>

          <div className="flex items-center gap-2">
            {onToggleSave && (
              <button
                onClick={(e) => onToggleSave(listing.id, e)}
                className={`p-2 rounded-full border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer ${
                  isSaved ? 'text-rose-600 bg-rose-50' : 'text-stone-600'
                }`}
                title={isSaved ? 'Remove from saved' : 'Save listing'}
              >
                <Heart size={18} className={isSaved ? 'fill-rose-600' : ''} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 Columns: Gallery, Info, Specs, Reviews */}
            <div className="lg:col-span-7 space-y-6">
              {/* Image Gallery */}
              <div>
                <div className="w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 relative mb-3">
                  <img
                    src={images[selectedImageIndex] || listing.coverImage}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          selectedImageIndex === idx
                            ? 'border-emerald-700 ring-2 ring-emerald-600/30'
                            : 'border-stone-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Location */}
              <div>
                <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                  <span className="flex items-center gap-1 font-semibold text-stone-700">
                    <MapPin size={14} className="text-emerald-700" />
                    <span>{listing.location}, {listing.city}, {listing.state}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-bold text-stone-900">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span>{listing.ownerRating.toFixed(1)}</span>
                    <span className="text-stone-400 font-normal">({listing.ownerReviewCount} reviews)</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-tight">
                  {listing.title}
                </h1>
              </div>

              {/* Verified Owner Card */}
              <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-900 font-black text-lg flex items-center justify-center border border-emerald-300">
                    {listing.ownerName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                      <span>{listing.ownerName}</span>
                      {listing.isOwnerVerified && <ShieldCheck size={16} className="text-emerald-600" />}
                    </div>
                    <div className="text-xs text-stone-500">
                      Verified Owner · Member since 2024 · 100% Response Rate
                    </div>
                  </div>
                </div>

                {onOpenOwnerMessage && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenOwnerMessage(listing.ownerId, listing.ownerName)}
                  >
                    Contact Owner
                  </Button>
                )}
              </div>

              {/* Sub-tabs: Overview / Specs / Policies / Reviews */}
              <div className="border-b border-stone-200 flex gap-4 text-xs font-bold">
                {(['overview', 'specs', 'policies', 'reviews'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2.5 capitalize transition-colors border-b-2 cursor-pointer ${
                      activeTab === tab
                        ? 'border-emerald-700 text-emerald-800'
                        : 'border-transparent text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {tab} {tab === 'reviews' && `(${reviews.length})`}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              {activeTab === 'overview' && (
                <div className="space-y-4 text-sm text-stone-700 leading-relaxed">
                  <p>{listing.description}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                      <div className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">Condition</div>
                      <div className="font-bold text-stone-900 text-sm mt-0.5">{listing.condition}</div>
                    </div>
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                      <div className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">Delivery</div>
                      <div className="font-bold text-stone-900 text-sm mt-0.5">
                        {listing.deliveryAvailable ? `Available (+${formatPrice(listing.deliveryFee)})` : 'Pickup only'}
                      </div>
                    </div>
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                      <div className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">Operator</div>
                      <div className="font-bold text-stone-900 text-sm mt-0.5">
                        {listing.operatorAvailable ? 'Driver included' : 'Self-operated'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-4">
                  {listing.category === 'Land' && listing.landSpecs && (
                    <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
                      <h4 className="font-bold text-stone-900 text-sm">Land & Soil Specifications</h4>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                        <div>
                          <span className="text-stone-400 block font-semibold">Total Area</span>
                          <span className="font-bold text-stone-900 text-sm">{listing.landSpecs.area} {listing.landSpecs.areaUnit}s</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block font-semibold">Soil Type</span>
                          <span className="font-bold text-stone-900 text-sm">{listing.landSpecs.soilType}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block font-semibold">Water Source</span>
                          <span className="font-bold text-stone-900">{listing.landSpecs.waterAvailability}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block font-semibold">Electricity Supply</span>
                          <span className="font-bold text-stone-900">{listing.landSpecs.electricity ? 'Yes (3-Phase)' : 'No'}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block font-semibold">Road Access</span>
                          <span className="font-bold text-stone-900">{listing.landSpecs.roadAccess ? 'Motorable 20ft road' : 'Trail'}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block font-semibold">Perimeter Fencing</span>
                          <span className="font-bold text-stone-900">{listing.landSpecs.fencing ? 'Wire fenced' : 'Open boundary'}</span>
                        </div>
                      </div>

                      {listing.landSpecs.cropSuitability.length > 0 && (
                        <div className="pt-2 border-t border-stone-200">
                          <span className="text-stone-400 block text-xs font-semibold mb-1">Recommended Crops:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {listing.landSpecs.cropSuitability.map(crop => (
                              <span key={crop} className="px-2 py-0.5 bg-white border border-stone-200 rounded-md text-[11px] font-semibold text-stone-700">
                                {crop}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {listing.vehicleSpecs && (
                    <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
                      <h4 className="font-bold text-stone-900 text-sm">Machinery & Technical Specifications</h4>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                        {listing.vehicleSpecs.brand && (
                          <div>
                            <span className="text-stone-400 block font-semibold">Brand / Manufacturer</span>
                            <span className="font-bold text-stone-900 text-sm">{listing.vehicleSpecs.brand}</span>
                          </div>
                        )}
                        {listing.vehicleSpecs.model && (
                          <div>
                            <span className="text-stone-400 block font-semibold">Model</span>
                            <span className="font-bold text-stone-900 text-sm">{listing.vehicleSpecs.model}</span>
                          </div>
                        )}
                        {listing.vehicleSpecs.hp && (
                          <div>
                            <span className="text-stone-400 block font-semibold">Engine Horsepower</span>
                            <span className="font-bold text-stone-900 text-sm">{listing.vehicleSpecs.hp} HP</span>
                          </div>
                        )}
                        {listing.vehicleSpecs.year && (
                          <div>
                            <span className="text-stone-400 block font-semibold">Manufacturing Year</span>
                            <span className="font-bold text-stone-900 text-sm">{listing.vehicleSpecs.year}</span>
                          </div>
                        )}
                        {listing.vehicleSpecs.capacity && (
                          <div className="col-span-2">
                            <span className="text-stone-400 block font-semibold">Lifting / Operating Capacity</span>
                            <span className="font-bold text-stone-900">{listing.vehicleSpecs.capacity}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'policies' && (
                <div className="space-y-4 text-xs text-stone-600 leading-relaxed bg-stone-50 p-5 rounded-2xl border border-stone-200">
                  <h4 className="font-bold text-stone-900 text-sm">Rental Policies & Transparency</h4>
                  <ul className="space-y-2 list-disc list-inside">
                    <li><strong>Security Deposit:</strong> {formatPrice(listing.securityDeposit)} held securely in escrow and refunded within 24 hours of return inspection.</li>
                    <li><strong>Platform Fee:</strong> 2.5% platform fee covers AgriShare payment protection, equipment escrow, and verified support.</li>
                    <li><strong>Cancellation Policy:</strong> 100% refund if cancelled at least 24 hours before the rental start date.</li>
                    <li><strong>Maintenance & Fuel:</strong> Machine is supplied in ready-to-run condition with standard oil and greasing included. Diesel to be refilled by renter or billed on return.</li>
                  </ul>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <div className="text-center py-8 text-stone-500 text-xs">
                      No customer reviews yet. Be the first farmer to review after booking!
                    </div>
                  ) : (
                    reviews.map(rev => (
                      <div key={rev.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-stone-900">{rev.reviewerName}</span>
                          <span className="text-stone-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} size={13} className="fill-current" />
                          ))}
                        </div>
                        <p className="text-xs text-stone-700 leading-relaxed">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Right 5 Columns: Sticky Booking & Pricing Box */}
            <div className="lg:col-span-5">
              <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200 sticky top-4 shadow-sm space-y-5">
                {/* Price Display */}
                <div className="flex items-baseline justify-between pb-4 border-b border-stone-200">
                  <div>
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Rental Rate</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-3xl font-black text-stone-900">
                        {formatPrice(listing.pricePerDay)}
                      </span>
                      <span className="text-xs font-semibold text-stone-500">
                        /{listing.pricingUnit}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-emerald-800 font-bold bg-emerald-100 px-2.5 py-1 rounded-md">
                    Instant Booking
                  </span>
                </div>

                {/* Date Selection Box */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-stone-500 tracking-wider mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        min={tomorrow}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full text-xs font-bold p-2.5 bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-stone-500 tracking-wider mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        min={startDate}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full text-xs font-bold p-2.5 bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-stone-600 font-medium flex items-center justify-between px-1">
                    <span>Duration:</span>
                    <span className="font-bold text-stone-900">{diffDays} {diffDays === 1 ? 'day' : 'days'}</span>
                  </div>
                </div>

                {/* Delivery Option */}
                {listing.deliveryAvailable && (
                  <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-200 cursor-pointer">
                    <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                      <input
                        type="checkbox"
                        checked={deliverySelected}
                        onChange={(e) => setDeliverySelected(e.target.checked)}
                        className="w-4 h-4 text-emerald-700 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <span>Farm delivery & pickup</span>
                    </div>
                    <span className="text-xs font-bold text-stone-900">+{formatPrice(listing.deliveryFee)}</span>
                  </label>
                )}

                {/* Transparent Deterministic Price Breakdown */}
                <div className="bg-white rounded-2xl p-4 border border-stone-200/80 space-y-2.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Base Rental ({diffDays} days × {formatPrice(listing.pricePerDay)})</span>
                    <span className="font-semibold text-stone-900">{formatPrice(basePrice)}</span>
                  </div>

                  {deliverySelected && (
                    <div className="flex justify-between text-stone-600">
                      <span>Delivery & Transport Fee</span>
                      <span className="font-semibold text-stone-900">{formatPrice(listing.deliveryFee)}</span>
                    </div>
                  )}

                  {securityDeposit > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span className="flex items-center gap-1">
                        <span>Refundable Security Deposit</span>
                        <Info size={12} className="text-stone-400" title="Returned within 24 hours of return" />
                      </span>
                      <span className="font-semibold text-stone-900">{formatPrice(securityDeposit)}</span>
                    </div>
                  )}

                  {/* Explicit Platform Fee disclosure (2.5%) */}
                  <div className="flex justify-between text-emerald-800 font-medium pt-1 border-t border-stone-100">
                    <span className="flex items-center gap-1">
                      <span>AgriShare Platform Fee (2.5%)</span>
                      <Info size={12} className="text-emerald-700" title="Includes escrow protection & payment security" />
                    </span>
                    <span className="font-bold">{formatPrice(platformFee)}</span>
                  </div>

                  <div className="flex justify-between text-stone-500 text-[11px]">
                    <span>GST (18% on platform fee)</span>
                    <span>{formatPrice(taxFee)}</span>
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                    <span className="font-bold text-stone-900 text-sm">Total Payable</span>
                    <span className="text-xl font-black text-emerald-800">{formatPrice(totalPayable)}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full shadow-md"
                  onClick={() =>
                    onProceedToCheckout(listing, startDate, endDate, diffDays, deliverySelected, 1)
                  }
                  icon={<ArrowRight size={18} />}
                >
                  Proceed to Secure Checkout
                </Button>

                <p className="text-[11px] text-center text-stone-400 font-medium">
                  🔒 Payments are held safely in escrow until you verify equipment handover.
                </p>
              </div>
            </div>
          </div>

          {/* Similar Recommended Listings */}
          {similarListings.length > 0 && (
            <div className="mt-12 pt-8 border-t border-stone-200">
              <h3 className="text-lg font-bold text-stone-900 mb-4">Similar Farm Resources</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {similarListings.slice(0, 3).map(sim => (
                  <div
                    key={sim.id}
                    onClick={() => onSelectSimilar(sim)}
                    className="p-3 bg-stone-50 hover:bg-stone-100 rounded-2xl border border-stone-200 flex gap-3 cursor-pointer transition-all"
                  >
                    <img src={sim.coverImage} alt={sim.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-stone-900 truncate">{sim.title}</h4>
                      <p className="text-[11px] text-stone-500 truncate">{sim.location}</p>
                      <p className="text-xs font-black text-emerald-800 mt-1">{formatPrice(sim.pricePerDay)}/day</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
