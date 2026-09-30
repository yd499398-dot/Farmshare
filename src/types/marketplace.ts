export type UserRole = 'customer' | 'owner' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  role: UserRole;
  photoURL?: string;
  isVerified?: boolean;
  farmLocation?: string;
  bio?: string;
  createdAt: string;
}

export type ListingCategory =
  | 'Tractors'
  | 'Farm Vehicles'
  | 'Harvesting Equipment'
  | 'Agricultural Machinery'
  | 'Tools & Equipment'
  | 'Land'
  | 'Storage'
  | 'Irrigation Equipment'
  | 'Farming Services'
  | 'Other';

export interface LandSpecs {
  area: number;
  areaUnit: 'acre' | 'hectare' | 'guntha';
  soilType: string;
  waterAvailability: 'Borewell' | 'Canal' | 'Rainfed' | 'Multiple Sources' | 'None';
  electricity: boolean;
  roadAccess: boolean;
  fencing: boolean;
  storageOnSite: boolean;
  cropSuitability: string[];
}

export interface VehicleSpecs {
  hp?: number;
  brand?: string;
  model?: string;
  year?: number;
  capacity?: string;
  fuelType?: 'Diesel' | 'Petrol' | 'Electric' | 'Manual';
  driveType?: '2WD' | '4WD';
  operatorAvailable?: boolean;
  attachmentAvailability?: string;
}

export interface Listing {
  id: string;
  title: string;
  category: ListingCategory;
  subcategory?: string;
  description: string;
  pricePerDay: number; // in INR
  pricePerHour?: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  pricingUnit: 'day' | 'hour' | 'week' | 'month' | 'acre/month';
  securityDeposit: number;
  location: string;
  city: string;
  state: string;
  pincode: string;
  distanceKm?: number;
  images: string[];
  coverImage: string;
  condition: 'Brand New' | 'Excellent' | 'Good' | 'Fair';
  deliveryAvailable: boolean;
  deliveryFee: number;
  pickupAvailable: boolean;
  operatorAvailable: boolean;
  maintenanceIncluded: boolean;
  landSpecs?: LandSpecs;
  vehicleSpecs?: VehicleSpecs;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  ownerRating: number;
  ownerReviewCount: number;
  isOwnerVerified: boolean;
  isListingVerified: boolean;
  status: 'draft' | 'pending_verification' | 'active' | 'paused' | 'rejected';
  rejectionReason?: string;
  minRentalDuration: number; // in days
  maxRentalDuration: number;
  blockedDates: string[]; // ISO date strings
  createdAt: string;
  updatedAt: string;
}

export interface PriceBreakdown {
  rentalDays: number;
  baseAmount: number;
  deliveryFee: number;
  securityDeposit: number;
  commissionRate: number; // e.g. 2.5
  commissionAmount: number;
  taxAmount: number; // 18% GST on commission / service
  totalCustomerPayable: number;
  ownerGrossAmount: number;
  ownerCommissionDeducted: number;
  ownerNetAmount: number;
  feeModel: 'add_to_customer' | 'deduct_from_owner';
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'refunded'
  | 'failed';

export type PayoutStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'on_hold';

export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  listingCoverImage: string;
  listingCategory: ListingCategory;
  listingLocation: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  quantity: number;
  deliverySelected: boolean;
  priceBreakdown: PriceBreakdown;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: 'UPI' | 'Card' | 'NetBanking' | 'Cash on Delivery';
  transactionId?: string;
  paidAt?: string;
  payoutStatus: PayoutStatus;
  payoutId?: string;
  hasCustomerReviewed?: boolean;
  hasOwnerReviewed?: boolean;
  cancellationReason?: string;
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionAuditLog {
  id: string;
  adminEmail: string;
  oldRate: number;
  newRate: number;
  changedAt: string;
  reason: string;
}

export interface PlatformSettings {
  defaultCommissionRate: number; // Default 2.5%
  feeModel: 'add_to_customer' | 'deduct_from_owner';
  allowCategorySpecific: boolean;
  categoryRates: Record<string, number>;
  allowOwnerSpecific: boolean;
  ownerRates: Record<string, number>;
  allowPromotional: boolean;
  payoutDelayDays: number; // e.g. 3 days settlement period
  gstRatePercent: number; // 18% on platform services
  minPayoutAmountINR: number;
  auditLogs: CommissionAuditLog[];
}

export interface PayoutRequest {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  amount: number;
  status: PayoutStatus;
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    upiId?: string;
  };
  requestedAt: string;
  processedAt?: string;
  transactionRef?: string;
  adminNotes?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  listingId: string;
  listingTitle?: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: 'customer' | 'owner';
  targetUserId: string;
  rating: number; // 1 - 5
  comment: string;
  createdAt: string;
}

export interface BookingMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'payout' | 'verification' | 'system';
  linkTarget?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  subject: string;
  category: 'Booking' | 'Payment' | 'Payout' | 'Listing' | 'Verification' | 'Dispute' | 'General';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  bookingId?: string;
  messages: Array<{
    sender: string;
    text: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
