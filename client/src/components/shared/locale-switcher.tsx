'use client'

import { useTransition } from 'react'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import { LOCALES, type Locale } from '@/config/constants'
import { Globe } from 'lucide-react'

const LOCALE_LABELS: Record<Locale, string> = {
  vi: 'VI',
  en: 'EN',
}

export function LocaleSwitcher() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const currentLocale = (Cookies.get('locale') || 'vi') as Locale

  const handleChange = (locale: Locale) => {
    Cookies.set('locale', locale, { path: '/' })
    startTransition(() => {
      router.refresh()
    })
  }

  const nextLocale = LOCALES.find((l) => l !== currentLocale) ?? LOCALES[0]

  return (
    <button
      onClick={() => handleChange(nextLocale)}
      disabled={isPending}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-accent disabled:opacity-50"
      aria-label="Switch language"
    >
      <Globe className="h-4 w-4" />
      {LOCALE_LABELS[currentLocale]}
    </button>
  )
}
