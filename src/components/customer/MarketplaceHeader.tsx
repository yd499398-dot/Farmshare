import React, { useState } from 'react';
import { Tractor, Search, ShieldCheck, User, Bell, Menu, X, DollarSign, IndianRupee, Briefcase, Lock, LogOut, ChevronDown } from 'lucide-react';
import { UserProfile, UserRole } from '../../types/marketplace';
import { Button } from '../ui/designSystem';

interface MarketplaceHeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: UserProfile | null;
  onOpenAuth: (defaultRole?: UserRole) => void;
  onSignOut: () => void;
  currency: 'INR' | 'USD';
  onToggleCurrency: () => void;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenAuth,
  onSignOut,
  currency,
  onToggleCurrency,
  unreadNotifsCount,
  onOpenNotifications
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Top Banner Notice for rural farmers */}
      <div className="bg-emerald-950 text-emerald-200 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span className="hidden sm:inline">🌾 AgriShare India: Verified tractors, farmland, combines & machinery for rent.</span>
        <span className="sm:hidden">🌾 AgriShare: Verified tractors & farm rentals.</span>
        <span className="text-emerald-400 font-bold">· 2.5% Standard Platform Fee</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('home')}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-emerald-700 text-white rounded-xl flex items-center justify-center shadow-xs">
              <Tractor size={24} className="text-white" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 leading-none flex items-center gap-1.5">
                <span>AgriShare</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Marketplace</span>
              </div>
              <div className="text-[11px] text-stone-500 font-medium tracking-tight mt-0.5 hidden sm:block">
                Rent what you need. Earn from what you own.
              </div>
            </div>
          </div>

          {/* Desktop Public Navigation */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-stone-600">
            <button
              onClick={() => onSelectTab('browse')}
              className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                currentTab === 'browse' ? 'text-emerald-800 bg-emerald-50' : 'hover:text-stone-950 hover:bg-stone-50'
              }`}
            >
              Browse
            </button>
            <button
              onClick={() => onSelectTab('land')}
              className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                currentTab === 'land' ? 'text-emerald-800 bg-emerald-50' : 'hover:text-stone-950 hover:bg-stone-50'
              }`}
            >
              Farmland
            </button>
            <button
              onClick={() => onSelectTab('vehicles')}
              className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                currentTab === 'vehicles' ? 'text-emerald-800 bg-emerald-50' : 'hover:text-stone-950 hover:bg-stone-50'
              }`}
            >
              Vehicles
            </button>
            <button
              onClick={() => onSelectTab('equipment')}
              className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                currentTab === 'equipment' ? 'text-emerald-800 bg-emerald-50' : 'hover:text-stone-950 hover:bg-stone-50'
              }`}
            >
              Machinery
            </button>
            <button
              onClick={() => onSelectTab('services')}
              className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                currentTab === 'services' ? 'text-emerald-800 bg-emerald-50' : 'hover:text-stone-950 hover:bg-stone-50'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => onSelectTab('how-it-works')}
              className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                currentTab === 'how-it-works' ? 'text-emerald-800 bg-emerald-50' : 'hover:text-stone-950 hover:bg-stone-50'
              }`}
            >
              How It Works
            </button>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency Selector */}
            <button
              onClick={onToggleCurrency}
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 flex items-center gap-1 cursor-pointer"
              title="Toggle Currency (INR / USD)"
            >
              {currency === 'INR' ? (
                <>
                  <IndianRupee size={13} className="text-emerald-700" />
                  <span>INR (₹)</span>
                </>
              ) : (
                <>
                  <DollarSign size={13} className="text-emerald-700" />
                  <span>USD ($)</span>
                </>
              )}
            </button>

            {/* Notification Bell */}
            {user && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell size={20} />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-600 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>
            )}

            {/* Role Gateway & Portals */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => onSelectTab('owner')}
                className="px-3 py-2 rounded-xl text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Machinery & Land Owners Portal"
              >
                <Briefcase size={14} className="text-emerald-700" />
                <span>Owner Portal</span>
              </button>
              <button
                onClick={() => onSelectTab('admin')}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors flex items-center gap-1 cursor-pointer"
                title="Platform Administration Portal"
              >
                <Lock size={13} />
                <span>Admin</span>
              </button>
            </div>

            {/* Auth / Account Profile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-full border border-stone-200 hover:border-stone-300 bg-white cursor-pointer"
                >
                  <img
                    src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName)}&backgroundColor=15803d`}
                    alt={user.displayName}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                  />
                  <span className="text-xs font-bold text-stone-800 hidden sm:inline max-w-[90px] truncate">
                    {user.displayName}
                  </span>
                  <ChevronDown size={14} className="text-stone-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-50 animate-in fade-in"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-xs text-stone-500">Signed in as</p>
                      <p className="text-sm font-bold text-stone-900 truncate">{user.displayName}</p>
                      <p className="text-xs text-stone-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onSelectTab('dashboard');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                    >
                      <User size={15} className="text-emerald-700" />
                      <span>Farmer Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onSelectTab('owner');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Briefcase size={15} className="text-emerald-700" />
                      <span>Switch to Owner Portal</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onSelectTab('admin');
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Lock size={15} className="text-stone-500" />
                      <span>Platform Admin Portal</span>
                    </button>
                    <div className="border-t border-stone-100 my-1" />
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenAuth('customer')}
                  className="hidden sm:inline-flex"
                >
                  Log In
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onOpenAuth('owner')}
                >
                  List a Resource
                </Button>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-stone-100 space-y-2">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-stone-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSelectTab('owner');
                }}
                className="py-2 px-3 bg-stone-900 text-white rounded-xl text-xs font-bold text-center"
              >
                Owner Portal
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSelectTab('admin');
                }}
                className="py-2 px-3 bg-stone-100 text-stone-800 rounded-xl text-xs font-bold text-center"
              >
                Admin Portal
              </button>
            </div>
            <button
              onClick={() => { setMobileMenuOpen(false); onSelectTab('home'); }}
              className="w-full text-left py-2 px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 rounded-lg"
            >
              Home
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onSelectTab('browse'); }}
              className="w-full text-left py-2 px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 rounded-lg"
            >
              Browse All Resources
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onSelectTab('land'); }}
              className="w-full text-left py-2 px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 rounded-lg"
            >
              Agricultural Farmland
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onSelectTab('vehicles'); }}
              className="w-full text-left py-2 px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 rounded-lg"
            >
              Tractors & Vehicles
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onSelectTab('equipment'); }}
              className="w-full text-left py-2 px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 rounded-lg"
            >
              Harvesting & Machinery
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onSelectTab('how-it-works'); }}
              className="w-full text-left py-2 px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 rounded-lg"
            >
              How AgriShare Works
            </button>
            {user && (
              <button
                onClick={() => { setMobileMenuOpen(false); onSelectTab('dashboard'); }}
                className="w-full text-left py-2 px-3 text-sm font-bold text-emerald-800 bg-emerald-50 rounded-lg"
              >
                My Bookings & Profile
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
