import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Gift,
  Heart,
  Home,
  LayoutGrid,
  MapPin,
  Plus,
  Radio,
  Search,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trophy,
  Truck,
  User,
  X,
} from 'lucide-react'
import { getWebStoreProducts } from '../utils/webSiteStorage'
import { getWebTemplate } from '../utils/webTemplateStorage'
import {
  findCategory,
  findProduct,
  GIFT_CATEGORIES,
  GIFT_CITIES,
  GIFT_CORPORATE_AREAS,
  GIFT_FOOTER_COLS,
  GIFT_HERO_SLIDES,
  GIFT_INSTAGRAM,
  GIFT_LEGAL,
  GIFT_NAV,
  GIFT_OCCASIONS,
  GIFT_PRODUCTS,
  GIFT_SHORTCUTS,
  GIFT_TABS,
  GIFT_TRUST,
  GIFT_WINNERS,
  money,
  productsByCategory,
  productsForOccasion,
  productsForTab,
} from './giftTemplateData'
import './gift-storefront.css'

const CART_KEY = 'bach-web-sf-cart'
const FAV_KEY = 'bach-web-sf-favs'
const LOTTERY_KEY = 'bach-web-sf-lottery'
const DELIVERY_KEY = 'bach-web-sf-delivery'
const BASE = '/vitrin'

function sf(path = '/') {
  if (!path || path === '/') return BASE
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`
}

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new Event('bach:web-sf-updated'))
  } catch {
    /* ignore */
  }
}

function useBag() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const refresh = () => setTick((n) => n + 1)
    window.addEventListener('bach:web-sf-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('bach:web-sf-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  const cart = readJson(CART_KEY, [])
  const favs = readJson(FAV_KEY, [])
  const cartCount = cart.reduce((sum, row) => sum + (Number(row.qty) || 0), 0)
  return {
    tick,
    cart,
    favs,
    cartCount,
    favCount: favs.length,
    isFav: (id) => favs.includes(id),
    toggleFav(id) {
      const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id]
      writeJson(FAV_KEY, next)
    },
    addCart(id, qty = 1) {
      const found = cart.find((row) => row.id === id)
      const next = found
        ? cart.map((row) => (row.id === id ? { ...row, qty: row.qty + qty } : row))
        : [...cart, { id, qty }]
      writeJson(CART_KEY, next)
    },
    setQty(id, qty) {
      writeJson(
        CART_KEY,
        qty < 1 ? cart.filter((row) => row.id !== id) : cart.map((row) => (row.id === id ? { ...row, qty } : row)),
      )
    },
    removeCart(id) {
      writeJson(CART_KEY, cart.filter((row) => row.id !== id))
    },
  }
}

function catalogProducts() {
  const stored = getWebStoreProducts().filter((item) => item.published !== false)
  if (stored.length >= 8) {
    return stored.map((item, index) => {
      const fallback = GIFT_PRODUCTS[index % GIFT_PRODUCTS.length]
      return {
        ...fallback,
        id: item.id || fallback.id,
        name: item.name || fallback.name,
        slug: item.slug || fallback.slug,
        price: item.price || fallback.price,
        image: item.image || fallback.image,
        shortDescription: item.shortDescription || fallback.shortDescription,
      }
    })
  }
  return GIFT_PRODUCTS
}

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
    <Link to={sf('/')} className={`inline-flex flex-col items-center gap-0.5 ${inverted ? 'text-white' : 'text-[#1f3f66]'}`}>
      <LotusMark className="sf-logo-mark" />
      <span className="text-[1.35rem] font-extrabold leading-none tracking-[0.22em]">{tpl.logoText || 'LOGO'}</span>
      {slogan ? (
        <span className={`text-[0.58rem] font-normal uppercase tracking-[0.28em] ${inverted ? 'text-white/70' : 'text-[#1f3f66]/55'}`}>
          {tpl.slogan || 'More Than a Gift'}
        </span>
      ) : null}
    </Link>
  )
}

function ProductCard({ product, bag, onQuickView }) {
  const [hovered, setHovered] = useState(false)
  const fav = bag.isFav(product.id)
  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#1f3f66]/8 bg-[#fcfaf7]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[9/16] w-full shrink-0 overflow-hidden bg-[#f7f2ea]">
        <Link to={sf(`/urunler/${product.slug}`)} className="absolute inset-0 block">
          <img
            src={product.image}
            alt={product.name}
            className={`absolute inset-0 h-full w-full object-cover object-center transition duration-700 ${
              hovered && product.image2 ? 'scale-105 opacity-0' : 'opacity-100 group-hover:scale-[1.04]'
            }`}
          />
          {product.image2 ? (
            <img
              src={product.image2}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover object-center transition duration-700 ${
                hovered ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
              }`}
            />
          ) : null}
        </Link>
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
          {product.isNew ? (
            <span className="rounded-full bg-[#1f3f66] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#fcfaf7]">
              Yeni
            </span>
          ) : null}
          {product.discount > 0 ? (
            <span className="rounded-full bg-[#c9ad8a] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#1f3f66]">
              %{product.discount}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => bag.toggleFav(product.id)}
          aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border bg-[#fcfaf7]/90 backdrop-blur-sm ${
            fav ? 'border-[#c9ad8a] text-[#c9ad8a]' : 'border-[#1f3f66]/10 text-[#1f3f66]/70'
          }`}
        >
          <Heart className="h-4 w-4" fill={fav ? 'currentColor' : 'none'} strokeWidth={1.75} />
        </button>
        <div className="absolute inset-x-3 bottom-3 z-10 flex translate-y-0 gap-2 opacity-100 transition duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={() => bag.addCart(product.id, 1)}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#1f3f66] text-xs font-semibold text-[#fcfaf7]"
          >
            <Plus className="h-3.5 w-3.5" />
            Sepete Ekle
          </button>
          <button
            type="button"
            onClick={() => onQuickView(product)}
            aria-label="Hızlı bakış"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#1f3f66]/15 bg-[#fcfaf7] text-[#1f3f66]"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-[#1f3f66]/8 bg-[#fcfaf7] px-3 py-3 sm:px-3.5 sm:py-3.5">
        <Link to={sf(`/urunler/${product.slug}`)} className="line-clamp-2 font-bold leading-snug text-[#1f3f66]">
          {product.name}
        </Link>
        <p className="line-clamp-2 text-xs leading-relaxed text-[#1f3f66]/55">{product.shortDescription}</p>
        <div className="mt-auto pt-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold">{money(product.price)}</span>
            {product.oldPrice ? <span className="text-xs text-[#1f3f66]/45 line-through">{money(product.oldPrice)}</span> : null}
          </div>
          <p className="mt-1 text-[11px] text-[#c9ad8a]">{product.earliestDeliveryLabel}</p>
        </div>
      </div>
    </article>
  )
}

function ProductGrid({ products, bag, onQuickView }) {
  if (!products.length) {
    return <p className="py-12 text-center text-sm text-[#1f3f66]/55">Bu seçkide ürün yok.</p>
  }
  return (
    <div className="sf-grid-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} bag={bag} onQuickView={onQuickView} />
      ))}
    </div>
  )
}

function QuickView({ product, bag, onClose }) {
  if (!product) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1f3f66]/40 p-4" role="dialog">
      <div className="relative grid max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[28px] bg-[#fcfaf7] md:grid-cols-2">
        <button type="button" onClick={onClose} aria-label="Kapat" className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white">
          <X className="h-5 w-5" />
        </button>
        <div className="aspect-[9/16] bg-[#f7f2ea] md:aspect-auto">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        </div>
        <div className="p-6">
          <h2 className="sf-serif mt-2 text-2xl text-[#1f3f66]">{product.name}</h2>
          <p className="mt-2 text-sm text-[#1f3f66]/60">{product.shortDescription}</p>
          <p className="mt-4 text-lg font-extrabold">{money(product.price)}</p>
          <button
            type="button"
            onClick={() => {
              bag.addCart(product.id, 1)
              onClose()
            }}
            className="mt-6 inline-flex h-12 items-center rounded-full bg-[#1f3f66] px-6 text-sm font-bold text-white"
          >
            Sepete Ekle
          </button>
        </div>
      </div>
    </div>
  )
}

function MegaMenu({ category, open, onClose }) {
  if (!open || !category) return null
  const cols = (category.menuGroups || []).length >= 3 ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'
  return (
    <div role="region" aria-label={`${category.name} menüsü`} className="absolute inset-x-0 top-full z-50 border-t border-[#1f3f66]/8 bg-[#fcfaf7]/98 backdrop-blur-md">
      <button
        type="button"
        onClick={onClose}
        aria-label="Menüyü kapat"
        className="absolute right-4 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#1f3f66]/50 hover:bg-[#f7f2ea]"
      >
        <X className="h-5 w-5" />
      </button>
      <div className={`sf-container grid gap-8 py-5 pr-12 lg:py-6 lg:pr-14 ${cols}`}>
        {(category.menuGroups || []).map((group) => (
          <div key={group.title} className="min-w-0">
            <p className="mb-3.5 text-base font-extrabold uppercase tracking-[0.16em] text-[#1f3f66]">{group.title}</p>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <Link to={sf(item.href)} onClick={onClose} className="group flex items-center gap-3.5 py-1">
                    <span className="relative h-[4.25rem] w-[2.4rem] shrink-0 overflow-hidden rounded-sm bg-[#f7f2ea] sm:h-[4.75rem] sm:w-[2.65rem]">
                      <img src={item.image} alt="" className="h-full w-full object-contain p-0.5 transition duration-300 group-hover:scale-105" />
                    </span>
                    <span className="text-sm font-normal leading-snug text-[#1f3f66]/70 group-hover:text-[#1f3f66]">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function DeliveryPicker() {
  const [open, setOpen] = useState(false)
  const [city, setCity] = useState(() => readJson(DELIVERY_KEY, { city: '', district: '' }).city)
  const [district, setDistrict] = useState(() => readJson(DELIVERY_KEY, { city: '', district: '' }).district)
  const [query, setQuery] = useState('')
  const label = city ? (district ? `${district}, ${city}` : city) : 'Gönderim yeri seçin'
  const districts = GIFT_CITIES.find((row) => row.name === city)?.districts || []
  const cities = GIFT_CITIES.map((row) => row.name).filter((name) =>
    name.toLocaleLowerCase('tr-TR').includes(query.toLocaleLowerCase('tr-TR')),
  )

  function pickCity(name) {
    setCity(name)
    setDistrict('')
    setQuery('')
  }
  function pickDistrict(name) {
    setDistrict(name)
    writeJson(DELIVERY_KEY, { city, district: name })
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#1f3f66]/10 bg-white px-3 py-2 text-left text-sm text-[#1f3f66]/70"
      >
        <MapPin className="h-4 w-4 text-[#c9ad8a]" />
        <span className="truncate">{label}</span>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-[70] mt-2 w-72 rounded-2xl border border-[#1f3f66]/10 bg-white p-3 shadow-xl">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="İl veya ilçe ara"
            className="h-10 w-full rounded-full border border-[#1f3f66]/10 px-4 text-sm outline-none"
          />
          <ul className="mt-2 max-h-56 overflow-auto text-sm">
            {!city
              ? cities.map((name) => (
                  <li key={name}>
                    <button type="button" className="w-full rounded-lg px-3 py-2 text-left hover:bg-[#f7f2ea]" onClick={() => pickCity(name)}>
                      {name}
                    </button>
                  </li>
                ))
              : districts.map((name) => (
                  <li key={name}>
                    <button type="button" className="w-full rounded-lg px-3 py-2 text-left hover:bg-[#f7f2ea]" onClick={() => pickDistrict(name)}>
                      {name}
                    </button>
                  </li>
                ))}
          </ul>
          {city ? (
            <button type="button" className="mt-2 text-xs font-bold text-[#1f3f66]/55" onClick={() => { setCity(''); setDistrict(''); writeJson(DELIVERY_KEY, { city: '', district: '' }) }}>
              İli değiştir
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function SearchOverlay({ open, onClose, products }) {
  const [q, setQ] = useState('')
  if (!open) return null
  const hits = products.filter((p) =>
    `${p.name} ${p.shortDescription} ${(p.tags || []).join(' ')}`.toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR')),
  ).slice(0, 8)
  return (
    <div className="fixed inset-0 z-[80] bg-[#1f3f66]/40 p-4" onClick={onClose}>
      <div className="mx-auto mt-16 max-w-2xl rounded-[28px] bg-[#fcfaf7] p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-[#c9ad8a]" />
          <input
            autoFocus
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Marka, ürün veya kategori ara"
            className="h-12 flex-1 bg-transparent text-lg outline-none"
          />
          <button type="button" onClick={onClose} aria-label="Kapat"><X className="h-5 w-5" /></button>
        </div>
        <ul className="mt-4 space-y-2">
          {hits.map((p) => (
            <li key={p.id}>
              <Link to={sf(`/urunler/${p.slug}`)} onClick={onClose} className="flex items-center gap-3 rounded-xl p-2 hover:bg-[#f7f2ea]">
                <img src={p.image} alt="" className="h-14 w-8 rounded-sm object-cover" />
                <span>
                  <span className="block text-sm font-bold">{p.name}</span>
                  <span className="text-xs text-[#1f3f66]/55">{money(p.price)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {q ? (
          <Link to={`${sf('/arama')}?q=${encodeURIComponent(q)}`} onClick={onClose} className="mt-4 inline-flex text-sm font-bold text-[#1f3f66]">
            Tüm sonuçlar
          </Link>
        ) : null}
      </div>
    </div>
  )
}

function SiteChrome({ preview, bag, products, children, searchOpen, setSearchOpen }) {
  const location = useLocation()
  const tpl = getWebTemplate()
  const [megaId, setMegaId] = useState(null)
  const [fullChrome, setFullChrome] = useState(true)
  const navRef = useRef(null)
  const messages = [
    tpl.announcement || 'İlk siparişinde 250 TL indirim için hemen üye ol!',
    'Aynı gün teslimat — seçili bölgelerde',
    'Kurumsal hediyelerde özel teklif alın',
  ]
  const loop = [...messages, ...messages]
  const activeNav = GIFT_NAV.find((item) => item.id === megaId)
  const activeCategory = activeNav ? findCategory(activeNav.slug) : null

  useEffect(() => {
    if (!megaId) return undefined
    const onDown = (event) => {
      if (!navRef.current?.contains(event.target)) setMegaId(null)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') setMegaId(null)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [megaId])

  useEffect(() => {
    if (preview) return undefined
    const onScroll = () => setFullChrome(window.scrollY < 100)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [preview])

  const mobileItems = [
    { href: sf('/'), label: 'Ana Sayfa', icon: Home, active: location.pathname === BASE || location.pathname === `${BASE}/` },
    { href: sf('/kategoriler'), label: 'Kategoriler', icon: LayoutGrid, active: location.pathname.includes('/kategoriler') },
    { href: `${sf('/hesap')}?tab=favori`, label: 'Favoriler', icon: Heart, active: location.search.includes('favori'), badge: bag.favCount },
    { href: sf('/sepet'), label: 'Sepet', icon: ShoppingBag, active: location.pathname.includes('/sepet'), badge: bag.cartCount },
    { href: sf('/hesap'), label: 'Hesabım', icon: User, active: location.pathname.includes('/hesap') && !location.search.includes('favori') },
  ]

  return (
    <>
      <header className="sticky top-0 z-50">
        <div className={fullChrome ? '' : 'hidden'}>
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
        </div>

        <div className="relative z-[60] border-b border-[#1f3f66]/10 bg-[#c9ad8a] text-[#1f3f66]">
          <div className="sf-container flex min-h-9 items-center justify-end gap-4 py-1.5 text-[12px] sm:gap-5 sm:text-[13px]">
            <nav aria-label="Hızlı hesap bağlantıları" className="flex items-center gap-4 sm:gap-5">
              <Link to={sf('/hesap')} className="whitespace-nowrap text-[#1f3f66]/80 hover:text-[#1f3f66]">Giriş Yap / Üye Ol</Link>
              <Link to={sf('/sepet')} className="inline-flex items-center gap-1.5 whitespace-nowrap text-[#1f3f66]/80 hover:text-[#1f3f66]">
                Sepetim
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1f3f66] px-1.5 text-[11px] font-medium text-[#fcfaf7]">
                  {bag.cartCount}
                </span>
              </Link>
              <Link to={`${sf('/hesap')}?tab=siparis`} className="whitespace-nowrap text-[#1f3f66]/80 hover:text-[#1f3f66]">Sipariş Durumu</Link>
            </nav>
          </div>
        </div>

        <div className={`border-b border-[#1f3f66]/8 bg-[#fcfaf7]/92 backdrop-blur-md ${fullChrome ? '' : 'shadow-[0_10px_28px_-22px_rgba(16,24,39,0.35)]'}`}>
          <div className={fullChrome ? '' : 'hidden'}>
            <div className="sf-container relative flex items-center gap-3 py-3 sm:gap-6 sm:py-4">
              <div className="relative z-10 flex min-w-0 flex-1 justify-start">
                <div className="w-full max-w-[min(100%,22rem)]">
                  <DeliveryPicker />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-x-0 z-20 flex justify-center">
                <div className="pointer-events-auto">
                  <BrandLogo slogan />
                </div>
              </div>
              <div className="relative z-10 flex min-w-0 flex-1 justify-end">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="group flex h-11 w-full max-w-[min(100%,22rem)] items-center gap-2 rounded-full border border-[#1f3f66]/10 bg-white pl-4 pr-1.5 sm:min-w-[14rem]"
                  aria-label="Ara"
                >
                  <span className="hidden flex-1 truncate text-left text-sm text-[#1f3f66]/40 sm:block">Marka, ürün veya kategori ara</span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#c9ad8a] text-[#1f3f66] sm:h-9 sm:w-9">
                    <Search className="h-4 w-4" />
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div ref={navRef} className="relative hidden border-t border-[#1f3f66]/8 lg:block">
            <nav aria-label="Ana kategoriler" className="sf-container flex justify-center">
              <ul className="mx-auto flex w-max max-w-full items-center justify-center gap-1 xl:gap-2">
                {GIFT_NAV.map((item) => {
                  const isOpen = megaId === item.id
                  const cat = findCategory(item.slug)
                  const hasMenu = Boolean(cat?.menuGroups?.length)
                  return (
                    <li key={item.id} className="relative">
                      <Link
                        to={sf(item.href)}
                        className={`inline-flex h-12 items-center gap-1.5 px-3 text-[12px] font-semibold uppercase tracking-[0.14em] xl:px-4 ${
                          isOpen ? 'text-[#1f3f66]' : 'text-[#1f3f66]/75 hover:text-[#1f3f66]'
                        }`}
                        onClick={(event) => {
                          if (!hasMenu) return
                          event.preventDefault()
                          setMegaId(isOpen ? null : item.id)
                        }}
                        aria-expanded={hasMenu ? isOpen : undefined}
                        aria-haspopup={hasMenu ? 'true' : undefined}
                      >
                        {item.icon === 'gift' ? <Gift className="h-3.5 w-3.5 text-[#c9ad8a]" /> : null}
                        {item.label}
                        {hasMenu ? (
                          <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
            <MegaMenu category={activeCategory} open={Boolean(activeCategory && megaId)} onClose={() => setMegaId(null)} />
          </div>
        </div>
      </header>

      {children}

      <footer className="bg-[#1f3f66] text-white">
        <div className="sf-container border-b border-white/10 py-10 text-center sm:py-12">
          <p className="sf-serif text-2xl sm:text-3xl">{tpl.logoText || 'LOGO'}’dan haberdar olun</p>
          <p className="mt-2 text-sm text-white/60">Yeni koleksiyonlar ve özel gün fırsatları için bültene katılın.</p>
          <FooterForm dark />
        </div>
        <div className="sf-container grid gap-10 py-12 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <BrandLogo inverted slogan />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              Premium çikolata, çiçek ve lifestyle hediyelerle unutulmaz anlar yaratın. More than a gift.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {['Instagram', 'Facebook', 'Pinterest', 'YouTube'].map((label) => (
                <span key={label} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-xs text-white/80">
                  {label.slice(0, 2)}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {GIFT_FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9ad8a]">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link to={sf(link.href)} className="text-sm text-white/65 hover:text-white">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="sf-container flex flex-col gap-3 border-t border-white/10 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {tpl.logoText || 'LOGO'}. Tüm hakları saklıdır.</p>
          <p className="tracking-wide">Ödeme: Visa · Mastercard · Troy · Apple Pay · Kapıda Ödeme</p>
        </div>
      </footer>

      {preview ? null : (
        <nav
          aria-label="Mobil alt menü"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-[#1f3f66]/10 bg-[#fcfaf7]/95 backdrop-blur-md lg:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <ul className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-5 px-1">
            {mobileItems.map((item) => (
              <li key={item.label} className="min-w-0">
                <Link
                  to={item.href}
                  aria-label={item.label}
                  className={`relative flex h-full flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-wide ${
                    item.active ? 'text-[#1f3f66]' : 'text-[#1f3f66]/45'
                  }`}
                >
                  <span className="relative">
                    <item.icon className="h-[1.15rem] w-[1.15rem]" />
                    {item.badge > 0 ? (
                      <span className="absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c9ad8a] px-1 text-[9px] font-semibold text-[#1f3f66]">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} products={products} />
    </>
  )
}

function FooterForm({ dark }) {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  if (done) return <p className={`mt-6 text-sm font-medium ${dark ? 'text-[#c9ad8a]' : 'text-[#1f3f66]'}`}>Teşekkürler — listemize eklendiniz.</p>
  return (
    <form
      className="mt-6 flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault()
        if (email.trim()) setDone(true)
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="E-posta adresiniz"
        className={`h-12 flex-1 rounded-full border px-5 text-sm outline-none ${
          dark ? 'border-white/15 bg-[#2b527a] text-white placeholder:text-white/40' : 'border-[#1f3f66]/15 bg-[#fcfaf7]'
        }`}
      />
      <button type="submit" className={`h-12 rounded-full px-7 text-sm font-bold ${dark ? 'bg-[#c9ad8a] text-[#1f3f66]' : 'bg-[#1f3f66] text-white'}`}>
        Kayıt Ol
      </button>
    </form>
  )
}

function HomeView({ products, bag, onQuickView, logoText }) {
  const [heroIndex, setHeroIndex] = useState(0)
  const [tab, setTab] = useState(GIFT_TABS[0].id)
  const [igIndex, setIgIndex] = useState(0)
  const [entered, setEntered] = useState(() => Boolean(readJson(LOTTERY_KEY, false)))
  const [remain, setRemain] = useState(0)
  const [newsEmail, setNewsEmail] = useState('')
  const [newsDone, setNewsDone] = useState(false)
  const slide = GIFT_HERO_SLIDES[heroIndex]
  const shown = productsForTab(products, tab)
  const visibleIg = GIFT_INSTAGRAM.slice(igIndex, igIndex + 4)
  const maxIg = Math.max(0, GIFT_INSTAGRAM.length - 4)

  useEffect(() => {
    const id = window.setInterval(() => setHeroIndex((i) => (i + 1) % GIFT_HERO_SLIDES.length), 6500)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const tick = () => setRemain(Math.max(0, end.getTime() - Date.now()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  const total = Math.floor(remain / 1000)
  const clock = {
    h: String(Math.floor(total / 3600)).padStart(2, '0'),
    m: String(Math.floor((total % 3600) / 60)).padStart(2, '0'),
    s: String(total % 60).padStart(2, '0'),
  }

  return (
    <>
      <section aria-label="Hediye kısayolları" className="w-full">
        <div className="sf-container flex justify-center py-5">
          <div className="sf-hide-scroll flex w-max max-w-full justify-center gap-4 overflow-x-auto px-1 md:gap-7 xl:gap-9">
            {GIFT_SHORTCUTS.map((item) => (
              <Link key={item.id} to={sf(item.href)} className="group flex w-[84px] shrink-0 flex-col items-center gap-2.5 sm:w-[96px]">
                <span className="rounded-full border border-[#c9ad8a]/45 bg-[#fcfaf7] p-1.5 shadow-[0_1px_0_rgba(31,63,102,0.04)] sm:p-[7px]">
                  <span className="relative block h-[64px] w-[64px] overflow-hidden rounded-full bg-[#f7f2ea] ring-1 ring-[#1f3f66]/8 sm:h-[76px] sm:w-[76px]">
                    <img src={item.image} alt={item.label} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </span>
                </span>
                <span className="line-clamp-2 max-w-[6.5rem] text-center text-[12px] font-bold leading-tight text-[#1f3f66]/80">{item.label}</span>
              </Link>
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
            <h1 className="sf-serif mt-3 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[#fcfaf7] sm:text-5xl lg:text-6xl">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#fcfaf7]/80 sm:text-base">{slide.description}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to={sf(slide.href)} className="inline-flex h-12 items-center rounded-full bg-[#c9ad8a] px-7 text-sm font-semibold text-[#1f3f66]">
                {slide.cta}
              </Link>
              {[
                { icon: Truck, label: 'Aynı gün teslim' },
                { icon: Shield, label: 'Güvenli ödeme' },
                { icon: Sparkles, label: 'Özenli paketleme' },
              ].map((perk) => (
                <span key={perk.label} className="inline-flex items-center gap-1.5 rounded-full border border-[#fcfaf7]/20 bg-[#fcfaf7]/10 px-3 py-1.5 text-[11px] font-medium text-[#fcfaf7]/90">
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
              <button type="button" aria-label="Önceki slayt" onClick={() => setHeroIndex((i) => (i - 1 + GIFT_HERO_SLIDES.length) % GIFT_HERO_SLIDES.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#fcfaf7]/25 bg-[#1f3f66]/40 text-[#fcfaf7]">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" aria-label="Sonraki slayt" onClick={() => setHeroIndex((i) => (i + 1) % GIFT_HERO_SLIDES.length)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#fcfaf7]/25 bg-[#1f3f66]/40 text-[#fcfaf7]">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {(GIFT_HERO_SLIDES[0].panels || []).map((panel) => (
            <Link key={panel.title} to={sf(panel.href)} className="group relative min-h-[140px] overflow-hidden rounded-[22px] sm:min-h-[180px]">
              <img src={panel.image} alt={panel.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1f3f66]/80 via-[#1f3f66]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <p className="sf-serif text-lg text-[#fcfaf7] sm:text-xl">{panel.title}</p>
                <span className="mt-2 inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-[#c9ad8a]">{panel.cta} →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="w-full bg-[#1f3f66] text-[#fcfaf7]">
        <div className="sf-container py-8 sm:py-10">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
            {GIFT_TRUST.map((badge, index) => (
              <li key={badge.id} className={`flex items-start gap-3.5 px-3 py-3 lg:px-5 ${index > 0 ? 'lg:border-l lg:border-white/10' : ''}`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#c9ad8a]/35 bg-[#c9ad8a]/10 text-[#c9ad8a]">
                  <Shield className="h-[1.15rem] w-[1.15rem]" />
                </span>
                <div>
                  <p className="text-[13px] font-extrabold tracking-tight">{badge.label}</p>
                  <p className="mt-1 text-[12px] leading-snug text-[#fcfaf7]/65">{badge.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-label="Ürün seçkisi" className="w-full">
        <div className="sf-container py-10 lg:py-14">
          <div className="flex justify-center">
            <div role="tablist" className="sf-hide-scroll relative flex w-max max-w-full items-stretch justify-center overflow-x-auto border-b border-[#1f3f66]/10">
              {GIFT_TABS.map((item) => {
                const selected = tab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setTab(item.id)}
                    className={`group relative shrink-0 px-6 py-5 sm:px-10 sm:py-6 ${selected ? 'text-[#1f3f66]' : 'text-[#c9ad8a] hover:text-[#1f3f66]'}`}
                  >
                    <span className="block whitespace-nowrap text-base font-bold tracking-[0.04em] sm:text-lg lg:text-[1.35rem]">{item.label}</span>
                    <span className={`absolute inset-x-6 bottom-0 h-[2.5px] origin-center bg-[#1f3f66] transition sm:inset-x-10 ${selected ? 'scale-x-100 opacity-100' : 'scale-x-50 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'}`} />
                  </button>
                )
              })}
            </div>
          </div>
          <div className="mt-8 lg:mt-10">
            <ProductGrid products={shown} bag={bag} onQuickView={onQuickView} />
          </div>
        </div>
      </section>

      <section aria-labelledby="lottery-title" className="w-full">
        <div className="sf-container py-12 lg:py-16">
          <div className="overflow-hidden rounded-[28px] border border-[#1f3f66]/8 bg-white">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
              <div className="p-6 sm:p-8 lg:p-10">
                <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#c9ad8a]">
                  <Trophy className="h-3.5 w-3.5" /> Haftalık Çekiliş
                </p>
                <h2 id="lottery-title" className="sf-serif mt-4 text-3xl text-[#1f3f66] sm:text-4xl">Hediye Çekilişi</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#1f3f66]/55">
                  Her hafta hediye çekilişine katılın, siz de sevdiklerinizi mutlu edin. Kazananlar Cumartesi günü sitede ve Instagram’da duyurulur; hediyeler Pazartesi yola çıkar.
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {[
                    { id: 'normal', label: 'Normal', description: 'Seçili çikolata ve küçük hediye kutuları', tone: 'border-[#1f3f66]/10 bg-[#fcfaf7]' },
                    { id: 'luks', label: 'Lüks', description: 'Premium kutu, buket ve signature setler', tone: 'border-[#c9ad8a]/50 bg-[#c9ad8a]/15' },
                    { id: 'ultra', label: 'Ultra Lüks', description: 'Üst segment hediye deneyimi ve özel ambalaj', tone: 'border-[#1f3f66]/20 bg-[#1f3f66] text-[#fcfaf7]' },
                  ].map((tier) => (
                    <div key={tier.id} className={`rounded-2xl border px-4 py-4 ${tier.tone}`}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">Bu haftanın hediyesi</p>
                      <p className="mt-2 text-lg font-extrabold tracking-tight">{tier.label}</p>
                      <p className={`mt-1.5 text-xs leading-snug ${tier.id === 'ultra' ? 'text-[#fcfaf7]/70' : 'text-[#1f3f66]/55'}`}>{tier.description}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
                  {[
                    { label: 'Saat', value: clock.h },
                    { label: 'Dakika', value: clock.m },
                    { label: 'Saniye', value: clock.s },
                  ].map((cell) => (
                    <div key={cell.label} className="rounded-2xl bg-[#fcfaf7] px-3 py-4 text-center">
                      <p className="sf-serif text-3xl font-extrabold">{cell.value}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#1f3f66]/45">{cell.label}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[#1f3f66]/45">Bir sonraki duyuru / katılım penceresine kalan süre</p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={entered}
                    onClick={() => { writeJson(LOTTERY_KEY, true); setEntered(true) }}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1f3f66] px-7 text-sm font-bold text-[#fcfaf7] disabled:opacity-50"
                  >
                    <Gift className="h-4 w-4" />
                    {entered ? 'Bu hafta katıldınız' : 'Çekilişe Katıl'}
                  </button>
                  <Link to={sf('/hesap')} className="inline-flex h-12 items-center rounded-full border border-[#1f3f66]/15 px-5 text-sm font-bold">Üye Ol / Giriş Yap</Link>
                  <a href="#canli" className="inline-flex h-12 items-center gap-2 rounded-full border border-[#1f3f66]/15 px-5 text-sm font-bold">
                    <Radio className="h-4 w-4" /> Canlı yayına git
                  </a>
                </div>
              </div>
              <div className="border-t border-[#1f3f66]/8 bg-[#fcfaf7]/70 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#1f3f66]/70">Son kazananlar</h3>
                <ul className="mt-5 space-y-3">
                  {GIFT_WINNERS.map((w) => (
                    <li key={w.id} className="flex items-center justify-between rounded-2xl border border-[#1f3f66]/8 bg-white px-4 py-3">
                      <div>
                        <p className="text-sm font-bold">{w.displayName}</p>
                        <p className="text-xs text-[#1f3f66]/55">{w.city} · {w.prize}</p>
                      </div>
                      <span className="text-[11px] font-bold text-[#c9ad8a]">{w.date}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 space-y-4 border-t border-[#1f3f66]/10 pt-6">
                  <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#1f3f66]/70">Çekiliş şartları</h3>
                  <ul className="space-y-3 text-sm leading-relaxed text-[#1f3f66]/55">
                    <li className="flex gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#c9ad8a]" />
                      <span>Çekilişe katılmak için <Link to={sf('/hesap')} className="font-bold text-[#1f3f66]">üye</Link> olmanız gerekir. Giriş yaptıktan sonra “Çekilişe Katıl” yeterlidir.</span>
                    </li>
                    <li className="flex gap-3">
                      <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-[#c9ad8a]" />
                      <span>Her hafta <strong className="text-[#1f3f66]">Normal</strong>, <strong className="text-[#1f3f66]">Lüks</strong> ve <strong className="text-[#1f3f66]">Ultra Lüks</strong> olmak üzere 3 çeşit hediye verilir.</span>
                    </li>
                    <li className="flex gap-3">
                      <Radio className="mt-0.5 h-4 w-4 shrink-0 text-[#c9ad8a]" />
                      <span>Kazananlar her <strong className="text-[#1f3f66]">Cumartesi</strong> sitede ve Instagram’da yayınlanır.</span>
                    </li>
                    <li className="flex gap-3">
                      <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#c9ad8a]" />
                      <span>Hediyeler <strong className="text-[#1f3f66]">Pazartesi</strong> günü yola çıkar.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="instagram-title" className="w-full">
        <div className="sf-container py-12 lg:py-16">
          <div className="mb-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#c9ad8a]">Sosyal</p>
            <h2 id="instagram-title" className="sf-serif mt-2 text-3xl sm:text-4xl">@{String(logoText || 'LOGO').toLowerCase()}</h2>
            <p className="mt-2 text-sm text-[#1f3f66]/55">Gerçek hediyeler, gerçek anlar.</p>
          </div>
          <div className="relative">
            <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
              {visibleIg.map((post) => (
                <div key={post.id} className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-[#f7f2ea]">
                  <img src={post.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1f3f66]/35 via-transparent to-transparent" />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setIgIndex((i) => Math.max(0, i - 1))} disabled={igIndex === 0} aria-label="Önceki" className="absolute left-0 top-1/2 z-10 inline-flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#1f3f66]/10 bg-[#fcfaf7]/95 disabled:opacity-30">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => setIgIndex((i) => Math.min(maxIg, i + 1))} disabled={igIndex >= maxIg} aria-label="Sonraki" className="absolute right-0 top-1/2 z-10 inline-flex h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#1f3f66]/10 bg-[#fcfaf7]/95 disabled:opacity-30">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-8 text-center">
            <span className="text-sm font-bold tracking-wide text-[#1f3f66]/70">Daha fazla göster</span>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#1f3f66] text-[#fcfaf7]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-24">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#c9ad8a]">{logoText || 'LOGO'}</p>
          <h2 className="sf-serif mt-4 text-3xl leading-tight sm:text-5xl">Bir hediyeden daha fazlası.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-[#fcfaf7]/75 sm:text-base">
            Her kutu bir hikâye taşır. Özenle seçilmiş çikolatalar, taze buketler ve lifestyle dokunuşlarla anları kalıcı kılarız — sade, sıcak ve unutulmaz.
          </p>
          <Link to={sf('/kurumsal')} className="mt-8 inline-flex h-12 items-center rounded-full border border-[#c9ad8a]/50 px-7 text-sm font-semibold text-[#c9ad8a]">
            Hikâyemizi Keşfet
          </Link>
        </div>
      </section>

      <section className="w-full border-t border-[#1f3f66]/8 bg-white">
        <div className="sf-container flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-md">
            <h2 className="sf-serif text-2xl sm:text-3xl">Özel günleri kaçırma</h2>
            <p className="mt-2 text-sm text-[#1f3f66]/55">Kampanyalar, yeni ürünler ve hediye fikirleri e-postanda.</p>
          </div>
          {newsDone ? (
            <p className="text-sm font-medium">Teşekkürler — listemize eklendin.</p>
          ) : (
            <form
              className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                if (newsEmail.trim()) setNewsDone(true)
              }}
            >
              <input
                type="email"
                required
                value={newsEmail}
                onChange={(event) => setNewsEmail(event.target.value)}
                placeholder="E-posta adresin"
                className="h-12 flex-1 rounded-full border border-[#1f3f66]/15 bg-[#fcfaf7] px-5 text-sm outline-none"
              />
              <button type="submit" className="h-12 shrink-0 rounded-full bg-[#1f3f66] px-6 text-sm font-semibold text-[#fcfaf7]">Abone Ol</button>
            </form>
          )}
        </div>
      </section>
    </>
  )
}

function CategoryIndex({ bag, onQuickView, products }) {
  return (
    <div className="sf-container py-12">
      <h1 className="sf-serif text-3xl sm:text-4xl">Kategoriler</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GIFT_CATEGORIES.map((cat) => (
          <Link key={cat.id} to={sf(`/kategoriler/${cat.slug}`)} className="group overflow-hidden rounded-3xl border border-[#1f3f66]/8 bg-white">
            <div className="aspect-[16/9] overflow-hidden bg-[#f7f2ea]">
              <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <div className="p-5">
              <h2 className="sf-serif text-xl">{cat.name}</h2>
              <p className="mt-2 text-sm text-[#1f3f66]/55">{cat.description}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-12">
        <ProductGrid products={products.slice(0, 10)} bag={bag} onQuickView={onQuickView} />
      </div>
    </div>
  )
}

function CategoryPage({ slug, products, bag, onQuickView }) {
  const [params] = useSearchParams()
  const category = findCategory(slug)
  const [sort, setSort] = useState('recommended')
  const [sortOpen, setSortOpen] = useState(false)
  const [chip, setChip] = useState(params.get('tur') || params.get('gun') || params.get('icin') || '')
  const list = useMemo(() => {
    let rows = productsByCategory(slug).length ? productsByCategory(slug) : products
    if (chip) {
      const needle = chip.toLocaleLowerCase('tr-TR').replace(/-/g, ' ')
      rows = rows.filter((p) => `${p.name} ${p.shortDescription} ${(p.tags || []).join(' ')}`.toLocaleLowerCase('tr-TR').includes(needle))
    }
    if (sort === 'price-asc') rows = [...rows].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') rows = [...rows].sort((a, b) => b.price - a.price)
    if (sort === 'newest') rows = [...rows].filter((p) => p.isNew).concat(rows.filter((p) => !p.isNew))
    if (sort === 'bestsellers') rows = [...rows].filter((p) => p.isBestseller).concat(rows.filter((p) => !p.isBestseller))
    return rows
  }, [slug, products, sort, chip])

  if (!category) {
    return (
      <div className="sf-container py-16 text-center">
        <h1 className="sf-serif text-3xl">Kategori bulunamadı</h1>
        <Link to={sf('/kategoriler')} className="mt-4 inline-flex text-sm font-bold">Tüm kategoriler</Link>
      </div>
    )
  }

  const chips = (category.menuGroups || []).flatMap((g) => g.items)

  return (
    <div>
      <section className="relative overflow-hidden bg-[#1f3f66] text-[#fcfaf7]">
        <img src={category.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="sf-container relative py-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#c9ad8a]">Kategori</p>
          <h1 className="sf-serif mt-3 max-w-2xl text-4xl sm:text-5xl">{category.name}</h1>
          <p className="mt-3 max-w-xl text-sm text-[#fcfaf7]/75">{category.description}</p>
        </div>
      </section>
      <div className="sf-container py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="sf-hide-scroll flex max-w-full gap-2 overflow-x-auto">
            <button type="button" onClick={() => setChip('')} className={`rounded-full px-4 py-2 text-xs font-bold ${chip ? 'bg-[#f7f2ea]' : 'bg-[#1f3f66] text-white'}`}>Tümü</button>
            {chips.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setChip(item.label)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold ${chip === item.label ? 'bg-[#1f3f66] text-white' : 'bg-[#f7f2ea]'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <button type="button" onClick={() => setSortOpen((v) => !v)} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#1f3f66]/15 px-4 text-sm font-bold">
              Sırala <ChevronDown className="h-4 w-4" />
            </button>
            {sortOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-[#1f3f66]/10 bg-white p-2 shadow-xl">
                {[
                  ['recommended', 'Önerilen'],
                  ['bestsellers', 'Çok satanlar'],
                  ['newest', 'En yeni'],
                  ['price-asc', 'Fiyat: düşük → yüksek'],
                  ['price-desc', 'Fiyat: yüksek → düşük'],
                ].map(([id, label]) => (
                  <button key={id} type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f7f2ea]" onClick={() => { setSort(id); setSortOpen(false) }}>
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-8">
          <ProductGrid products={list} bag={bag} onQuickView={onQuickView} />
        </div>
      </div>
    </div>
  )
}

function ProductPage({ slug, products, bag }) {
  const product = findProduct(slug) || products.find((p) => p.slug === slug)
  const [qty, setQty] = useState(1)
  const [wrap, setWrap] = useState(false)
  const [note, setNote] = useState('')
  const [slot, setSlot] = useState('12-15')
  const [msg, setMsg] = useState('')
  if (!product) {
    return (
      <div className="sf-container py-16 text-center">
        <h1 className="sf-serif text-3xl">Ürün bulunamadı</h1>
        <Link to={sf('/')} className="mt-4 inline-flex text-sm font-bold">Ana sayfa</Link>
      </div>
    )
  }
  const related = products.filter((p) => p.id !== product.id).slice(0, 5)
  return (
    <div className="sf-container py-10">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="overflow-hidden rounded-[28px] bg-[#f7f2ea]">
          <div className="aspect-[9/16] sm:aspect-[4/5]">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#c9ad8a]">{product.earliestDeliveryLabel}</p>
          <h1 className="sf-serif mt-2 text-[2.15rem] leading-[1.12] sm:text-[2.6rem]">{product.name}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#1f3f66]/60">{product.description}</p>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-2xl font-extrabold">{money(product.price)}</span>
            {product.oldPrice ? <span className="text-sm text-[#1f3f66]/45 line-through">{money(product.oldPrice)}</span> : null}
          </div>
          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1f3f66]/55">Teslimat saati</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {['09-12', '12-15', '15-18', '18-21'].map((id) => (
                <button key={id} type="button" onClick={() => setSlot(id)} className={`rounded-full px-4 py-2 text-xs font-bold ${slot === id ? 'bg-[#1f3f66] text-white' : 'bg-[#f7f2ea]'}`}>
                  {id.replace('-', ':00 – ')}:00
                </button>
              ))}
            </div>
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={wrap} onChange={(event) => setWrap(event.target.checked)} />
            Hediye paketi (+150 ₺)
          </label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Hediye notu"
            className="mt-3 w-full rounded-2xl border border-[#1f3f66]/10 bg-white px-4 py-3 text-sm outline-none"
            rows={3}
          />
          <div className="mt-6 flex items-center gap-3">
            <div className="inline-flex h-12 items-center rounded-full border border-[#1f3f66]/15">
              <button type="button" className="px-4" onClick={() => setQty((n) => Math.max(1, n - 1))}>−</button>
              <span className="w-8 text-center text-sm font-bold">{qty}</span>
              <button type="button" className="px-4" onClick={() => setQty((n) => n + 1)}>+</button>
            </div>
            <button
              type="button"
              onClick={() => {
                bag.addCart(product.id, qty)
                setMsg(wrap || note ? 'Sepete eklendi — hediye seçenekleri kaydedildi.' : 'Sepete eklendi.')
              }}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-[#1f3f66] text-sm font-bold text-white"
            >
              Sepete Ekle
            </button>
            <button type="button" onClick={() => bag.toggleFav(product.id)} className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#1f3f66]/15">
              <Heart className="h-4 w-4" fill={bag.isFav(product.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
          {msg ? <p className="mt-3 text-sm text-[#1f3f66]/70">{msg}</p> : null}
        </div>
      </div>
      <div className="mt-16">
        <h2 className="sf-serif text-3xl">Bunları da beğenebilirsiniz</h2>
        <div className="mt-8">
          <ProductGrid products={related} bag={bag} onQuickView={() => {}} />
        </div>
      </div>
    </div>
  )
}

function OccasionPage({ slug, bag, onQuickView }) {
  const occ = GIFT_OCCASIONS[slug]
  const list = productsForOccasion(slug)
  return (
    <div className="sf-container py-12">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#c9ad8a]">Hediye fikirleri</p>
      <h1 className="sf-serif mt-3 text-4xl">{occ?.title || 'Hediye'}</h1>
      <p className="mt-3 max-w-xl text-sm text-[#1f3f66]/60">{occ?.text}</p>
      <div className="mt-10">
        <ProductGrid products={list} bag={bag} onQuickView={onQuickView} />
      </div>
    </div>
  )
}

function CorporatePage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ company: '', name: '', email: '', phone: '', note: '' })
  return (
    <div>
      <section className="sf-container py-14">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#c9ad8a]">B2B</p>
        <h1 className="sf-serif mt-3 max-w-3xl text-4xl sm:text-5xl">Markanız İçin Unutulmaz Hediyeler</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#1f3f66]/55 sm:text-base">
          Kurumsal ekibimiz çikolata, hediye kutusu ve özel gün setlerini markanızın diline uyarlar. Premium sunum, güvenilir teslimat.
        </p>
      </section>
      <section className="sf-container pb-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GIFT_CORPORATE_AREAS.map((a) => (
            <article key={a.title} className="rounded-3xl border border-[#1f3f66]/8 bg-white p-5">
              <h2 className="sf-serif text-xl">{a.title}</h2>
              <p className="mt-2 text-sm text-[#1f3f66]/55">{a.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="teklif" className="border-t border-[#1f3f66]/8 bg-[#1f3f66] text-[#fcfaf7]">
        <div className="sf-container grid gap-10 py-14 lg:grid-cols-2">
          <div>
            <h2 className="sf-serif text-3xl">Teklif İste</h2>
            <p className="mt-3 text-sm text-[#fcfaf7]/75">İhtiyacınızı paylaşın, size özel bir teklif hazırlayalım.</p>
          </div>
          {sent ? (
            <p className="self-center text-sm">Talebiniz alındı. Ekibimiz en kısa sürede dönüş yapacak.</p>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                setSent(true)
              }}
            >
              {[['company', 'Şirket'], ['name', 'Yetkili'], ['email', 'E-posta'], ['phone', 'Telefon']].map(([key, label]) => (
                <label key={key} className="block text-sm">
                  <span className="text-[#fcfaf7]/80">{label}</span>
                  <input
                    required
                    value={form[key]}
                    onChange={(event) => setForm((f) => ({ ...f, [key]: event.target.value }))}
                    className="mt-1.5 h-11 w-full rounded-full border border-white/15 bg-white/5 px-4 text-sm outline-none"
                  />
                </label>
              ))}
              <label className="block text-sm">
                <span className="text-[#fcfaf7]/80">Not</span>
                <textarea rows={3} value={form.note} onChange={(event) => setForm((f) => ({ ...f, note: event.target.value }))} className="mt-1.5 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none" />
              </label>
              <button type="submit" className="inline-flex h-12 items-center rounded-full bg-[#c9ad8a] px-7 text-sm font-bold text-[#1f3f66]">Teklif Gönder</button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}

function CartPage({ bag, products }) {
  const rows = bag.cart.map((row) => ({ ...row, product: products.find((p) => p.id === row.id) })).filter((row) => row.product)
  const total = rows.reduce((sum, row) => sum + row.product.price * row.qty, 0)
  if (!rows.length) {
    return (
      <div className="sf-container py-16 text-center">
        <h1 className="sf-serif text-3xl">Sepetin boş</h1>
        <Link to={sf('/')} className="mt-4 inline-flex h-12 items-center rounded-full bg-[#1f3f66] px-6 text-sm font-bold text-white">Alışverişe başla</Link>
      </div>
    )
  }
  return (
    <div className="sf-container grid gap-10 py-12 lg:grid-cols-[1.3fr_0.7fr]">
      <div>
        <h1 className="sf-serif text-3xl">Sepetim</h1>
        <ul className="mt-6 space-y-4">
          {rows.map((row) => (
            <li key={row.id} className="flex gap-4 rounded-2xl border border-[#1f3f66]/8 bg-white p-4">
              <img src={row.product.image} alt="" className="h-28 w-16 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{row.product.name}</p>
                <p className="mt-1 text-sm">{money(row.product.price)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <button type="button" onClick={() => bag.setQty(row.id, row.qty - 1)}>−</button>
                  <span className="text-sm font-bold">{row.qty}</span>
                  <button type="button" onClick={() => bag.setQty(row.id, row.qty + 1)}>+</button>
                  <button type="button" className="ml-auto text-xs font-bold text-[#1f3f66]/45" onClick={() => bag.removeCart(row.id)}>Kaldır</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="h-fit rounded-[28px] border border-[#1f3f66]/8 bg-white p-6">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#1f3f66]/55">Özet</p>
        <p className="mt-4 text-2xl font-extrabold">{money(total)}</p>
        <button type="button" className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#1f3f66] text-sm font-bold text-white">Ödemeye geç</button>
      </aside>
    </div>
  )
}

function AccountPage({ bag, products }) {
  const [params] = useSearchParams()
  const tab = params.get('tab') || 'siparis'
  const favs = products.filter((p) => bag.favs.includes(p.id))
  return (
    <div className="sf-container py-12">
      <h1 className="sf-serif text-3xl sm:text-4xl">Hesabım</h1>
      <div className="mt-6 flex gap-2">
        {[
          ['siparis', 'Siparişlerim'],
          ['favori', 'Favorilerim'],
          ['adres', 'Adreslerim'],
        ].map(([id, label]) => (
          <Link key={id} to={`${sf('/hesap')}?tab=${id}`} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === id ? 'bg-[#1f3f66] text-white' : 'bg-[#f7f2ea]'}`}>
            {label}
          </Link>
        ))}
      </div>
      {tab === 'favori' ? (
        <div className="mt-8">
          {favs.length ? <ProductGrid products={favs} bag={bag} onQuickView={() => {}} /> : <p className="text-sm text-[#1f3f66]/55">Henüz favori yok.</p>}
        </div>
      ) : tab === 'adres' ? (
        <p className="mt-8 text-sm text-[#1f3f66]/55">Kayıtlı adresiniz yok. Teslimat yerini üst çubuktan seçebilirsiniz.</p>
      ) : (
        <p className="mt-8 text-sm text-[#1f3f66]/55">Henüz siparişiniz yok.</p>
      )}
    </div>
  )
}

function SearchPage({ products, bag, onQuickView }) {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const hits = products.filter((p) => `${p.name} ${p.shortDescription}`.toLocaleLowerCase('tr-TR').includes(q.toLocaleLowerCase('tr-TR')))
  return (
    <div className="sf-container py-12">
      <h1 className="sf-serif text-3xl">Arama</h1>
      <p className="mt-2 text-sm text-[#1f3f66]/55">{q ? `“${q}” için sonuçlar` : 'Ne arıyorsunuz?'}</p>
      <div className="mt-8">
        <ProductGrid products={q ? hits : products.slice(0, 10)} bag={bag} onQuickView={onQuickView} />
      </div>
    </div>
  )
}

function LegalPage({ slug }) {
  const page = GIFT_LEGAL[slug] || { title: 'Yasal', body: 'Bu sayfa hazırlanıyor.' }
  return (
    <div className="sf-container py-14">
      <h1 className="sf-serif max-w-2xl text-3xl sm:text-4xl">{page.title}</h1>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#1f3f66]/60">{page.body}</p>
    </div>
  )
}

function parseView(pathname) {
  const rest = pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : '/'
  const parts = rest.split('/').filter(Boolean)
  if (!parts.length) return { name: 'home' }
  if (parts[0] === 'kategoriler' && parts[1]) return { name: 'category', slug: parts[1] }
  if (parts[0] === 'kategoriler') return { name: 'categories' }
  if (parts[0] === 'urunler' && parts[1]) return { name: 'product', slug: parts[1] }
  if (parts[0] === 'hediye' && parts[1]) return { name: 'occasion', slug: parts[1] }
  if (parts[0] === 'kurumsal') return { name: 'corporate' }
  if (parts[0] === 'sepet') return { name: 'cart' }
  if (parts[0] === 'hesap') return { name: 'account' }
  if (parts[0] === 'arama') return { name: 'search' }
  if (parts[0] === 'yasal' && parts[1]) return { name: 'legal', slug: parts[1] }
  return { name: 'home' }
}

export default function GiftStorefront({ preview = false }) {
  const location = useLocation()
  const bag = useBag()
  const [quick, setQuick] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const products = useMemo(() => catalogProducts(), [tick])
  const tpl = getWebTemplate()
  const view = preview ? { name: 'home' } : parseView(location.pathname)

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
    const refresh = () => setTick((n) => n + 1)
    window.addEventListener('bach:web-catalog-updated', refresh)
    window.addEventListener('bach:web-template-updated', refresh)
    return () => {
      window.removeEventListener('bach:web-catalog-updated', refresh)
      window.removeEventListener('bach:web-template-updated', refresh)
    }
  }, [])

  let body = <HomeView products={products} bag={bag} onQuickView={setQuick} logoText={tpl.logoText} />
  if (view.name === 'categories') body = <CategoryIndex products={products} bag={bag} onQuickView={setQuick} />
  if (view.name === 'category') body = <CategoryPage slug={view.slug} products={products} bag={bag} onQuickView={setQuick} />
  if (view.name === 'product') body = <ProductPage slug={view.slug} products={products} bag={bag} />
  if (view.name === 'occasion') body = <OccasionPage slug={view.slug} bag={bag} onQuickView={setQuick} />
  if (view.name === 'corporate') body = <CorporatePage />
  if (view.name === 'cart') body = <CartPage bag={bag} products={products} />
  if (view.name === 'account') body = <AccountPage bag={bag} products={products} />
  if (view.name === 'search') body = <SearchPage products={products} bag={bag} onQuickView={setQuick} />
  if (view.name === 'legal') body = <LegalPage slug={view.slug} />

  return (
    <div className={`gift-sf ${preview ? 'overflow-hidden rounded-[24px] border border-[#e8edf4]' : 'sf-has-mobile-nav min-h-dvh'}`}>
      <SiteChrome preview={preview} bag={bag} products={products} searchOpen={searchOpen} setSearchOpen={setSearchOpen}>
        {body}
      </SiteChrome>
      <QuickView product={quick} bag={bag} onClose={() => setQuick(null)} />
    </div>
  )
}
