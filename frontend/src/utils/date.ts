import { toZonedTime, format } from 'date-fns-tz';

/**
 * Formats a UTC date string into a specific timezone-aware string representation.
 * @param dateStr ISO date string or Date object
 * @param timeZone Target timezone (e.g. 'America/New_York', 'UTC')
 * @param formatStr Date-fns format string
 */
export const formatInTimezone = (
  dateStr: string | Date,
  timeZone: string = 'UTC',
  formatStr: string = 'MMMM d, yyyy'
): string => {
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return '';
    
    // Convert UTC time to Zoned time
    const zonedDate = toZonedTime(date, timeZone);
    
    // Format zoned time
    return format(zonedDate, formatStr, { timeZone });
  } catch (error) {
    console.error('Error formatting timezone date:', error);
    // Fallback to basic format
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
};
