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
  const [ownerName, setOwnerName] = useState(process.env.NEXT_PUBLIC_OWNER_NAME || 'Calendar Owner');
  const [bookingDetails, setBookingDetails] = useState<any>(null);

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
        process.env.NEXT_PUBLIC_OWNER_TIMEZONE || 'UTC'
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
          description: `Booked via Mirra Calendar Template\n\nReason: ${formData.reason}\n\nContact: ${formData.email}`,
          start: {
            dateTime: selectedSlot.start.toISOString(),
            timeZone: process.env.NEXT_PUBLIC_OWNER_TIMEZONE || 'UTC'
          },
          end: {
            dateTime: selectedSlot.end.toISOString(),
            timeZone: process.env.NEXT_PUBLIC_OWNER_TIMEZONE || 'UTC'
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

      {/* Global Styles */}
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
}
