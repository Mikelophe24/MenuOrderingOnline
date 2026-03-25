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

const TIMEZONE = 'Asia/Ho_Chi_Minh'

export function formatDate(date: string | Date, locale = 'vi-VN') {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date, locale = 'vi-VN') {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TIMEZONE,
  }).format(new Date(date))
}

export function formatTime(date: string | Date, locale = 'vi-VN') {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TIMEZONE,
  }).format(new Date(date))
}

export function formatDayLabel(date: string | Date, locale = 'vi-VN') {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TIMEZONE,
  }).format(new Date(date))
}
