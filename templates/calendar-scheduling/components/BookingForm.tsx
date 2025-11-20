import { useState } from 'react';
import { format } from 'date-fns';

interface AvailabilitySlot {
  start: Date;
  end: Date;
}

interface BookingFormProps {
  slot: AvailabilitySlot;
  loading: boolean;
  onSubmit: (formData: { name: string; email: string; reason: string }) => void;
  onBack: () => void;
}

export default function BookingForm({
  slot,
  loading,
  onSubmit,
  onBack
}: BookingFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!reason.trim()) {
      newErrors.reason = 'Please provide a reason for the meeting';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSubmit({ name, email, reason });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#2B2B2B]/70 hover:text-[#E37C60] dark:text-gray-400 dark:hover:text-white transition-colors font-medium group"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to time slots
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[24px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] p-8 md:p-12">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-[#2B2B2B] dark:text-white mb-6 tracking-tight">
            Complete Your Booking
          </h2>

          {/* Selected Time Display */}
          <div className="p-6 bg-[#FAF8F5] dark:bg-gray-700/30 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#E37C60]/10 flex items-center justify-center text-[#E37C60]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2B2B2B]/50 dark:text-gray-400 uppercase tracking-wider mb-1">
                Selected Time
              </p>
              <p className="text-lg font-bold text-[#2B2B2B] dark:text-white">
                {format(slot.start, 'EEEE, MMMM d')} • {format(slot.start, 'h:mm a')} - {format(slot.end, 'h:mm a')}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-[#2B2B2B] dark:text-gray-300 mb-2">
              Your Name <span className="text-[#E37C60]">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-5 py-4 rounded-xl border-0 ring-1 ring-inset ${
                errors.name
                  ? 'ring-red-300 dark:ring-red-700 bg-red-50/50'
                  : 'ring-gray-200 dark:ring-gray-600 bg-gray-50/50 dark:bg-gray-700'
              } text-[#2B2B2B] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#E37C60] focus:bg-white transition-all duration-200`}
              placeholder="John Doe"
              disabled={loading}
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{errors.name}</p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-[#2B2B2B] dark:text-gray-300 mb-2">
              Email Address <span className="text-[#E37C60]">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-5 py-4 rounded-xl border-0 ring-1 ring-inset ${
                errors.email
                  ? 'ring-red-300 dark:ring-red-700 bg-red-50/50'
                  : 'ring-gray-200 dark:ring-gray-600 bg-gray-50/50 dark:bg-gray-700'
              } text-[#2B2B2B] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#E37C60] focus:bg-white transition-all duration-200`}
              placeholder="john@example.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{errors.email}</p>
            )}
          </div>

          {/* Reason Textarea */}
          <div>
            <label htmlFor="reason" className="block text-sm font-bold text-[#2B2B2B] dark:text-gray-300 mb-2">
              Reason for Meeting <span className="text-[#E37C60]">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className={`w-full px-5 py-4 rounded-xl border-0 ring-1 ring-inset ${
                errors.reason
                  ? 'ring-red-300 dark:ring-red-700 bg-red-50/50'
                  : 'ring-gray-200 dark:ring-gray-600 bg-gray-50/50 dark:bg-gray-700'
              } text-[#2B2B2B] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#E37C60] focus:bg-white transition-all duration-200 resize-none`}
              placeholder="Please describe what you'd like to discuss..."
              disabled={loading}
            />
            {errors.reason && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{errors.reason}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-[#E37C60] hover:bg-[#D96B51] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(227,124,96,0.15)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(227,124,96,0.2)] hover:-translate-y-px active:translate-y-0 active:shadow-sm transition-all duration-200 flex items-center justify-center gap-3 text-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Booking...</span>
              </>
            ) : (
              <>
                <span>Confirm Booking</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
