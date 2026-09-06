/**
 * Utility for parsing date/time formats used in BoM VAA products.
 * All parsed values are ISO 8601 UTC.
 */

/**
 * Parses a DTG string like "20260904/1400Z" into a UTC Date.
 * Returns null if format is invalid.
 */
export function parseDtg(raw: string): Date | null {
  const trimmed = raw.trim().toUpperCase().replace(/Z$/, '');
  const match = /^(\d{6,8})\/(\d{4})$/.exec(trimmed);
  if (!match) return null;

  const datePart = match[1];
  const timePart = match[2];

  let year: number;
  let month: number;
  let day: number;

  if (datePart.length === 8) {
    year = parseInt(datePart.substring(0, 4), 10);
    month = parseInt(datePart.substring(4, 6), 10);
    day = parseInt(datePart.substring(6, 8), 10);
  } else if (datePart.length === 6) {
    const yy = parseInt(datePart.substring(0, 2), 10);
    year = 2000 + yy;
    month = parseInt(datePart.substring(2, 4), 10);
    day = parseInt(datePart.substring(4, 6), 10);
  } else {
    return null;
  }

  const hour = parseInt(timePart.substring(0, 2), 10);
  const minute = parseInt(timePart.substring(2, 4), 10);

  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

/**
 * Parses a short forecast DTG like "04/1940Z" using the advisory DTG
 * for year/month context.
 */
export function parseForecastDtg(raw: string, contextDtg: Date): Date | null {
  const trimmed = raw.trim().toUpperCase().replace(/Z$/, '');
  const match = /^(\d{2})\/(\d{4})$/.exec(trimmed);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const timePart = match[2];
  const hour = parseInt(timePart.substring(0, 2), 10);
  const minute = parseInt(timePart.substring(2, 4), 10);

  if (isNaN(day) || isNaN(hour) || isNaN(minute)) return null;
  if (day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  let year = contextDtg.getUTCFullYear();
  let month = contextDtg.getUTCMonth(); // 0-indexed

  // If forecast day < context day, it rolled over to next month
  if (day < contextDtg.getUTCDate()) {
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return new Date(Date.UTC(year, month, day, hour, minute));
}

/**
 * Formats a Date object to UTC string: YYYY-MM-DD HH:mm UTC
 */
export function formatUtcDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid date';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());

  return `${y}-${m}-${day} ${h}:${min} UTC`;
}

/**
 * Formats a Date object to Indonesian Western Time (WIB / UTC+7)
 * Deterministic implementation to avoid SSR/hydration mismatch across locales.
 */
export function formatWibDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid date';

  const wibTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = pad(wibTime.getUTCDate());
  const month = months[wibTime.getUTCMonth()];
  const year = wibTime.getUTCFullYear();
  const hour = pad(wibTime.getUTCHours());
  const min = pad(wibTime.getUTCMinutes());

  return `${day} ${month} ${year}, ${hour}:${min} WIB`;
}
