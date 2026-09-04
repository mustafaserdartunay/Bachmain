'use client'

import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Globe2,
  Layers3,
  MousePointer2,
  Palette,
  Rocket,
  Search,
  Sparkles,
} from 'lucide-react'

const features = [
  {
    icon: MousePointer2,
    title: 'Görsel builder',
    body: 'Bölümleri sürükleyip bırakın, metin ve görselleri yerinde düzenleyin.',
  },
  {
    icon: Palette,
    title: 'Markaya özel tasarım',
    body: 'Renk, tipografi ve yerleşimi markanıza göre saniyeler içinde ayarlayın.',
  },
  {
    icon: Globe2,
    title: 'Domain & yayın',
    body: 'Kendi alan adınızı bağlayın, tek tıkla güvenli yayına alın.',
  },
  {
    icon: Search,
    title: 'SEO paneli',
    body: 'Başlık, meta ve yapılandırılmış veri kontrolleri doğrudan Studio içinde.',
  },
  {
    icon: Layers3,
    title: 'Sayfa & şablonlar',
    body: 'Hazır sektör şablonlarından başlayın veya sıfırdan kendi sayfanızı kurun.',
  },
  {
    icon: Rocket,
    title: 'Hızlı performans',
    body: 'Modern, hafif çıktı — ziyaretçiler için hızlı yüklenen siteler.',
  },
]

const previewBlocks = [
  { label: 'Hero', w: '72%', h: 56 },
  { label: 'Hizmetler', w: '48%', h: 40 },
  { label: 'Galeri', w: '58%', h: 48 },
  { label: 'İletişim', w: '40%', h: 36 },
]

export default function StudioPage() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="studio-page">
      <div className="studio-bg" aria-hidden>
        <span className="studio-grid" />
        <span className="studio-beam studio-beam-a" />
        <span className="studio-beam studio-beam-b" />
        <span className="studio-noise" />
      </div>

      <header className="studio-topbar">
        <Link to="/" className="studio-back">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Ana sayfa
        </Link>
        <div className="studio-topbar-brand">
          <img
            src="/assets/bachmain-logo-on-dark.png"
            alt="BACHMAIN"
            width={148}
            height={32}
            className="studio-topbar-logo"
            draggable={false}
          />
          <span className="studio-topbar-badge">Studio</span>
        </div>
        <Link to="/" className="studio-switch">
          BACHMAIN
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </header>

      <section className="studio-hero">
        <motion.div
          className="studio-hero-copy"
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="studio-pill">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Web sitesi yapma & yönetim paneli
          </span>
          <h1>
            İstediğiniz web sayfasını
            <span className="studio-hero-accent"> Studio</span> ile kurun
          </h1>
          <p>
            Bachmain Studio; sürükle-bırak editör, şablon kütüphanesi, domain yönetimi ve SEO
            araçlarıyla markanıza özel siteleri tek panelden tasarlamanızı sağlar.
          </p>
          <div className="studio-hero-actions">
            <a
              href="https://uygulama.bachmain.com/web/studio/yonetim/tasarim"
              className="studio-btn studio-btn-primary"
            >
              Studio'yu aç
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a href="#studio-features" className="studio-btn studio-btn-ghost">
              Özellikleri keşfet
            </a>
          </div>
        </motion.div>

        <motion.div
          className="studio-canvas"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.94, x: 24 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          <div className="studio-canvas-chrome">
            <span />
            <span />
            <span />
            <p>studio.bachmain · canlı önizleme</p>
          </div>
          <div className="studio-canvas-stage">
            {previewBlocks.map((block, i) => (
              <motion.div
                key={block.label}
                className="studio-canvas-block"
                style={{ width: block.w, minHeight: block.h }}
                animate={
                  reduceMotion
                    ? undefined
                    : { y: [0, i % 2 === 0 ? -8 : 8, 0], opacity: [0.85, 1, 0.85] }
                }
                transition={{
                  duration: 4 + i * 0.45,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.2,
                }}
              >
                <strong>{block.label}</strong>
                <em />
                <em />
              </motion.div>
            ))}
            <motion.div
              className="studio-cursor"
              animate={reduceMotion ? undefined : { x: [12, 120, 70, 12], y: [20, 90, 150, 20] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            >
              <MousePointer2 className="h-5 w-5" />
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section id="studio-features" className="studio-features">
        <div className="studio-section-head">
          <h2>Tasarım paneli, yayın paneli — tek Studio</h2>
          <p>
            Kod yazmadan sayfa kurun, içerikleri yönetin ve sitenizi canlıya alın. Bachmain
            ekosisteminin web yüzü.
          </p>
        </div>
        <div className="studio-feature-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.article
                key={feature.title}
                className="studio-feature-card"
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
              >
                <div className="studio-feature-icon">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </motion.article>
            )
          })}
        </div>
      </section>

      <section className="studio-cta-band">
        <motion.div
          className="studio-cta-card"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2>Web sitenizi Studio ile şekillendirin</h2>
          <p>
            Sürükle-bırak editör canlı. Sayfaları yerinde düzenleyin, şablon seçin ve yayınlayın.
          </p>
          <div className="studio-hero-actions">
            <a
              href="https://uygulama.bachmain.com/web/studio/yonetim/tasarim"
              className="studio-btn studio-btn-primary"
            >
              Studio'yu aç
            </a>
            <Link to="/giris" className="studio-btn studio-btn-ghost">
              Giriş yap
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
