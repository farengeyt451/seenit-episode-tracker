import { Nullable } from '@/utility-types';
import { DateTime } from 'luxon';

/**
 * Extracts the year from an ISO date string
 */
export const getYear = (date: Nullable<string>): Nullable<number> => {
  const dateTime = date ? DateTime.fromISO(date) : null;
  return dateTime?.isValid ? dateTime.year : null;
};

/**
 * Returns the current date/time as an ISO string
 */
export const getDateInISO = (): string => {
  return DateTime.now().toUTC().toISO();
};

export const getBackupTime = (): string => {
  return DateTime.now().toFormat('yyyy-MM-dd_HH-mm-ss');
};
