'use client'

import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, Bot, Mic, Send, Sparkles, Workflow } from 'lucide-react'

const FLOATS = [
  { label: 'Teklif oluştur', x: '2%', y: '8%', delay: 0 },
  { label: 'Sayfa aç', x: '78%', y: '12%', delay: 0.15 },
  { label: 'Görev ekle', x: '70%', y: '82%', delay: 0.3 },
]

/**
 * Bachy AI — gerçek uygulama paneli + AI Asistan ön planı
 * (görsel: public/assets/bachmain-ai-panel.jpg)
 */
export default function AISection() {
  const reduce = useReducedMotion()
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (reduce) return
    const root = rootRef.current
    if (!root) return
    gsap.registerPlugin(ScrollTrigger)

    const cards = gsap.utils.toArray<HTMLElement>('.cine-ai-float', root)
    const copy = root.querySelector('.cine-ai-section-copy')
    const visual = root.querySelector('.cine-ai-visual')
    const assistant = root.querySelector('.cine-ai-assistant-card')

    const ctx = gsap.context(() => {
      if (copy) {
        gsap.fromTo(
          copy,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: root,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          },
        )
      }
      if (visual) {
        gsap.fromTo(
          visual,
          { y: 48, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: root,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          },
        )
      }
      if (assistant) {
        gsap.fromTo(
          assistant,
          { y: 28, opacity: 0, scale: 0.94 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.85,
            delay: 0.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: root,
              start: 'top 68%',
              toggleActions: 'play none none reverse',
            },
          },
        )
        gsap.to(assistant, {
          y: '-=8',
          duration: 3.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      }
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
          y: '-=12',
          duration: 2.6 + i * 0.35,
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
      className="cine-ai-section cine-ai-section--app"
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
          <h2 className="cine-ai-headline">
            Uygulama içi AI asistan — yazın veya konuşun, süreçler açılsın.
          </h2>
          <p className="cine-ai-lead">
            Bachy; CRM, ERP, stok ve finans verilerinizi okur, özetler, hatırlatır ve aksiyon
            önerir. Sayfa açar, müşteri/ürün/teklif oluşturur, görev ve randevu ekler — tüm ekip
            aynı akıllı asistanla çalışır.
          </p>
          <ul className="cine-ai-features">
            <li>
              <Sparkles className="h-4 w-4" aria-hidden /> Doğal dil ile komut
            </li>
            <li>
              <Workflow className="h-4 w-4" aria-hidden /> Hands-free mikrofon
            </li>
            <li>
              <Bot className="h-4 w-4" aria-hidden /> Panel + asistan tek ekranda
            </li>
          </ul>
          <Link to="/openai" className="cine-btn cine-btn-primary cine-ai-cta">
            Bachy ile Tanış <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="cine-ai-visual cine-ai-visual--app">
          {FLOATS.map((f) => (
            <div
              key={f.label}
              className="cine-ai-float"
              style={{ left: f.x, top: f.y, animationDelay: `${f.delay}s` }}
            >
              {f.label}
            </div>
          ))}

          <div className="cine-ai-panel-stage">
            <img
              src="/assets/bachmain-ai-panel.jpg"
              alt="BACHMAIN uygulama paneli ve AI Asistan"
              className="cine-ai-panel-shot"
              width={1024}
              height={549}
              loading="lazy"
              decoding="async"
            />
            <div className="cine-ai-panel-shade" aria-hidden />

            <div className="cine-ai-assistant-card" role="dialog" aria-label="AI Asistan önizleme">
              <div className="cine-ai-assistant-head">
                <strong>AI Asistan</strong>
                <span>Yazın veya mikrofonla konuşun</span>
              </div>
              <label className="cine-ai-assistant-check">
                <input type="checkbox" defaultChecked readOnly /> Hands-free (ön plan)
              </label>
              <div className="cine-ai-assistant-bubbles">
                <p>
                  Merhaba! Ne yapmamı istersiniz? Sayfa açabilir, müşteri/ürün/teklif oluşturabilir,
                  görev ve randevu ekleyebilirim.
                </p>
              </div>
              <div className="cine-ai-assistant-input">
                <Mic className="h-4 w-4" aria-hidden />
                <span>Örn: Teklifler sayfasını aç…</span>
                <Send className="h-4 w-4 cine-ai-assistant-send" aria-hidden />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
