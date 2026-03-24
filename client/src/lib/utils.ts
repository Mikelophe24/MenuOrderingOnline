import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, locale = 'vi-VN') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export function formatDate(date: string | Date, locale = 'vi-VN') {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
