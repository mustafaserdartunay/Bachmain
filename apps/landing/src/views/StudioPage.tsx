'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Globe2, LayoutGrid, MousePointer2, Rocket, Search, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import ParticleField from '../components/cinematic/hero/ParticleField'
import StudioLiveCanvas from '../components/studio/StudioLiveCanvas'
import './studio-landing.css'

const ease = [0.22, 1, 0.36, 1] as const

const FEATURES = [
  {
    id: 'editor',
    kicker: 'Canlı tuval',
    title: 'Sitenizi sürükleyerek kurun',
    body: 'Başlık, görsel, galeri ve iletişim bloklarını tuvale bırakın. Seçtiğiniz öğe anında düzenlenir; kod, tema dosyası veya eklenti yoktur. Taslağı kaydedin, önizleyin, tek tıkla canlıya alın.',
    points: [
      'Blokları sürükleyip yerleştirin',
      'Metin ve görseli yerinde düzenleyin',
      'Mobil ve masaüstü aynı tuvalde',
    ],
    image: '/assets/studio/studio-feature-editor.png',
    alt: 'Studio sürükle-bırak editör tuvali',
  },
  {
    id: 'templates',
    kicker: 'Şablonlar',
    title: 'Hazır vitrinle başlayın, markanıza çevirin',
    body: 'Çiçekçi, pastane, restoran veya butik — sektöre uygun şablonlardan birini seçin. Renk, yazı tipi, fotoğraf ve menüyü değiştirin; iskelet hazır, vitrin sizin.',
    points: ['Sektör şablonları', 'Marka renkleri ve logo', 'Sayfa kopyalama ve çoğaltma'],
    image: '/assets/studio/studio-feature-templates.png',
    alt: 'Studio şablon galerisi',
  },
  {
    id: 'publish',
    kicker: 'SEO ve yayın',
    title: 'Arama, domain ve yayın aynı panelde',
    body: 'Sayfa başlığı, açıklama ve paylaşım görseli tuvalden ayrılmaz. Kendi alan adınızı bağlayın veya Studio adresinizle yayınlayın. Taslak ayrı, canlı site ayrı durur.',
    points: ['Sayfa SEO alanları', 'Kendi domaininiz', 'Tek tıkla yayın'],
    image: '/assets/studio/studio-feature-publish.png',
    alt: 'Studio yayın ve domain sahnesi',
  },
  {
    id: 'workspace',
    kicker: 'Çalışma alanı',
    title: 'Size özel, uygulamadan ayrı bir Studio',
    body: 'Studio üyeliği Bachmain CRM/ERP hesabından bağımsızdır. Kendi çalışma alanınız, kendi siteleriniz. Tasarımcı veya işletme olarak yalnızca web vitrinine odaklanırsınız.',
    points: ['Ayrı Studio üyeliği', 'Güvenli oturum ve bildirim', '7 günlük demo ile deneyin'],
    image: '/assets/studio/studio-feature-workspace.png',
    alt: 'Studio özel çalışma alanı',
  },
] as const

export default function StudioPage() {
  const reduceMotion = useReducedMotion()
  const enter = (delay = 0) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease },
        }

  return (
    <div className="spl spl-simple">
      <section className="spl-hero" aria-labelledby="studio-hero-heading">
        <div className="spl-hero-veil" aria-hidden />
        {reduceMotion ? null : <ParticleField />}
        <div className="spl-hero-layout">
          <motion.div {...enter(0.06)}>
            <p className="spl-hero-kicker">Bachmain Studio</p>
            <h1 id="studio-hero-heading" className="spl-title">
              Sitenizi <em>sürükleyip</em> kurun.
            </h1>
            <p className="spl-lead">
              Canlı tuvalde bloğu tutun, bırakın, yazın. Şablonla başlayın veya boş sayfadan
              ilerleyin. SEO, domain ve yayın aynı panelde — yazılım ekibi veya kod gerekmez.
            </p>
            <p className="spl-lead spl-lead-more">
              Taslağınız sizin çalışma alanınızda kalır. Hazır olduğunuzda tek tıkla canlıya alın;
              vitrin, menü ve iletişim sayfaları aynı sitede birlikte yaşar.
            </p>
            <ul className="spl-notes">
              <li>
                <MousePointer2 className="h-3.5 w-3.5" aria-hidden /> Sürükle-bırak düzenleme
              </li>
              <li>
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden /> Sektör şablonları
              </li>
              <li>
                <Search className="h-3.5 w-3.5" aria-hidden /> SEO alanları yerinde
              </li>
              <li>
                <Globe2 className="h-3.5 w-3.5" aria-hidden /> Domain ve yayın
              </li>
              <li>
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Size özel çalışma alanı
              </li>
            </ul>
            <div className="spl-actions">
              <Link to="/studio/paket" className="spl-btn spl-btn-buy">
                <Rocket className="h-4 w-4" aria-hidden />
                Modül Seç
              </Link>
              <Link to="/demo?next=studio" className="spl-btn spl-btn-ghost-dark">
                Demo oluştur
              </Link>
            </div>
          </motion.div>

          <motion.div
            {...(reduceMotion
              ? { initial: false, animate: { opacity: 1 } }
              : {
                  initial: { opacity: 0, y: 28, scale: 0.96 },
                  animate: { opacity: 1, y: 0, scale: 1 },
                  transition: { duration: 0.75, delay: 0.12, ease },
                })}
          >
            <StudioLiveCanvas />
          </motion.div>
        </div>
      </section>

      <section className="spl-band" id="ozellikler" aria-labelledby="studio-features-heading">
        <div className="spl-wrap">
          <header className="spl-head">
            <p className="spl-paket-kicker">Özellikler</p>
            <h2 id="studio-features-heading">Studio’yu yakından görün</h2>
            <p>
              Editör, şablon, SEO ve yayın — her katman görsel. Aşağıda Studio’nun nasıl çalıştığını
              adım adım izleyin.
            </p>
          </header>

          <div className="spl-feat-list">
            {FEATURES.map((feat, idx) => (
              <article key={feat.id} className={`spl-feat ${idx % 2 === 1 ? 'is-flip' : ''}`}>
                <div className="spl-feat-copy">
                  <p className="spl-feat-kicker">{feat.kicker}</p>
                  <h3>{feat.title}</h3>
                  <p>{feat.body}</p>
                  <ul>
                    {feat.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
                <figure className="spl-feat-visual">
                  <img src={feat.image} alt={feat.alt} width={960} height={540} />
                </figure>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
