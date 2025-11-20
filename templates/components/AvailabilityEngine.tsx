/**
 * Availability Engine
 * 
 * Calculates available time slots based on:
 * - Working hours configuration
 * - Existing calendar events
 * - Slot duration and buffer time
 */

interface CalendarEvent {
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  summary?: string;
}

interface AvailabilitySlot {
  start: Date;
  end: Date;
}

interface WorkingHoursSchedule {
  day: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "09:00"
  endTime: string; // "17:00"
}

// Default working hours (Monday-Friday, 9am-5pm)
const DEFAULT_WORKING_HOURS: WorkingHoursSchedule[] = [
  { day: 1, startTime: '09:00', endTime: '17:00' }, // Monday
  { day: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
  { day: 3, startTime: '09:00', endTime: '17:00' }, // Wednesday
  { day: 4, startTime: '09:00', endTime: '17:00' }, // Thursday
  { day: 5, startTime: '09:00', endTime: '17:00' }, // Friday
];

const SLOT_DURATION_MINUTES = 30; // Default meeting length
const BUFFER_MINUTES = 0; // Buffer between meetings

/**
 * Parse time string (HH:MM) and apply to a date
 */
function applyTimeToDate(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Get working hours for a specific date
 */
function getWorkingHoursForDate(
  date: Date,
  workingHours: WorkingHoursSchedule[] = DEFAULT_WORKING_HOURS
): { start: Date; end: Date } | null {
  const dayOfWeek = date.getDay();
  const schedule = workingHours.find(wh => wh.day === dayOfWeek);

  if (!schedule) {
    return null; // No working hours for this day
  }

  return {
    start: applyTimeToDate(date, schedule.startTime),
    end: applyTimeToDate(date, schedule.endTime)
  };
}

/**
 * Parse calendar events into time ranges
 */
function parseCalendarEvents(events: CalendarEvent[]): Array<{ start: Date; end: Date }> {
  return events
    .map(event => {
      const startStr = event.start?.dateTime || event.start?.date;
      const endStr = event.end?.dateTime || event.end?.date;

      if (!startStr || !endStr) return null;

      return {
        start: new Date(startStr),
        end: new Date(endStr)
      };
    })
    .filter((range): range is { start: Date; end: Date } => range !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Generate time slots for a time range
 */
function generateTimeSlots(
  start: Date,
  end: Date,
  durationMinutes: number = SLOT_DURATION_MINUTES
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  let currentTime = new Date(start);

  while (currentTime.getTime() + durationMinutes * 60 * 1000 <= end.getTime()) {
    const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);
    
    slots.push({
      start: new Date(currentTime),
      end: slotEnd
    });

    currentTime = new Date(currentTime.getTime() + durationMinutes * 60 * 1000);
  }

  return slots;
}

/**
 * Check if a slot overlaps with any busy periods
 */
function isSlotAvailable(
  slot: AvailabilitySlot,
  busyPeriods: Array<{ start: Date; end: Date }>,
  bufferMinutes: number = BUFFER_MINUTES
): boolean {
  const slotStart = slot.start.getTime() - bufferMinutes * 60 * 1000;
  const slotEnd = slot.end.getTime() + bufferMinutes * 60 * 1000;

  for (const busy of busyPeriods) {
    const busyStart = busy.start.getTime();
    const busyEnd = busy.end.getTime();

    // Check for overlap
    if (slotStart < busyEnd && slotEnd > busyStart) {
      return false; // Slot overlaps with a busy period
    }
  }

  return true;
}

/**
 * Calculate available time slots for a date
 * 
 * @param date - The date to calculate availability for
 * @param events - Existing calendar events
 * @param timezone - Owner's timezone (not currently used, but available for future enhancement)
 * @param workingHours - Optional custom working hours (defaults to Mon-Fri 9-5)
 * @returns Array of available time slots
 */
export function calculateAvailability(
  date: Date,
  events: CalendarEvent[],
  timezone: string = 'UTC',
  workingHours?: WorkingHoursSchedule[]
): AvailabilitySlot[] {
  // Don't allow booking in the past
  const now = new Date();
  if (date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    return [];
  }

  // Get working hours for this date
  const dayWorkingHours = getWorkingHoursForDate(date, workingHours);
  if (!dayWorkingHours) {
    return []; // No working hours configured for this day
  }

  // If the date is today, adjust working hours to only show future times
  let effectiveStart = dayWorkingHours.start;
  if (date.toDateString() === now.toDateString()) {
    // Round up to next 30-minute interval
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const roundedMinutes = Math.ceil(minutesSinceMidnight / 30) * 30;
    const adjustedTime = new Date(date);
    adjustedTime.setHours(Math.floor(roundedMinutes / 60), roundedMinutes % 60, 0, 0);

    if (adjustedTime > effectiveStart) {
      effectiveStart = adjustedTime;
    }

    // If adjusted start is after working hours end, no availability
    if (effectiveStart >= dayWorkingHours.end) {
      return [];
    }
  }

  // Parse calendar events into busy periods
  const busyPeriods = parseCalendarEvents(events);

  // Generate all possible slots within working hours
  const allSlots = generateTimeSlots(effectiveStart, dayWorkingHours.end);

  // Filter out slots that overlap with busy periods
  const availableSlots = allSlots.filter(slot =>
    isSlotAvailable(slot, busyPeriods, BUFFER_MINUTES)
  );

  return availableSlots;
}

