import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, type Locale, LOCALES } from '@/config/constants'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value as Locale | undefined
  const locale = localeCookie && LOCALES.includes(localeCookie) ? localeCookie : DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
  }
})
