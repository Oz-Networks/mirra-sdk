import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

interface CalendarViewProps {
  onDateSelect: (date: Date) => void;
}

export default function CalendarView({ onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    // Only allow selecting dates in the current month and in the future
    if (isSameMonth(date, currentMonth) && date >= new Date(new Date().setHours(0, 0, 0, 0))) {
      onDateSelect(date);
    }
  };

  const isSelectable = (date: Date) => {
    return isSameMonth(date, currentMonth) && date >= new Date(new Date().setHours(0, 0, 0, 0));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[24px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] p-8 md:p-10 max-w-2xl mx-auto">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={handlePrevMonth}
          className="p-3 hover:bg-[#FAF8F5] dark:hover:bg-gray-700 rounded-xl transition-colors text-[#2B2B2B] dark:text-white"
          aria-label="Previous month"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-[#2B2B2B] dark:text-white tracking-tight">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>

        <button
          onClick={handleNextMonth}
          className="p-3 hover:bg-[#FAF8F5] dark:hover:bg-gray-700 rounded-xl transition-colors text-[#2B2B2B] dark:text-white"
          aria-label="Next month"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-[#2B2B2B]/50 dark:text-gray-400 py-2 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {days.map((day, index) => {
          const selectable = isSelectable(day);
          const today = isToday(day);
          const currentMonthDay = isSameMonth(day, currentMonth);

          return (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              disabled={!selectable}
              className={`
                aspect-square p-2 rounded-2xl flex items-center justify-center text-lg font-medium transition-all duration-200
                ${selectable 
                  ? 'hover:bg-[#E37C60] hover:text-white hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' 
                  : 'cursor-not-allowed'}
                ${!currentMonthDay ? 'text-gray-300 dark:text-gray-600' : 'text-[#2B2B2B] dark:text-white'}
                ${today && !selectable ? 'bg-[#FAF8F5] dark:bg-gray-700' : ''}
                ${today && selectable ? 'ring-2 ring-[#E37C60] ring-offset-2 ring-offset-white dark:ring-offset-gray-800' : ''}
                ${!selectable && currentMonthDay ? 'opacity-40' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-center gap-8 text-sm text-[#2B2B2B]/70 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#E37C60]"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-[#E37C60]"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-600"></div>
            <span>Unavailable</span>
          </div>
        </div>
      </div>
    </div>
  );
}
