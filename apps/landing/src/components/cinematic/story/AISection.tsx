'use client'

import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, Bot, Sparkles, Workflow } from 'lucide-react'
import OptimizedImage from '../../seo/OptimizedImage'

const FLOATS = [
  { label: 'Teklif özeti', x: '8%', y: '18%', delay: 0 },
  { label: 'Stok uyarısı', x: '72%', y: '22%', delay: 0.15 },
  { label: 'Tahsilat hatırlat', x: '62%', y: '68%', delay: 0.3 },
]

export default function AISection() {
  const reduce = useReducedMotion()
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (reduce) return
    const root = rootRef.current
    if (!root) return
    gsap.registerPlugin(ScrollTrigger)

    const cards = gsap.utils.toArray<HTMLElement>('.cine-ai-float', root)
    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 24, opacity: 0, scale: 0.92 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            delay: i * 0.08,
            scrollTrigger: {
              trigger: root,
              start: 'top 72%',
              toggleActions: 'play none none reverse',
            },
          },
        )
        gsap.to(card, {
          y: '-=10',
          duration: 2.8 + i * 0.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      })
    }, root)

    return () => ctx.revert()
  }, [reduce])

  return (
    <section
      ref={rootRef}
      className="cine-ai-section"
      id="bachy-ai"
      aria-labelledby="cine-ai-title"
    >
      <div className="cine-ai-section-grid">
        <div className="cine-ai-section-copy">
          <div className="cine-ai-title-row">
            <span id="cine-ai-title" className="cine-ai-title">
              BACHY AI ASİSTANI
            </span>
            <span className="cine-ai-new">Yeni</span>
          </div>
          <h2 className="cine-act-title">Yapay zekâ iş süreçlerinizi sizin için kolaylaştırsın.</h2>
          <p className="cine-act-body">
            Bachy; CRM, ERP, stok ve finans verilerinizi okur, özetler, hatırlatır ve aksiyon
            önerir. Tüm ekip aynı akıllı asistanla çalışır.
          </p>
          <ul className="cine-ai-features">
            <li>
              <Sparkles className="h-4 w-4" aria-hidden /> Doğal dil ile sorgu
            </li>
            <li>
              <Workflow className="h-4 w-4" aria-hidden /> Süreç otomasyonu
            </li>
            <li>
              <Bot className="h-4 w-4" aria-hidden /> 7/24 iş asistanı
            </li>
          </ul>
          <Link to="/openai" className="cine-btn cine-btn-primary cine-ai-cta">
            Bachy ile Tanış <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="cine-ai-visual">
          {FLOATS.map((f) => (
            <div
              key={f.label}
              className="cine-ai-float"
              style={{ left: f.x, top: f.y, animationDelay: `${f.delay}s` }}
            >
              {f.label}
            </div>
          ))}
          <OptimizedImage
            src="/bachy/bachy-hero-scene.jpg"
            alt=""
            width={1024}
            height={571}
            className="cine-ai-mascot"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  )
}
