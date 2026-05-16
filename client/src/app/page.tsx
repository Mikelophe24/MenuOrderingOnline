import { Suspense } from 'react'
import Link from 'next/link'
import { BannerSlider } from './manage/home/banner-slider'
import { PublicDishGrid, type PublicDish } from '@/components/shared/public-dish-grid'
import { LandingNav } from '@/components/shared/landing-nav'
import { Phone, MapPin } from 'lucide-react'

async function getDishes() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dishes?status=Available&limit=100`, {
      next: { tags: ['dishes'] },
    })
    if (!res.ok) return { data: { data: [] } }
    return res.json()
  } catch {
    return { data: { data: [] } }
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      next: { tags: ['dishes'] },
    })
    if (!res.ok) return { data: [] }
    return res.json()
  } catch {
    return { data: [] }
  }
}

function DishListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border p-4">
          <div className="aspect-[4/3] w-full rounded-lg bg-muted" />
          <div className="mt-4 h-4 w-3/4 rounded bg-muted" />
          <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function DishListServer() {
  const [dishData, catData] = await Promise.all([getDishes(), getCategories()])
  const dishes = shuffle<PublicDish>(dishData.data?.data ?? dishData.data ?? [])
  const categories = catData.data ?? []
  return <PublicDishGrid dishes={dishes} categories={categories} />
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <LandingNav />

      {/* Banner Slider with overlay */}
      <section className="container mt-4">
        <BannerSlider showOverlay />
      </section>

      {/* Giới thiệu nhà hàng */}
      <section className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 items-center">
          {/* Text */}
          <div className="space-y-5">
            <div>
              <span className="text-sm font-semibold text-red-600 uppercase tracking-wider">Về chúng tôi</span>
              <h2 className="text-3xl font-bold mt-1">Nhất Nướng — Đệ Nhất Nướng Lẩu</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Nhất Nướng là thương hiệu hàng đầu trong chuỗi nhà hàng lẩu nướng than hoa không khói tại Hà Nội.
              Với triết lý mang đến trải nghiệm ẩm thực Việt Nam đích thực, chúng tôi phục vụ những món nướng và lẩu
              thơm ngon, đậm đà trên bếp than hồng đặc trưng.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Nguyên liệu tươi ngon mỗi ngày — từ bò ta nướng tảng, sườn bò Mỹ, lõi vai bò Mỹ đến các set lẩu thái,
              lẩu nấm hải sản. Tất cả được phục vụ trong không gian ấm cúng, phù hợp cho gia đình, bạn bè và tiệc liên hoan.
            </p>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span>Số 25, Lô 2, Ngõ 67 Phùng Khoang, Trung Văn, Nam Từ Liêm, Hà Nội</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0 text-red-600" />
              <span>Hotline đặt bàn: <a href="tel:0927083333" className="font-semibold text-foreground">0927 083 333</a></span>
            </div>
          </div>

          {/* Images grid */}
          <div className="grid grid-cols-2 gap-3">
            <img
              src="/images/about/about-banner.jpg"
              alt="Nhất Nướng - Nướng & Lẩu"
              className="w-full h-48 object-cover rounded-xl col-span-2"
            />
            <img
              src="/images/about/about-food-1.jpg"
              alt="Bò ta nướng tảng"
              className="w-full h-40 object-cover rounded-xl"
            />
            <img
              src="/images/about/about-food-2.jpg"
              alt="Sườn bò Mỹ"
              className="w-full h-40 object-cover rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* Menu */}
      <section id="thuc-don" className="container pb-12 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Thực đơn</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Khám phá các món ăn hấp dẫn của chúng tôi
          </p>
        </div>

        <Suspense fallback={<DishListSkeleton />}>
          <DishListServer />
        </Suspense>
      </section>

      {/* Hotline floating */}
      <a
        href="tel:0927083333"
        className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-green-500 px-5 py-3 font-medium text-white shadow-lg hover:bg-green-600 transition-colors z-50"
      >
        <Phone className="h-5 w-5" />
        0927 083 333
      </a>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-auto">
        <div className="container grid gap-6 md:grid-cols-3 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/images/logo/logo.jpg" alt="Nhất Nướng" className="h-10 w-10 rounded-lg" />
              <h4 className="font-bold text-base">Nhất Nướng</h4>
            </div>
            <p className="text-muted-foreground">Nhà hàng nướng & lẩu. Trải nghiệm ẩm thực tuyệt vời cùng gia đình và bạn bè.</p>
          </div>
          <div>
            <h4 className="font-bold mb-3">Liên hệ</h4>
            <div className="space-y-2 text-muted-foreground">
              <a href="tel:0927083333" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                <Phone className="h-3.5 w-3.5 shrink-0" /> 0927 083 333
              </a>
              <p className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /> Số 25, Lô 2, Ngõ 67 Phùng Khoang, Trung Văn, Nam Từ Liêm, Hà Nội
              </p>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-3">Theo dõi chúng tôi</h4>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/nhatnuongphungkhoangcoso4" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors" title="Facebook">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-600 text-white hover:bg-pink-700 transition-colors" title="Instagram">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors" title="Zalo">
                <span className="text-xs font-bold">Zalo</span>
              </a>
              <a href="#" className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors" title="TikTok">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 005.58 2.2V12a4.85 4.85 0 01-3.77-1.54V6.69h3.77z" /></svg>
              </a>
            </div>
            <div className="mt-4">
              <Link href="/login" className="text-primary hover:underline text-sm">
                Dành cho nhân viên — Đăng nhập quản lý
              </Link>
            </div>
          </div>
        </div>
        <div className="container mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Nhất Nướng. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
