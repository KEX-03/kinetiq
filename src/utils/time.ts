/** Formats a number of seconds as m:ss, e.g. 90 → "1:30". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

/** Time of day in the device's locale, e.g. "14:05" or "2:05 PM". */
export function formatClockTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Date in the device's locale, e.g. "Wed, 25 Nov 2026". */
export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Short date in the device's locale, e.g. "25 Nov". */
export function formatShortDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** Local calendar day as YYYY-MM-DD (not UTC, so late-evening entries stay on the right day). */
export function localDateKey(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Midnight local time for a YYYY-MM-DD key, in ms. */
export function parseDateKey(key: string): number {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
}

/** Whole minutes between two timestamps (at least 1 once any time has passed). */
export function minutesBetween(startMs: number, endMs: number): number {
  const minutes = Math.round((endMs - startMs) / 60_000);
  return endMs > startMs ? Math.max(1, minutes) : 0;
}
