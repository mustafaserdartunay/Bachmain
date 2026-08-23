'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'
import OptimizedImage from '../seo/OptimizedImage'
import { BLUR_PHOTO } from '../../seo/imageBlur'
import ScrollReveal from '../ScrollReveal'

/** Referans carousel — oklar + otomatik kayma. */
export default function TestimonialsCarousel({ items }) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const total = items?.length || 0
  const visible = Math.min(3, total)

  useEffect(() => {
    if (reduce || total <= visible) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % total)
    }, 5200)
    return () => window.clearInterval(id)
  }, [reduce, total, visible])

  if (!total) return null

  const go = (dir) => setIndex((i) => (i + dir + total) % total)
  const windowItems = Array.from(
    { length: visible },
    (_, offset) => items[(index + offset) % total],
  )

  return (
    <div className="testimonials-carousel">
      <div className="testimonials-carousel-toolbar">
        <button
          type="button"
          className="testimonials-nav"
          onClick={() => go(-1)}
          aria-label="Önceki referans"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="testimonials-nav"
          onClick={() => go(1)}
          aria-label="Sonraki referans"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3" aria-live="polite">
        {windowItems.map((t, i) => (
          <ScrollReveal key={`${t.name}-${index}-${i}`} delay={i * 0.06}>
            <article className="testimonial-card testimonial-card--v2 group flex h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-0.5 text-amber-400" aria-label={`${t.rating} yıldız`}>
                  {Array.from({ length: t.rating }).map((_, si) => (
                    <Star key={si} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="testimonial-quote-mark" aria-hidden>
                  “
                </span>
              </div>
              <p className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-600">{t.quote}</p>
              <div className="mt-6 flex items-center gap-3 border-t border-slate-100/80 pt-5">
                <OptimizedImage
                  src={t.image}
                  alt={t.name}
                  className="testimonial-avatar h-12 w-12 rounded-full object-cover"
                  width={48}
                  height={48}
                  placeholder="blur"
                  blurDataURL={BLUR_PHOTO}
                />
                <div className="min-w-0">
                  <div className="truncate font-bold text-slate-900">{t.name}</div>
                  <div className="truncate text-xs text-slate-500">
                    {t.role} · {t.company}
                  </div>
                </div>
              </div>
            </article>
          </ScrollReveal>
        ))}
      </div>

      <div className="testimonials-carousel-dots">
        {items.map((t, i) => (
          <button
            key={t.name}
            type="button"
            aria-label={`${t.name} referansı`}
            className={`cine-story-dot${i === index ? ' is-active' : ''}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  )
}
