'use client'

import { useState, useEffect, useCallback } from 'react'
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

export function BannerSlider() {
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
          <div key={i} className="w-full shrink-0">
            <img
              src={src}
              alt={`Banner ${i + 1}`}
              className="w-full h-[200px] sm:h-[300px] md:h-[400px] object-cover"
            />
          </div>
        ))}
      </div>

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
