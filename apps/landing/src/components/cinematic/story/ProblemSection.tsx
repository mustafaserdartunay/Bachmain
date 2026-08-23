'use client'

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Link2,
  Workflow,
} from 'lucide-react'

const SLIDES = [
  {
    id: 'daginik',
    icon: Layers3,
    title: 'Dağınık yazılımlar yerine tek ekosistem',
    body: 'Satış, üretim, stok, lojistik ve finans aynı dilde konuşsun — veri kopyalamadan, süreç kopmadan.',
  },
  {
    id: 'akis',
    icon: Workflow,
    title: 'Tekliften teslime kesintisiz akış',
    body: 'CRM fırsatından siparişe, üretimden sevkiyata ve faturaya kadar her adım birbirine bağlı ilerler.',
  },
  {
    id: 'modul',
    icon: Boxes,
    title: 'İhtiyacınız kadar modül',
    body: 'CRM, ERP, e-fatura, saha satış ve AI asistanı — büyüdükçe ekleyin, tek panelden yönetin.',
  },
  {
    id: 'entegrasyon',
    icon: Link2,
    title: 'Kanallar ve belgeler tek panelde',
    body: 'WhatsApp, e-posta, e-fatura ve SMS bildirimleri operasyonla aynı ekranda birleşir.',
  },
]

export default function ProblemSection() {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const total = SLIDES.length

  useEffect(() => {
    if (reduce || total < 2) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % total)
    }, 4800)
    return () => window.clearInterval(id)
  }, [reduce, total])

  const go = (dir: number) => setIndex((i) => (i + dir + total) % total)
  const slide = SLIDES[index]
  const Icon = slide.icon

  return (
    <section className="cine-problem cine-problem--grand cine-problem--slider" id="problem">
      <div className="cine-problem-glow" aria-hidden />
      <p className="cine-kicker">Neden tek platform?</p>
      <h2 className="cine-problem-title">
        İşletmenizde onlarca farklı sistem kullanmak zorunda değilsiniz.
      </h2>
      <p className="cine-problem-lead">
        Satış, üretim, stok, lojistik ve finans aynı dilde konuşsun. Dağınık yazılımlar yerine tek
        ekosistem — tüm süreçler tek platform.
      </p>

      <div className="cine-problem-slider" aria-live="polite">
        <button
          type="button"
          className="cine-problem-nav"
          onClick={() => go(-1)}
          aria-label="Önceki"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <article key={slide.id} className="cine-problem-slide-card">
          <span className="cine-problem-icon">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <h3>{slide.title}</h3>
          <p>{slide.body}</p>
        </article>

        <button
          type="button"
          className="cine-problem-nav"
          onClick={() => go(1)}
          aria-label="Sonraki"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="cine-problem-dots" role="tablist">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`cine-story-dot${i === index ? ' is-active' : ''}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>

      <div className="cine-problem-cta-row">
        <Link to="/ozellikler" className="cine-btn cine-btn-ghost cine-problem-cta">
          Tüm özellikleri gör <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
