import { format } from 'date-fns';

interface ConfirmationViewProps {
  booking: {
    name: string;
    email: string;
    reason: string;
    slot: {
      start: Date;
      end: Date;
    };
    ownerName: string;
  };
  onBookAnother: () => void;
}

export default function ConfirmationView({
  booking,
  onBookAnother
}: ConfirmationViewProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-[24px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] p-8 md:p-12 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Success Message */}
        <h2 className="text-3xl font-bold text-[#2B2B2B] dark:text-white mb-3 tracking-tight">
          Booking Confirmed!
        </h2>
        <p className="text-[#2B2B2B]/70 dark:text-gray-400 mb-10 text-lg">
          Your meeting with <span className="font-semibold">{booking.ownerName}</span> has been scheduled.
        </p>

        {/* Booking Details */}
        <div className="bg-[#FAF8F5] dark:bg-gray-700/30 rounded-2xl p-8 mb-10 text-left">
          <h3 className="text-xs font-bold text-[#2B2B2B]/40 dark:text-gray-400 uppercase tracking-widest mb-6">
            Meeting Details
          </h3>

          <div className="space-y-6">
            {/* Date and Time */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-[#E37C60] shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[#2B2B2B]/60 dark:text-gray-400 mb-1">When</p>
                <p className="font-bold text-[#2B2B2B] dark:text-white text-lg">
                  {format(booking.slot.start, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-[#2B2B2B] dark:text-gray-300 font-medium">
                  {format(booking.slot.start, 'h:mm a')} - {format(booking.slot.end, 'h:mm a')}
                </p>
              </div>
            </div>

            {/* Your Info */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-[#E37C60] shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[#2B2B2B]/60 dark:text-gray-400 mb-1">Who</p>
                <p className="font-bold text-[#2B2B2B] dark:text-white text-lg">
                  {booking.name}
                </p>
                <p className="text-[#2B2B2B] dark:text-gray-300 font-medium">
                  {booking.email}
                </p>
              </div>
            </div>

            {/* Reason */}
            {booking.reason && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-[#E37C60] shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[#2B2B2B]/60 dark:text-gray-400 mb-1">Purpose</p>
                  <p className="text-[#2B2B2B] dark:text-white font-medium">
                    {booking.reason}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r-lg p-4 mb-10 text-left">
          <p className="text-blue-900 dark:text-blue-100 font-medium">
            📧 A calendar invitation has been sent to <strong>{booking.email}</strong>
          </p>
        </div>

        {/* Actions */}
        <button
          onClick={onBookAnother}
          className="inline-flex items-center gap-2 px-8 py-4 bg-transparent hover:bg-[#FAF8F5] dark:hover:bg-gray-700 text-[#E37C60] font-bold rounded-xl transition-colors border-2 border-[#E37C60]/20 hover:border-[#E37C60]/50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Book Another Meeting</span>
        </button>
      </div>
    </div>
  );
}
