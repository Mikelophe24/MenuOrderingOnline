'use client'

import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const banners = [
  '/banner-1.jpg',
  '/banner-2.jpg',
  '/banner-3.jpg',
  '/banner-5.png',
  '/banner-6.jpg',
  '/banner-7.jpg',
  '/banner-8.jpg',
]

export function BannerSlider({ showOverlay = false }: { showOverlay?: boolean }) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length)
  }, [])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length)
  }, [])

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-muted">
      {/* Images */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((src, i) => (
          <div key={i} className="w-full shrink-0 relative">
            <img
              src={src}
              alt={`Banner ${i + 1}`}
              className="w-full h-[200px] sm:h-[300px] md:h-[400px] object-cover"
            />
          </div>
        ))}
      </div>

      {/* Overlay text + CTA (only on landing page) */}
      {showOverlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
          <div className="p-6 sm:p-10 space-y-3 max-w-xl">
            <h2 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg">
              Nhất Nướng
            </h2>
            <p className="text-sm sm:text-base text-white/90 drop-shadow">
              Đệ nhất nướng lẩu — Trải nghiệm ẩm thực tuyệt vời cùng gia đình và bạn bè
            </p>
            <div className="flex gap-3 pt-1">
              <a
                href="#thuc-don"
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-white/90 transition-colors shadow-lg"
              >
                Xem thực đơn
              </a>
              <a
                href="/reservation"
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-lg"
              >
                Đặt bàn ngay
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Prev/Next buttons */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === current ? 'w-8 bg-white' : 'w-2.5 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
