export const ITEMS_PER_PAGE = 10

export const LOCALES = ['vi', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'vi'
