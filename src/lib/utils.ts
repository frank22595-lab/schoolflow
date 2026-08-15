import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function generateShortCode(schoolName: string, maxLen = 4): string {
  const words = schoolName.trim().split(/\s+/).filter(w =>
    !['school', 'schools', 'academy', 'college', 'international'].includes(w.toLowerCase())
  );
  if (words.length === 0) return schoolName.slice(0, maxLen).toUpperCase();
  if (words.length === 1) return words[0].slice(0, maxLen).toUpperCase();
  return words.slice(0, maxLen).map(w => w[0]).join('').toUpperCase();
}

export function generateAccessCode(length = 8): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no confusing chars
  let code = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}
