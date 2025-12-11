import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  disabledDates?: Set<string>;
  fullyBookedDates?: Set<string>;
  label?: string;
  required?: boolean;
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  disabledDates = new Set(),
  fullyBookedDates = new Set(),
  label,
  required,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  // Memoize today to prevent infinite loops
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Memoize selected date to prevent infinite loops
  const selectedDate = useMemo(() => {
    return value ? new Date(value) : null;
  }, [value]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Set current month to selected date or today when opening
  useEffect(() => {
    if (isOpen && selectedDate) {
      setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    } else if (isOpen) {
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    }
  }, [isOpen, selectedDate, today]);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isDateDisabled = (date: Date): boolean => {
    const dateStr = formatDate(date);
    
    // Check if before min date
    if (minDate && dateStr < minDate) return true;
    
    // Check if before today
    if (date < today) return true;
    
    // Check if in disabled dates
    if (disabledDates.has(dateStr)) return true;
    
    return false;
  };

  const isDateFullyBooked = (date: Date): boolean => {
    const dateStr = formatDate(date);
    return fullyBookedDates.has(dateStr);
  };

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date) || isDateFullyBooked(date)) return;
    
    const dateStr = formatDate(date);
    onChange(dateStr);
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const days = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    days.push(date);
  }

  return (
    <div className="relative" ref={calendarRef}>
      {label && (
        <label className="block text-sm font-light tracking-wide text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div
        ref={inputRef}
        className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 text-left ${
          value
            ? 'border-blue-900/30 bg-blue-900/5 text-gray-900'
            : 'border-gray-200 bg-white text-gray-500 hover:border-blue-900/50'
        } focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-900/20 focus-within:border-blue-900`}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 flex-1 text-left"
          >
            <CalendarIcon className="w-5 h-5 text-blue-900" />
            <span className={value ? 'font-light' : 'font-light'}>
              {value ? formatDisplayDate(value) : 'Select a date'}
            </span>
          </button>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setIsOpen(false);
              }}
              className="p-1 rounded-full hover:bg-blue-900/10 transition-colors ml-2"
            >
              <X className="w-4 h-4 text-blue-900" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div 
          className="absolute z-50 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-200 animate-bubble-popup w-full sm:w-auto sm:min-w-[420px] left-0"
          style={{
            top: '100%',
          }}
        >
          <style>{`
            @keyframes bubble-popup {
              0% {
                opacity: 0;
                transform: scale(0.85) translateY(-10px);
              }
              50% {
                transform: scale(1.02) translateY(0);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            .animate-bubble-popup {
              animation: bubble-popup 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
          `}</style>
          
          {/* Calendar Header */}
          <div className="bg-blue-900 text-white px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="p-2 sm:p-2.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <h3 className="text-lg sm:text-xl font-light tracking-wide">{monthName}</h3>
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="p-2 sm:p-2.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 bg-gray-50/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-xs sm:text-sm font-medium text-gray-700 py-1 sm:py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 p-2 sm:p-4">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateStr = formatDate(date);
              const isSelected = value === dateStr;
              const isToday = formatDate(today) === dateStr;
              const isDisabled = isDateDisabled(date);
              const isFullyBooked = isDateFullyBooked(date);

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  disabled={isDisabled || isFullyBooked}
                  className={`aspect-square rounded-lg sm:rounded-xl text-sm sm:text-base font-light transition-all duration-200 flex items-center justify-center ${
                    isSelected
                      ? 'bg-blue-900 text-white shadow-lg scale-105'
                      : isToday
                      ? 'bg-blue-900/10 text-blue-900 border-2 border-blue-900 font-medium'
                      : isFullyBooked
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed line-through'
                      : isDisabled
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-blue-900/10 hover:text-blue-900 hover:border-2 hover:border-blue-900/30'
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Footer info */}
          {(fullyBookedDates.size > 0 || disabledDates.size > 0) && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 space-y-1">
              {fullyBookedDates.size > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 rounded border border-gray-300"></div>
                  <span>Fully booked</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

