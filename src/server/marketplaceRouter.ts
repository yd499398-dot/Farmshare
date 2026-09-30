import { Router, Request, Response } from 'express';
import { marketplaceStore } from './marketplaceStore';
import { Listing, Booking, PayoutRequest, Review, BookingMessage, SupportTicket, AppNotification } from '../types/marketplace';

export const marketplaceRouter = Router();

// ==========================================
// 1. LISTINGS ENDPOINTS
// ==========================================

// Get listings with rich filtering, search & sorting
marketplaceRouter.get('/listings', (req: Request, res: Response) => {
  try {
    let list = Array.from(marketplaceStore.listings.values());

    const {
      category,
      city,
      search,
      ownerId,
      status,
      minPrice,
      maxPrice,
      verifiedOnly,
      instantOnly,
      deliveryOnly,
      sortBy
    } = req.query;

    // Filter by status (default to active for public unless requested)
    if (status && typeof status === 'string') {
      list = list.filter(l => l.status === status);
    } else if (!ownerId) {
      list = list.filter(l => l.status === 'active');
    }

    // Filter by owner
    if (ownerId && typeof ownerId === 'string') {
      list = list.filter(l => l.ownerId === ownerId);
    }

    // Filter by Category
    if (category && typeof category === 'string' && category !== 'All') {
      list = list.filter(l => l.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by City / Location
    if (city && typeof city === 'string' && city.trim() !== '') {
      const qCity = city.toLowerCase();
      list = list.filter(l => l.city.toLowerCase().includes(qCity) || l.location.toLowerCase().includes(qCity));
    }

    // Full text search in title, description, category, and specs
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        (l.vehicleSpecs?.brand && l.vehicleSpecs.brand.toLowerCase().includes(q)) ||
        (l.landSpecs?.soilType && l.landSpecs.soilType.toLowerCase().includes(q))
      );
    }

    // Price range
    if (minPrice && !isNaN(Number(minPrice))) {
      list = list.filter(l => l.pricePerDay >= Number(minPrice));
    }
    if (maxPrice && !isNaN(Number(maxPrice))) {
      list = list.filter(l => l.pricePerDay <= Number(maxPrice));
    }

    // Verified only
    if (verifiedOnly === 'true') {
      list = list.filter(l => l.isListingVerified || l.isOwnerVerified);
    }

    // Delivery available
    if (deliveryOnly === 'true') {
      list = list.filter(l => l.deliveryAvailable);
    }

    // Sort
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.pricePerDay - a.pricePerDay);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.ownerRating - a.ownerRating);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'nearest') {
      list.sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));
    }

    return res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch listings' });
  }
});

// Get single listing by ID
marketplaceRouter.get('/listings/:id', (req: Request, res: Response) => {
  const listing = marketplaceStore.listings.get(req.params.id);
  if (!listing) {
    return res.status(404).json({ success: false, error: 'Listing not found' });
  }
  return res.json({ success: true, data: listing });
});

// Create new listing
marketplaceRouter.post('/listings', (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.title || !body.category || !body.pricePerDay || !body.location) {
      return res.status(400).json({ success: false, error: 'Title, category, price, and location are required' });
    }

    const id = 'list_' + Date.now();
    const newListing: Listing = {
      id,
      title: String(body.title).trim(),
      category: body.category,
      subcategory: body.subcategory || '',
      description: body.description || '',
      pricePerDay: Number(body.pricePerDay),
      pricePerHour: body.pricePerHour ? Number(body.pricePerHour) : undefined,
      pricePerWeek: body.pricePerWeek ? Number(body.pricePerWeek) : undefined,
      pricePerMonth: body.pricePerMonth ? Number(body.pricePerMonth) : undefined,
      pricingUnit: body.pricingUnit || 'day',
      securityDeposit: Number(body.securityDeposit || 0),
      location: String(body.location).trim(),
      city: body.city || 'Nashik',
      state: body.state || 'Maharashtra',
      pincode: body.pincode || '422001',
      distanceKm: body.distanceKm ? Number(body.distanceKm) : 5.0,
      images: Array.isArray(body.images) && body.images.length > 0 ? body.images : [body.coverImage || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1200&q=80'],
      coverImage: body.coverImage || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1200&q=80',
      condition: body.condition || 'Excellent',
      deliveryAvailable: Boolean(body.deliveryAvailable),
      deliveryFee: Number(body.deliveryFee || 0),
      pickupAvailable: body.pickupAvailable !== false,
      operatorAvailable: Boolean(body.operatorAvailable),
      maintenanceIncluded: body.maintenanceIncluded !== false,
      landSpecs: body.landSpecs,
      vehicleSpecs: body.vehicleSpecs,
      ownerId: body.ownerId || 'owner_default',
      ownerName: body.ownerName || 'Verified Owner',
      ownerEmail: body.ownerEmail || 'owner@agrishare.in',
      ownerPhone: body.ownerPhone || '+91 98000 00000',
      ownerRating: 5.0,
      ownerReviewCount: 1,
      isOwnerVerified: true,
      isListingVerified: true, // auto-verified for seamless experience
      status: body.status || 'active',
      minRentalDuration: Number(body.minRentalDuration || 1),
      maxRentalDuration: Number(body.maxRentalDuration || 30),
      blockedDates: Array.isArray(body.blockedDates) ? body.blockedDates : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    marketplaceStore.listings.set(id, newListing);
    return res.status(201).json({ success: true, data: newListing });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create listing' });
  }
});

// Update listing
marketplaceRouter.put('/listings/:id', (req: Request, res: Response) => {
  const listing = marketplaceStore.listings.get(req.params.id);
  if (!listing) {
    return res.status(404).json({ success: false, error: 'Listing not found' });
  }

  const updated: Listing = {
    ...listing,
    ...req.body,
    id: listing.id,
    updatedAt: new Date().toISOString()
  };

  marketplaceStore.listings.set(listing.id, updated);
  return res.json({ success: true, data: updated });
});

// Delete listing
marketplaceRouter.delete('/listings/:id', (req: Request, res: Response) => {
  if (!marketplaceStore.listings.has(req.params.id)) {
    return res.status(404).json({ success: false, error: 'Listing not found' });
  }
  marketplaceStore.listings.delete(req.params.id);
  return res.json({ success: true, message: 'Listing deleted successfully' });
});

// ==========================================
// 2. PRICING & COMMISSION CALCULATION
// ==========================================

marketplaceRouter.post('/calculate-price', (req: Request, res: Response) => {
  try {
    const { pricePerDay, days, deliveryFee, securityDeposit, category, ownerId } = req.body;
    if (pricePerDay === undefined || days === undefined) {
      return res.status(400).json({ success: false, error: 'pricePerDay and days are required' });
    }

    const breakdown = marketplaceStore.calculatePricing(
      Number(pricePerDay),
      Number(days),
      Number(deliveryFee || 0),
      Number(securityDeposit || 0),
      category || 'Other',
      ownerId
    );

    return res.json({ success: true, data: breakdown });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Price calculation error' });
  }
});

// ==========================================
// 3. BOOKINGS ENDPOINTS
// ==========================================

// Get bookings (filtered by customer, owner or all for admin)
marketplaceRouter.get('/bookings', (req: Request, res: Response) => {
  try {
    let list = Array.from(marketplaceStore.bookings.values());
    const { customerId, ownerId, status } = req.query;

    if (customerId && typeof customerId === 'string') {
      list = list.filter(b => b.customerId === customerId);
    }
    if (ownerId && typeof ownerId === 'string') {
      list = list.filter(b => b.ownerId === ownerId);
    }
    if (status && typeof status === 'string' && status !== 'all') {
      list = list.filter(b => b.status === status);
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch bookings' });
  }
});

// Create booking & checkout
marketplaceRouter.post('/bookings', (req: Request, res: Response) => {
  try {
    const {
      listingId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      startDate,
      endDate,
      totalDays,
      quantity,
      deliverySelected,
      paymentMethod
    } = req.body;

    const listing = marketplaceStore.listings.get(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found for this booking' });
    }

    const days = Math.max(1, Number(totalDays) || 1);
    const deliveryFee = deliverySelected ? listing.deliveryFee : 0;
    const priceBreakdown = marketplaceStore.calculatePricing(
      listing.pricePerDay,
      days,
      deliveryFee,
      listing.securityDeposit,
      listing.category,
      listing.ownerId
    );

    const bookingId = 'bk_' + Date.now();
    const transactionId = 'TXN_' + (paymentMethod || 'UPI').toUpperCase() + '_' + Math.floor(1000000000 + Math.random() * 9000000000);
    const now = new Date().toISOString();

    const newBooking: Booking = {
      id: bookingId,
      listingId: listing.id,
      listingTitle: listing.title,
      listingCoverImage: listing.coverImage,
      listingCategory: listing.category,
      listingLocation: listing.location,
      customerId: customerId || 'cust_guest',
      customerName: customerName || 'Farmer Renter',
      customerEmail: customerEmail || 'renter@agrishare.in',
      customerPhone: customerPhone || '+91 98000 00000',
      ownerId: listing.ownerId,
      ownerName: listing.ownerName,
      ownerEmail: listing.ownerEmail,
      ownerPhone: listing.ownerPhone,
      startDate,
      endDate,
      totalDays: days,
      quantity: quantity || 1,
      deliverySelected: Boolean(deliverySelected),
      priceBreakdown,
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: paymentMethod || 'UPI',
      transactionId,
      paidAt: now,
      payoutStatus: 'pending',
      createdAt: now,
      updatedAt: now
    };

    marketplaceStore.bookings.set(bookingId, newBooking);

    // Notify Owner
    const ownerNotifs = marketplaceStore.notifications.get(listing.ownerId) || [];
    ownerNotifs.unshift({
      id: 'notif_' + Date.now(),
      userId: listing.ownerId,
      title: 'New Confirmed Booking',
      message: `${customerName || 'A farmer'} booked ${listing.title} from ${startDate} to ${endDate}. Platform fee: ₹${priceBreakdown.commissionAmount.toFixed(2)}.`,
      type: 'booking',
      linkTarget: '/owner/bookings',
      isRead: false,
      createdAt: now
    });
    marketplaceStore.notifications.set(listing.ownerId, ownerNotifs);

    return res.status(201).json({ success: true, data: newBooking });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create booking' });
  }
});

// Update booking status (accept, complete, cancel, dispute)
marketplaceRouter.put('/bookings/:id/status', (req: Request, res: Response) => {
  try {
    const booking = marketplaceStore.bookings.get(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const { status, cancellationReason, disputeReason } = req.body;
    const now = new Date().toISOString();

    if (status) {
      booking.status = status;
    }
    if (cancellationReason) {
      booking.cancellationReason = cancellationReason;
      booking.paymentStatus = 'refunded';
    }
    if (disputeReason) {
      booking.disputeReason = disputeReason;
    }
    booking.updatedAt = now;

    // If completed, release owner funds into available balance for payout
    if (status === 'completed') {
      const ownerNotifs = marketplaceStore.notifications.get(booking.ownerId) || [];
      ownerNotifs.unshift({
        id: 'notif_' + Date.now(),
        userId: booking.ownerId,
        title: 'Booking Completed - Payout Available',
        message: `Booking ${booking.id} is marked completed! ₹${booking.priceBreakdown.ownerNetAmount.toFixed(2)} is now eligible for withdrawal.`,
        type: 'payout',
        linkTarget: '/owner/payouts',
        isRead: false,
        createdAt: now
      });
      marketplaceStore.notifications.set(booking.ownerId, ownerNotifs);
    }

    marketplaceStore.bookings.set(booking.id, booking);
    return res.json({ success: true, data: booking });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update booking status' });
  }
});

// ==========================================
// 4. COMMISSION MANAGEMENT (ADMIN)
// ==========================================

marketplaceRouter.get('/commission', (req: Request, res: Response) => {
  return res.json({ success: true, data: marketplaceStore.settings });
});

marketplaceRouter.post('/commission', (req: Request, res: Response) => {
  try {
    const { defaultRate, feeModel, categoryRates, adminEmail, reason } = req.body;
    if (defaultRate === undefined || isNaN(Number(defaultRate))) {
      return res.status(400).json({ success: false, error: 'Valid default commission rate is required' });
    }

    const oldRate = marketplaceStore.settings.defaultCommissionRate;
    const newRate = Number(defaultRate);
    const now = new Date().toISOString();

    // Create immutable audit log
    const auditLog = {
      id: 'audit_' + Date.now(),
      adminEmail: adminEmail || 'admin@agrishare.in',
      oldRate,
      newRate,
      changedAt: now,
      reason: reason || 'Updated standard platform commission fee policy.'
    };

    marketplaceStore.settings.defaultCommissionRate = newRate;
    if (feeModel) {
      marketplaceStore.settings.feeModel = feeModel;
    }
    if (categoryRates && typeof categoryRates === 'object') {
      marketplaceStore.settings.categoryRates = { ...marketplaceStore.settings.categoryRates, ...categoryRates };
    }
    marketplaceStore.settings.auditLogs.unshift(auditLog);

    return res.json({ success: true, data: marketplaceStore.settings, auditLog });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update commission settings' });
  }
});

// ==========================================
// 5. OWNER PAYOUTS & WALLET
// ==========================================

// Get owner balances and payout history
marketplaceRouter.get('/payouts', (req: Request, res: Response) => {
  try {
    const { ownerId } = req.query;
    let list = Array.from(marketplaceStore.payouts.values());

    if (ownerId && typeof ownerId === 'string') {
      list = list.filter(p => p.ownerId === ownerId);
      const balances = marketplaceStore.getOwnerBalances(ownerId);
      return res.json({
        success: true,
        balances,
        payouts: list
      });
    }

    // Admin view of all payouts
    return res.json({
      success: true,
      payouts: list
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch payouts' });
  }
});

// Request payout
marketplaceRouter.post('/payouts', (req: Request, res: Response) => {
  try {
    const { ownerId, ownerName, ownerEmail, amount, bankDetails } = req.body;
    if (!ownerId || !amount || !bankDetails || !bankDetails.accountNumber) {
      return res.status(400).json({ success: false, error: 'Owner ID, amount, and verified bank details are required' });
    }

    const balances = marketplaceStore.getOwnerBalances(ownerId);
    if (amount > balances.availableBalance) {
      return res.status(400).json({
        success: false,
        error: `Requested amount (₹${amount}) exceeds available balance (₹${balances.availableBalance.toFixed(2)})`
      });
    }

    const minAmt = marketplaceStore.settings.minPayoutAmountINR || 500;
    if (amount < minAmt) {
      return res.status(400).json({
        success: false,
        error: `Minimum payout request threshold is ₹${minAmt}`
      });
    }

    const payoutId = 'pay_' + Date.now();
    const newPayout: PayoutRequest = {
      id: payoutId,
      ownerId,
      ownerName: ownerName || 'Owner',
      ownerEmail: ownerEmail || 'owner@agrishare.in',
      amount: Number(amount),
      status: 'pending',
      bankDetails,
      requestedAt: new Date().toISOString()
    };

    marketplaceStore.payouts.set(payoutId, newPayout);
    return res.status(201).json({ success: true, data: newPayout });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to request payout' });
  }
});

// Admin approve / mark payout paid
marketplaceRouter.put('/payouts/:id', (req: Request, res: Response) => {
  try {
    const payout = marketplaceStore.payouts.get(req.params.id);
    if (!payout) {
      return res.status(404).json({ success: false, error: 'Payout request not found' });
    }

    const { status, transactionRef, adminNotes } = req.body;
    if (status) payout.status = status;
    if (transactionRef) payout.transactionRef = transactionRef;
    if (adminNotes) payout.adminNotes = adminNotes;
    payout.processedAt = new Date().toISOString();

    marketplaceStore.payouts.set(payout.id, payout);

    // Notify owner
    const ownerNotifs = marketplaceStore.notifications.get(payout.ownerId) || [];
    ownerNotifs.unshift({
      id: 'notif_' + Date.now(),
      userId: payout.ownerId,
      title: `Payout ${status === 'paid' ? 'Processed' : 'Status Updated'}`,
      message: `Your payout of ₹${payout.amount} has been marked as ${status}. Ref: ${transactionRef || 'N/A'}.`,
      type: 'payout',
      linkTarget: '/owner/payouts',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    marketplaceStore.notifications.set(payout.ownerId, ownerNotifs);

    return res.json({ success: true, data: payout });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to update payout' });
  }
});

// ==========================================
// 6. REVIEWS
// ==========================================

marketplaceRouter.get('/reviews', (req: Request, res: Response) => {
  const { listingId, targetUserId } = req.query;
  let list = Array.from(marketplaceStore.reviews.values());

  if (listingId && typeof listingId === 'string') {
    list = list.filter(r => r.listingId === listingId);
  }
  if (targetUserId && typeof targetUserId === 'string') {
    list = list.filter(r => r.targetUserId === targetUserId);
  }

  return res.json({ success: true, count: list.length, data: list });
});

marketplaceRouter.post('/reviews', (req: Request, res: Response) => {
  try {
    const { bookingId, listingId, reviewerId, reviewerName, reviewerRole, targetUserId, rating, comment } = req.body;
    if (!bookingId || !listingId || !rating || !comment) {
      return res.status(400).json({ success: false, error: 'Booking ID, listing ID, rating (1-5), and review text are required' });
    }

    // Verify booking is completed to prevent fraudulent reviews
    const booking = marketplaceStore.bookings.get(bookingId);
    if (!booking) {
      return res.status(400).json({ success: false, error: 'Only verified bookings can be reviewed' });
    }

    // Prevent duplicate reviews
    const existing = Array.from(marketplaceStore.reviews.values()).find(
      r => r.bookingId === bookingId && r.reviewerId === reviewerId
    );
    if (existing) {
      return res.status(400).json({ success: false, error: 'You have already submitted a review for this booking' });
    }

    const reviewId = 'rev_' + Date.now();
    const newReview: Review = {
      id: reviewId,
      bookingId,
      listingId,
      listingTitle: booking.listingTitle,
      reviewerId: reviewerId || 'cust_user',
      reviewerName: reviewerName || 'Verified Farmer',
      reviewerRole: reviewerRole || 'customer',
      targetUserId: targetUserId || booking.ownerId,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: String(comment).trim(),
      createdAt: new Date().toISOString()
    };

    marketplaceStore.reviews.set(reviewId, newReview);
    booking.hasCustomerReviewed = true;
    marketplaceStore.bookings.set(booking.id, booking);

    // Update listing rating average
    const listingReviews = Array.from(marketplaceStore.reviews.values()).filter(r => r.listingId === listingId);
    const avg = listingReviews.reduce((sum, r) => sum + r.rating, 0) / listingReviews.length;
    const listing = marketplaceStore.listings.get(listingId);
    if (listing) {
      listing.ownerRating = Number(avg.toFixed(1));
      listing.ownerReviewCount = listingReviews.length;
      marketplaceStore.listings.set(listing.id, listing);
    }

    return res.status(201).json({ success: true, data: newReview });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to submit review' });
  }
});

// ==========================================
// 7. BOOKING MESSAGES
// ==========================================

marketplaceRouter.get('/messages/:bookingId', (req: Request, res: Response) => {
  const msgs = marketplaceStore.messages.get(req.params.bookingId) || [];
  return res.json({ success: true, data: msgs });
});

marketplaceRouter.post('/messages', (req: Request, res: Response) => {
  try {
    const { bookingId, senderId, senderName, senderRole, text } = req.body;
    if (!bookingId || !text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Booking ID and message text are required' });
    }

    const msgs = marketplaceStore.messages.get(bookingId) || [];
    const newMsg: BookingMessage = {
      id: 'msg_' + Date.now(),
      bookingId,
      senderId: senderId || 'user',
      senderName: senderName || 'User',
      senderRole: senderRole || 'customer',
      text: String(text).trim(),
      timestamp: new Date().toISOString(),
      isRead: false
    };

    msgs.push(newMsg);
    marketplaceStore.messages.set(bookingId, msgs);

    return res.status(201).json({ success: true, data: newMsg });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to send message' });
  }
});

// ==========================================
// 8. SUPPORT TICKETS
// ==========================================

marketplaceRouter.get('/support', (req: Request, res: Response) => {
  const { userId } = req.query;
  let tickets = Array.from(marketplaceStore.supportTickets.values());
  if (userId && typeof userId === 'string') {
    tickets = tickets.filter(t => t.userId === userId);
  }
  return res.json({ success: true, data: tickets });
});

marketplaceRouter.post('/support', (req: Request, res: Response) => {
  try {
    const { userId, userEmail, userName, userRole, subject, category, priority, description, bookingId } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ success: false, error: 'Subject and description are required' });
    }

    const ticketId = 'tkt_' + Date.now();
    const newTicket: SupportTicket = {
      id: ticketId,
      userId: userId || 'user_guest',
      userEmail: userEmail || 'user@example.com',
      userName: userName || 'User',
      userRole: userRole || 'customer',
      subject: String(subject).trim(),
      category: category || 'General',
      priority: priority || 'medium',
      status: 'open',
      bookingId: bookingId || undefined,
      messages: [
        {
          sender: userName || 'User',
          text: String(description).trim(),
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    marketplaceStore.supportTickets.set(ticketId, newTicket);
    return res.status(201).json({ success: true, data: newTicket });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to create support ticket' });
  }
});

// ==========================================
// 9. ADMIN METRICS
// ==========================================

marketplaceRouter.get('/admin/metrics', (req: Request, res: Response) => {
  try {
    const metrics = marketplaceStore.getAdminMetrics();
    return res.json({ success: true, data: metrics });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Failed to fetch admin metrics' });
  }
});

// ==========================================
// 10. NOTIFICATIONS
// ==========================================

marketplaceRouter.get('/notifications/:userId', (req: Request, res: Response) => {
  const notifs = marketplaceStore.notifications.get(req.params.userId) || [];
  return res.json({ success: true, data: notifs });
});

marketplaceRouter.put('/notifications/:userId/read', (req: Request, res: Response) => {
  const notifs = marketplaceStore.notifications.get(req.params.userId) || [];
  notifs.forEach(n => { n.isRead = true; });
  marketplaceStore.notifications.set(req.params.userId, notifs);
  return res.json({ success: true, message: 'All notifications marked as read' });
});
