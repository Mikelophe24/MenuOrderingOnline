'use client'

import { useTheme } from 'next-themes'
import { LocaleSwitcher } from '@/components/shared/locale-switcher'

export default function SettingPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Cài đặt</h1>

      <div className="space-y-4">
        {/* Theme */}
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Giao diện</h3>
          <p className="text-sm text-muted-foreground mb-3">Chọn chế độ hiển thị</p>
          <div className="flex gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-md px-4 py-2 text-sm ${
                  theme === t ? 'bg-primary text-primary-foreground' : 'border'
                }`}
              >
                {t === 'light' ? 'Sáng' : t === 'dark' ? 'Tối' : 'Hệ thống'}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Ngôn ngữ</h3>
          <p className="text-sm text-muted-foreground mb-3">Chọn ngôn ngữ hiển thị</p>
          <LocaleSwitcher />
        </div>
      </div>
    </div>
  )
}
