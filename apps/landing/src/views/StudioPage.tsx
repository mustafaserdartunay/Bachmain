'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  Globe2,
  Layers3,
  MousePointer2,
  Palette,
  Rocket,
  Search,
  Type,
  Image as ImageIcon,
  Link2,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import ParticleField from '../components/cinematic/hero/ParticleField'
import './studio-landing.css'

const features = [
  {
    icon: MousePointer2,
    title: 'Sürükle-bırak builder',
    body: 'Bölümleri, metinleri ve görselleri tuvalde tutup taşıyın. Seçtiğiniz alan anında düzenlenir — kod yok, bekleme yok.',
  },
  {
    icon: Type,
    title: 'Yerinde metin düzenleme',
    body: 'Başlık, paragraf ve düğmeye tıklayın, yazın. Tipografi, hizalama ve renk markanıza göre saniyeler içinde oturur.',
  },
  {
    icon: ImageIcon,
    title: 'Canlı medya sahnesi',
    body: 'Görseli sürükleyin, banner’ı değiştirin, galeriyi doldurun. Hero, kart ve ürün görselleri aynı panelde yaşar.',
  },
  {
    icon: Palette,
    title: 'Marka paleti',
    body: 'Renk, yazı tipi ve boşlukları bir kez ayarlayın; tüm sayfalar aynı dilde konuşsun. Premium görünüm varsayılan.',
  },
  {
    icon: Layers3,
    title: 'Şablon ve sayfalar',
    body: 'Mağaza, hizmet, blog, iletişim, sepet ve teşekkür sayfaları hazır. İstediğiniz sektörden başlayıp özelleştirin.',
  },
  {
    icon: Globe2,
    title: 'Domain ve yayın',
    body: 'Kendi alan adınızı bağlayın, SSL otomatik. Taslağı kaydedin, önizleyin, tek tıkla canlıya alın.',
  },
  {
    icon: Search,
    title: 'SEO paneli',
    body: 'Sayfa başlığı, meta açıklama ve yapılandırılmış veri Studio içinde. Arama motoruna giden yol kısa tutulur.',
  },
  {
    icon: Zap,
    title: 'Hızlı çıktı',
    body: 'Modern, hafif sayfalar. Ziyaretçi beklemeyecek; siz de yayın sonrası “bir daha export alayım” demeyeceksiniz.',
  },
  {
    icon: ShieldCheck,
    title: 'Size özel çalışma alanı',
    body: 'Her hesap kendi temiz tenant’ı ile açılır. Taslak, yayın ve medya yalnızca sizin panelinizde durur.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Giriş veya demo',
    body: 'Paketiniz varsa üye girişi yapın. Yoksa demo oluşturun — 7 gün Studio yöneticisine bağlanırsınız.',
  },
  {
    n: '02',
    title: 'Şablon seçin',
    body: 'Mobilya, hizmet, vitrin veya boş tuval. Marka renklerinizle sahneyi hemen kendi dilinize çevirin.',
  },
  {
    n: '03',
    title: 'Sürükleyip yayınlayın',
    body: 'Öğeleri bırakın, metni yazın, görseli değiştirin. Kaydet, canlı göster, yayınla — hepsi aynı üst barda.',
  },
  {
    n: '04',
    title: 'Domain bağlayın',
    body: 'Kendi adresinizle çıkın. SEO, SSL ve sayfa yönetimi aynı Studio’da kalır.',
  },
]

const chips = [
  'Hero',
  'Hizmet kartları',
  'Galeri',
  'Blog',
  'İletişim formu',
  'Mağaza vitrini',
  'Sepet',
  'Ödeme',
  'Teşekkür',
  'Menü',
  'Footer',
  'SEO',
  'Domain',
  'Mobil önizleme',
]

const ease = [0.22, 1, 0.36, 1] as const

export default function StudioPage() {
  const reduceMotion = useReducedMotion()
  const enter = (delay = 0) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.65, delay, ease },
        }

  return (
    <div className="spl">
      <section className="spl-hero" aria-labelledby="studio-hero-heading">
        <div className="spl-hero-veil" aria-hidden />
        {reduceMotion ? null : <ParticleField />}
        <div className="spl-hero-layout">
          <motion.div {...enter(0.08)}>
            <h1 id="studio-hero-heading" className="spl-title">
              Markanızın sitesini <em>sürükleyip</em> kurun.
            </h1>
            <p className="spl-lead">
              Canlı tuval, hazır şablonlar, SEO ve domain — tek panelde. Kod yazmadan sayfa
              tasarlayın, yerinde düzenleyin, tek tıkla yayınlayın. Paketiniz varsa girin; yoksa
              demo veya üyelikle başlayın.
            </p>
            <ul className="spl-notes">
              <li>
                <Rocket className="h-3.5 w-3.5" aria-hidden /> Canlı sürükle-bırak tuval
              </li>
              <li>
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Size özel çalışma alanı
              </li>
              <li>
                <Globe2 className="h-3.5 w-3.5" aria-hidden /> Domain ve SEO aynı panelde
              </li>
            </ul>
          </motion.div>

          <motion.div
            className="spl-canvas"
            {...(reduceMotion
              ? { initial: false, animate: { opacity: 1 } }
              : {
                  initial: { opacity: 0, y: 28, rotate: -1.2 },
                  animate: { opacity: 1, y: 0, rotate: 0 },
                  transition: { duration: 0.75, delay: 0.16, ease },
                })}
            aria-hidden
          >
            <div className="spl-canvas-chrome">
              <span className="spl-canvas-dots">
                <i />
                <i />
                <i />
              </span>
              <span className="spl-canvas-chip">Canlı düzenleme</span>
            </div>
            <div className="spl-canvas-stage">
              <div className="spl-canvas-rail">
                <em className="is-on" />
                <em />
                <em />
                <em />
                <em />
              </div>
              <div className="spl-canvas-board">
                <div className="spl-block spl-block-hero">
                  <strong>Hero</strong>
                  <b>Modern vitrin sahnesi</b>
                </div>
                <div className="spl-block-row">
                  <article>Hizmetler</article>
                  <article>Galeri</article>
                  <article>İletişim</article>
                </div>
                <div className="spl-cursor">
                  <MousePointer2 className="h-5 w-5" />
                  <span>Sürükle</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="spl-band" id="surukle-birak">
        <div className="spl-wrap spl-drag-grid">
          <motion.div
            className="spl-copy"
            initial={reduceMotion ? false : { opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease }}
          >
            <img
              src="/assets/bachmain-studio-logo.png"
              alt="Bachmain Studio"
              width={220}
              height={48}
              className="spl-logo-mark"
              style={{ margin: '0 0 1.1rem', height: '2.35rem' }}
              draggable={false}
            />
            <h2>Bachmain’in canlı, dinamik sürükle-bırak Studio’su.</h2>
            <p>
              Öğeler rayından tuvale gelir. Bloğu tutun, bırakın, yazın. Cursor ile her başlığa,
              görsele ve düğmeye dokunun — sahne anında güncellenir. Kaydet, canlı göster ve yayınla
              aynı üst çubukta durur.
            </p>
            <ul>
              <li>Bölüm, metin, görsel, düğme ve formlar katalogdan eklenir</li>
              <li>Seçili alan çerçevelenir; sürükleyince sayfa yeniden akar</li>
              <li>Masaüstü ve mobil önizleme aynı tuvalde</li>
            </ul>
          </motion.div>
          <motion.div
            className="spl-canvas"
            style={{ color: '#eef4ff', background: 'linear-gradient(165deg, #1f4e9a, #2563eb)' }}
            initial={reduceMotion ? false : { opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.08, ease }}
            aria-hidden
          >
            <div className="spl-canvas-chrome">
              <img
                src="/assets/bachmain-studio-logo.png"
                alt=""
                width={140}
                height={28}
                style={{ height: '1.15rem', width: 'auto' }}
                draggable={false}
              />
              <span className="spl-canvas-chip">Sürükle · Bırak · Yayınla</span>
            </div>
            <div className="spl-canvas-board">
              <div className="spl-block spl-block-hero">
                <strong>Tuval</strong>
                <b>Bloğu tut, sahneye bırak</b>
              </div>
              <div className="spl-block-row">
                <article>Ürün</article>
                <article>Hikâye</article>
                <article>CTA</article>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="spl-band spl-band-alt" id="ozellikler">
        <div className="spl-wrap">
          <div className="spl-head">
            <h2>Studio’nun her katmanı, yayına kadar.</h2>
            <p>
              Tasarım, içerik, medya, SEO ve domain aynı üründe. Aşağıda neyin çalıştığını — ve
              neden dikkat çektiğini — net görün.
            </p>
          </div>
          <div className="spl-feature-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.article
                  key={feature.title}
                  className="spl-card"
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: index * 0.04, ease }}
                >
                  <div className="spl-card-icon">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </motion.article>
              )
            })}
          </div>
          <div className="spl-marquee" aria-hidden>
            <div className="spl-marquee-track">
              {[...chips, ...chips].map((chip, i) => (
                <span key={`${chip}-${i}`}>{chip}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="spl-band" id="nasil">
        <div className="spl-wrap">
          <div className="spl-head">
            <h2>Dört adımda canlı site.</h2>
            <p>Üye girişi, üye ol, demo oluştur veya paket satın al — sonra tuval sizin.</p>
          </div>
          <div className="spl-steps">
            {steps.map((step, index) => (
              <motion.article
                key={step.n}
                className="spl-step"
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06, ease }}
              >
                <b>{step.n}</b>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="spl-cta">
        <div className="spl-cta-card">
          <Link2 className="mx-auto mb-4 h-8 w-8 text-sky-200" aria-hidden />
          <h2>Studio’yu şimdi açın.</h2>
          <p>
            Hesabınız varsa üye girişi yapın. Yeniyseniz üye olun veya 7 günlük demo oluşturun.
            Paketi hazır almak için satın almaya geçin.
          </p>
          <div className="spl-actions">
            <a href="/giris?next=studio" className="spl-btn spl-btn-login">
              Üye girişi
            </a>
            <a href="/uye-ol?next=studio" className="spl-btn spl-btn-ghost">
              Üye ol
            </a>
            <a href="/demo?next=studio" className="spl-btn spl-btn-primary">
              Demo oluştur
            </a>
            <a
              href="https://uygulama.bachmain.com/paketler?urun=studio"
              className="spl-btn spl-btn-buy"
            >
              Paket satın al
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
