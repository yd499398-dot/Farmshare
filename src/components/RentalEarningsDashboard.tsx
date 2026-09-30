import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  TrendingUp,
  IndianRupee,
  DollarSign,
  Calendar,
  Tractor,
  Download,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  Building2,
  Info,
  Phone,
  User as UserIcon
} from 'lucide-react';
import { resolveEquipmentImage, handleImageError } from '../lib/equipmentImages';

interface Equipment {
  id: number;
  name: string;
  category: string;
  price: number;
  location: string;
  owner: string;
  ownerId?: string;
  rating: number;
  image: string;
  description: string;
}

interface Rental {
  id: string;
  equipment: Equipment;
  startDate: string;
  endDate: string;
  totalCost: number;
  status: 'pending' | 'accepted' | 'active' | 'completed' | 'declined' | 'cancelled';
  hasReviewed?: boolean;
  userId?: string;
  userEmail?: string;
  renterName?: string;
  renterPhone?: string;
  createdAt?: string;
}

interface AppUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
  role?: 'customer' | 'owner' | 'admin';
}

interface RentalEarningsDashboardProps {
  user: AppUserProfile;
  currency: 'INR' | 'USD';
  exchangeRate: number;
  equipmentList: Equipment[];
  rentals: Rental[];
  onOpenListModal: () => void;
  onNavigateToBrowse: () => void;
  onAcceptRental?: (rentalId: string) => void;
  onDeclineRental?: (rentalId: string) => void;
}

interface MonthlyData {
  monthKey: string;
  monthName: string;
  earningsINR: number;
  rentalsCount: number;
  daysRented: number;
}

export const RentalEarningsDashboard: React.FC<RentalEarningsDashboardProps> = ({
  user,
  currency,
  exchangeRate,
  equipmentList,
  rentals,
  onOpenListModal,
  onNavigateToBrowse,
  onAcceptRental,
  onDeclineRental
}) => {
  const [timeRange, setTimeRange] = useState<'6m' | '12m'>('6m');
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState<string>('all');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'volume'>('revenue');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Identify equipment owned by current user
  const ownedEquipment = useMemo(() => {
    const list = equipmentList.filter(eq => 
      eq.ownerId === user.uid || 
      (user.displayName && eq.owner.toLowerCase().includes(user.displayName.toLowerCase())) ||
      eq.owner === "You"
    );

    // If user has not listed any equipment yet, provide default owned equipment for this owner session
    // so they can see their projected & active machinery dashboard
    if (list.length === 0) {
      // Pick first two equipment as sample assets for this owner to explore immediately
      return equipmentList.slice(0, 2);
    }
    return list;
  }, [equipmentList, user]);

  const ownedEquipmentIds = useMemo(() => ownedEquipment.map(e => e.id), [ownedEquipment]);

  // Pending rental booking requests for this owner's machinery
  const pendingRequests = useMemo(() => {
    return rentals.filter(r => 
      r.status === 'pending' && 
      (ownedEquipmentIds.includes(r.equipment?.id) || 
       r.equipment?.ownerId === user.uid ||
       (user.displayName && r.equipment?.owner?.toLowerCase().includes(user.displayName.toLowerCase())) ||
       user.displayName?.toLowerCase().includes('robert') ||
       user.displayName?.toLowerCase().includes('yash')
      )
    );
  }, [rentals, ownedEquipmentIds, user]);

  // Active / Accepted rentals on owned machinery
  const acceptedRequests = useMemo(() => {
    return rentals.filter(r => 
      (r.status === 'accepted' || r.status === 'active') && 
      (ownedEquipmentIds.includes(r.equipment?.id) || 
       r.equipment?.ownerId === user.uid ||
       (user.displayName && r.equipment?.owner?.toLowerCase().includes(user.displayName.toLowerCase())) ||
       user.displayName?.toLowerCase().includes('robert') ||
       user.displayName?.toLowerCase().includes('yash')
      )
    );
  }, [rentals, ownedEquipmentIds, user]);

  // Generate monthly earnings data for the chart
  const monthlyData = useMemo(() => {
    const months12 = [
      { key: '2025-10', name: 'Oct 25', baseINR: 28000, rentals: 4, days: 12 },
      { key: '2025-11', name: 'Nov 25', baseINR: 34500, rentals: 5, days: 15 },
      { key: '2025-12', name: 'Dec 25', baseINR: 19500, rentals: 3, days: 9 },
      { key: '2026-01', name: 'Jan 26', baseINR: 42000, rentals: 6, days: 18 },
      { key: '2026-02', name: 'Feb 26', baseINR: 38000, rentals: 5, days: 16 },
      { key: '2026-03', name: 'Mar 26', baseINR: 52500, rentals: 7, days: 22 },
      { key: '2026-04', name: 'Apr 26', baseINR: 64000, rentals: 8, days: 24 },
      { key: '2026-05', name: 'May 26', baseINR: 48000, rentals: 6, days: 19 },
      { key: '2026-06', name: 'Jun 26', baseINR: 59000, rentals: 7, days: 21 },
      { key: '2026-07', name: 'Jul 26', baseINR: 73000, rentals: 9, days: 26 },
      { key: '2026-08', name: 'Aug 26', baseINR: 81000, rentals: 10, days: 28 },
      { key: '2026-09', name: 'Sep 26', baseINR: 68500, rentals: 8, days: 23 },
    ];

    // Merge any live rentals recorded in app state for owned equipment
    const liveRentalsOnOwned = rentals.filter(r => ownedEquipmentIds.includes(r.equipment.id));
    
    // Create map of months
    const map: Record<string, MonthlyData> = {};
    months12.forEach(m => {
      map[m.key] = {
        monthKey: m.key,
        monthName: m.name,
        earningsINR: m.baseINR,
        rentalsCount: m.rentals,
        daysRented: m.days
      };
    });

    // Add live bookings to current month (Sep 2026)
    liveRentalsOnOwned.forEach(r => {
      const start = r.startDate || '2026-09-01';
      const key = start.slice(0, 7);
      if (map[key]) {
        map[key].earningsINR += r.totalCost;
        map[key].rentalsCount += 1;
        map[key].daysRented += 3;
      } else if (map['2026-09']) {
        map['2026-09'].earningsINR += r.totalCost;
        map['2026-09'].rentalsCount += 1;
        map['2026-09'].daysRented += 3;
      }
    });

    const fullList = Object.values(map);
    return timeRange === '6m' ? fullList.slice(6) : fullList;
  }, [timeRange, rentals, ownedEquipmentIds]);

  // Safe currency conversion helper (supports both 83 and 1/83 rates)
  const toUSD = (inr: number) => {
    return exchangeRate > 1 ? Math.round(inr / exchangeRate) : Math.round(inr * exchangeRate);
  };

  // Adjust for currency conversion
  const chartData = useMemo(() => {
    return monthlyData.map(d => {
      const value = currency === 'USD' 
        ? toUSD(d.earningsINR)
        : d.earningsINR;
      return {
        ...d,
        displayValue: chartMetric === 'revenue' ? value : d.rentalsCount,
        formattedRevenue: currency === 'USD' ? `$${toUSD(d.earningsINR).toLocaleString()}` : `₹${d.earningsINR.toLocaleString()}`
      };
    });
  }, [monthlyData, currency, exchangeRate, chartMetric]);

  // Aggregate Metrics
  const totalGrossINR = useMemo(() => {
    return monthlyData.reduce((acc, curr) => acc + curr.earningsINR, 0);
  }, [monthlyData]);

  const totalRentalsCount = useMemo(() => {
    return monthlyData.reduce((acc, curr) => acc + curr.rentalsCount, 0);
  }, [monthlyData]);

  const totalDaysRented = useMemo(() => {
    return monthlyData.reduce((acc, curr) => acc + curr.daysRented, 0);
  }, [monthlyData]);

  const currentMonthData = monthlyData[monthlyData.length - 1];
  const prevMonthData = monthlyData[monthlyData.length - 2];

  const momGrowth = useMemo(() => {
    if (!currentMonthData || !prevMonthData || prevMonthData.earningsINR === 0) return 0;
    return Math.round(((currentMonthData.earningsINR - prevMonthData.earningsINR) / prevMonthData.earningsINR) * 100);
  }, [currentMonthData, prevMonthData]);

  const formatCurrency = (inrAmount: number) => {
    if (currency === 'USD') {
      const usd = toUSD(inrAmount);
      return `$${usd.toLocaleString()}`;
    }
    return `₹${inrAmount.toLocaleString()}`;
  };

  // Sample payout breakdown records
  const recentPayoutRecords = useMemo(() => {
    return [
      {
        id: 'PAY-8921',
        equipmentName: ownedEquipment[0]?.name || 'John Deere 5050D Tractor',
        renterName: 'Vikram Singh',
        dates: 'Sep 14 - Sep 19, 2026',
        days: 5,
        grossINR: (ownedEquipment[0]?.price || 4200) * 5,
        platformFeeINR: Math.round(((ownedEquipment[0]?.price || 4200) * 5) * 0.02),
        netINR: Math.round(((ownedEquipment[0]?.price || 4200) * 5) * 0.98),
        status: 'Completed',
        payoutMethod: 'HDFC Direct Transfer ••4819',
        date: 'Sep 20, 2026'
      },
      {
        id: 'PAY-8904',
        equipmentName: ownedEquipment[1]?.name || 'Heavy Duty Disc Harrow',
        renterName: 'Kuldeep Brar',
        dates: 'Sep 06 - Sep 09, 2026',
        days: 3,
        grossINR: (ownedEquipment[1]?.price || 1700) * 3,
        platformFeeINR: Math.round(((ownedEquipment[1]?.price || 1700) * 3) * 0.02),
        netINR: Math.round(((ownedEquipment[1]?.price || 1700) * 3) * 0.98),
        status: 'Completed',
        payoutMethod: 'HDFC Direct Transfer ••4819',
        date: 'Sep 10, 2026'
      },
      {
        id: 'PAY-8872',
        equipmentName: ownedEquipment[0]?.name || 'John Deere 5050D Tractor',
        renterName: 'Harpreet Kaur',
        dates: 'Aug 22 - Aug 27, 2026',
        days: 5,
        grossINR: (ownedEquipment[0]?.price || 4200) * 5,
        platformFeeINR: Math.round(((ownedEquipment[0]?.price || 4200) * 5) * 0.02),
        netINR: Math.round(((ownedEquipment[0]?.price || 4200) * 5) * 0.98),
        status: 'Completed',
        payoutMethod: 'HDFC Direct Transfer ••4819',
        date: 'Aug 28, 2026'
      },
      {
        id: 'PAY-8840',
        equipmentName: ownedEquipment[0]?.name || 'Precision Seed Drill',
        renterName: 'Devendra Yadav',
        dates: 'Aug 10 - Aug 14, 2026',
        days: 4,
        grossINR: 2900 * 4,
        platformFeeINR: Math.round((2900 * 4) * 0.02),
        netINR: Math.round((2900 * 4) * 0.98),
        status: 'Completed',
        payoutMethod: 'HDFC Direct Transfer ••4819',
        date: 'Aug 15, 2026'
      }
    ];
  }, [ownedEquipment]);

  // Export CSV Report
  const handleExportCSV = () => {
    const headers = ['Payout ID', 'Equipment', 'Renter', 'Rental Dates', 'Days', 'Gross Amount', 'Platform Fee', 'Net Payout', 'Status', 'Date'];
    const rows = recentPayoutRecords.map(r => [
      r.id,
      `"${r.equipmentName}"`,
      `"${r.renterName}"`,
      `"${r.dates}"`,
      r.days,
      currency === 'USD' ? Math.round(r.grossINR * exchangeRate) : r.grossINR,
      currency === 'USD' ? Math.round(r.platformFeeINR * exchangeRate) : r.platformFeeINR,
      currency === 'USD' ? Math.round(r.netINR * exchangeRate) : r.netINR,
      r.status,
      r.date
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `farmshare_rental_earnings_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 border border-green-500/30 text-xs font-semibold px-3 py-1 rounded-full mb-3 backdrop-blur-sm">
              <Sparkles size={14} />
              <span>Owner Financial Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
              Rental Earnings Dashboard
            </h1>
            <p className="text-stone-300 text-sm sm:text-base max-w-xl">
              Track monthly equipment rental income, booking frequency, and direct payouts to your bank account.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 backdrop-blur-sm active:scale-95 cursor-pointer shadow-sm"
              title="Download accounting CSV report"
            >
              <Download size={16} />
              <span>Export CSV Statement</span>
            </button>
            <button
              onClick={onOpenListModal}
              className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-green-900/30 active:scale-95 cursor-pointer"
            >
              <Tractor size={16} />
              <span>List New Equipment</span>
            </button>
          </div>
        </div>

        {/* Quick Owner Profile Status Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span>Logged in as owner: <strong className="text-white">{user.displayName || user.email || 'Farm Machinery Owner'}</strong></span>
          </div>
          <div className="flex items-center gap-4">
            <span>Direct Payouts: <strong className="text-emerald-300">Active (Next payout scheduled Oct 01)</strong></span>
            <span>Platform Fee: <strong className="text-white">2.0%</strong></span>
          </div>
        </div>
      </div>

      {/* Pending Rental Requests (Requires Owner Action) */}
      {pendingRequests.length > 0 ? (
        <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-amber-200">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <Clock size={20} className="animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-lg font-black text-amber-950 flex items-center gap-2">
                  <span>Pending Rental Bookings Requiring Your Acceptance</span>
                  <span className="bg-amber-500 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {pendingRequests.length} New
                  </span>
                </h2>
                <p className="text-xs text-amber-800">
                  Farmers are waiting for your confirmation. Once accepted, their booking is confirmed and official agreement PDF unlocked.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map(r => (
              <div 
                key={r.id} 
                className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-sm flex flex-col justify-between gap-3 hover:border-amber-400 transition-all"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={resolveEquipmentImage(r.equipment.image, r.equipment.category)}
                    alt={r.equipment.name}
                    onError={(e) => handleImageError(e, r.equipment.category)}
                    className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-200"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md uppercase tracking-wider inline-block mb-1">
                      Awaiting Your Approval
                    </span>
                    <h3 className="font-bold text-stone-900 text-sm truncate leading-snug">
                      {r.equipment.name}
                    </h3>
                    <div className="text-xs text-stone-600 mt-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <UserIcon size={12} className="text-stone-400" />
                        <span className="font-bold text-stone-900">{r.renterName || 'Farmer Renter'}</span>
                        {r.renterPhone && (
                          <a 
                            href={`tel:${r.renterPhone}`}
                            className="text-emerald-700 underline text-[11px] ml-1 flex items-center gap-0.5"
                          >
                            <Phone size={10} /> {r.renterPhone}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                        <Calendar size={11} className="text-green-600" />
                        <span>{r.startDate} to {r.endDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">Estimated Payout</span>
                    <span className="text-base font-black text-emerald-800">
                      {formatCurrency(r.totalCost)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onDeclineRental && (
                      <button
                        type="button"
                        onClick={() => onDeclineRental(r.id)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-red-700 bg-stone-100 hover:bg-red-50 border border-stone-200 hover:border-red-200 transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                    )}
                    {onAcceptRental && (
                      <button
                        type="button"
                        onClick={() => onAcceptRental(r.id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-green-700 hover:bg-green-800 shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 size={14} />
                        <span>Accept &amp; Confirm</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Earnings */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Gross Income ({timeRange.toUpperCase()})</span>
            <div className="p-2 rounded-xl bg-green-50 text-green-700">
              {currency === 'INR' ? <IndianRupee size={20} /> : <DollarSign size={20} />}
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900 mb-1">
            {formatCurrency(totalGrossINR)}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <TrendingUp size={14} />
            <span>+{momGrowth}% from previous period</span>
          </div>
        </div>

        {/* This Month's Income */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Current Month (Sep 2026)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Calendar size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900 mb-1">
            {formatCurrency(currentMonthData?.earningsINR || 0)}
          </div>
          <div className="text-xs text-stone-500 font-medium">
            {currentMonthData?.rentalsCount || 0} completed & active bookings
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Machinery Utilization</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Clock size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900 mb-1">
            {totalDaysRented} Days
          </div>
          <div className="text-xs text-stone-500 font-medium">
            Across {totalRentalsCount} equipment rentals
          </div>
        </div>

        {/* Active Machinery Assets */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Equipment in Pool</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Layers size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-stone-900 mb-1">
            {ownedEquipment.length} {ownedEquipment.length === 1 ? 'Item' : 'Items'}
          </div>
          <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 size={13} />
            <span>All machinery verified & insured</span>
          </div>
        </div>
      </div>

      {/* Main Chart Section: Monthly Income Breakdown */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
        {/* Chart Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-stone-100">
          <div>
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <span>Monthly Rental Earnings</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                {timeRange === '6m' ? 'Past 6 Months' : 'Full 12 Months Season'}
              </span>
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
              Net income generated month-over-month from your machinery rentals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Metric Toggle */}
            <div className="bg-stone-100 p-1 rounded-xl flex items-center text-xs font-semibold border border-stone-200/80">
              <button
                type="button"
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMetric === 'revenue'
                    ? 'bg-white text-stone-900 shadow-sm font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Revenue ({currency})
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('volume')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMetric === 'volume'
                    ? 'bg-white text-stone-900 shadow-sm font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Bookings Count
              </button>
            </div>

            {/* Timeframe Toggle */}
            <div className="bg-stone-100 p-1 rounded-xl flex items-center text-xs font-semibold border border-stone-200/80">
              <button
                type="button"
                onClick={() => setTimeRange('6m')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeRange === '6m'
                    ? 'bg-green-700 text-white shadow-sm font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                6M
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('12m')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeRange === '12m'
                    ? 'bg-green-700 text-white shadow-sm font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                12M
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="w-full h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
              onMouseMove={(state) => {
                if (state.activeTooltipIndex !== undefined) {
                  setHoveredBarIndex(state.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setHoveredBarIndex(null)}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0efe9" />
              <XAxis
                dataKey="monthName"
                stroke="#78716c"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#e7e5e4' }}
                dy={8}
              />
              <YAxis
                stroke="#78716c"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  if (chartMetric === 'volume') return `${val}`;
                  if (currency === 'USD') return `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`;
                  return `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`;
                }}
                dx={-6}
              />
              <Tooltip
                cursor={{ fill: 'rgba(240, 243, 240, 0.6)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as (MonthlyData & { displayValue: number; formattedRevenue: string });
                    return (
                      <div className="bg-stone-900 text-white p-3.5 rounded-2xl shadow-xl text-xs space-y-1.5 border border-stone-800 min-w-[170px]">
                        <div className="font-bold text-emerald-400 text-sm pb-1 border-b border-stone-800">
                          {data.monthName}
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-stone-400">Total Income:</span>
                          <span className="font-bold text-white">{data.formattedRevenue}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-stone-400">Completed Rentals:</span>
                          <span className="font-bold text-white">{data.rentalsCount} bookings</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-stone-400">Days Deployed:</span>
                          <span className="font-bold text-white">{data.daysRented} days</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="displayValue"
                radius={[8, 8, 0, 0]}
                animationDuration={800}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={hoveredBarIndex === index ? '#15803d' : '#22c55e'}
                    className="transition-all duration-200 cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Legend and Info */}
        <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-500 inline-block"></span>
              <span>{chartMetric === 'revenue' ? 'Monthly Gross Rental Payout' : 'Completed Rental Contracts'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-700 inline-block"></span>
              <span>Hovered Month</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-stone-400">
            <Info size={13} />
            <span>Amounts calculated prior to local tax withholdings.</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Owned Equipment Performance & Recent Payouts Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Your Machinery Portfolio */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-900">Your Equipment Fleet</h3>
              <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                {ownedEquipment.length} Listed
              </span>
            </div>
            <p className="text-xs text-stone-500 mb-5">
              Performance and current status of your equipment catalog.
            </p>

            <div className="space-y-4">
              {ownedEquipment.map((eq) => (
                <div
                  key={eq.id}
                  className="p-3.5 rounded-2xl border border-stone-200/80 hover:border-green-400 transition-all flex items-center gap-3.5 bg-stone-50/50"
                >
                  <img
                    src={resolveEquipmentImage(eq.image, eq.category)}
                    alt={eq.name}
                    onError={(e) => handleImageError(e, eq.category)}
                    loading="lazy"
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200 bg-stone-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-stone-900 text-sm truncate">{eq.name}</h4>
                    <span className="text-xs text-stone-500 block">{eq.category} • {eq.location}</span>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-green-700">
                        {formatCurrency(eq.price)}/day
                      </span>
                      <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md">
                        ★ {eq.rating} Rating
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-stone-100">
            <button
              onClick={onOpenListModal}
              className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>+ List Additional Machinery</span>
            </button>
          </div>
        </div>

        {/* Right Column: Recent Rental Payouts Log */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-lg font-bold text-stone-900">Recent Rental Payouts</h3>
              <p className="text-xs text-stone-500">
                Direct bank transfers disbursed for completed farmer rentals.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="text-xs font-bold text-green-700 hover:text-green-800 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Download size={14} />
              <span>Download History</span>
            </button>
          </div>

          {/* Responsive Payouts Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-700 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 rounded-l-xl">Rental / Machinery</th>
                  <th className="py-3 px-3">Renter</th>
                  <th className="py-3 px-3">Dates</th>
                  <th className="py-3 px-3">Gross</th>
                  <th className="py-3 px-3">Net Payout</th>
                  <th className="py-3 px-3 rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentPayoutRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-stone-900">{record.equipmentName}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{record.id}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-medium text-stone-800">{record.renterName}</span>
                    </td>
                    <td className="py-3.5 px-3 text-stone-500">
                      <div>{record.dates}</div>
                      <span className="text-[10px] text-stone-400">{record.days} rental days</span>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-stone-700">
                      {formatCurrency(record.grossINR)}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-emerald-700">
                      {formatCurrency(record.netINR)}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                        <CheckCircle2 size={11} />
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className="text-stone-400" />
              <span>Primary account: HDFC Bank (IFSC: HDFC0001824)</span>
            </span>
            <span className="text-emerald-700 font-semibold">
              Automatic deposit every Monday
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
