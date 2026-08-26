// Centralized date utilities to avoid timezone inconsistencies

/**
 * Returns today's date in YYYY-MM-DD format based on local time
 */
export const getTodayString = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
};

/**
 * Formats a Date object or date string to YYYY-MM-DD
 */
export const formatDateString = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput;
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
};

/**
 * Returns tomorrow's date in YYYY-MM-DD format
 */
export const getTomorrowString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
};

/**
 * Returns yesterday's date in YYYY-MM-DD format
 */
export const getYesterdayString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
};

/**
 * Checks if a given date string (YYYY-MM-DD) is in the future relative to today
 */
export const isFutureDate = (dateStr) => {
  const today = getTodayString();
  return dateStr > today;
};

/**
 * Checks if a given date string (YYYY-MM-DD) is today
 */
export const isToday = (dateStr) => {
  return dateStr === getTodayString();
};

/**
 * Returns all dates for a given year and month in YYYY-MM-DD format
 * month is 0-indexed (0 = Jan, 11 = Dec)
 */
export const getMonthDates = (year, month) => {
  const dates = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(i).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
  }
  return dates;
};
