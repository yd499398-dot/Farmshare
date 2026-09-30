import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarPickerProps {
  bookedRanges: { start: string; end: string }[];
  onDatesChange?: (start: string, end: string, days: number) => void;
}

export function CalendarPicker({ bookedRanges, onDatesChange }: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    return d;
  });
  
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d;
  });

  // Calculate booked dates map
  const bookedDatesMap = useMemo(() => {
    const map = new Map<string, boolean>();
    bookedRanges.forEach(range => {
      const start = new Date(range.start);
      start.setHours(0,0,0,0);
      const end = new Date(range.end);
      end.setHours(0,0,0,0);
      
      const current = new Date(start);
      while (current <= end) {
        map.set(current.toISOString().split('T')[0], true);
        current.setDate(current.getDate() + 1);
      }
    });
    return map;
  }, [bookedRanges]);

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  // Sync date changes to parent
  useEffect(() => {
    if (startDate) {
      const effectiveEnd = endDate || startDate;
      const startStr = formatDateForInput(startDate);
      const endStr = formatDateForInput(effectiveEnd);
      const diffMs = effectiveEnd.getTime() - startDate.getTime();
      const rawDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const days = Math.max(1, rawDays + (startDate.getTime() === effectiveEnd.getTime() ? 1 : 0));
      onDatesChange?.(startStr, endStr, days);
    }
  }, [startDate, endDate]);

  const nextMonth = () => {
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const prevMonth = () => {
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = [];
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Previous month padding
    const startingDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Next month padding to complete the last row
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const isBooked = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return bookedDatesMap.has(dateString);
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return date < today;
  };

  const isDisabled = (date: Date) => {
    return isBooked(date) || isPast(date);
  };

  const handleDateClick = (date: Date) => {
    if (isDisabled(date)) return;
    
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (date < startDate) {
        setStartDate(date);
      } else {
        // Check if there are any booked dates between startDate and date
        let hasConflict = false;
        const current = new Date(startDate);
        while (current <= date) {
          if (isBooked(current)) {
            hasConflict = true;
            break;
          }
          current.setDate(current.getDate() + 1);
        }
        
        if (hasConflict) {
          // If conflict, just set the new start date instead
          setStartDate(date);
        } else {
          setEndDate(date);
        }
      }
    }
  };

  const isSelected = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const startStr = startDate?.toISOString().split('T')[0];
    const endStr = endDate?.toISOString().split('T')[0];
    return dateStr === startStr || dateStr === endStr;
  };

  const isInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return date > startDate && date < endDate;
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={prevMonth} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-600">
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-stone-900">{monthName}</span>
        <button type="button" onClick={nextMonth} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-600">
          <ChevronRight size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-xs font-bold text-stone-400 py-1">{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-y-1 gap-x-1">
        {days.map((dayObj, i) => {
          const { date, isCurrentMonth } = dayObj;
          const disabled = isDisabled(date);
          const selected = isSelected(date);
          const inRange = isInRange(date);
          const booked = isBooked(date);
          const past = isPast(date) && !booked; // Booked styling takes precedence over past for visual clarity of schedule
          
          let className = "h-10 w-full flex items-center justify-center text-sm rounded-lg transition-colors relative ";
          
          if (!isCurrentMonth) {
            className += "text-stone-300 ";
          } else if (booked) {
            className += "bg-red-50 text-red-500 font-medium line-through cursor-not-allowed ";
          } else if (past) {
            className += "text-stone-300 cursor-not-allowed ";
          } else if (selected) {
            className += "bg-green-700 text-white font-bold shadow-sm ";
          } else if (inRange) {
            className += "bg-green-50 text-green-800 ";
          } else {
            className += "text-stone-700 hover:bg-stone-100 cursor-pointer ";
          }

          return (
            <div key={i} className="relative">
              {inRange && <div className="absolute inset-y-0 -left-1 -right-1 bg-green-50 z-0"></div>}
              {(selected && startDate && endDate && date.getTime() === startDate.getTime()) && <div className="absolute inset-y-0 right-0 w-1/2 bg-green-50 z-0"></div>}
              {(selected && startDate && endDate && date.getTime() === endDate.getTime()) && <div className="absolute inset-y-0 left-0 w-1/2 bg-green-50 z-0"></div>}
              
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleDateClick(date)}
                className={className + " z-10"}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Hidden inputs to integrate with existing form submission */}
      <input type="hidden" name="start" value={formatDateForInput(startDate)} />
      <input type="hidden" name="end" value={formatDateForInput(endDate || startDate)} />
      
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-medium border-t border-stone-100 pt-3">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5 text-stone-600">
            <div className="w-3 h-3 rounded-full bg-green-700"></div> Selected
          </div>
          <div className="flex items-center gap-1.5 text-stone-600">
            <div className="w-3 h-3 rounded-full bg-red-100 border border-red-200 flex items-center justify-center">
               <div className="w-full h-px bg-red-400 rotate-45"></div>
            </div> Booked
          </div>
        </div>
        {startDate && (
          <div className="text-green-800 font-semibold bg-green-50 px-2.5 py-0.5 rounded-full text-[11px]">
            {endDate 
              ? `${formatDateForInput(startDate)} → ${formatDateForInput(endDate)}` 
              : `${formatDateForInput(startDate)} (1-Day Booking)`}
          </div>
        )}
      </div>
    </div>
  );
}
