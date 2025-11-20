import { format } from 'date-fns';

interface AvailabilitySlot {
  start: Date;
  end: Date;
}
// build?
interface TimeSlotPickerProps {
  date: Date;
  slots: AvailabilitySlot[];
  loading: boolean;
  onSlotSelect: (slot: AvailabilitySlot) => void;
  onBack: () => void;
}

export default function TimeSlotPicker({
  date,
  slots,
  loading,
  onSlotSelect,
  onBack
}: TimeSlotPickerProps) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#2B2B2B]/70 hover:text-[#E37C60] dark:text-gray-400 dark:hover:text-white transition-colors font-medium group"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to calendar
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[24px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] p-8 md:p-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#2B2B2B] dark:text-white mb-2 tracking-tight">
            {format(date, 'EEEE, MMMM d')}
          </h2>
          <p className="text-[#2B2B2B]/60 dark:text-gray-400 text-lg">
            Select a time that works best for you
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E37C60]"></div>
            <p className="mt-6 text-[#2B2B2B]/60 dark:text-gray-400 font-medium">Loading available time slots...</p>
          </div>
        )}

        {/* No Slots Available */}
        {!loading && slots.length === 0 && (
          <div className="text-center py-16 bg-[#FAF8F5] dark:bg-gray-700/30 rounded-2xl">
            <svg className="w-16 h-16 text-[#2B2B2B]/30 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-[#2B2B2B] dark:text-white mb-2">
              No availability
            </h3>
            <p className="text-[#2B2B2B]/60 dark:text-gray-400 max-w-xs mx-auto">
              There are no available time slots on this date. Please select another date.
            </p>
          </div>
        )}

        {/* Time Slots Grid */}
        {!loading && slots.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {slots.map((slot, index) => (
              <button
                key={index}
                onClick={() => onSlotSelect(slot)}
                className="group relative p-4 bg-white dark:bg-gray-700 border-2 border-transparent hover:border-[#E37C60]/30 rounded-2xl hover:shadow-[0_4px_12px_rgba(227,124,96,0.15)] transition-all duration-200 text-center hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-[#E37C60]/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-lg font-bold text-[#2B2B2B] dark:text-white group-hover:text-[#E37C60] transition-colors">
                    {format(slot.start, 'h:mm a')}
                  </div>
                  <div className="text-xs text-[#2B2B2B]/50 dark:text-gray-400 mt-1 font-medium">
                    {format(slot.end, 'h:mm a')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
// Trigger workflow test
