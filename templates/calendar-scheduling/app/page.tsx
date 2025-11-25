'use client';

import { useState, useEffect } from 'react';
import { MirraSDK } from '@mirra-messenger/sdk';
import CalendarView from '../components/CalendarView';
import TimeSlotPicker from '../components/TimeSlotPicker';
import BookingForm from '../components/BookingForm';
import ConfirmationView from '../components/ConfirmationView';
import { calculateAvailability } from '../components/AvailabilityEngine';

// Initialize SDK with template API key
const sdk = new MirraSDK({
  apiKey: process.env.NEXT_PUBLIC_TEMPLATE_API_KEY!,
});

type Step = 'calendar' | 'timeslot' | 'form' | 'confirmation';

interface AvailabilitySlot {
  start: Date;
  end: Date;
}

export default function CalendarSchedulingTemplate() {
  const [step, setStep] = useState<Step>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownerName] = useState(process.env.NEXT_PUBLIC_OWNERNAME || 'Calendar Owner');
  const [ownerTimezone] = useState(process.env.NEXT_PUBLIC_TIMEZONE || 'America/New_York');
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  
  // Get timezone abbreviation for display
  const getTimezoneAbbr = (timezone: string): string => {
    const abbrs: Record<string, string> = {
      'America/New_York': 'ET',
      'America/Chicago': 'CT',
      'America/Denver': 'MT',
      'America/Los_Angeles': 'PT',
      'America/Phoenix': 'MST',
      'America/Anchorage': 'AKT',
      'Pacific/Honolulu': 'HST',
      'Europe/London': 'GMT',
      'Europe/Paris': 'CET',
      'Europe/Berlin': 'CET',
      'Asia/Tokyo': 'JST',
      'Asia/Shanghai': 'CST',
      'Asia/Singapore': 'SGT',
      'Australia/Sydney': 'AEST',
      'UTC': 'UTC'
    };
    return abbrs[timezone] || timezone;
  };
  
  const ownerTzAbbr = getTimezoneAbbr(ownerTimezone);

  // Load availability when date is selected
  useEffect(() => {
    if (selectedDate && step === 'timeslot') {
      loadAvailability(selectedDate);
    }
  }, [selectedDate, step]);

  const loadAvailability = async (date: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get calendar events for the selected date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch events from Google Calendar
      const events = await sdk.resources.call({
        resourceId: 'google-calendar',
        method: 'getEvents',
        params: {
          timeMin: startOfDay.toISOString(),
          timeMax: endOfDay.toISOString()
        }
      });

      // Calculate available time slots
      const slots = calculateAvailability(
        date,
        events.events || [],
        ownerTimezone
      );

      setAvailableSlots(slots);
    } catch (err) {
      console.error('Error loading availability:', err);
      setError('Failed to load availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep('timeslot');
  };

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    setStep('form');
  };

  // Format date for Google Calendar API (without UTC conversion)
  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const handleBookingSubmit = async (formData: {
    name: string;
    email: string;
    reason: string;
  }) => {
    if (!selectedSlot) return;

    setLoading(true);
    setError(null);

    try {
      // Create calendar event
      await sdk.resources.call({
        resourceId: 'google-calendar',
        method: 'createEvent',
        params: {
          summary: `Meeting with ${formData.name}`,
          description: `Booked via Mirra\n\nReason: ${formData.reason}\n\nContact: ${formData.email}`,
          start: {
            dateTime: formatDateTime(selectedSlot.start),
            timeZone: ownerTimezone
          },
          end: {
            dateTime: formatDateTime(selectedSlot.end),
            timeZone: ownerTimezone
          },
          attendees: [{ email: formData.email }]
        }
      });

      setBookingDetails({
        ...formData,
        slot: selectedSlot,
        ownerName
      });
      setStep('confirmation');
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCalendar = () => {
    setStep('calendar');
    setSelectedDate(null);
    setSelectedSlot(null);
    setAvailableSlots([]);
    setError(null);
  };

  const handleBackToSlots = () => {
    setStep('timeslot');
    setSelectedSlot(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#1A1A1A]">
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#2B2B2B] dark:text-white mb-6 tracking-tight leading-tight">
            Book a Meeting with <span className="text-[#E37C60]">{ownerName}</span>
          </h1>
          <p className="text-xl text-[#2B2B2B]/70 dark:text-gray-300 max-w-2xl mx-auto font-medium">
            Select a date and time that works for you to get started.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#2B2B2B]/60 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>All times in {ownerTzAbbr}</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="transition-all duration-300 ease-in-out">
          {step === 'calendar' && (
            <CalendarView onDateSelect={handleDateSelect} />
          )}

          {step === 'timeslot' && selectedDate && (
            <TimeSlotPicker
              date={selectedDate}
              slots={availableSlots}
              loading={loading}
              onSlotSelect={handleSlotSelect}
              onBack={handleBackToCalendar}
            />
          )}

          {step === 'form' && selectedSlot && (
            <BookingForm
              slot={selectedSlot}
              loading={loading}
              onSubmit={handleBookingSubmit}
              onBack={handleBackToSlots}
            />
          )}

          {step === 'confirmation' && bookingDetails && (
            <ConfirmationView
              booking={bookingDetails}
              onBookAnother={handleBackToCalendar}
            />
          )}
        </div>
      </div>
    </div>
  );
}
