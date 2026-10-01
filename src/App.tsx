/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Tractor, Search, MapPin, Calendar, Star, DollarSign, IndianRupee, Wrench, Menu, X, ChevronRight, CheckCircle2, ShieldCheck, MessageSquare, Download, Heart, AlertCircle, Sparkles, UserCheck, BarChart3, Eye, EyeOff, Lock, Mail, User as UserIcon, KeyRound, RotateCw, ArrowLeft, Database, Terminal, LogOut, FileText, Check, Clock, Bookmark, TrendingUp, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from './lib/firebase';
import { CalendarPicker } from './components/CalendarPicker';
import { RentalEarningsDashboard } from './components/RentalEarningsDashboard';
import { UserProfileModal } from './components/UserProfileModal';
import { PasswordRequirementsIndicator } from './components/PasswordRequirementsIndicator';
import { generateRentalReceiptPDF } from './lib/pdfReceipt';
import { getSavedSession, saveSession, clearSession, registerManualUser, loginManualUser, resetPasswordManualUser, loginAsGoogleUser, requestVerificationCode, verifyCode, checkUserExists, clearAllWebsiteDataAndLogins, updateManualUserProfile, validateStrongPassword } from './lib/manualAuth';
import { resolveEquipmentImage, handleImageError, DEFAULT_CATEGORY_IMAGES } from './lib/equipmentImages';
import { apiFetch } from './lib/api';

export interface Equipment {
  id: number;
  name: string;
  category: string;
  price: number;
  location: string;
  address?: string;
  owner: string;
  ownerId?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  rating: number;
  image: string;
  description: string;
}

const INITIAL_EQUIPMENT: Equipment[] = [
  { 
    id: 1, 
    name: "John Deere 5050D Tractor", 
    category: "Tractors", 
    price: 4200, 
    location: "Springfield Farm, 5 miles away", 
    address: "Plot 14, Springfield Agro Yard, Near GT Canal Road, District 4",
    owner: "Robert K.", 
    ownerId: "seed_robert", 
    ownerPhone: "+91 98251 44102",
    ownerEmail: "robert.k@springfieldfarm.com",
    rating: 4.8, 
    image: DEFAULT_CATEGORY_IMAGES.Tractors, 
    description: "Reliable 50 HP tractor suitable for heavy tillage and haulage. Well maintained and regularly serviced." 
  },
  { 
    id: 2, 
    name: "Heavy Duty Disc Harrow", 
    category: "Tillage", 
    price: 1700, 
    location: "Miller's Ranch, 12 miles away", 
    address: "Miller's Agricultural Yard, North Canal Bypass, Sector 9",
    owner: "Sarah M.", 
    ownerId: "seed_sarah", 
    ownerPhone: "+91 98762 11093",
    ownerEmail: "sarah.m@farms.in",
    rating: 4.5, 
    image: DEFAULT_CATEGORY_IMAGES.Tillage, 
    description: "Perfect for breaking up virgin land and chopping up crop residue." 
  },
  { 
    id: 3, 
    name: "Combine Harvester S700", 
    category: "Harvesters", 
    price: 16500, 
    location: "Oakhaven Fields, 8 miles away", 
    address: "Oakhaven Fields, Agro Complex 3, Highway 27 Junction",
    owner: "Jim B.", 
    ownerId: "seed_jim", 
    ownerPhone: "+91 94280 55431",
    ownerEmail: "jim.b@harvesters.in",
    rating: 4.9, 
    image: DEFAULT_CATEGORY_IMAGES.Harvesters, 
    description: "High-capacity automated combine harvester. Excellent for large-scale wheat and corn harvesting." 
  },
  { 
    id: 4, 
    name: "Precision Seed Drill", 
    category: "Seeding", 
    price: 2900, 
    location: "Pine Valley, 3 miles away", 
    address: "Pine Valley Agro Depot, Village Rampur Post",
    owner: "Elena W.", 
    ownerId: "seed_elena", 
    ownerPhone: "+91 99042 77819",
    ownerEmail: "elena.w@agri.in",
    rating: 4.7, 
    image: DEFAULT_CATEGORY_IMAGES.Seeding, 
    description: "Ensures uniform seed placement at precise depths. Greatly improves germination rates." 
  },
  { 
    id: 5, 
    name: "Portable Irrigation Pump", 
    category: "Irrigation", 
    price: 1250, 
    location: "Riverdale Farms, 6 miles away", 
    address: "Riverdale Pump House, Canal Gate 4, East Bank",
    owner: "Tom H.", 
    ownerId: "seed_tom", 
    ownerPhone: "+91 97123 88904",
    ownerEmail: "tom.h@irrigation.in",
    rating: 4.2, 
    image: DEFAULT_CATEGORY_IMAGES.Irrigation, 
    description: "Gas-powered portable water pump. Moves up to 500 gallons per minute." 
  },
  { 
    id: 6, 
    name: "Compact Utility Tractor", 
    category: "Tractors", 
    price: 3300, 
    location: "Green Acres, 2 miles away", 
    address: "Green Acres Farmstead, Ring Road East, Near Agro Mandi",
    owner: "Lisa T.", 
    ownerId: "seed_lisa", 
    ownerPhone: "+91 98980 23456",
    ownerEmail: "lisa.t@farmland.in",
    rating: 4.6, 
    image: DEFAULT_CATEGORY_IMAGES.All, 
    description: "Versatile compact tractor ideal for small farms, landscaping, and loader work." 
  },
];

const CATEGORIES = ["All", "Tractors", "Harvesters", "Tillage", "Seeding", "Irrigation"];

export type RentalStatus = 'pending' | 'accepted' | 'active' | 'completed' | 'declined' | 'cancelled';
export interface Rental {
  id: string;
  equipment: Equipment;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: RentalStatus;
  hasReviewed?: boolean;
  userId?: string;
  userEmail?: string;
  renterName?: string;
  renterPhone?: string;
  ownerId?: string;
  ownerName?: string;
  createdAt?: string;
  acceptedAt?: string;
}
type Review = { id: string; equipmentId: number; rating: number; text: string; author: string; date: string; userId?: string };

interface AppUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  phone?: string | null;
  address?: string | null;
  photoURL?: string | null;
  role?: 'customer' | 'owner' | 'admin';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'browse' | 'rentals' | 'saved' | 'earnings'>('browse');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [user, setUser] = useState<AppUserProfile | null>(() => {
    try {
      const saved = getSavedSession();
      if (saved) return saved;
      return null;
    } catch {
      return null;
    }
  });
  const isSignedIn = !!user;
  const [isLoading, setIsLoading] = useState(true);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form');
  const [pendingSignupData, setPendingSignupData] = useState<{ name: string; email: string; password: string; role?: 'customer' | 'owner' | 'admin' } | null>(null);
  const [pendingResetData, setPendingResetData] = useState<{ email: string; newPassword: string } | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [bookedRentalNotice, setBookedRentalNotice] = useState<Rental | null>(null);
  const [modalSelectedDates, setModalSelectedDates] = useState<{ start: string; end: string; days: number }>({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    days: 3
  });
  const [renterNameInput, setRenterNameInput] = useState('');
  const [renterPhoneInput, setRenterPhoneInput] = useState('');
  const [rentalError, setRentalError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState<'default' | 'price-asc' | 'price-desc' | 'rating'>('default');
  const [rentalFilter, setRentalFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  // Currency exchange and formatting
  const EXCHANGE_RATE = 83; // 1 USD ≈ 83 INR
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const formatCurrency = (amountInINR: number, showDecimal = false) => {
    if (currency === 'USD') {
      const usd = amountInINR / EXCHANGE_RATE;
      return `$${showDecimal ? usd.toFixed(2) : Math.round(usd).toLocaleString('en-US')}`;
    }
    return `₹${showDecimal ? amountInINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Math.round(amountInINR).toLocaleString('en-IN')}`;
  };

  const formatAmountOnly = (amountInINR: number, showDecimal = false) => {
    if (currency === 'USD') {
      const usd = amountInINR / EXCHANGE_RATE;
      return showDecimal ? usd.toFixed(2) : Math.round(usd).toLocaleString('en-US');
    }
    return showDecimal ? amountInINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Math.round(amountInINR).toLocaleString('en-IN');
  };

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [activeTab, selectedCategory, rentalFilter, searchQuery, sortOption]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Restore the local session and load all application data from the Render/MongoDB API.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !getSavedSession()) {
        setUser({
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || "Farmer",
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          isDemo: false
        });
        setShowAuthPage(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadEquipment = async () => {
      try {
        const result = await apiFetch<{ data: Equipment[] }>('/api/app/equipment');
        const items = (result.data || []).map(item => ({ ...item, image: resolveEquipmentImage(item.image, item.category) }));
        setEquipmentList(items.length ? items : INITIAL_EQUIPMENT);
      } catch (error) {
        console.warn('MongoDB equipment load note:', error);
        setEquipmentList(INITIAL_EQUIPMENT);
      }
    };
    loadEquipment();
  }, []);

  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [savedEquipmentIds, setSavedEquipmentIds] = useState<number[]>([]);
  const [reviews, setReviews] = useState<Review[]>([
    { id: 'r1', equipmentId: 1, rating: 5, text: "Great tractor, handled the field perfectly and was very fuel efficient. Easy to operate.", author: "Sarah M.", date: "2026-08-15" },
    { id: 'r2', equipmentId: 1, rating: 4, text: "Good condition, pick up was easy. A bit dusty but runs well.", author: "Tom H.", date: "2026-09-02" }
  ]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load rentals, reviews and saved items from MongoDB.
  useEffect(() => {
    const loadData = async () => {
      try {
        const userId = user?.uid ? `?userId=${encodeURIComponent(user.uid)}` : '';
        const [rentalsRes, reviewsRes, savedRes] = await Promise.all([
          apiFetch<{ data: Rental[] }>(`/api/app/rentals${userId}`),
          apiFetch<{ data: Review[] }>('/api/app/reviews'),
          apiFetch<{ data: { equipmentId: string }[] }>(`/api/app/saved${userId}`)
        ]);
        setRentals((rentalsRes.data || []) as Rental[]);
        if (reviewsRes.data?.length) setReviews(reviewsRes.data.map((r: any) => ({ ...r, equipmentId: Number(r.equipmentId) })) as Review[]);
        setSavedEquipmentIds((savedRes.data || []).map(x => Number(x.equipmentId)));
      } catch (error) {
        console.warn('MongoDB data load note:', error);
      }
    };
    loadData();
  }, [user?.uid]);

  const [reviewModalRental, setReviewModalRental] = useState<Rental | null>(null);
  const [receiptModalRental, setReceiptModalRental] = useState<Rental | null>(null);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingValue, setRatingValue] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const filteredRentals = rentals.filter(r => {
    if (rentalFilter === 'all') return true;
    if (rentalFilter === 'pending') return r.status === 'pending';
    if (rentalFilter === 'accepted') return r.status === 'accepted' || r.status === 'active';
    if (rentalFilter === 'completed') return r.status === 'completed';
    return r.status === rentalFilter;
  });

  const filteredEquipment = [...equipmentList].filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase()) || eq.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || eq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortOption === 'price-asc') return a.price - b.price;
    if (sortOption === 'price-desc') return b.price - a.price;
    if (sortOption === 'rating') return b.rating - a.rating;
    return 0;
  });

  const handleRent = async (
    equipment: Equipment, 
    startDate: string, 
    endDate: string,
    renterInfo?: { name?: string; phone?: string; email?: string }
  ) => {
    const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
    const rawDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const days = Math.max(1, rawDays <= 0 ? 1 : rawDays);
    const rentalId = 'rent_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // If user is not yet logged in, auto-initialize an active farmer session so they never get thrown to a login wall
    let currentUserProfile = user;
    if (!currentUserProfile) {
      const chosenName = renterInfo?.name?.trim() || "Farmer Renter";
      const cleanEmail = renterInfo?.email?.trim() || `${chosenName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'farmer'}@agrishare.in`;
      const guestProfile: AppUserProfile = {
        uid: 'farmer_' + Date.now(),
        displayName: chosenName,
        email: cleanEmail,
        phone: renterInfo?.phone || null,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(chosenName)}&backgroundColor=15803d`,
        role: 'customer'
      };
      currentUserProfile = guestProfile;
      setUser(guestProfile);
      saveSession(guestProfile as any);
      setAuthNotice(`Profile saved: ${chosenName}`);
    }

    const newRental: Rental = {
      id: rentalId,
      equipment,
      startDate,
      endDate,
      totalCost: equipment.price * days,
      status: 'pending', // Goes to pending option until owner accepts it!
      hasReviewed: false,
      userId: currentUserProfile.uid,
      userEmail: currentUserProfile.email || 'farmer@agrishare.in',
      renterName: renterInfo?.name || currentUserProfile.displayName || 'Farmer Renter',
      renterPhone: renterInfo?.phone || currentUserProfile.phone || '',
      ownerId: equipment.ownerId || 'seed_robert',
      ownerName: equipment.owner,
      createdAt: new Date().toISOString()
    };

    setRentals(prev => [newRental, ...prev]);

    try {
      await apiFetch('/api/app/rentals', {
        method: 'POST',
        body: JSON.stringify({
          ...newRental,
          equipmentId: equipment.id.toString(),
          equipmentName: equipment.name,
          userEmail: currentUserProfile.email || 'farmer@agrishare.in',
          userName: newRental.renterName,
          renterPhone: newRental.renterPhone,
          ownerId: newRental.ownerId,
          ownerName: newRental.ownerName
        })
      });
    } catch (error) {
      console.warn('Persisting rental to MongoDB note:', error);
    }

    setSelectedEquipment(null);
    setRentalError('');
    setBookedRentalNotice(newRental);
  };

  const handleAcceptRental = async (rentalId: string) => {
    const acceptedAt = new Date().toISOString();
    setRentals(prev => prev.map(r => 
      r.id === rentalId ? { ...r, status: 'accepted' as const, acceptedAt } : r
    ));
    setAuthNotice("Rental booking accepted! Booking confirmed and official PDF receipt is ready.");
    try {
      await apiFetch(`/api/app/rentals/${encodeURIComponent(rentalId)}`, {
        method: 'PATCH', body: JSON.stringify({ status: 'accepted', acceptedAt })
      });
    } catch (error) {
      console.warn("Updating rental to accepted in Firestore note:", error);
    }
  };

  const handleDeclineRental = async (rentalId: string) => {
    setRentals(prev => prev.map(r => 
      r.id === rentalId ? { ...r, status: 'declined' as const } : r
    ));
    setAuthNotice("Rental request declined.");
    try {
      await apiFetch(`/api/app/rentals/${encodeURIComponent(rentalId)}`, {
        method: 'PATCH', body: JSON.stringify({ status: 'declined' })
      });
    } catch (error) {
      console.warn("Updating rental to declined in Firestore note:", error);
    }
  };

  const handleDownloadReceipt = (rental: Rental) => {
    try {
      generateRentalReceiptPDF({
        id: rental.id,
        equipment: {
          id: rental.equipment.id,
          name: rental.equipment.name,
          category: rental.equipment.category,
          price: rental.equipment.price,
          location: rental.equipment.location,
          owner: rental.equipment.owner,
          description: rental.equipment.description
        },
        startDate: rental.startDate,
        endDate: rental.endDate,
        totalCost: rental.totalCost,
        status: rental.status,
        renterName: rental.renterName || user?.displayName || 'Farmer Renter',
        renterPhone: rental.renterPhone || user?.phone || '',
        renterEmail: rental.userEmail || user?.email || '',
        currency: currency,
        exchangeRate: EXCHANGE_RATE,
        bookingDate: rental.createdAt ? rental.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
      });
      setAuthNotice(`Official PDF Receipt downloaded for #${rental.id.slice(-6).toUpperCase()}`);
    } catch (err) {
      console.warn('PDF Receipt download warning:', err);
    }
  };

  const markAsCompleted = async (rentalId: string) => {
    setRentals(rentals.map(r => r.id === rentalId ? { ...r, status: 'completed' } : r));
    try {
      await apiFetch(`/api/app/rentals/${encodeURIComponent(rentalId)}`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) });
    } catch (error) {
      console.warn('Updating rental to completed note:', error);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalRental || ratingValue === 0) return;

    const reviewerName = user?.displayName || "Verified Farmer";
    const reviewerId = user?.uid || 'farmer_reviewer';
    const reviewId = 'rev_' + Date.now();
    const newReview: Review = {
      id: reviewId,
      equipmentId: reviewModalRental.equipment.id,
      rating: ratingValue,
      text: reviewText || "Excellent equipment, handled field work smoothly.",
      author: reviewerName,
      date: new Date().toISOString().split('T')[0],
      userId: reviewerId
    };

    setReviews(prev => [newReview, ...prev]);
    setRentals(rentals.map(r => r.id === reviewModalRental.id ? { ...r, hasReviewed: true } : r));

    try {
      await apiFetch('/api/app/reviews', { method: 'POST', body: JSON.stringify({ ...newReview, bookingId: reviewModalRental.id, createdAt: new Date().toISOString() }) });
      await apiFetch(`/api/app/rentals/${encodeURIComponent(reviewModalRental.id)}`, { method: 'PATCH', body: JSON.stringify({ hasReviewed: true }) });
    } catch (error) {
      console.warn('Persisting review note:', error);
    }

    setReviewModalRental(null);
    setRatingValue(0);
    setReviewText("");
  };

  const toggleSaveEquipment = async (equipmentId: number) => {
    const isSaved = savedEquipmentIds.includes(equipmentId);
    const userId = user?.uid || 'local_guest';

    if (isSaved) {
      setSavedEquipmentIds(prev => prev.filter(id => id !== equipmentId));
      try {
        await apiFetch(`/api/app/saved/${encodeURIComponent(userId)}/${equipmentId}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Removing saved item note:', e);
      }
    } else {
      setSavedEquipmentIds(prev => [...prev, equipmentId]);
      try {
        await apiFetch(`/api/app/saved/${encodeURIComponent(userId)}/${equipmentId}`, { method: 'PUT' });
      } catch (e) {
        console.warn('Persisting saved item note:', e);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.warn("Sign-out note:", e);
    }
    clearSession();
    setUser(null);
    setIsProfileModalOpen(false);
    setAuthMode('login');
    setAuthEmail('');
    setActiveTab('browse');
    setAuthNotice('You have been signed out.');
  };

  const handleUpdateUser = (updatedProfile: any) => {
    setUser(updatedProfile);
    setAuthNotice(`Profile updated successfully! Welcome, ${updatedProfile.displayName || updatedProfile.email}.`);
  };

  const handleClearDatabaseAndLogins = async () => {
    try {
      // Purge MongoDB application data through the authenticated admin endpoint.
      await apiFetch('/api/system/clear-database', { method: 'POST' });

      // Clear all stored local sessions, accounts, and auth tokens
      clearAllWebsiteDataAndLogins();
      try {
        if (auth.currentUser) {
          await firebaseSignOut(auth);
        }
      } catch {}

      // 4. Reset component states
      setUser(null);
      setRentals([]);
      setReviews([]);
      setSavedEquipmentIds([]);
      setIsProfileModalOpen(false);
      setActiveTab('browse');
      setAuthNotice('✨ Database wiped clean and all logins cleared! Fresh start ready.');
    } catch (err: any) {
      console.warn('Purge error:', err);
      clearAllWebsiteDataAndLogins();
      setUser(null);
      setIsProfileModalOpen(false);
      setAuthNotice('Local data and logins cleared.');
    }
  };

  const handleManualAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');
    setIsSubmittingAuth(true);

    const formData = new FormData(e.currentTarget);
    const identifier = ((formData.get('email') as string) || authEmail || '').trim();
    const password = ((formData.get('password') as string) || authPassword || '').trim();
    const fullName = ((formData.get('name') as string) || '').trim();

    if (!identifier) {
      setAuthError('Please enter your email address or mobile number.');
      setIsSubmittingAuth(false);
      return;
    }

    if (authMode === 'signup' || authMode === 'reset') {
      const validation = validateStrongPassword(password);
      if (!validation.isValid) {
        setAuthError(`Password requirements not met: ${validation.errors.join(' • ')}`);
        setIsSubmittingAuth(false);
        return;
      }
    } else {
      if (!password || password.length < 4) {
        setAuthError('Please enter a valid password.');
        setIsSubmittingAuth(false);
        return;
      }
    }

    try {
      if (authMode === 'reset') {
        // Step 1: Check if the user exists
        const userExists = await checkUserExists(identifier);
        if (!userExists) {
          setAuthError(`No registered account found with "${identifier}". Please create an account or verify your email.`);
          setIsSubmittingAuth(false);
          return;
        }

        // Step 2: Request 6-digit confirmation code via Gmail SMTP
        const res = await requestVerificationCode(identifier, undefined, 'reset');
        setPendingResetData({
          email: identifier,
          newPassword: password
        });
        setSignupStep('otp');
        setOtpInput('');
        setResendCooldown(60);
        setAuthNotice(res.message || `A 6-digit password reset verification code was sent to your Gmail inbox (${identifier}). Please check your inbox and enter the code below.`);
      } else if (authMode === 'signup') {
        // Step 1: Check if the user is already registered (forbid duplicate registration)
        const alreadyRegistered = await checkUserExists(identifier);
        if (alreadyRegistered) {
          setAuthError(`An account is already registered with "${identifier}". You cannot register again with this email/phone. Please sign in instead.`);
          setIsSubmittingAuth(false);
          return;
        }

        // Step 2: Request 6-digit confirmation code via email to prevent fake & bot accounts
        const res = await requestVerificationCode(identifier, fullName, 'signup');
        setPendingSignupData({
          name: fullName || identifier.split('@')[0],
          email: identifier,
          password: password,
          role: 'customer'
        });
        setSignupStep('otp');
        setOtpInput('');
        setResendCooldown(60);
        setAuthNotice(res.message || `A 6-digit confirmation code was sent to your Gmail inbox (${identifier}). Please check your inbox and enter the code below.`);
      } else {
        // Direct sign-in flow: verifies credentials directly without email confirmation
        const userProfile = await loginManualUser(identifier, password);
        setUser(userProfile as any);
        saveSession(userProfile as any);
        setShowAuthPage(false);
        setAuthNotice(`Signed in successfully as ${userProfile.displayName || userProfile.email}.`);
        if (userProfile.role === 'owner' || userProfile.displayName?.toLowerCase().includes('robert')) {
          setActiveTab('earnings');
        }
      }
    } catch (err: any) {
      console.warn("Auth error:", err);
      setAuthError(err.message || 'Could not complete sign in. Please verify your details.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingSignupData) {
      setSignupStep('form');
      return;
    }

    const cleanOtp = otpInput.trim().replace(/\D/g, '');
    if (!cleanOtp || cleanOtp.length < 6) {
      setAuthError('Please enter the full 6-digit verification code sent to your email.');
      return;
    }

    setIsVerifyingOtp(true);
    setAuthError('');
    setAuthNotice('');

    try {
      const isVerified = await verifyCode(pendingSignupData.email, cleanOtp);
      if (!isVerified) {
        setAuthError('Invalid or expired verification code. Please check your Gmail inbox or click Resend Code.');
        setIsVerifyingOtp(false);
        return;
      }

      // Code verified! Finalize account registration in Firestore & Local storage
      const newUser = await registerManualUser(
        pendingSignupData.name,
        pendingSignupData.email,
        pendingSignupData.password,
        pendingSignupData.role
      );

      setUser(newUser as any);
      saveSession(newUser as any);
      setShowAuthPage(false);
      setSignupStep('form');
      setPendingSignupData(null);
      setOtpInput('');
      setAuthNotice(`🎉 Email confirmed! Welcome to AgriShare, ${newUser.displayName || 'Farmer'}!`);
    } catch (err: any) {
      console.warn("Registration completion error:", err);
      setAuthError(err.message || 'Failed to complete registration. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleVerifyOtpAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingResetData) {
      setSignupStep('form');
      return;
    }

    const cleanOtp = otpInput.trim().replace(/\D/g, '');
    if (!cleanOtp || cleanOtp.length < 6) {
      setAuthError('Please enter the full 6-digit verification code sent to your email.');
      return;
    }

    setIsVerifyingOtp(true);
    setAuthError('');
    setAuthNotice('');

    try {
      const isVerified = await verifyCode(pendingResetData.email, cleanOtp);
      if (!isVerified) {
        setAuthError('Invalid or expired verification code. Please check your Gmail inbox or click Resend Code.');
        setIsVerifyingOtp(false);
        return;
      }

      // Code verified! Finalize password reset
      const userProfile = await resetPasswordManualUser(pendingResetData.email, pendingResetData.newPassword);
      setUser(userProfile as any);
      saveSession(userProfile as any);
      setShowAuthPage(false);
      setAuthMode('login');
      setSignupStep('form');
      setPendingResetData(null);
      setOtpInput('');
      setAuthNotice(`🎉 Password reset successfully! Logged in as ${userProfile.displayName || userProfile.email}.`);
    } catch (err: any) {
      console.warn("Password reset error:", err);
      setAuthError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    const isReset = authMode === 'reset';
    const targetEmail = isReset ? pendingResetData?.email : pendingSignupData?.email;
    const targetName = isReset ? undefined : pendingSignupData?.name;
    if (!targetEmail || resendCooldown > 0) return;
    setIsResendingOtp(true);
    setAuthError('');
    setAuthNotice('');
    try {
      const res = await requestVerificationCode(targetEmail, targetName, isReset ? 'reset' : 'signup');
      setResendCooldown(60);
      setAuthNotice(res.message || `A new 6-digit verification code was dispatched to your Gmail inbox (${targetEmail}). Please check your inbox and spam folder.`);
    } catch (err: any) {
      setAuthError('Could not resend verification code. Please try again.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  const eqReviews = selectedEquipment ? reviews.filter(r => r.equipmentId === selectedEquipment.id) : [];
  const displayRating = eqReviews.length > 0 ? (eqReviews.reduce((sum, r) => sum + r.rating, 0) / eqReviews.length).toFixed(1) : selectedEquipment?.rating;

  const ownerEquipment = selectedOwner ? equipmentList.filter(eq => eq.owner === selectedOwner) : [];
  const ownerAvgRating = ownerEquipment.length > 0 
    ? (ownerEquipment.reduce((acc, eq) => acc + eq.rating, 0) / ownerEquipment.length).toFixed(1)
    : "0.0";

  if (showAuthPage) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row font-sans">
        {/* Left side visual */}
        <div className="hidden md:block md:w-1/2 lg:w-3/5 relative">
          <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80" alt="Farm Equipment" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-green-900/70 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent"></div>
          
          <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
            <div className="flex items-center gap-2 text-2xl font-black tracking-tight cursor-pointer" onClick={() => setShowAuthPage(false)}>
              <Tractor size={32} className="text-green-400" />
              <span>FarmShare</span>
            </div>
            <div className="max-w-xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Quality farm equipment, shared locally.</h1>
              <p className="text-green-50 text-lg md:text-xl font-medium max-w-md opacity-90">Join the community of farmers renting and sharing tractors, harvesters, and more to grow better together.</p>
            </div>
          </div>
        </div>
        
        {/* Right side form */}
        <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-6 sm:p-12 bg-white relative min-h-screen shadow-2xl z-10">
          <button 
            onClick={() => setShowAuthPage(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
          
          <div className="w-full max-w-sm">
            {/* Logo for mobile */}
            <div className="md:hidden flex items-center gap-2 text-2xl font-black tracking-tight text-green-800 mb-8 cursor-pointer" onClick={() => setShowAuthPage(false)}>
              <Tractor size={28} className="text-green-600" />
              <span>FarmShare</span>
            </div>

            <div className="mb-6">
              <h2 className="text-3xl font-black text-stone-900 mb-2">
                {authMode === 'reset'
                  ? (signupStep === 'otp' ? 'Verify Reset Code' : 'Reset Your Password')
                  : authMode === 'signup' && signupStep === 'otp'
                    ? 'Verify Email Code'
                    : authMode === 'login' 
                      ? 'Farmer Sign In' 
                      : 'Create Farmer Account'}
              </h2>
              <p className="text-stone-500 text-sm">
                {authMode === 'reset'
                  ? (signupStep === 'otp'
                      ? `Enter the 6-digit confirmation code sent to ${pendingResetData?.email || 'your email'} to verify your identity and reset your password.`
                      : 'Enter your account email and choose a new password. A 6-digit verification code will be sent to your Gmail.')
                  : authMode === 'signup' && signupStep === 'otp'
                    ? `Enter the 6-digit confirmation code sent to ${pendingSignupData?.email || 'your email'} to verify your identity and prevent fake accounts.`
                    : authMode === 'login'
                      ? 'Enter your email or mobile number to sign in directly.'
                      : 'Register once with email verification to access machinery, post listings, and manage rentals.'}
              </p>
            </div>

            {/* Segmented Auth Mode Switcher */}
            {authMode === 'reset' ? (
              signupStep === 'otp' ? (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 mb-6">
                  <div className="flex items-center gap-2">
                    <KeyRound size={16} className="text-amber-700" />
                    <span className="text-xs text-amber-900 font-bold">Step 2 of 2: Verification Code</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSignupStep('form');
                      setAuthError('');
                      setAuthNotice('');
                    }}
                    className="text-xs text-stone-600 hover:text-stone-900 font-bold underline underline-offset-2 cursor-pointer"
                  >
                    Edit Info
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-stone-100 border border-stone-200 rounded-xl px-3.5 py-2.5 mb-6">
                  <span className="text-xs text-stone-700 font-bold">Password Reset Mode</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setSignupStep('form');
                      setPendingResetData(null);
                      setAuthError('');
                      setAuthNotice('');
                    }}
                    className="text-xs text-green-700 hover:text-green-900 font-bold flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              )
            ) : authMode === 'signup' && signupStep === 'otp' ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 mb-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-green-700" />
                  <span className="text-xs text-green-900 font-bold">Step 2 of 2: Email Verification</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSignupStep('form');
                    setAuthError('');
                    setAuthNotice('');
                  }}
                  className="text-xs text-stone-600 hover:text-stone-900 font-bold underline underline-offset-2 cursor-pointer"
                >
                  Edit Info
                </button>
              </div>
            ) : (
              <div className="flex bg-stone-100 p-1 rounded-2xl mb-6 border border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setSignupStep('form');
                    setPendingResetData(null);
                    setPendingSignupData(null);
                    setAuthError('');
                    setAuthNotice('');
                    setAuthPassword('');
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    authMode === 'login' 
                      ? 'bg-white text-stone-900 shadow-sm' 
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setSignupStep('form');
                    setPendingResetData(null);
                    setPendingSignupData(null);
                    setAuthError('');
                    setAuthNotice('');
                    setAuthPassword('');
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    authMode === 'signup' 
                      ? 'bg-white text-stone-900 shadow-sm' 
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Register
                </button>
              </div>
            )}

            {/* Error Alerts */}
            {authError && (
              <div className="mb-6 bg-amber-50 text-amber-950 p-4 rounded-2xl text-sm border border-amber-200/80 shadow-sm flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                  <div className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                    {authError}
                  </div>
                </div>

                {/* Helpful quick switch button for duplicate registration or missing account */}
                {authError.toLowerCase().includes('already registered') && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setSignupStep('form');
                      setPendingResetData(null);
                      setAuthError('');
                    }}
                    className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Click Here to Sign In with this Account</span>
                    <ChevronRight size={14} />
                  </button>
                )}

                {authError.toLowerCase().includes('no account found') && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setSignupStep('form');
                      setPendingResetData(null);
                      setAuthError('');
                    }}
                    className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Click Here to Register this Account</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            )}

            {authNotice && (
              <div className="mb-6 bg-green-50 text-green-950 p-4 rounded-2xl text-sm border border-green-200/80 shadow-sm flex items-start gap-2.5">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-600" />
                <span className="text-xs sm:text-sm font-medium">{authNotice}</span>
              </div>
            )}

            {/* OTP Confirmation Form for Registration & Password Reset */}
            {signupStep === 'otp' ? (
              <form onSubmit={authMode === 'reset' ? handleVerifyOtpAndResetPassword : handleVerifyOtpAndRegister} className="space-y-4 mb-6">
                <div className={`${authMode === 'reset' ? 'bg-amber-50/80 border-amber-200/90' : 'bg-green-50/80 border-green-200/90'} border rounded-2xl p-4 text-center`}>
                  <div className={`w-12 h-12 rounded-full ${authMode === 'reset' ? 'bg-amber-700' : 'bg-green-700'} text-white flex items-center justify-center mx-auto mb-2 shadow-xs`}>
                    {authMode === 'reset' ? <KeyRound size={22} /> : <Mail size={22} />}
                  </div>
                  <p className={`text-xs font-bold ${authMode === 'reset' ? 'text-amber-900' : 'text-green-900'} mb-0.5`}>
                    {authMode === 'reset' ? 'Password Reset Code Dispatched' : 'Confirmation Code Dispatched'}
                  </p>
                  <p className="text-xs text-stone-600 font-medium break-all">
                    {authMode === 'reset' ? pendingResetData?.email : pendingSignupData?.email}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <input 
                    type="text" 
                    maxLength={6}
                    autoFocus
                    required
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value.replace(/\D/g, ''));
                      setAuthError('');
                    }}
                    className={`w-full text-center tracking-[0.4em] font-mono text-2xl font-bold py-3.5 border-2 ${authMode === 'reset' ? 'border-amber-600 focus:ring-amber-500/20' : 'border-green-600 focus:ring-green-500/20'} bg-white rounded-2xl text-stone-900 focus:outline-none focus:ring-4 transition-all shadow-inner placeholder:text-stone-300`} 
                    placeholder="••••••" 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isVerifyingOtp || otpInput.trim().length < 6}
                  className={`w-full ${authMode === 'reset' ? 'bg-amber-700 hover:bg-amber-800' : 'bg-green-700 hover:bg-green-800'} disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer`}
                >
                  {isVerifyingOtp ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{authMode === 'reset' ? 'Verifying & Resetting Password...' : 'Verifying & Creating Account...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {authMode === 'reset' ? <KeyRound size={18} /> : <ShieldCheck size={18} />}
                      <span>{authMode === 'reset' ? 'Confirm Code & Reset Password' : 'Confirm Email & Complete Registration'}</span>
                    </div>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSignupStep('form');
                      setAuthError('');
                      setAuthNotice('');
                    }}
                    className="text-stone-500 hover:text-stone-800 font-medium underline underline-offset-2 cursor-pointer"
                  >
                    ← Edit Details
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isResendingOtp}
                    onClick={handleResendOtp}
                    className={`${authMode === 'reset' ? 'text-amber-800 hover:text-amber-900' : 'text-green-700 hover:text-green-800'} disabled:text-stone-400 font-bold underline underline-offset-2 cursor-pointer`}
                  >
                    {isResendingOtp ? 'Sending...' : resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Direct Email & Password Form */}
                <form onSubmit={handleManualAuthSubmit} className="space-y-4 mb-6">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Full Name</label>
                      <div className="relative">
                        <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input 
                          type="text" 
                          name="name" 
                          required 
                          defaultValue=""
                          className="w-full pl-10 pr-4 py-2.5 border border-stone-200 bg-stone-50 rounded-xl text-stone-900 font-medium placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-sm" 
                          placeholder="e.g. Ramesh Patel" 
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                      {authMode === 'login' ? 'Email Address or Mobile Number' : 'Email Address (Verification Code will be sent)'}
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input 
                        type="text" 
                        name="email" 
                        required 
                        value={authEmail}
                        onChange={(e) => {
                          setAuthEmail(e.target.value);
                          setAuthError('');
                        }}
                        className="w-full pl-10 pr-4 py-2.5 border border-stone-200 bg-stone-50 rounded-xl text-stone-900 font-medium placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-sm" 
                        placeholder="farmer@example.com or 9876543210" 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider">
                        {authMode === 'reset' ? 'Create New Strong Password' : authMode === 'signup' ? 'Create Strong Password' : 'Password'}
                      </label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('reset');
                            setSignupStep('form');
                            setPendingResetData(null);
                            setAuthError('');
                            setAuthNotice('');
                            setAuthPassword('');
                          }}
                          className="text-xs text-green-700 hover:text-green-800 font-semibold underline underline-offset-2 cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        required 
                        value={authPassword}
                        onChange={(e) => {
                          setAuthPassword(e.target.value);
                          setAuthError('');
                        }}
                        className="w-full pl-10 pr-10 py-2.5 border border-stone-200 bg-stone-50 rounded-xl text-stone-900 font-medium placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all text-sm" 
                        placeholder={authMode === 'login' ? "••••••••" : "e.g. Strong@Farm2026"} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-none cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Compulsory Live Requirements Checklist for creating and adding passwords */}
                    {(authMode === 'signup' || authMode === 'reset') && (
                      <PasswordRequirementsIndicator password={authPassword} showAlways={true} />
                    )}
                  </div>

                  {authMode === 'login' && (
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-stone-600 font-medium">
                        <input 
                          type="checkbox" 
                          defaultChecked 
                          className="rounded text-green-700 focus:ring-green-600 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>Remember me</span>
                      </label>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isSubmittingAuth}
                    className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-70 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmittingAuth ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>
                          {authMode === 'login' 
                            ? 'Signing in...' 
                            : 'Sending verification code...'}
                        </span>
                      </div>
                    ) : authMode === 'signup' ? (
                      <div className="flex items-center gap-2">
                        <Mail size={16} />
                        <span>Continue &amp; Verify Email Code</span>
                      </div>
                    ) : authMode === 'reset' ? (
                      <div className="flex items-center gap-2">
                        <Mail size={16} />
                        <span>Continue &amp; Verify Email Code</span>
                      </div>
                    ) : (
                      <span>Sign In to AgriShare</span>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-stone-400 font-bold tracking-wider">Or continue with</span>
                  </div>
                </div>

                <div className="space-y-2.5 mb-6">
                  {/* Google Sign In */}
                  <button 
                    type="button"
                    disabled={isSigningInWithGoogle}
                    onClick={async () => {
                      setAuthError('');
                      setAuthNotice('');
                      setIsSigningInWithGoogle(true);
                      try {
                        const result = await signInWithPopup(auth, googleProvider);
                        const gUser = result.user;
                        if (!gUser.email) throw new Error('Your Google account did not return an email address.');
                        const googleProfile = await loginAsGoogleUser(
                          gUser.email,
                          gUser.displayName || gUser.email.split('@')[0],
                          gUser.photoURL || undefined
                        );
                        setUser(googleProfile as any);
                        setShowAuthPage(false);
                      } catch (error: any) {
                        console.error("Google sign-in failed:", error?.code, error?.message);
                        const code = error?.code || '';
                        if (code === 'auth/unauthorized-domain') setAuthError('Google sign-in is not enabled for this website yet. Add this site\'s domain under Firebase > Authentication > Settings > Authorized domains.');
                        else if (code === 'auth/operation-not-allowed') setAuthError('Google sign-in is not enabled in Firebase. Enable the Google provider under Authentication > Sign-in method.');
                        else if (code === 'auth/popup-blocked') setAuthError('Your browser blocked the Google popup. Allow popups for this site and try again.');
                        else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') setAuthError('');
                        else setAuthError(error?.message || 'Google sign-in failed. Please try again.');
                      } finally {
                        setIsSigningInWithGoogle(false);
                      }
                    }}
                    className="w-full bg-white border border-stone-200 hover:border-stone-400 hover:bg-stone-50 text-stone-700 py-3 px-4 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2.5 active:scale-[0.99] cursor-pointer text-xs"
                  >
                    {isSigningInWithGoogle ? (
                      <div className="flex items-center gap-2 text-stone-600 text-xs">
                        <div className="w-4 h-4 border-2 border-stone-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Connecting to Google...</span>
                      </div>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                          </g>
                        </svg>
                        <span>Sign in with Google</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Switch mode bottom link */}
            <div className="text-center text-xs text-stone-500">
              <button 
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setSignupStep('form');
                  setAuthError('');
                  setAuthNotice('');
                }}
                className="text-green-700 hover:text-green-800 font-semibold underline underline-offset-2 cursor-pointer"
              >
                {authMode === 'login' ? "Don't have an account? Register free here" : 'Already registered? Sign in here'}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100 text-center text-xs text-stone-400">
              AgriShare Farm Portal • Fast direct sign-in for farmers
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('browse')}>
              <div className="bg-green-700 p-2 rounded-lg text-white">
                <Tractor size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight text-green-900">AgriShare</span>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => setActiveTab('browse')}
                className={`font-medium transition-colors ${activeTab === 'browse' ? 'text-green-700' : 'text-stone-600 hover:text-stone-900'}`}
              >
                Browse Equipment
              </button>
              
              <button 
                onClick={() => setActiveTab('rentals')}
                className={`font-medium transition-colors ${activeTab === 'rentals' ? 'text-green-700 font-bold' : 'text-stone-600 hover:text-stone-900'}`}
              >
                My Rentals
                {rentals.length > 0 && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    {rentals.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('saved')}
                className={`font-medium transition-colors ${activeTab === 'saved' ? 'text-green-700 font-bold' : 'text-stone-600 hover:text-stone-900'}`}
              >
                Saved
                {savedEquipmentIds.length > 0 && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    {savedEquipmentIds.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('earnings')}
                className={`font-medium transition-colors flex items-center gap-1.5 ${activeTab === 'earnings' ? 'text-green-700 font-bold' : 'text-stone-600 hover:text-stone-900'}`}
                title="Owner Rental Earnings Dashboard"
              >
                <BarChart3 size={16} />
                <span>Rental Earnings</span>
              </button>
              <div className="w-px h-6 bg-stone-300"></div>
              <button 
                onClick={() => setListModalOpen(true)}
                className="text-stone-600 hover:text-stone-900 font-medium flex items-center gap-2 cursor-pointer"
              >
                List Your Tool
              </button>

              {/* Currency Selector */}
              <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs font-semibold">
                <button 
                  type="button"
                  onClick={() => setCurrency('INR')}
                  className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                    currency === 'INR' 
                      ? 'bg-green-700 text-white font-bold shadow-sm' 
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Display in Indian Rupees (₹)"
                >
                  <IndianRupee size={12} />
                  <span>INR</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                    currency === 'USD' 
                      ? 'bg-green-700 text-white font-bold shadow-sm' 
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Display in US Dollars ($)"
                >
                  <DollarSign size={12} />
                  <span>USD</span>
                </button>
              </div>

              {isSignedIn ? (
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 pl-2.5 py-1 pr-3 rounded-2xl hover:bg-stone-100 border border-stone-200 transition-all cursor-pointer group text-left shadow-2xs ml-1"
                  title="Open Account Profile & Settings"
                >
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || "Farmer"} className="w-8 h-8 rounded-full border border-green-600 object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 font-bold text-xs flex items-center justify-center border border-green-300 group-hover:bg-green-200 transition-colors">
                      {(user?.displayName || user?.email || "F").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-stone-800 max-w-[120px] truncate leading-tight group-hover:text-green-800">
                      {user?.displayName || user?.email?.split('@')[0] || "Farmer"}
                    </span>
                    <span className="text-[10px] text-stone-400 group-hover:text-green-700 font-medium">Profile</span>
                  </div>
                </button>
              ) : (
                <button 
                  onClick={() => setShowAuthPage(true)}
                  className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-full font-medium transition-colors shadow-sm cursor-pointer text-sm"
                >
                  Sign In
                </button>
              )}
            </nav>

            {/* Mobile Nav Toggle & Profile Preview */}
            <div className="flex items-center gap-2 md:hidden">
              <button 
                type="button"
                onClick={() => setCurrency(c => c === 'INR' ? 'USD' : 'INR')}
                className="px-2.5 py-1 bg-stone-100 border border-stone-200 rounded-lg text-xs font-bold text-stone-700 flex items-center gap-1 cursor-pointer"
                title="Toggle currency"
              >
                {currency === 'INR' ? <><IndianRupee size={12} className="text-green-700" /> INR</> : <><DollarSign size={12} className="text-green-700" /> USD</>}
              </button>

              {isSignedIn && (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="w-8 h-8 rounded-full bg-green-700 text-white font-bold text-xs flex items-center justify-center shadow-xs"
                >
                  {(user?.displayName || user?.email || "F").charAt(0).toUpperCase()}
                </button>
              )}

              <button 
                className="p-2 text-stone-600 hover:text-stone-900 cursor-pointer" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
          
          {/* Mobile Menu Drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden border-t border-stone-200 bg-white"
              >
                <div className="py-4 px-2 space-y-4 flex flex-col">
                  {/* Distinct User Profile Card */}
                  {isSignedIn && user ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full text-left bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-2xl p-4 shadow-xs transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full border-2 border-green-600 object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-green-700 text-white font-black text-lg flex items-center justify-center shadow-sm">
                            {(user.displayName || user.email || 'F').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-extrabold text-stone-900 text-sm truncate">
                              {user.displayName || 'Farmer Member'}
                            </h4>
                            <span className="text-[11px] text-green-700 font-bold underline">Edit Profile</span>
                          </div>
                          <p className="text-xs text-stone-500 truncate mt-0.5">
                            {user.email || user.phone || 'Verified Farmer'}
                          </p>
                          <span className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                            user.role === 'admin' 
                              ? 'bg-stone-900 text-amber-300' 
                              : user.role === 'owner' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-stone-200 text-stone-700'
                          }`}>
                            {user.role === 'admin' ? '🛡️ Platform Admin' : user.role === 'owner' ? '🌾 Machinery Owner' : '🚜 Farmer / Renter'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-green-950 text-sm">Welcome to AgriShare</h4>
                        <p className="text-xs text-green-800 mt-0.5">Sign in to book machines or list your equipment</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setShowAuthPage(true);
                        }}
                        className="bg-green-700 hover:bg-green-800 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs shrink-0 cursor-pointer"
                      >
                        Sign In
                      </button>
                    </div>
                  )}

                  {/* Navigation Links with Icons */}
                  <div className="space-y-1">
                    <button 
                      onClick={() => { setActiveTab('browse'); setMobileMenuOpen(false); }}
                      className={`w-full text-left font-medium px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                        activeTab === 'browse' ? 'bg-green-50 text-green-700 font-bold' : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <Tractor size={18} className={activeTab === 'browse' ? 'text-green-700' : 'text-stone-400'} />
                      <span>Browse Equipment</span>
                    </button>

                    <button 
                      onClick={() => { 
                        setMobileMenuOpen(false);
                        setActiveTab('rentals');
                      }}
                      className={`w-full text-left font-medium px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                        activeTab === 'rentals' ? 'bg-green-50 text-green-700 font-bold' : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={18} className={activeTab === 'rentals' ? 'text-green-700' : 'text-stone-400'} />
                        <span>My Rentals</span>
                      </div>
                      {rentals.length > 0 && (
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
                          {rentals.length}
                        </span>
                      )}
                    </button>

                    <button 
                      onClick={() => { 
                        setMobileMenuOpen(false);
                        setActiveTab('saved');
                      }}
                      className={`w-full text-left font-medium px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                        activeTab === 'saved' ? 'bg-green-50 text-green-700 font-bold' : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Bookmark size={18} className={activeTab === 'saved' ? 'text-green-700' : 'text-stone-400'} />
                        <span>Saved Items</span>
                      </div>
                      {savedEquipmentIds.length > 0 && (
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
                          {savedEquipmentIds.length}
                        </span>
                      )}
                    </button>

                    <button 
                      onClick={() => { 
                        setMobileMenuOpen(false);
                        setActiveTab('earnings');
                      }}
                      className={`w-full text-left font-medium px-3 py-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                        activeTab === 'earnings' ? 'bg-green-50 text-green-700 font-bold' : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <TrendingUp size={18} className={activeTab === 'earnings' ? 'text-green-700' : 'text-stone-400'} />
                      <span>Rental Earnings</span>
                    </button>

                    <button 
                      onClick={() => { 
                        setMobileMenuOpen(false);
                        setListModalOpen(true);
                      }}
                      className="w-full text-left font-medium px-3 py-2.5 rounded-xl text-stone-700 hover:bg-stone-100 flex items-center gap-3 transition-colors"
                    >
                      <Wrench size={18} className="text-stone-400" />
                      <span>List Your Tool</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'browse' ? (
            <motion.div 
              key="browse"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Hero Section */}
              <div className="bg-green-900 rounded-3xl overflow-hidden shadow-xl mb-12 relative">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-overlay"></div>
                <div className="relative z-10 px-6 py-16 md:py-24 md:px-12 max-w-3xl">
                  <span className="inline-block py-1 px-3 rounded-full bg-green-800 text-green-200 text-sm font-semibold mb-4 border border-green-700 backdrop-blur-sm">
                    Farmer-to-Farmer Rentals
                  </span>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                    Rent farm equipment <br className="hidden md:block" />
                    from locals, seamlessly.
                  </h1>
                  <p className="text-green-100 text-lg mb-8 max-w-xl leading-relaxed">
                    Improve harvest efficiency by borrowing heavy machinery and specialized tools from farmers in your community.
                  </p>
                  
                  {/* Search Bar */}
                  <div className="flex bg-white rounded-full p-2 shadow-lg max-w-xl focus-within:ring-4 focus-within:ring-green-500/30 transition-all">
                    <div className="flex-1 flex items-center px-4">
                      <Search className="text-stone-400 mr-2" size={20} />
                      <input 
                        type="text" 
                        placeholder="Search tractors, harvesters..." 
                        className="w-full bg-transparent border-none outline-none text-stone-800 placeholder:text-stone-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold transition-colors">
                      Search
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide flex-1">
                  {CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`whitespace-nowrap px-5 py-2.5 rounded-full font-medium transition-all ${
                        selectedCategory === category 
                          ? 'bg-green-700 text-white shadow-md' 
                          : 'bg-white text-stone-600 border border-stone-200 hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                
                <div className="flex-shrink-0">
                  <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="bg-white border border-stone-200 text-stone-700 py-2.5 px-4 rounded-full font-medium shadow-sm outline-none focus:ring-2 focus:ring-green-500/30 cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto', paddingRight: '2.5rem' }}
                  >
                    <option value="default">Sort: Default</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Rating</option>
                  </select>
                </div>
              </div>

              {/* Equipment Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={`skeleton-browse-${i}`} className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm flex flex-col h-[380px] animate-pulse">
                      <div className="h-56 bg-stone-200 w-full"></div>
                      <div className="p-5 flex-1 flex flex-col gap-3">
                        <div className="flex justify-between">
                          <div className="h-6 bg-stone-200 rounded w-2/3"></div>
                          <div className="h-6 bg-stone-200 rounded w-1/4"></div>
                        </div>
                        <div className="h-4 bg-stone-200 rounded w-1/2 mb-2"></div>
                        <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-stone-200"></div>
                            <div className="h-4 bg-stone-200 rounded w-20"></div>
                          </div>
                          <div className="h-8 bg-stone-200 rounded w-24"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : filteredEquipment.length > 0 ? (
                  filteredEquipment.map((eq, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      key={eq.id} 
                      className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition-all group flex flex-col"
                    >
                      <div className="relative h-56 overflow-hidden bg-stone-100">
                        <img 
                          src={resolveEquipmentImage(eq.image, eq.category)} 
                          alt={eq.name} 
                          onError={(e) => handleImageError(e, eq.category)}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-stone-800 shadow-sm flex items-center gap-1">
                          <Star className="text-amber-500 fill-amber-500" size={14} />
                          {eq.rating}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveEquipment(eq.id);
                          }}
                          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full text-stone-800 shadow-sm hover:bg-white transition-colors cursor-pointer"
                          title={savedEquipmentIds.includes(eq.id) ? "Remove from saved" : "Save equipment"}
                        >
                          <Heart size={18} className={savedEquipmentIds.includes(eq.id) ? "fill-red-500 text-red-500" : "text-stone-600"} />
                        </button>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-stone-900 leading-tight">{eq.name}</h3>
                          <div className="text-right">
                            <span className="font-bold text-green-700 text-xl">{formatCurrency(eq.price)}</span>
                            <span className="text-xs text-stone-500 block">/ day</span>
                          </div>
                        </div>
                        <div className="flex items-center text-stone-500 text-sm mb-4 gap-1">
                          <MapPin size={14} />
                          <span className="truncate">{eq.location}</span>
                        </div>
                        <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-sm">
                              {eq.owner.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-stone-700">{eq.owner}</span>
                          </div>
                          <button 
                            onClick={() => setSelectedEquipment(eq)}
                            className="text-green-700 font-semibold text-sm hover:text-green-800 flex items-center gap-1 bg-green-50 px-4 py-2 rounded-lg transition-colors"
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center text-stone-500">
                    <Wrench className="mx-auto h-12 w-12 text-stone-300 mb-4" />
                    <h3 className="text-lg font-medium text-stone-900 mb-1">No equipment found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'rentals' ? (
            <motion.div 
              key="rentals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-green-100 text-green-800 rounded-xl">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-stone-900">My Rentals</h2>
                  <p className="text-stone-500">Manage your active and past equipment rentals.</p>
                </div>
              </div>

              {rentals.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-8 bg-stone-100 p-1.5 rounded-xl w-fit">
                  {(['all', 'pending', 'accepted', 'completed'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setRentalFilter(filter)}
                      className={`px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-bold capitalize transition-all cursor-pointer ${
                        rentalFilter === filter
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'
                      }`}
                    >
                      {filter === 'all' ? 'All Rentals' : filter}
                    </button>
                  ))}
                </div>
              )}

              {isLoading ? (
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`skeleton-rental-${i}`} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center animate-pulse">
                      <div className="w-full md:w-48 h-32 bg-stone-200 rounded-xl"></div>
                      <div className="flex-1 w-full space-y-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="w-1/2 space-y-2">
                            <div className="h-6 bg-stone-200 rounded w-3/4"></div>
                            <div className="h-4 bg-stone-200 rounded w-1/2"></div>
                          </div>
                          <div className="w-20 h-6 bg-stone-200 rounded-full"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 bg-stone-50 p-4 rounded-xl border border-stone-100">
                          <div className="space-y-2">
                            <div className="h-3 bg-stone-200 rounded w-12"></div>
                            <div className="h-4 bg-stone-200 rounded w-full"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 bg-stone-200 rounded w-16"></div>
                            <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredRentals.length > 0 ? (
                <div className="space-y-6">
                  {filteredRentals.map(rental => (
                    <div key={rental.id} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-green-300 transition-colors">
                      <img 
                        src={resolveEquipmentImage(rental.equipment?.image, rental.equipment?.category)} 
                        alt={rental.equipment?.name || "Equipment"} 
                        onError={(e) => handleImageError(e, rental.equipment?.category)}
                        loading="lazy"
                        className="w-full md:w-48 h-32 object-cover rounded-xl bg-stone-100" 
                      />
                      <div className="flex-1 w-full">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-stone-900">{rental.equipment.name}</h3>
                            <span className="text-sm text-stone-500 flex items-center gap-1 mt-1"><MapPin size={14}/> {rental.equipment.location}</span>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {rental.status === 'pending' && (
                              <div className="flex flex-col items-end gap-1.5">
                                <span className="text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-xs">
                                  <Clock size={12} className="text-amber-700 animate-spin" />
                                  <span>Pending Approval</span>
                                </span>
                                <span className="text-[11px] text-amber-800 text-right max-w-[200px] leading-tight">
                                  Waiting for {rental.equipment.owner} to accept
                                </span>
                                {/* Owner action buttons if current user owns or is testing */}
                                {(user?.role === 'owner' || user?.role === 'admin' || rental.ownerId === user?.uid || user?.displayName?.toLowerCase() === rental.equipment.owner.toLowerCase()) && (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleAcceptRental(rental.id)}
                                      className="text-xs font-bold text-white bg-green-700 hover:bg-green-800 px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                    >
                                      <CheckCircle2 size={13} />
                                      <span>Accept Booking</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeclineRental(rental.id)}
                                      className="text-xs font-semibold text-stone-600 hover:text-red-700 bg-stone-100 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {(rental.status === 'accepted' || rental.status === 'active') && (
                              <div className="flex flex-col items-end gap-1.5">
                                <span className="text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                                  <CheckCircle2 size={12} className="text-emerald-700" />
                                  <span>Accepted &amp; Confirmed</span>
                                </span>
                                <button 
                                  type="button"
                                  onClick={() => handleDownloadReceipt(rental)} 
                                  className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                  title="Download official PDF receipt"
                                >
                                  <Download size={13} className="text-emerald-700" />
                                  <span>Download PDF Receipt</span>
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => markAsCompleted(rental.id)} 
                                  className="text-xs font-medium text-stone-500 hover:text-stone-800 underline cursor-pointer"
                                >
                                  Mark as Completed
                                </button>
                              </div>
                            )}

                            {rental.status === 'declined' && (
                              <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                                <XCircle size={12} />
                                <span>Declined</span>
                              </span>
                            )}

                            {rental.status === 'completed' && (
                              <div className="flex flex-col items-end gap-1.5">
                                <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide bg-stone-100 text-stone-700 border border-stone-200 flex items-center gap-1">
                                  <CheckCircle2 size={12} className="text-green-600" />
                                  <span>Completed</span>
                                </span>
                                <button 
                                  type="button"
                                  onClick={() => handleDownloadReceipt(rental)} 
                                  className="text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                                >
                                  <Download size={13} />
                                  <span>Download PDF Receipt</span>
                                </button>
                                {!rental.hasReviewed ? (
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      setReviewModalRental(rental);
                                      setRatingValue(0);
                                      setReviewText("");
                                    }} 
                                    className="text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Leave Review
                                  </button>
                                ) : (
                                  <span className="text-xs font-medium text-stone-400 flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Reviewed
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4 bg-stone-50 p-4 rounded-xl border border-stone-100">
                          <div>
                            <span className="text-xs text-stone-500 block mb-1">Dates</span>
                            <div className="font-medium text-stone-800 text-sm flex items-center gap-2">
                              <Calendar size={14} className="text-green-600"/>
                              {rental.startDate} <ChevronRight size={12} className="text-stone-400"/> {rental.endDate}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-stone-500 block mb-1">Total Cost</span>
                            <div className="font-bold text-stone-800 text-sm flex items-center">
                              {currency === 'INR' ? (
                                <IndianRupee size={14} className="text-green-600 mr-0.5 inline" />
                              ) : (
                                <DollarSign size={14} className="text-green-600 mr-0.5 inline" />
                              )}
                              {formatAmountOnly(rental.totalCost, currency === 'USD')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : rentals.length > 0 ? (
                <div className="bg-white border border-stone-200 border-dashed rounded-3xl p-16 text-center">
                  <h3 className="text-xl font-bold text-stone-900 mb-2">No {rentalFilter} rentals found</h3>
                  <p className="text-stone-500">Try changing your filter to view other rentals.</p>
                </div>
              ) : (
                <div className="bg-white border border-stone-200 border-dashed rounded-3xl p-16 text-center">
                  <div className="w-20 h-20 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Tractor size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-stone-900 mb-2">No active rentals</h3>
                  <p className="text-stone-500 mb-8 max-w-md mx-auto">You haven't rented any equipment yet. Browse the community portal to find what you need for your next harvest.</p>
                  <button 
                    onClick={() => setActiveTab('browse')}
                    className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                  >
                    <Search size={18} />
                    Browse Equipment
                  </button>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'saved' ? (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-stone-900 mb-2">Saved Items</h2>
                <p className="text-stone-500">Your wishlist of equipment for future rentals.</p>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`skeleton-saved-${i}`} className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm flex flex-col h-[380px] animate-pulse">
                      <div className="h-56 bg-stone-200 w-full"></div>
                      <div className="p-5 flex-1 flex flex-col gap-3">
                        <div className="flex justify-between">
                          <div className="h-6 bg-stone-200 rounded w-2/3"></div>
                          <div className="h-6 bg-stone-200 rounded w-1/4"></div>
                        </div>
                        <div className="h-4 bg-stone-200 rounded w-1/2 mb-2"></div>
                        <div className="mt-auto pt-4 border-t border-stone-100 flex items-center justify-between">
                          <div className="h-8 bg-stone-200 rounded w-20"></div>
                          <div className="h-10 bg-stone-200 rounded w-24"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : savedEquipmentIds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {equipmentList.filter(eq => savedEquipmentIds.includes(eq.id)).map((eq, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      key={eq.id} 
                      className="bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-sm hover:shadow-xl transition-all group flex flex-col"
                    >
                      <div className="relative h-56 overflow-hidden bg-stone-100">
                        <img 
                          src={resolveEquipmentImage(eq.image, eq.category)} 
                          alt={eq.name} 
                          onError={(e) => handleImageError(e, eq.category)}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-stone-800 shadow-sm flex items-center gap-1">
                          <Star className="text-amber-500 fill-amber-500" size={14} />
                          {eq.rating}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveEquipment(eq.id);
                          }}
                          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full text-stone-800 shadow-sm hover:bg-white transition-colors cursor-pointer"
                          title="Remove from saved"
                        >
                          <Heart size={18} className="fill-red-500 text-red-500" />
                        </button>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-stone-900 leading-tight">{eq.name}</h3>
                          <span className="bg-stone-100 text-stone-600 text-xs font-bold px-2 py-1 rounded-md">{eq.category}</span>
                        </div>
                        <p className="text-sm text-stone-500 flex items-center gap-1 mb-4"><MapPin size={14}/> {eq.location}</p>
                        
                        <div className="mt-auto flex items-end justify-between pt-4 border-t border-stone-100">
                          <div>
                            <span className="text-2xl font-black text-stone-900">{formatCurrency(eq.price)}</span>
                            <span className="text-sm text-stone-500">/day</span>
                          </div>
                          <button 
                            onClick={() => setSelectedEquipment(eq)}
                            className="bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                          >
                            Rent
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-stone-200 border-dashed rounded-3xl p-16 text-center">
                  <div className="w-20 h-20 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-stone-900 mb-2">No saved items</h3>
                  <p className="text-stone-500 mb-8 max-w-md mx-auto">Start browsing to save items you like for later.</p>
                  <button 
                    onClick={() => setActiveTab('browse')}
                    className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                  >
                    <Search size={18} />
                    Browse Equipment
                  </button>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'earnings' ? (
            <motion.div
              key="earnings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {isSignedIn && user ? (
                <RentalEarningsDashboard
                  user={user}
                  currency={currency}
                  exchangeRate={EXCHANGE_RATE}
                  equipmentList={equipmentList}
                  rentals={rentals}
                  onOpenListModal={() => setListModalOpen(true)}
                  onNavigateToBrowse={() => setActiveTab('browse')}
                  onAcceptRental={handleAcceptRental}
                  onDeclineRental={handleDeclineRental}
                />
              ) : (
                <div className="bg-white border border-stone-200 border-dashed rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm">
                  <div className="w-20 h-20 bg-green-50 text-green-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BarChart3 size={36} />
                  </div>
                  <h3 className="text-2xl font-bold text-stone-900 mb-2">Owner Sign-In Required</h3>
                  <p className="text-stone-500 mb-8 leading-relaxed">
                    Sign in to your machinery owner account to view your monthly rental revenue, booking requests, and equipment payout records.
                  </p>
                  <div className="flex items-center justify-center">
                    <button 
                      onClick={() => setShowAuthPage(true)}
                      className="bg-green-700 hover:bg-green-800 text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2 cursor-pointer text-base"
                    >
                      <UserIcon size={18} />
                      <span>Sign In to Owner Dashboard</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12 mt-20 pb-28 md:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <Tractor size={24} className="text-green-500" />
            <span className="text-xl font-bold tracking-tight">AgriShare</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} AgriShare Community. Empowering local farmers.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* Equipment Detail Modal */}
      <AnimatePresence>
        {selectedEquipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEquipment(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedEquipment(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-stone-800 hover:bg-white shadow-sm transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/2 border-r border-stone-100 flex flex-col">
                  <div className="h-64 md:h-80 relative shrink-0 bg-stone-100">
                    <img 
                      src={resolveEquipmentImage(selectedEquipment.image, selectedEquipment.category)} 
                      alt={selectedEquipment.name} 
                      onError={(e) => handleImageError(e, selectedEquipment.category)}
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                      <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {selectedEquipment.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-8 bg-stone-50/50 flex-1">
                    <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                      Reviews
                      <span className="bg-stone-200 text-stone-700 text-xs py-0.5 px-2 rounded-full">{eqReviews.length > 0 ? eqReviews.length : 12}</span>
                    </h3>
                    {eqReviews.length > 0 ? (
                      <div className="space-y-6">
                        {eqReviews.map(review => (
                          <div key={review.id} className="border-b border-stone-200/60 pb-6 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-stone-900 text-sm">{review.author}</span>
                              <span className="text-xs text-stone-500 font-medium">{review.date}</span>
                            </div>
                            <div className="flex items-center gap-0.5 mb-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} size={14} className={star <= review.rating ? "text-amber-500 fill-amber-500" : "text-stone-300"} />
                              ))}
                            </div>
                            <p className="text-stone-600 text-sm leading-relaxed">{review.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-stone-500">
                        <MessageSquare className="mx-auto h-8 w-8 text-stone-300 mb-2" />
                        <p className="text-sm">No written reviews yet.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="w-full md:w-1/2 p-8 flex flex-col">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-stone-900 mb-2 leading-tight">{selectedEquipment.name}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600">
                      <div className="flex items-center gap-1 text-green-700 font-semibold">
                        <MapPin size={16} className="text-green-600 shrink-0"/> {selectedEquipment.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-amber-500 fill-amber-500"/> {displayRating} ({eqReviews.length > 0 ? eqReviews.length : 12} reviews)
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-stone-600 leading-relaxed mb-5 text-sm">
                    {selectedEquipment.description}
                  </p>

                  {/* Physical Address & Location Card */}
                  <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 mb-4">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-xl bg-green-700 text-white shrink-0 mt-0.5 shadow-2xs">
                        <MapPin size={16} />
                      </div>
                      <div className="flex-1">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-green-900 block mb-0.5">
                          Equipment &amp; Farm Address
                        </span>
                        <p className="text-stone-900 font-bold text-sm leading-snug">
                          {selectedEquipment.address || selectedEquipment.location || "Springfield Farm, GT Road"}
                        </p>
                        <p className="text-stone-500 text-xs mt-0.5 flex items-center gap-1">
                          <span>Area: {selectedEquipment.location}</span>
                          <span>•</span>
                          <span className="text-green-700 font-semibold">Available for on-site inspection</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Seller / Owner Contact & Direct Communication Card */}
                  <div className="bg-stone-50 rounded-2xl p-4 mb-5 border border-stone-200">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-stone-200">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                          {selectedEquipment.owner.charAt(0)}
                        </div>
                        <div>
                          <span className="text-[11px] text-stone-500 font-semibold uppercase tracking-wider block">Machinery Owner</span>
                          <button 
                            type="button"
                            onClick={() => setSelectedOwner(selectedEquipment.owner)}
                            className="font-bold text-stone-900 hover:text-green-700 transition-colors text-left flex items-center gap-1 text-base cursor-pointer"
                          >
                            <span>{selectedEquipment.owner}</span>
                            <ShieldCheck size={16} className="text-green-600" />
                          </button>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-green-800 bg-green-100 px-2.5 py-1 rounded-full border border-green-200">
                        Verified Seller
                      </span>
                    </div>

                    {/* Direct Contact Buttons (Phone Call & WhatsApp) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                      <a
                        href={`tel:${(selectedEquipment.ownerPhone || "+919825144102").replace(/\s+/g, '')}`}
                        className="bg-green-700 hover:bg-green-800 text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
                      >
                        <Phone size={15} />
                        <span>Call Owner: {selectedEquipment.ownerPhone || "+91 98251 44102"}</span>
                      </a>
                      <a
                        href={`https://wa.me/${(selectedEquipment.ownerPhone || "919825144102").replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${selectedEquipment.owner}, I found your ${selectedEquipment.name} on AgriShare and I would like to rent it.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
                      >
                        <MessageSquare size={15} />
                        <span>Chat on WhatsApp</span>
                      </a>
                    </div>

                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-stone-200">
                      <div>
                        <span className="text-stone-500 text-xs block">Daily Rental Rate</span>
                        <span className="text-green-700 text-xs font-semibold">Includes damage guarantee</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-2xl text-stone-900">{formatCurrency(selectedEquipment.price)}</span>
                        <span className="text-stone-500 text-xs"> / day</span>
                      </div>
                    </div>
                  </div>

                  <form className="mt-auto" onSubmit={(e) => {
                    e.preventDefault();
                    setRentalError('');

                    const formData = new FormData(e.currentTarget);
                    const start = (formData.get('start') as string) || modalSelectedDates.start;
                    const end = (formData.get('end') as string) || modalSelectedDates.end || start;

                    if (!start) {
                      setRentalError('Please select rental dates on the calendar above.');
                      return;
                    }

                    const renterName = (formData.get('renterName') as string) || renterNameInput || user?.displayName || "Farmer Guest";
                    const renterPhone = (formData.get('renterPhone') as string) || renterPhoneInput || "";

                    handleRent(selectedEquipment, start, end, {
                      name: renterName,
                      phone: renterPhone,
                      email: user?.email || undefined
                    });
                  }}>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider">
                          Select Rental Dates
                        </label>
                        <span className="text-xs text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-md">
                          {modalSelectedDates.days} {modalSelectedDates.days === 1 ? 'day' : 'days'} selected
                        </span>
                      </div>
                      <CalendarPicker 
                        bookedRanges={rentals
                          .filter(r => r.equipment.id === selectedEquipment.id && r.status === 'active')
                          .map(r => ({ start: r.startDate, end: r.endDate }))} 
                        onDatesChange={(start, end, days) => {
                          setModalSelectedDates({ start, end, days });
                        }}
                      />
                    </div>

                    {/* Renter Contact Info Card */}
                    <div className="bg-stone-50 rounded-2xl p-4 mb-4 border border-stone-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                          <UserIcon size={14} className="text-green-700" />
                          Renter Details
                        </span>
                        {isSignedIn ? (
                          <span className="text-xs text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={12} /> Logged In
                          </span>
                        ) : (
                          <span className="text-xs text-stone-500 font-medium">
                            Instant Guest Checkout
                          </span>
                        )}
                      </div>

                      {isSignedIn && user ? (
                        <div className="flex items-center justify-between text-xs text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-green-100 text-green-800 font-bold flex items-center justify-center">
                              {(user.displayName || "F").charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-stone-900">{user.displayName || "Farmer"}</p>
                              <p className="text-stone-500 text-[11px]">{user.email || "farmer@agrishare.local"}</p>
                            </div>
                          </div>
                          <span className="text-[11px] text-green-700 font-semibold bg-green-50 px-2 py-1 rounded-md">
                            Ready to Rent
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Your Full Name</label>
                              <input 
                                type="text"
                                name="renterName"
                                value={renterNameInput}
                                onChange={(e) => setRenterNameInput(e.target.value)}
                                placeholder="e.g. Ramesh Patel"
                                className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-green-600"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Phone / WhatsApp</label>
                              <input 
                                type="tel"
                                name="renterPhone"
                                value={renterPhoneInput}
                                onChange={(e) => setRenterPhoneInput(e.target.value)}
                                placeholder="e.g. +91 98765 43210"
                                className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-green-600"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => setShowAuthPage(true)}
                              className="text-xs text-green-700 font-medium hover:text-green-800 underline cursor-pointer"
                            >
                              Sign in with existing account
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Calculated Price Summary */}
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 mb-4 text-xs">
                      <div className="flex justify-between items-center text-stone-600 mb-1.5">
                        <span>Rate × Duration:</span>
                        <span className="font-semibold text-stone-800">
                          {formatCurrency(selectedEquipment.price)} × {modalSelectedDates.days} {modalSelectedDates.days === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-stone-600 mb-2">
                        <span>Community Damage Protection:</span>
                        <span className="text-green-700 font-bold">FREE (Included)</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-emerald-200 pt-2 text-sm font-bold text-emerald-950">
                        <span>Estimated Total:</span>
                        <span className="text-lg text-green-800">
                          {formatCurrency(selectedEquipment.price * modalSelectedDates.days)}
                        </span>
                      </div>
                    </div>

                    {rentalError && (
                      <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                        <AlertCircle size={15} className="shrink-0" />
                        <span>{rentalError}</span>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="w-full bg-green-700 hover:bg-green-800 text-white py-3.5 rounded-xl font-bold text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    >
                      <CheckCircle2 size={18} />
                      <span>Confirm &amp; Book Rental • {formatCurrency(selectedEquipment.price * modalSelectedDates.days)}</span>
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModalRental && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setReviewModalRental(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8"
            >
              <button 
                onClick={() => setReviewModalRental(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
              >
                <X size={16} />
              </button>
              <h2 className="text-2xl font-bold text-stone-900 mb-2">Leave a Review</h2>
              <p className="text-stone-500 text-sm mb-6">How was your experience renting the <span className="font-semibold text-stone-700">{reviewModalRental.equipment.name}</span>?</p>
              
              <form onSubmit={submitReview}>
                <div className="mb-6 flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setRatingHover(star)}
                      onMouseLeave={() => setRatingHover(0)}
                      onClick={() => setRatingValue(star)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star size={32} className={(ratingHover || ratingValue) >= star ? "text-amber-500 fill-amber-500" : "text-stone-300"} />
                    </button>
                  ))}
                </div>
                <div className="mb-6">
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Your Review</label>
                  <textarea 
                    required
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share details about the equipment's condition and performance..."
                    className="w-full border border-stone-300 rounded-xl p-4 text-stone-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={ratingValue === 0}
                  className="w-full bg-green-700 disabled:bg-stone-300 disabled:cursor-not-allowed hover:bg-green-800 text-white py-3.5 rounded-xl font-bold text-lg transition-all shadow-md"
                >
                  Submit Review
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {receiptModalRental && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setReceiptModalRental(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8"
            >
              <button 
                onClick={() => setReceiptModalRental(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
              >
                <X size={16} />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <h2 className="text-2xl font-bold text-stone-900">Receipt</h2>
                <p className="text-stone-500 text-sm">Transaction #{receiptModalRental.id.toUpperCase()}</p>
              </div>
              
              <div className="border-t border-b border-stone-200 py-4 mb-6 space-y-4">
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider font-bold mb-1">Equipment</p>
                  <p className="font-medium text-stone-900">{receiptModalRental.equipment.name}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider font-bold mb-1">Rental Period</p>
                  <p className="font-medium text-stone-900">{receiptModalRental.startDate} to {receiptModalRental.endDate}</p>
                </div>
                <div className="flex justify-between items-center bg-stone-50 p-3 rounded-lg">
                  <span className="font-bold text-stone-700">Total Paid</span>
                  <span className="font-bold text-lg text-green-700">{formatCurrency(receiptModalRental.totalCost, currency === 'USD')}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  handleDownloadReceipt(receiptModalRental);
                }}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Download size={18} /> Download Official PDF Receipt
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Confirmation Celebration Modal */}
      <AnimatePresence>
        {bookedRentalNotice && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setBookedRentalNotice(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8 overflow-hidden z-10"
            >
              <button 
                onClick={() => setBookedRentalNotice(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Clock size={36} className="text-amber-700" />
                </div>
                <span className="inline-block bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
                  Request Submitted • Pending Owner Approval
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-900 mb-1">
                  Rental Request Sent!
                </h2>
                <p className="text-stone-500 text-xs sm:text-sm">
                  Booking Reference: <span className="font-mono font-bold text-stone-800">#{bookedRentalNotice.id.slice(-6).toUpperCase()}</span>
                </p>
                <p className="text-stone-600 text-xs mt-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  Your request is on <strong className="text-amber-950">Pending</strong> until the equipment owner ({bookedRentalNotice.equipment.owner}) accepts it. Once accepted, your booking becomes Confirmed and you can download your official PDF receipt.
                </p>
              </div>

              {/* Rental Summary Card */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 mb-6 space-y-3 text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <img 
                    src={resolveEquipmentImage(bookedRentalNotice.equipment.image, bookedRentalNotice.equipment.category)} 
                    alt={bookedRentalNotice.equipment.name} 
                    className="w-16 h-16 rounded-xl object-cover bg-stone-200 shrink-0" 
                  />
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm leading-tight">{bookedRentalNotice.equipment.name}</h3>
                    <p className="text-stone-500 text-xs flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-green-600" />
                      {bookedRentalNotice.equipment.location}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-1 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      <Clock size={10} className="animate-spin text-amber-700" />
                      Status: Pending Approval
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-stone-200 pt-3 text-xs">
                  <div>
                    <span className="text-stone-400 block text-[11px] mb-0.5">Rental Duration</span>
                    <span className="font-semibold text-stone-800 flex items-center gap-1">
                      <Calendar size={13} className="text-green-700" />
                      {bookedRentalNotice.startDate} → {bookedRentalNotice.endDate}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-stone-400 block text-[11px] mb-0.5">Estimated Total</span>
                    <span className="font-bold text-base text-green-700">
                      {formatCurrency(bookedRentalNotice.totalCost, currency === 'USD')}
                    </span>
                  </div>
                </div>

                <div className="border-t border-stone-200 pt-2 flex items-center justify-between text-xs text-stone-600">
                  <span>Equipment Owner:</span>
                  <span className="font-medium text-stone-900">{bookedRentalNotice.equipment.owner} • Verified</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBookedRentalNotice(null);
                    setActiveTab('rentals');
                    setRentalFilter('pending');
                  }}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Clock size={16} />
                  <span>View in My Rentals (Pending)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBookedRentalNotice(null)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-stone-200 cursor-pointer"
                >
                  <span>Close</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* List Tool Modal */}
      <AnimatePresence>
        {listModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setListModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setListModalOpen(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
              >
                <X size={16} />
              </button>
              <h2 className="text-2xl font-bold text-stone-900 mb-2">List Your Equipment</h2>
              <p className="text-stone-500 text-sm mb-6">Earn money by renting out your idle farm machinery.</p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const rawPrice = Number(formData.get('price'));
                // Normalize internal storage to INR
                const normalizedPrice = currency === 'USD' ? Math.round(rawPrice * EXCHANGE_RATE) : rawPrice;
                const newId = Date.now();
                const name = formData.get('name') as string;
                const category = formData.get('category') as string;
                const location = (formData.get('location') as string) || 'Local Area';
                const address = (formData.get('address') as string) || location;
                const ownerPhone = (formData.get('ownerPhone') as string) || user?.phone || '+91 98251 44102';
                const description = formData.get('description') as string;

                const newEq: Equipment = {
                  id: newId,
                  name,
                  category,
                  price: normalizedPrice,
                  location,
                  address,
                  owner: user?.displayName || (isSignedIn ? "You" : "Local Farmer"),
                  ownerId: user?.uid || 'farmer',
                  ownerPhone,
                  ownerEmail: user?.email || '',
                  rating: 5.0, // Default for new items
                  image: resolveEquipmentImage(null, category),
                  description
                };
                setEquipmentList(prev => [newEq, ...prev]);
                try {
                  await apiFetch('/api/app/equipment', { method: 'POST', body: JSON.stringify(newEq) });
                } catch (e) {
                  console.warn('Listing equipment save error:', e);
                }
                setListModalOpen(false);
                setActiveTab('browse');
                setSelectedCategory('All');
                setAuthNotice(`Your machinery "${name}" has been listed with address & contact details!`);
              }}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Equipment / Vehicle Name</label>
                    <input type="text" name="name" required className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" placeholder="e.g. John Deere 5050D Tractor" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Category</label>
                      <select name="category" className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-sm">
                        {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Daily Rate ({currencySymbol})</label>
                      <input type="number" name="price" min="1" required className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" placeholder={currency === 'INR' ? "3500" : "50"} />
                    </div>
                  </div>

                  {/* Physical Address & Location Input */}
                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Farm / Yard Full Address</label>
                    <input 
                      type="text" 
                      name="address" 
                      required 
                      className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" 
                      placeholder="e.g. Plot 14, Near GT Canal Gate, Springfield Agro Yard" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Village / City &amp; Distance</label>
                      <input 
                        type="text" 
                        name="location" 
                        required 
                        className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" 
                        placeholder="e.g. Springfield, 5 miles away" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Owner Phone / WhatsApp</label>
                      <input 
                        type="tel" 
                        name="ownerPhone" 
                        required 
                        defaultValue={user?.phone || "+91 98251 44102"}
                        className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" 
                        placeholder="e.g. +91 98251 44102" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Description &amp; Machinery Condition</label>
                    <textarea name="description" required rows={2} className="w-full border border-stone-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm" placeholder="Provide details about HP, fuel type, attachments included, and pick-up timing..."></textarea>
                  </div>
                </div>
                <button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white py-3.5 rounded-xl font-bold text-base transition-all shadow-md cursor-pointer flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} />
                  <span>Post Machinery Listing</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Owner Profile Modal */}
      <AnimatePresence>
        {selectedOwner && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedOwner(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center"
            >
              <button 
                onClick={() => setSelectedOwner(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
              >
                <X size={16} />
              </button>
              
              <div className="w-20 h-20 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                {selectedOwner.charAt(0)}
              </div>
              
              <h2 className="text-2xl font-bold text-stone-900 flex items-center justify-center gap-2 mb-1">
                {selectedOwner}
                <ShieldCheck size={20} className="text-green-600" />
              </h2>
              <p className="text-stone-500 text-sm mb-6">Verified Equipment Owner</p>
              
              <div className="grid grid-cols-2 gap-4 border-t border-stone-200 pt-6">
                <div className="bg-stone-50 rounded-xl p-4">
                  <div className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Listings</div>
                  <div className="text-2xl font-extrabold text-stone-900">{ownerEquipment.length}</div>
                </div>
                <div className="bg-stone-50 rounded-xl p-4">
                  <div className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Avg Rating</div>
                  <div className="flex justify-center items-center gap-1">
                    <span className="text-2xl font-extrabold text-stone-900">{ownerAvgRating}</span>
                    <Star size={18} className="text-amber-500 fill-amber-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Farmer User Profile & Account Settings Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
        onSignOut={handleSignOut}
        equipmentCount={ownerEquipment.length}
        rentalsCount={rentals.length}
        onClearAllData={handleClearDatabaseAndLogins}
      />

      {/* Mobile Farmer Bottom Navigation Bar */}
      <nav 
        aria-label="Mobile Bottom Navigation" 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex items-center justify-around"
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('browse');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'browse'
              ? 'text-green-700 font-extrabold scale-105'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'browse' ? 'bg-green-100 text-green-800' : ''}`}>
            <Tractor size={20} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Browse Eq</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('rentals');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'rentals'
              ? 'text-green-700 font-extrabold scale-105'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <div className={`p-1 rounded-xl relative transition-colors ${activeTab === 'rentals' ? 'bg-green-100 text-green-800' : ''}`}>
            <FileText size={20} />
            {rentals.some(r => r.status === 'pending') && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
            )}
            {rentals.length > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-green-700 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                {rentals.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">My Rentals</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('earnings');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'earnings'
              ? 'text-green-700 font-extrabold scale-105'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'earnings' ? 'bg-green-100 text-green-800' : ''}`}>
            <TrendingUp size={20} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Earnings</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('saved');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'saved'
              ? 'text-green-700 font-extrabold scale-105'
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <div className={`p-1 rounded-xl relative transition-colors ${activeTab === 'saved' ? 'bg-green-100 text-green-800' : ''}`}>
            <Bookmark size={20} />
            {savedEquipmentIds.length > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-amber-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                {savedEquipmentIds.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Saved</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (isSignedIn) {
              setIsProfileModalOpen(true);
            } else {
              setShowAuthPage(true);
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            isProfileModalOpen ? 'text-green-700 font-extrabold' : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <div className="p-1 rounded-xl flex items-center justify-center">
            {isSignedIn && user ? (
              user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full object-cover border border-green-600" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-green-700 text-white text-[10px] font-bold flex items-center justify-center">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )
            ) : (
              <UserIcon size={20} />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">
            {isSignedIn ? 'Profile' : 'Sign In'}
          </span>
        </button>
      </nav>
    </div>
  );
}
