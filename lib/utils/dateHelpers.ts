import { MONTH_NAMES } from '@/lib/constants';

/**
 * Format a Date or ISO string as "DD/MM/YYYY"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format as "DD de Mes YYYY" — Spanish long format
 * Example: "14 de julio de 2026"
 */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format as "HH:MM"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Returns true if dateA is strictly before dateB
 */
export function isBefore(dateA: Date | string, dateB: Date | string): boolean {
  return new Date(dateA) < new Date(dateB);
}

/**
 * Returns true if there are at least `hours` hours between now and the target date
 */
export function isAtLeastHoursAway(targetDate: Date | string, hours: number): boolean {
  const diff = new Date(targetDate).getTime() - Date.now();
  return diff >= hours * 60 * 60 * 1000;
}

/**
 * Generate an integer key from year/month/day — matches dateKey() in constants.ts
 */
export function makeDateKey(year: number, month: number, day: number): number {
  return year * 10000 + month * 100 + day;
}

/**
 * Parse a DD/MM/YYYY string into a Date object
 */
export function parseDMY(value: string): Date | null {
  const parts = value.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  return new Date(y, m - 1, d);
}

/**
 * Returns the number of days in a given month
 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Returns the weekday of the first day of a month (0=Mon … 6=Sun, ISO standard)
 */
export function firstWeekdayOfMonth(year: number, month: number): number {
  const jsDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1; // convert to Mon=0
}

/**
 * Returns a human-readable relative time string
 * e.g. "hace 3 minutos", "hace 2 horas", "hace 5 días"
 */
export function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);

  if (minutes < 1)  return 'ahora mismo';
  if (minutes < 60) return `hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  if (hours   < 24) return `hace ${hours} hora${hours !== 1 ? 's' : ''}`;
  return `hace ${days} día${days !== 1 ? 's' : ''}`;
}
