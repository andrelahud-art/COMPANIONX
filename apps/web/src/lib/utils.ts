import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in MXN
 */
export function formatCurrency(amount: number, locale: string = 'es-MX'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

/**
 * Calculate duration in hours between two dates
 */
export function calculateDurationHours(from: Date, to: Date): number {
  const diffMs = to.getTime() - from.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Format date for display
 */
export function formatDate(date: Date, locale: string = 'es-MX'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date, locale: string = 'es-MX'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
