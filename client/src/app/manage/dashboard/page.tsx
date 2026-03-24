'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useDashboard } from '@/hooks/use-dashboard'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { DollarSign, ClipboardList, Users, Armchair, FileSpreadsheet, FileText } from 'lucide-react'
import * as XLSX from 'xlsx'
import http from '@/lib/http'
import type { ApiResponse, PaginatedResponse, Order } from '@/types'

function formatCurrency(value: number) {
  return value.toLocaleString('vi-VN') + 'đ'
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')

  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const [fromDate, setFromDate] = useState(thirtyDaysAgo.toISOString().split('T')[0])
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0])

  const { data, isLoading } = useDashboard({ fromDate, toDate })
  const dashboard = data?.data

  const stats = [
    {
      label: t('totalRevenue'),
      value: dashboard ? formatCurrency(dashboard.totalRevenue) : '—',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: t('totalOrders'),
      value: dashboard?.totalOrders ?? '—',
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: t('totalGuests'),
      value: dashboard?.totalGuests ?? '—',
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      label: t('activeTables'),
      value: dashboard?.activeTables ?? '—',
      icon: Armchair,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ]

  const chartData = (() => {
    const revenueMap = new Map<string, number>()
    for (const item of dashboard?.revenueByDate ?? []) {
      revenueMap.set(item.date.split('T')[0], item.revenue)
    }
    const days: { date: string; revenue: number }[] = []
    const start = new Date(fromDate)
    const end = new Date(toDate)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0]
      days.push({ date: formatShortDate(key), revenue: revenueMap.get(key) ?? 0 })
    }
    return days
  })()

  const [exporting, setExporting] = useState(false)

  const exportToExcel = async () => {
    if (!dashboard) return
    setExporting(true)
    try {
      const wb = XLSX.utils.book_new()

      // Sheet 1: Summary
      const summarySheet = XLSX.utils.aoa_to_sheet([
        [t('dashboard'), '', `${fromDate} — ${toDate}`],
        [],
        [t('totalRevenue'), dashboard.totalRevenue],
        [t('totalOrders'), dashboard.totalOrders],
        [t('totalGuests'), dashboard.totalGuests],
        [t('activeTables'), dashboard.activeTables],
      ])
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 25 }]
      XLSX.utils.book_append_sheet(wb, summarySheet, t('dashboard'))

      // Sheet 2: Revenue by date
      const revenueRows = chartData.map((d) => ({
        'Ngày': d.date,
        'Doanh thu (VND)': d.revenue,
      }))
      const revenueSheet = XLSX.utils.json_to_sheet(revenueRows)
      revenueSheet['!cols'] = [{ wch: 15 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, revenueSheet, t('revenueChart'))

      // Sheet 3: Top dishes
      if (dashboard.topDishes?.length) {
        const dishRows = dashboard.topDishes.map((d, i) => ({
          'Hạng': i + 1,
          'Tên món': d.dishName,
          'Số đơn': d.orderCount,
        }))
        const dishSheet = XLSX.utils.json_to_sheet(dishRows)
        dishSheet['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 12 }]
        XLSX.utils.book_append_sheet(wb, dishSheet, t('topDishes'))
      }

      // Sheet 4: Order details - fetch all paid orders
      const ordersRes = await http.get<ApiResponse<PaginatedResponse<Order>>>('/orders', {
        params: { limit: '500', status: 'Paid' },
      })
      const orders = ordersRes.data?.data ?? []
      if (orders.length > 0) {
        const orderRows = orders.flatMap((o: Order) => {
          const items = o.orderItems ?? []
          if (items.length === 0) {
            return [{
              'Mã đơn': o.id,
              'Bàn': o.tableNumber,
              'Khách hàng': o.guestName ?? '',
              'Món ăn': '',
              'Số lượng': '',
              'Đơn giá': '',
              'Tổng tiền': o.totalPrice,
              'Người xử lý': o.processedByName ?? '',
              'Trạng thái': o.status,
              'Thời gian': new Date(o.createdAt).toLocaleString('vi-VN', { hour12: false }),
            }]
          }
          return items.map((item: any, idx: number) => ({
            'Mã đơn': idx === 0 ? o.id : '',
            'Bàn': idx === 0 ? o.tableNumber : '',
            'Khách hàng': idx === 0 ? (o.guestName ?? '') : '',
            'Món ăn': item.dishName ?? item.dish?.name ?? '',
            'Số lượng': item.quantity,
            'Đơn giá': item.dishPrice ?? item.dish?.price ?? 0,
            'Tổng tiền': idx === 0 ? o.totalPrice : '',
            'Người xử lý': idx === 0 ? (o.processedByName ?? '') : '',
            'Trạng thái': idx === 0 ? o.status : '',
            'Thời gian': idx === 0 ? new Date(o.createdAt).toLocaleString('vi-VN', { hour12: false }) : '',
          }))
        })
        const orderSheet = XLSX.utils.json_to_sheet(orderRows)
        orderSheet['!cols'] = [
          { wch: 10 }, { wch: 8 }, { wch: 20 }, { wch: 25 },
          { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
          { wch: 15 }, { wch: 20 },
        ]
        XLSX.utils.book_append_sheet(wb, orderSheet, 'Chi tiết đơn hàng')
      }

      XLSX.writeFile(wb, `bao-cao_${fromDate}_${toDate}.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  const exportToPDF = () => {
    if (!dashboard) return
    const content = `
      <html><head><meta charset="utf-8"><title>${t('dashboard')}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { font-size: 24px; margin-bottom: 5px; }
        h2 { font-size: 18px; margin-top: 30px; border-bottom: 2px solid #eee; padding-bottom: 5px; }
        .subtitle { color: #888; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
        .stat { border: 1px solid #eee; border-radius: 8px; padding: 16px; }
        .stat-label { font-size: 12px; color: #888; }
        .stat-value { font-size: 22px; font-weight: bold; margin-top: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
        th { background: #f5f5f5; font-weight: 600; }
        tr:nth-child(even) { background: #fafafa; }
        .medal { display: inline-block; width: 22px; height: 22px; border-radius: 50%; text-align: center; line-height: 22px; color: white; font-size: 11px; font-weight: bold; }
        .gold { background: #eab308; } .silver { background: #9ca3af; } .bronze { background: #b45309; }
      </style></head><body>
      <h1>${t('dashboard')}</h1>
      <p class="subtitle">${fromDate} — ${toDate}</p>
      <div class="stats">
        <div class="stat"><div class="stat-label">${t('totalRevenue')}</div><div class="stat-value">${formatCurrency(dashboard.totalRevenue)}</div></div>
        <div class="stat"><div class="stat-label">${t('totalOrders')}</div><div class="stat-value">${dashboard.totalOrders}</div></div>
        <div class="stat"><div class="stat-label">${t('totalGuests')}</div><div class="stat-value">${dashboard.totalGuests}</div></div>
        <div class="stat"><div class="stat-label">${t('activeTables')}</div><div class="stat-value">${dashboard.activeTables}</div></div>
      </div>
      <h2>${t('revenueChart')}</h2>
      <table><thead><tr><th>Ngày</th><th>${t('revenue')}</th></tr></thead><tbody>
        ${chartData.filter(d => d.revenue > 0).map(d => `<tr><td>${d.date}</td><td>${formatCurrency(d.revenue)}</td></tr>`).join('')}
      </tbody></table>
      ${dashboard.topDishes?.length ? `
        <h2>${t('topDishes')}</h2>
        <table><thead><tr><th>#</th><th>Món ăn</th><th>Số đơn</th></tr></thead><tbody>
          ${dashboard.topDishes.map((d, i) => `<tr><td>${i < 3 ? `<span class="medal ${['gold','silver','bronze'][i]}">${i+1}</span>` : i+1}</td><td>${d.dishName}</td><td>${d.orderCount}</td></tr>`).join('')}
        </tbody></table>
      ` : ''}
      </body></html>
    `
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(content)
      printWindow.document.close()
      printWindow.onload = () => printWindow.print()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t('dashboard')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            disabled={!dashboard || exporting}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            {exporting ? '...' : 'Excel'}
          </button>
          <button
            onClick={exportToPDF}
            disabled={!dashboard}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
          >
            <FileText className="h-4 w-4 text-red-600" />
            PDF
          </button>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border p-6">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="mt-3 h-8 w-32 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <div className={`rounded-lg p-2 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Charts - side by side */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Revenue Line Chart */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">{t('revenueChart')}</h2>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={50}
                      tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}tr` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), t('revenue')]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                  {t('noRevenueData')}
                </div>
              )}
            </div>

            {/* Top 3 Dishes Horizontal Bar Chart */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">{t('topDishes')}</h2>
              {dashboard?.topDishes && dashboard.topDishes.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={dashboard.topDishes.slice(0, 3)}
                    layout="vertical"
                    margin={{ left: 10, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="dishName"
                      tick={{ fontSize: 13 }}
                      axisLine={false}
                      tickLine={false}
                      width={120}
                    />
                    <Tooltip
                      cursor={false}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const item = payload[0].payload
                        return (
                          <div style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))', padding: '8px 12px' }}>
                            <p style={{ fontWeight: 600 }}>{item.dishName}</p>
                            <p style={{ color: 'hsl(var(--muted-foreground))' }}>{t('orderCount')}: {item.orderCount}</p>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="orderCount" radius={[0, 6, 6, 0]} barSize={40}>
                      {dashboard.topDishes.slice(0, 3).map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={['#3b82f6', '#34d399', '#f97316'][idx]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                  {t('noRevenueData')}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
