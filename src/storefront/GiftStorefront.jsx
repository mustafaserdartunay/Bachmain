import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Gift, Heart, Search, Shield, Sparkles, Truck } from 'lucide-react'
import { getWebStoreProducts } from '../utils/webSiteStorage'
import { getWebTemplate } from '../utils/webTemplateStorage'
import {
  GIFT_DEMO_PRODUCTS,
  GIFT_HERO_SLIDES,
  GIFT_INSTAGRAM,
  GIFT_NAV,
  GIFT_SHORTCUTS,
  GIFT_TABS,
  money,
} from './giftTemplateData'
import './gift-storefront.css'

function LotusMark({ className }) {
  return (
    <svg viewBox="0 0 48 40" fill="none" className={className} aria-hidden>
      <path d="M24 36c-3.2-4.8-8.8-8.4-14.4-9.6 2.4-6.4 7.2-11.2 14.4-14.4 7.2 3.2 12 8 14.4 14.4C32.8 27.6 27.2 31.2 24 36Z" fill="currentColor" opacity="0.18" />
      <path d="M24 34.5c-2.6-4-7.2-7-11.8-8.2 2-5.4 6-9.5 11.8-12.3 5.8 2.8 9.8 6.9 11.8 12.3-4.6 1.2-9.2 4.2-11.8 8.2Z" fill="currentColor" opacity="0.35" />
      <path d="M24 6c1.4 4.8 1.4 9.8 0 14.6-1.4-4.8-1.4-9.8 0-14.6Z" fill="currentColor" />
      <path d="M12.5 12.5c3.6 2.2 6.8 5.2 9.2 8.8-4.2-.8-8-3.2-10.8-6.6 0 0 1.6-1.4 1.6-2.2Z" fill="currentColor" opacity="0.85" />
      <path d="M35.5 12.5c-3.6 2.2-6.8 5.2-9.2 8.8 4.2-.8 8-3.2 10.8-6.6 0 0-1.6-1.4-1.6-2.2Z" fill="currentColor" opacity="0.85" />
      <path d="M24 21.2c2.4 3.4 4.2 7.2 5.2 11.2-1.6-1.2-3.4-2.1-5.2-2.6-1.8.5-3.6 1.4-5.2 2.6 1-4 2.8-7.8 5.2-11.2Z" fill="currentColor" />
      <circle cx="24" cy="20" r="1.6" fill="currentColor" />
    </svg>
  )
}

function BrandLogo({ inverted = false, slogan }) {
  const tpl = getWebTemplate()
  return (
    <span className={`inline-flex flex-col items-center gap-0.5 ${inverted ? 'text-white' : 'text-[#1f3f66]'}`}>
      <LotusMark className="sf-logo-mark" />
      <span className="text-[1.35rem] font-extrabold leading-none tracking-[0.22em]">{tpl.logoText || 'LOGO'}</span>
      {slogan ? (
        <span className={`text-[0.58rem] font-normal uppercase tracking-[0.28em] ${inverted ? 'text-white/70' : 'text-[#1f3f66]/55'}`}>
          {tpl.slogan || 'More Than a Gift'}
        </span>
      ) : null}
    </span>
  )
}

function readCatalogProducts() {
  const stored = getWebStoreProducts().filter((item) => item.published !== false)
  if (stored.length) {
    return stored.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image || GIFT_DEMO_PRODUCTS[0].image,
      tag: item.published ? 'çok sevilen' : 'yeni',
    }))
  }
  return GIFT_DEMO_PRODUCTS
}

export default function GiftStorefront({ preview = false }) {
  const [heroIndex, setHeroIndex] = useState(0)
  const [tab, setTab] = useState(GIFT_TABS[0].id)
  const [entered, setEntered] = useState(false)
  const [tick, setTick] = useState(0)
  const slide = GIFT_HERO_SLIDES[heroIndex]
  const products = useMemo(() => readCatalogProducts(), [tick])
  const tpl = getWebTemplate()

  useEffect(() => {
    if (document.getElementById('gift-sf-fonts')) return undefined
    const link = document.createElement('link')
    link.id = 'gift-sf-fonts'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;800&display=swap'
    document.head.appendChild(link)
    return undefined
  }, [])

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1)
    window.addEventListener('bach:web-catalog-updated', refresh)
    window.addEventListener('bach:web-template-updated', refresh)
    return () => {
      window.removeEventListener('bach:web-catalog-updated', refresh)
      window.removeEventListener('bach:web-template-updated', refresh)
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % GIFT_HERO_SLIDES.length)
    }, 6500)
    return () => window.clearInterval(id)
  }, [])

  const filtered = products.filter((item) => {
    if (tab === 'yeni-gelenler') return item.tag === 'yeni'
    if (tab === 'en-cok-hediye') return item.tag === 'hediye' || item.tag === 'çok sevilen'
    if (tab === 'indirimdekiler') return Boolean(item.discount)
    return true
  })
  const shown = (filtered.length ? filtered : products).slice(0, 8)
  const messages = [
    tpl.announcement || 'İlk siparişinde 250 TL indirim için hemen üye ol!',
    'Aynı gün teslimat — seçili bölgelerde',
    'Kurumsal hediyelerde özel teklif alın',
  ]
  const loop = [...messages, ...messages, ...messages, ...messages]

  return (
    <div className={`gift-sf ${preview ? 'rounded-[24px] border border-[#e8edf4] overflow-hidden' : 'min-h-dvh'}`}>
      <div className="sf-announce" aria-label="Kampanya duyurusu">
        <div className="sf-announce-track">
          {loop.map((text, index) => (
            <span key={`${text}-${index}`} className="inline-flex items-center gap-10">
              <span className="text-white/95">{text}</span>
              <span className="text-[#c9ad8a]">•</span>
            </span>
          ))}
        </div>
      </div>

      <div className="border-b border-[#1f3f66]/10 bg-[#fcfaf7]/95">
        <div className="sf-container hidden items-center justify-between py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f3f66]/55 lg:flex">
          <span>Aynı gün teslimat</span>
          <span>Güvenli ödeme</span>
          <span>Kurumsal teklif</span>
        </div>
        <div className="sf-container relative flex items-center gap-3 py-3 sm:py-4">
          <p className="hidden min-w-0 flex-1 text-xs font-semibold text-[#1f3f66]/55 sm:block">Teslimat: İstanbul</p>
          <div className="absolute inset-x-0 flex justify-center">
            <BrandLogo slogan />
          </div>
          <div className="flex min-w-0 flex-1 justify-end">
            <button
              type="button"
              className="flex h-11 w-full max-w-[22rem] items-center gap-2 rounded-full border border-[#1f3f66]/10 bg-white pl-4 pr-1.5"
              aria-label="Ara"
            >
              <span className="hidden flex-1 truncate text-left text-sm text-[#1f3f66]/40 sm:block">
                Marka, ürün veya kategori ara
              </span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#c9ad8a] text-[#1f3f66]">
                <Search className="h-4 w-4" />
              </span>
            </button>
          </div>
        </div>
        <nav className="sf-container hidden justify-center border-t border-[#1f3f66]/8 lg:flex" aria-label="Ana kategoriler">
          <ul className="flex w-max max-w-full items-center gap-1 py-1 xl:gap-2">
            {GIFT_NAV.map((item) => (
              <li key={item}>
                <span className="inline-flex h-11 items-center px-3 text-[13px] font-bold text-[#1f3f66]">{item}</span>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <section aria-label="Hediye kısayolları" className="w-full">
        <div className="sf-container flex justify-center py-5">
          <div className="flex w-max max-w-full justify-center gap-4 overflow-x-auto px-1 md:gap-7 xl:gap-9">
            {GIFT_SHORTCUTS.map((item) => (
              <div key={item.id} className="flex w-[84px] shrink-0 flex-col items-center gap-2.5 sm:w-[96px]">
                <span className="rounded-full border border-[#c9ad8a]/45 bg-[#fcfaf7] p-1.5 sm:p-[7px]">
                  <span className="relative block h-[64px] w-[64px] overflow-hidden rounded-full bg-[#f7f2ea] sm:h-[76px] sm:w-[76px]">
                    <img src={item.image} alt={item.label} className="h-full w-full object-cover" />
                  </span>
                </span>
                <span className="line-clamp-2 max-w-[6.5rem] text-center text-[12px] font-bold leading-tight text-[#1f3f66]/80">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sf-container flex flex-col items-center gap-4 py-4 lg:gap-5 lg:py-6">
        <div className="relative min-h-[420px] w-full overflow-hidden rounded-[28px] bg-[#1f3f66] sm:min-h-[480px] lg:min-h-[560px]">
          <img src={slide.image} alt={slide.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1f3f66]/80 via-[#1f3f66]/45 to-[#1f3f66]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1f3f66]/70 via-transparent to-[#1f3f66]/20" />
          <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-end p-6 sm:min-h-[480px] sm:p-10 lg:min-h-[560px] lg:p-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#c9ad8a]">{slide.eyebrow}</p>
            <h1 className="mt-3 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[#fcfaf7] sm:text-5xl lg:text-6xl">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#fcfaf7]/80 sm:text-base">{slide.description}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="inline-flex h-12 items-center rounded-full bg-[#c9ad8a] px-7 text-sm font-semibold text-[#1f3f66]">
                {slide.cta}
              </span>
              {[
                { icon: Truck, label: 'Aynı gün teslim' },
                { icon: Shield, label: 'Güvenli ödeme' },
                { icon: Sparkles, label: 'Özenli paketleme' },
              ].map((perk) => (
                <span
                  key={perk.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#fcfaf7]/20 bg-[#fcfaf7]/10 px-3 py-1.5 text-[11px] font-medium text-[#fcfaf7]/90"
                >
                  <perk.icon className="h-3.5 w-3.5 text-[#c9ad8a]" />
                  {perk.label}
                </span>
              ))}
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between p-4 sm:p-6">
            <div className="flex gap-2">
              {GIFT_HERO_SLIDES.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Slayt ${index + 1}`}
                  onClick={() => setHeroIndex(index)}
                  className={`h-1.5 rounded-full ${index === heroIndex ? 'w-8 bg-[#c9ad8a]' : 'w-2.5 bg-[#fcfaf7]/40'}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Önceki slayt"
                onClick={() => setHeroIndex((current) => (current - 1 + GIFT_HERO_SLIDES.length) % GIFT_HERO_SLIDES.length)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#fcfaf7]/25 bg-[#1f3f66]/40 text-[#fcfaf7]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Sonraki slayt"
                onClick={() => setHeroIndex((current) => (current + 1) % GIFT_HERO_SLIDES.length)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#fcfaf7]/25 bg-[#1f3f66]/40 text-[#fcfaf7]"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {slide.panels.map((panel) => (
            <div key={panel.title} className="relative min-h-[140px] overflow-hidden rounded-[22px] sm:min-h-[180px]">
              <img src={panel.image} alt={panel.title} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1f3f66]/80 via-[#1f3f66]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <p className="text-lg text-[#fcfaf7] sm:text-xl">{panel.title}</p>
                <span className="mt-2 inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-[#c9ad8a]">
                  {panel.cta} →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sf-container py-10 lg:py-14">
        <div className="flex justify-center">
          <div className="flex w-max max-w-full overflow-x-auto border-b border-[#1f3f66]/10">
            {GIFT_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`shrink-0 px-6 py-5 text-sm font-bold sm:px-10 ${
                  tab === item.id ? 'border-b-2 border-[#1f3f66] text-[#1f3f66]' : 'text-[#c9ad8a]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-8 lg:grid-cols-4 lg:gap-10">
          {shown.map((product) => (
            <article key={product.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#1f3f66]/8 bg-[#fcfaf7]">
              <div className="relative aspect-[9/16] overflow-hidden bg-[#f7f2ea]">
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1f3f66]"
                  aria-label="Favori"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-1 px-3 py-3">
                <p className="text-sm font-bold text-[#1f3f66]">{product.name}</p>
                <p className="text-sm font-extrabold text-[#1f3f66]">{money(product.price)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sf-container py-8 lg:py-12">
        <div className="overflow-hidden rounded-[28px] border border-[#1f3f66]/10 bg-white p-6 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#c9ad8a]">Haftalık hediye</p>
              <h2 className="mt-2 text-3xl font-extrabold text-[#1f3f66]">Çekilişe Katıl</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#1f3f66]/65">
                Her hafta hediye çekilişine katılın. Kazananlar pazartesi günü sitede duyurulur.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEntered(true)}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1f3f66] px-6 text-sm font-bold text-white"
            >
              <Gift className="h-4 w-4" />
              {entered ? 'Katıldınız' : 'Çekilişe Katıl'}
            </button>
          </div>
        </div>
      </section>

      <section className="sf-container pb-12">
        <h2 className="text-center text-2xl font-extrabold text-[#1f3f66]">Instagram</h2>
        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {GIFT_INSTAGRAM.map((image) => (
            <div key={image} className="aspect-square overflow-hidden rounded-2xl bg-[#f7f2ea]">
              <img src={image} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-[#1f3f66] text-white">
        <div className="sf-container border-b border-white/10 py-10 text-center">
          <p className="text-2xl font-extrabold sm:text-3xl">{tpl.logoText || 'LOGO'}’dan haberdar olun</p>
          <p className="mt-2 text-sm text-white/60">Yeni koleksiyonlar ve özel gün fırsatları için bültene katılın.</p>
        </div>
        <div className="sf-container grid gap-10 py-12 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <BrandLogo inverted slogan />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              Premium çikolata, çiçek ve lifestyle hediyelerle unutulmaz anlar yaratın. More than a gift.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {['Kurumsal', 'Müşteri Hizmetleri', 'Hesabım', 'Destek'].map((title) => (
              <div key={title}>
                <p className="text-sm font-bold">{title}</p>
                <p className="mt-3 text-sm text-white/55">Yakında</p>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
