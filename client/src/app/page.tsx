'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { CalendarCheck, QrCode, Clock, Utensils, Phone, MapPin, ChevronRight } from 'lucide-react'

export default function LandingPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logoNhatNuong.jpg" alt="Nhất Nướng" className="h-9 w-9 rounded-lg" />
            <span className="font-bold text-lg">Nhất Nướng</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/reservation"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <CalendarCheck className="h-4 w-4" />
              Đặt bàn
            </Link>
            <Link
              href="/login"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              {t('auth.login')}
            </Link>
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <section
        className="relative flex items-center justify-center py-32 md:py-44"
        style={{
          backgroundImage: 'url(/logoNhatNuong.jpg)',
          backgroundSize: '50%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#8b1a1a',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white space-y-6 px-4 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {t('landing.welcome')} <span className="text-red-400">Nhất Nướng</span>
          </h1>
          <p className="text-lg text-white/80 max-w-lg mx-auto">
            Nhà hàng nướng & lẩu hàng đầu. Quét QR đặt món tại bàn, theo dõi đơn hàng realtime, thanh toán tiện lợi.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/reservation"
              className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-base font-semibold text-white hover:bg-red-700 transition-colors shadow-lg"
            >
              <CalendarCheck className="h-5 w-5" />
              Đặt bàn ngay
            </Link>
            <Link
              href="/reservation/check"
              className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-base font-medium text-white hover:bg-white/20 backdrop-blur-sm transition-colors"
            >
              Kiểm tra đặt bàn
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-10">Tại sao chọn Nhất Nướng?</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: QrCode,
                title: t('landing.fastOrdering'),
                desc: 'Quét mã QR tại bàn, xem thực đơn và đặt món ngay trên điện thoại. Không cần đợi nhân viên.',
              },
              {
                icon: Clock,
                title: t('landing.realtimeManagement'),
                desc: 'Theo dõi trạng thái đơn hàng realtime. Biết ngay khi món được chuẩn bị và phục vụ.',
              },
              {
                icon: Utensils,
                title: 'Thực đơn phong phú',
                desc: 'Hơn 60 món nướng, lẩu, hải sản và đồ uống. Nguyên liệu tươi ngon mỗi ngày.',
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border bg-card p-6 space-y-3 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container text-center space-y-6">
          <h2 className="text-2xl font-bold">Đặt bàn trước - An tâm có chỗ</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Chỉ cần nhập tên, số điện thoại và thời gian bạn muốn đến. Nhà hàng sẽ xác nhận ngay.
          </p>
          <Link
            href="/reservation"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-red-700 transition-colors shadow-lg"
          >
            <CalendarCheck className="h-5 w-5" />
            Đặt bàn ngay
          </Link>
        </div>
      </section>

      {/* Hotline floating */}
      <a
        href="tel:0372239310"
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-green-500 px-5 py-3 font-medium text-white shadow-lg hover:bg-green-600 transition-colors z-50"
      >
        <Phone className="h-5 w-5" />
        0372 239 310
      </a>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container grid gap-6 md:grid-cols-3 text-sm">
          <div>
            <h4 className="font-bold text-base mb-2">Nhất Nướng</h4>
            <p className="text-muted-foreground">Nhà hàng nướng & lẩu. Trải nghiệm ẩm thực tuyệt vời cùng gia đình và bạn bè.</p>
          </div>
          <div>
            <h4 className="font-bold mb-2">Liên hệ</h4>
            <div className="space-y-1 text-muted-foreground">
              <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> 0372 239 310</p>
              <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> TP. Hồ Chí Minh</p>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-2">Dành cho nhân viên</h4>
            <Link href="/login" className="text-primary hover:underline">
              Đăng nhập quản lý
            </Link>
          </div>
        </div>
        <div className="container mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Nhất Nướng. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
