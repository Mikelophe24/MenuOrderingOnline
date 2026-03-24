'use client'

import { useTranslations } from 'next-intl'

export default function DashboardPage() {
  const t = useTranslations('dashboard')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('totalRevenue')}</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t('totalRevenue'), value: '0đ', icon: '💰' },
          { label: t('totalOrders'), value: '0', icon: '📋' },
          { label: t('totalGuests'), value: '0', icon: '👥' },
          { label: t('topDishes'), value: '--', icon: '🍽️' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">{t('revenueChart')}</h2>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Recharts revenue chart will be rendered here
        </div>
      </div>

      {/* Top Dishes */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">{t('topDishes')}</h2>
        <div className="text-muted-foreground">
          Top dishes table will be rendered here
        </div>
      </div>
    </div>
  )
}
