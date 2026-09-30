import {
  Listing,
  Booking,
  PlatformSettings,
  PayoutRequest,
  Review,
  BookingMessage,
  AppNotification,
  SupportTicket,
  PriceBreakdown
} from '../types/marketplace';
import { SEED_LISTINGS, INITIAL_PLATFORM_SETTINGS } from '../lib/seedData';

// In-memory operational store with persistence helper
class MarketplaceStore {
  public listings: Map<string, Listing> = new Map();
  public bookings: Map<string, Booking> = new Map();
  public settings: PlatformSettings = { ...INITIAL_PLATFORM_SETTINGS };
  public payouts: Map<string, PayoutRequest> = new Map();
  public reviews: Map<string, Review> = new Map();
  public messages: Map<string, BookingMessage[]> = new Map();
  public notifications: Map<string, AppNotification[]> = new Map();
  public supportTickets: Map<string, SupportTicket> = new Map();

  constructor() {
    // Initialize seed listings
    SEED_LISTINGS.forEach(item => {
      this.listings.set(item.id, { ...item });
    });

    // Initialize sample realistic bookings
    const sampleBooking1: Booking = {
      id: 'bk_1001',
      listingId: 'list_1',
      listingTitle: 'John Deere 5050D (50 HP) Heavy Tillage Tractor',
      listingCoverImage: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1200&q=80',
      listingCategory: 'Tractors',
      listingLocation: 'Springfield Farm, 4 km from APMC Market, Nashik',
      customerId: 'seed_ramesh',
      customerName: 'Ramesh Patel',
      customerEmail: 'ramesh.patel@farmshare.in',
      customerPhone: '+91 98765 43210',
      ownerId: 'owner_robert',
      ownerName: 'Robert K. (Green Valley Farms)',
      ownerEmail: 'robert.k@springfieldfarm.com',
      ownerPhone: '+91 98230 44120',
      startDate: '2026-09-15',
      endDate: '2026-09-18',
      totalDays: 3,
      quantity: 1,
      deliverySelected: true,
      priceBreakdown: this.calculatePricing(2800, 3, 450, 3000, 'Tractors', 'owner_robert'),
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod: 'UPI',
      transactionId: 'TXN_UPI_9824729104',
      paidAt: '2026-09-14T11:20:00.000Z',
      payoutStatus: 'paid',
      hasCustomerReviewed: true,
      createdAt: '2026-09-14T11:15:00.000Z',
      updatedAt: '2026-09-18T18:00:00.000Z'
    };

    const sampleBooking2: Booking = {
      id: 'bk_1002',
      listingId: 'list_4',
      listingTitle: 'Shaktiman 7-Feet Heavy Duty Multi-Speed Rotavator',
      listingCoverImage: 'https://images.unsplash.com/photo-1589923188651-268a9765e432?auto=format&fit=crop&w=1200&q=80',
      listingCategory: 'Agricultural Machinery',
      listingLocation: 'Sector 5 Industrial & Farm Hub, Indore',
      customerId: 'seed_ramesh',
      customerName: 'Ramesh Patel',
      customerEmail: 'ramesh.patel@farmshare.in',
      customerPhone: '+91 98765 43210',
      ownerId: 'owner_robert',
      ownerName: 'Robert K. (Green Valley Farms)',
      ownerEmail: 'robert.k@springfieldfarm.com',
      ownerPhone: '+91 98230 44120',
      startDate: '2026-10-01',
      endDate: '2026-10-03',
      totalDays: 2,
      quantity: 1,
      deliverySelected: false,
      priceBreakdown: this.calculatePricing(1600, 2, 0, 2000, 'Agricultural Machinery', 'owner_robert'),
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'NetBanking',
      transactionId: 'TXN_NB_5510293841',
      paidAt: '2026-09-28T09:10:00.000Z',
      payoutStatus: 'pending',
      createdAt: '2026-09-28T09:00:00.000Z',
      updatedAt: '2026-09-28T09:10:00.000Z'
    };

    this.bookings.set(sampleBooking1.id, sampleBooking1);
    this.bookings.set(sampleBooking2.id, sampleBooking2);

    // Sample reviews
    const rev1: Review = {
      id: 'rev_1',
      bookingId: 'bk_1001',
      listingId: 'list_1',
      listingTitle: 'John Deere 5050D (50 HP) Heavy Tillage Tractor',
      reviewerId: 'seed_ramesh',
      reviewerName: 'Ramesh Patel',
      reviewerRole: 'customer',
      targetUserId: 'owner_robert',
      rating: 5,
      comment: 'Superb tractor! Ploughed 10 acres of black soil without single hitch. The operator was polite, came right on schedule, and machine consumed very reasonable diesel. Will rent again!',
      createdAt: '2026-09-19T10:00:00.000Z'
    };
    this.reviews.set(rev1.id, rev1);

    // Sample payout
    const payout1: PayoutRequest = {
      id: 'pay_101',
      ownerId: 'owner_robert',
      ownerName: 'Robert K. (Green Valley Farms)',
      ownerEmail: 'robert.k@springfieldfarm.com',
      amount: 8667,
      status: 'paid',
      bankDetails: {
        accountHolderName: 'Robert K.',
        accountNumber: '••••••••8912',
        ifscCode: 'HDFC0001244',
        bankName: 'HDFC Bank, College Road Branch',
        upiId: 'robert.farm@okaxis'
      },
      requestedAt: '2026-09-19T12:00:00.000Z',
      processedAt: '2026-09-20T14:30:00.000Z',
      transactionRef: 'NEFT_REF_20260920008471',
      adminNotes: 'Settled booking bk_1001'
    };
    this.payouts.set(payout1.id, payout1);

    // Initial messages
    this.messages.set('bk_1001', [
      {
        id: 'msg_1',
        bookingId: 'bk_1001',
        senderId: 'owner_robert',
        senderName: 'Robert K.',
        senderRole: 'owner',
        text: 'Namaste Ramesh ji. I have dispatched the tractor with driver Suresh. He will arrive by 7:30 AM.',
        timestamp: '2026-09-15T01:30:00.000Z',
        isRead: true
      },
      {
        id: 'msg_2',
        bookingId: 'bk_1001',
        senderId: 'seed_ramesh',
        senderName: 'Ramesh Patel',
        senderRole: 'customer',
        text: 'Dhanyawad Robert ji. The farm gate is open and diesel can is ready.',
        timestamp: '2026-09-15T02:00:00.000Z',
        isRead: true
      }
    ]);

    // Initial notifications
    this.notifications.set('owner_robert', [
      {
        id: 'notif_1',
        userId: 'owner_robert',
        title: 'New Booking Confirmed',
        message: 'Ramesh Patel booked Shaktiman 7-Ft Rotavator for Oct 01 - Oct 03 (₹3,200 total).',
        type: 'booking',
        linkTarget: '/owner/bookings',
        isRead: false,
        createdAt: '2026-09-28T09:10:00.000Z'
      },
      {
        id: 'notif_2',
        userId: 'owner_robert',
        title: 'Payout Processed (₹8,667)',
        message: 'Your payout request for booking bk_1001 was transferred to your HDFC bank account.',
        type: 'payout',
        linkTarget: '/owner/payouts',
        isRead: true,
        createdAt: '2026-09-20T14:35:00.000Z'
      }
    ]);
  }

  // Deterministic calculation in integer paise to eliminate floating point issues
  public calculatePricing(
    pricePerDay: number,
    days: number,
    deliveryFee: number,
    securityDeposit: number,
    category: string,
    ownerId?: string
  ): PriceBreakdown {
    const rentalDays = Math.max(1, days);
    const basePaise = Math.round(pricePerDay * 100) * rentalDays;
    const deliveryPaise = Math.round(deliveryFee * 100);
    const depositPaise = Math.round(securityDeposit * 100);

    // Determine platform commission rate
    let commissionRate = this.settings.defaultCommissionRate;
    if (this.settings.allowCategorySpecific && this.settings.categoryRates[category] !== undefined) {
      commissionRate = this.settings.categoryRates[category];
    }
    if (ownerId && this.settings.allowOwnerSpecific && this.settings.ownerRates[ownerId] !== undefined) {
      commissionRate = this.settings.ownerRates[ownerId];
    }

    // Commission amount in paise (round to nearest paise)
    const commissionPaise = Math.round((basePaise * commissionRate) / 100);

    // GST on commission (18%)
    const gstRate = this.settings.gstRatePercent || 18;
    const taxPaise = Math.round((commissionPaise * gstRate) / 100);

    const feeModel = this.settings.feeModel;

    let totalCustomerPaise = 0;
    let ownerGrossPaise = basePaise;
    let ownerCommissionDeducted = 0;
    let ownerNetPaise = 0;

    if (feeModel === 'add_to_customer') {
      // Customer pays Base + Delivery + Deposit + Platform Fee + Tax
      totalCustomerPaise = basePaise + deliveryPaise + depositPaise + commissionPaise + taxPaise;
      ownerGrossPaise = basePaise + deliveryPaise;
      ownerCommissionDeducted = 0;
      ownerNetPaise = ownerGrossPaise;
    } else {
      // Fee is deducted from owner earnings
      totalCustomerPaise = basePaise + deliveryPaise + depositPaise;
      ownerGrossPaise = basePaise + deliveryPaise;
      ownerCommissionDeducted = commissionPaise + taxPaise;
      ownerNetPaise = Math.max(0, ownerGrossPaise - ownerCommissionDeducted);
    }

    return {
      rentalDays,
      baseAmount: basePaise / 100,
      deliveryFee: deliveryPaise / 100,
      securityDeposit: depositPaise / 100,
      commissionRate,
      commissionAmount: commissionPaise / 100,
      taxAmount: taxPaise / 100,
      totalCustomerPayable: totalCustomerPaise / 100,
      ownerGrossAmount: ownerGrossPaise / 100,
      ownerCommissionDeducted: ownerCommissionDeducted / 100,
      ownerNetAmount: ownerNetPaise / 100,
      feeModel
    };
  }

  // Calculate wallet balances for an owner
  public getOwnerBalances(ownerId: string): {
    totalLifetimeEarnings: number;
    availableBalance: number;
    pendingBalance: number;
    totalPlatformFeesPaid: number;
    totalCompletedBookings: number;
    activeBookingsCount: number;
  } {
    const ownerBookings = Array.from(this.bookings.values()).filter(b => b.ownerId === ownerId);
    const ownerPayouts = Array.from(this.payouts.values()).filter(p => p.ownerId === ownerId);

    let totalEarningsPaise = 0;
    let availablePaise = 0;
    let pendingPaise = 0;
    let totalFeesPaise = 0;
    let completedCount = 0;
    let activeCount = 0;

    ownerBookings.forEach(b => {
      const netPaise = Math.round(b.priceBreakdown.ownerNetAmount * 100);
      const feePaise = Math.round(b.priceBreakdown.commissionAmount * 100);
      totalFeesPaise += feePaise;

      if (b.paymentStatus === 'paid') {
        totalEarningsPaise += netPaise;

        if (b.status === 'completed') {
          completedCount++;
          if (b.payoutStatus === 'pending') {
            availablePaise += netPaise;
          }
        } else if (b.status === 'confirmed' || b.status === 'active') {
          activeCount++;
          pendingPaise += netPaise;
        }
      }
    });

    // Deduct already requested/paid payouts from available balance
    ownerPayouts.forEach(p => {
      if (p.status === 'pending' || p.status === 'processing') {
        const amtPaise = Math.round(p.amount * 100);
        availablePaise = Math.max(0, availablePaise - amtPaise);
      }
    });

    return {
      totalLifetimeEarnings: totalEarningsPaise / 100,
      availableBalance: availablePaise / 100,
      pendingBalance: pendingPaise / 100,
      totalPlatformFeesPaid: totalFeesPaise / 100,
      totalCompletedBookings: completedCount,
      activeBookingsCount: activeCount
    };
  }

  // Get administrative analytics
  public getAdminMetrics() {
    let totalGmvPaise = 0;
    let totalCommissionPaise = 0;
    let totalBookings = this.bookings.size;
    let activeListings = 0;
    let pendingVerifications = 0;
    let pendingPayoutsCount = 0;
    let pendingPayoutsAmountPaise = 0;

    this.listings.forEach(l => {
      if (l.status === 'active') activeListings++;
      if (l.status === 'pending_verification') pendingVerifications++;
    });

    this.bookings.forEach(b => {
      if (b.paymentStatus === 'paid') {
        totalGmvPaise += Math.round(b.priceBreakdown.totalCustomerPayable * 100);
        totalCommissionPaise += Math.round(b.priceBreakdown.commissionAmount * 100);
      }
    });

    this.payouts.forEach(p => {
      if (p.status === 'pending') {
        pendingPayoutsCount++;
        pendingPayoutsAmountPaise += Math.round(p.amount * 100);
      }
    });

    const uniqueCustomers = new Set(Array.from(this.bookings.values()).map(b => b.customerId)).size + 3;
    const uniqueOwners = new Set(Array.from(this.listings.values()).map(l => l.ownerId)).size;

    return {
      gmv: totalGmvPaise / 100,
      platformRevenue: totalCommissionPaise / 100,
      commissionRate: this.settings.defaultCommissionRate,
      feeModel: this.settings.feeModel,
      totalBookings,
      activeListings,
      pendingVerifications,
      totalUsers: uniqueCustomers + uniqueOwners,
      totalOwners: uniqueOwners,
      pendingPayoutsCount,
      pendingPayoutsAmount: pendingPayoutsAmountPaise / 100,
      recentAuditLogs: this.settings.auditLogs
    };
  }
}

export const marketplaceStore = new MarketplaceStore();
