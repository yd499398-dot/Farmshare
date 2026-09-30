import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Phone, MapPin, CheckCircle2, AlertCircle, LogOut, ShieldCheck, Tractor, Trash2, RotateCw, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import { updateManualUserProfile, clearAllWebsiteDataAndLogins, updateUserPassword, validateStrongPassword } from '../lib/manualAuth';
import { PasswordRequirementsIndicator } from './PasswordRequirementsIndicator';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    uid: string;
    displayName: string | null;
    email: string | null;
    phone?: string | null;
    address?: string | null;
    photoURL?: string | null;
    role?: 'customer' | 'owner' | 'admin' | null;
  } | null;
  onUpdateUser: (updatedUser: any) => void;
  onSignOut: () => void;
  equipmentCount?: number;
  rentalsCount?: number;
  onClearAllData?: () => Promise<void>;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onSignOut,
  equipmentCount = 0,
  rentalsCount = 0,
  onClearAllData
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Password Management States
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setSaveSuccess('');
      setErrorMsg('');
      setConfirmClear(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('');
      setPasswordError('');
      setShowPasswordSection(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const validation = validateStrongPassword(newPassword);
    if (!validation.isValid) {
      setPasswordError(`Password requirement not met: ${validation.errors.join(' • ')}`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-enter identical passwords.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updateUserPassword(user.email || user.uid, newPassword);
      setPasswordSuccess('Strong password created & saved securely!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccess('');
      }, 4500);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaveSuccess('');

    if (!name.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid Gmail / Email address.');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateManualUserProfile(user.uid, {
        displayName: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        address: address.trim()
      });

      onUpdateUser(updated);
      setSaveSuccess('Your profile details and address have been updated successfully!');
      setTimeout(() => {
        setSaveSuccess('');
      }, 4000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMsg(err.message || 'Could not update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteClear = async () => {
    setIsClearing(true);
    try {
      if (onClearAllData) {
        await onClearAllData();
      } else {
        clearAllWebsiteDataAndLogins();
        onSignOut();
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error clearing data.');
      setIsClearing(false);
    }
  };

  const roleTitle = user.role === 'admin' 
    ? '🛡️ Platform Admin' 
    : user.role === 'owner' 
      ? '🌾 Machinery Owner' 
      : '🚜 Farmer / Renter';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto z-10 border border-stone-100 p-6 sm:p-8"
        >
          {/* Close button */}
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close profile modal"
          >
            <X size={18} />
          </button>

          {/* Profile Header & Badge */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-stone-100">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="" 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-green-600 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-green-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
                {(user.displayName || user.email || 'F').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-xl font-black text-stone-900 truncate">
                  {name || user.displayName || 'Farmer Member'}
                </h3>
                <ShieldCheck size={18} className="text-green-600 shrink-0" />
              </div>
              <p className="text-xs text-stone-500 font-medium truncate mt-0.5">
                {email || user.email}
              </p>
              <div className="mt-1.5">
                <span className="inline-block bg-green-50 text-green-800 border border-green-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {roleTitle}
                </span>
              </div>
            </div>
          </div>

          {/* Account Snapshot Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 text-center">
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-bold block mb-1">
                Equipment Listed
              </span>
              <span className="text-2xl font-black text-stone-900">
                {equipmentCount}
              </span>
            </div>
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 text-center">
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-bold block mb-1">
                Rentals &amp; Bookings
              </span>
              <span className="text-2xl font-black text-green-700">
                {rentalsCount}
              </span>
            </div>
          </div>

          {/* Notification Banners */}
          {saveSuccess && (
            <div className="mb-5 bg-green-50 text-green-950 p-3.5 rounded-2xl text-xs font-semibold border border-green-200 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 bg-red-50 text-red-900 p-3.5 rounded-2xl text-xs font-semibold border border-red-200 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Editable Profile Form */}
          <form onSubmit={handleSave} className="space-y-4 mb-6">
            <div className="flex items-center justify-between pb-1 border-b border-stone-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-stone-700">
                Personal Information &amp; Contacts
              </span>
              <span className="text-[11px] text-green-700 font-semibold">
                Editable
              </span>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all"
                />
              </div>
            </div>

            {/* Gmail / Email Field */}
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                Gmail / Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all"
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                Used for FarmShare verification codes, booking confirmations, and machinery receipts.
              </p>
            </div>

            {/* Contact / Phone Field */}
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                Contact Phone / WhatsApp
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all"
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                Shared with machinery renters &amp; owners for pickup coordination.
              </p>
            </div>

            {/* Address Field */}
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                Farm / Living Address
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-3 text-stone-400" />
                <textarea 
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Plot 14, Springfield Agro Yard, Near GT Canal Road"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 transition-all resize-none"
                />
              </div>
            </div>

            {/* Save Profile Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Profile Changes...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </form>

          {/* Create or Add Password Section */}
          <div className="mb-6 pt-5 border-t border-stone-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={17} className="text-green-700" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-stone-800">
                  Password &amp; Security
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordSection(!showPasswordSection);
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                className="text-xs font-bold text-green-700 hover:text-green-800 underline underline-offset-2 cursor-pointer"
              >
                {showPasswordSection ? 'Close' : 'Add / Change Password'}
              </button>
            </div>

            {showPasswordSection && (
              <form onSubmit={handleUpdatePassword} className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700">Set Account Password</span>
                  <span className="text-[11px] font-semibold text-green-700">Upper + Lower + Number + Special</span>
                </div>

                {passwordSuccess && (
                  <div className="bg-green-100 text-green-900 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-700 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="bg-red-50 text-red-900 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                    New Strong Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError('');
                      }}
                      required
                      placeholder="e.g. Strong@Farm2026"
                      className="w-full pl-9 pr-9 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Real-time Checklist & Strength Meter */}
                <PasswordRequirementsIndicator password={newPassword} showAlways={true} />

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError('');
                      }}
                      required
                      placeholder="Re-enter same password"
                      className="w-full pl-9 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword}
                  className="w-full bg-stone-900 hover:bg-black disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isUpdatingPassword ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Securing Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={14} />
                      <span>Save New Password</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Distinct Sign Out Section (kept only inside profile modal per user requirement) */}
          <div className="pt-5 border-t border-stone-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
              <span>Account Actions</span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/90 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              title="Sign out of your account"
            >
              <LogOut size={16} />
              <span>Sign Out of AgriShare</span>
            </button>

            {/* Clear Database & All Logins (Fresh Start) button */}
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="w-full text-stone-500 hover:text-stone-700 text-xs font-semibold py-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 size={13} className="text-stone-400" />
                <span>Wipe Database &amp; Start Completely Fresh</span>
              </button>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-center space-y-2">
                <p className="text-xs text-amber-900 font-bold">
                  Are you sure you want to clear all data and logins?
                </p>
                <p className="text-[11px] text-amber-800">
                  This will purge all users, bookings, and active logins for a completely fresh start.
                </p>
                <div className="flex gap-2 justify-center pt-1">
                  <button
                    type="button"
                    disabled={isClearing}
                    onClick={handleExecuteClear}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    {isClearing ? 'Clearing...' : 'Yes, Clear Everything'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs py-1.5 px-3 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
