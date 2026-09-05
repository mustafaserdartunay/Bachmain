'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
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

export default function StudioPage() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="studio-page">
      <header className="studio-topbar">
        <img
          src="/assets/bachmain-studio-logo.png"
          alt="Bachmain Studio"
          width={220}
          height={48}
          className="studio-topbar-logo"
          draggable={false}
        />
      </header>

      <section className="studio-hero">
        <motion.div
          className="studio-hero-copy"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="studio-pill">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Web sitesi yapma ve yönetim paneli
          </span>
          <h1>Markanıza özel siteyi Studio ile kurun</h1>
          <p>
            Sürükle-bırak editör, şablonlar, domain ve SEO — tek panelde. Paketiniz varsa
            hesabınızla girin; yoksa 7 günlük demo ile Studio yöneticisine bağlanın. Her hesap kendi
            temiz çalışma alanı ile açılır.
          </p>
          <div className="studio-hero-actions">
            <a href="/giris?next=studio" className="studio-btn studio-btn-navy">
              Hesabımla aç
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a href="/demo?next=studio" className="studio-btn studio-btn-ghost">
              7 gün demo ile gir
            </a>
          </div>
          <ul className="studio-hero-notes">
            <li>Satın alınmış Studio paketi → hesabınızla panele girin</li>
            <li>Demo üyelik → 7 gün Studio yöneticisine bağlanın</li>
          </ul>
        </motion.div>

        <motion.div
          className="studio-canvas"
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          <div className="studio-canvas-chrome">
            <img
              src="/assets/bachmain-studio-logo.png"
              alt=""
              width={112}
              height={24}
              className="studio-canvas-logo"
              draggable={false}
            />
            <span className="studio-canvas-chip">Yönetici paneli</span>
          </div>
          <div className="studio-canvas-stage">
            <div className="studio-canvas-rail">
              <em />
              <em />
              <em className="is-active" />
              <em />
            </div>
            <div className="studio-canvas-board">
              <div className="studio-canvas-hero-block">
                <strong>Ana sayfa</strong>
                <span />
              </div>
              <div className="studio-canvas-row">
                <article>
                  <b>Hizmetler</b>
                  <i />
                </article>
                <article>
                  <b>Galeri</b>
                  <i />
                </article>
                <article>
                  <b>İletişim</b>
                  <i />
                </article>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="studio-features" className="studio-features">
        <div className="studio-section-head">
          <h2>Tasarım ve yayın — tek Studio</h2>
          <p>
            Kod yazmadan sayfa kurun, içerikleri yönetin ve sitenizi canlıya alın. Çalışma alanınız
            yalnızca size aittir.
          </p>
        </div>
        <div className="studio-feature-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.article
                key={feature.title}
                className="studio-feature-card"
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
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
        <div className="studio-cta-card">
          <h2>Studio paneline bağlanın</h2>
          <p>
            Paket üyeliğiniz varsa hesabınızla giriş yapın. Yeni başlıyorsanız 7 günlük demo ile
            yönetici paneline geçin.
          </p>
          <div className="studio-hero-actions">
            <a href="/giris?next=studio" className="studio-btn studio-btn-navy">
              Hesabımla aç
            </a>
            <a href="/demo?next=studio" className="studio-btn studio-btn-ghost">
              7 gün demo ile gir
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
