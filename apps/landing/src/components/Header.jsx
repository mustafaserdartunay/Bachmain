'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Link } from 'react-router-dom'
import { Boxes, ChevronDown, LayoutGrid, Menu, Receipt, Sparkles, X } from 'lucide-react'
import Logo from './Logo'

const nav = [
  {
    label: 'Ürün',
    items: [
      { label: 'CRM', href: '/crm' },
      { label: 'ERP', href: '/erp' },
      { label: 'Muhasebe', href: '/muhasebe' },
      { label: 'E-Fatura', href: '/e-fatura' },
      { label: 'Üretim', href: '/uretim' },
      { label: 'Depo', href: '/depo' },
      { label: 'WhatsApp', href: '/whatsapp' },
      { label: 'AI Asistan', href: '/openai' },
    ],
  },
  {
    label: 'Sektörler',
    href: '/sektorler',
    items: [
      { label: 'Tüm sektörler', href: '/sektorler' },
      { label: 'Üretim', href: '/sektorler/uretim-sektor' },
      { label: 'E-Ticaret', href: '/sektorler/e-ticaret' },
      { label: 'Toptan Satış', href: '/sektorler/toptan-satis' },
      { label: 'Mobilya', href: '/sektorler/mobilya' },
    ],
  },
  {
    label: 'Paketler',
    rich: true,
    items: [
      {
        label: 'Modüller',
        href: '/paketler/moduller',
        description: 'İhtiyacınız olan Bachmain modüllerini seçin.',
        icon: 'modules',
      },
      {
        label: 'E-Fatura Kontör',
        href: '/paketler/e-fatura-kontor',
        description: 'E-Fatura işlemleriniz için kontör satın alın.',
        icon: 'efatura',
      },
      {
        label: 'AI Kontör',
        href: '/paketler/ai-kontor',
        description: 'Yapay zeka işlemleriniz için AI kontörü satın alın.',
        icon: 'ai',
      },
    ],
  },
  { label: 'Referanslar', href: '/referanslar' },
  { label: 'Başarı Hikayeleri', href: '/basari-hikayeleri' },
  { label: 'Blog', href: '/blog' },
  { label: 'Studio', href: '/studio' },
  { label: 'İletişim', href: '/iletisim' },
]

function RichNavIcon({ type }) {
  if (type === 'efatura') return <Receipt className="h-4 w-4 text-blue-600" aria-hidden />
  if (type === 'ai') return <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
  if (type === 'modules') return <LayoutGrid className="h-4 w-4 text-blue-600" aria-hidden />
  return <Boxes className="h-4 w-4 text-blue-600" aria-hidden />
}

function Dropdown({ label, items, href, rich, cine }) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef(null)

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    },
    [],
  )

  const openMenu = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setOpen(true)
  }

  const closeMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 160)
  }

  const triggerCls = cine
    ? 'flex items-center gap-1 px-2.5 py-2 text-[13px] font-semibold text-white/85 transition hover:text-white'
    : 'flex items-center gap-1 px-2.5 py-2 text-[13px] font-semibold text-slate-600 transition hover:text-blue-600'

  return (
    <div className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
      {href ? (
        <Link to={href} className={triggerCls} aria-expanded={open}>
          {label}
          <ChevronDown
            className={`h-3.5 w-3.5 opacity-60 transition duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </Link>
      ) : (
        <button
          type="button"
          className={triggerCls}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {label}
          <ChevronDown
            className={`h-3.5 w-3.5 opacity-60 transition duration-300 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      )}
      {open && items ? (
        <div className="absolute left-0 top-full z-50 pt-2">
          <div
            className={[
              'nav-dropdown-panel rounded-2xl p-2',
              rich ? 'min-w-[340px]' : 'min-w-[220px]',
            ].join(' ')}
          >
            {items.map((item, idx) =>
              rich ? (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-start gap-3 rounded-xl px-3 py-3 transition"
                  style={{ animationDelay: `${idx * 40}ms` }}
                  onClick={() => setOpen(false)}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-100">
                    <RichNavIcon type={item.icon} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-bold text-slate-800">
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className="mt-0.5 block text-[12px] leading-snug text-slate-500">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </Link>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:text-blue-700"
                  style={{ animationDelay: `${idx * 35}ms` }}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

const STUDIO_NAV = [
  { label: 'Özellikler', href: '/studio#ozellikler' },
  { label: 'Paketler', href: '/studio/paket' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname() || '/'
  const isStudio = pathname === '/studio' || pathname.startsWith('/studio/')
  const cine = !isStudio

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header
      className={`site-nav ${scrolled ? 'scrolled' : ''} ${
        isStudio ? 'site-nav-studio' : cine ? 'site-nav-cine' : ''
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <Logo onDark={!isStudio && cine} studio={isStudio} />
        </div>

        <nav className="hidden items-center xl:flex">
          {(isStudio ? STUDIO_NAV : nav).map((item) =>
            !isStudio && item.items ? (
              <Dropdown
                key={item.label}
                label={item.label}
                items={item.items}
                href={item.href}
                rich={item.rich}
                cine={cine}
              />
            ) : (
              <Link
                key={item.label}
                to={item.href}
                className={`px-2.5 py-2 text-[13px] font-semibold transition ${
                  isStudio
                    ? 'text-slate-700 hover:text-blue-600'
                    : cine
                      ? 'text-white/85 hover:text-white'
                      : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="nav-cta-group hidden items-center lg:flex">
          {isStudio ? (
            <>
              <Link to="/" className="nav-cta nav-cta-home" aria-label="BACHMAIN ana sayfa">
                <img
                  src="/assets/bachmain-logo.png"
                  alt="BACHMAIN"
                  width={140}
                  height={28}
                  className="nav-cta-home-logo"
                  draggable={false}
                />
              </Link>
              <Link to="/studio/demo" className="nav-cta nav-cta-demo">
                Demo oluştur
              </Link>
              <Link to="/studio/giris" className="nav-cta nav-cta-login">
                Üye girişi
              </Link>
              <Link to="/studio/paket" className="nav-cta nav-cta-buy">
                Modül Seç
              </Link>
            </>
          ) : (
            <>
              <Link to="/demo" className="nav-cta nav-cta-demo">
                Demo Girişi
              </Link>
              <Link to="/giris" className="nav-cta nav-cta-login">
                Giriş Yap
              </Link>
              <Link to="/paketler/moduller" className="nav-cta nav-cta-buy">
                Modül Seç
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className={`rounded-lg p-2 xl:hidden ${
            isStudio || !cine ? 'text-slate-700' : 'text-white'
          }`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menü"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="cine-mobile-panel absolute left-0 right-0 top-[68px] border-b border-slate-100 bg-white px-4 py-4 shadow-lg xl:hidden">
          <div className="flex flex-col gap-1">
            {(isStudio ? STUDIO_NAV : nav).map((item) => (
              <div key={item.label}>
                {item.href && !item.items ? (
                  <Link
                    to={item.href}
                    className="block py-2 font-semibold text-slate-800"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <>
                    <div className="py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {item.label}
                    </div>
                    {item.items?.map((sub) => (
                      <Link
                        key={sub.href}
                        to={sub.href}
                        className="block py-1.5 pl-3 text-sm text-slate-600"
                        onClick={() => setMobileOpen(false)}
                      >
                        {sub.label}
                        {sub.description ? (
                          <span className="mt-0.5 block text-[11px] text-slate-400">
                            {sub.description}
                          </span>
                        ) : null}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            ))}
            <div className="nav-cta-group mt-3 flex flex-col gap-2 sm:flex-row">
              {isStudio ? (
                <>
                  <Link
                    to="/"
                    className="nav-cta nav-cta-home flex-1"
                    aria-label="BACHMAIN ana sayfa"
                    onClick={() => setMobileOpen(false)}
                  >
                    <img
                      src="/assets/bachmain-logo.png"
                      alt="BACHMAIN"
                      width={140}
                      height={28}
                      className="nav-cta-home-logo"
                      draggable={false}
                    />
                  </Link>
                  <Link
                    to="/studio/demo"
                    className="nav-cta nav-cta-demo flex-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    Demo oluştur
                  </Link>
                  <Link
                    to="/studio/giris"
                    className="nav-cta nav-cta-login flex-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    Üye girişi
                  </Link>
                  <Link
                    to="/studio/paket"
                    className="nav-cta nav-cta-buy flex-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    Modül Seç
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/demo"
                    className="nav-cta nav-cta-demo flex-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    Demo Girişi
                  </Link>
                  <Link
                    to="/giris"
                    className="nav-cta nav-cta-login flex-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    to="/paketler/moduller"
                    className="nav-cta nav-cta-buy flex-1"
                    onClick={() => setMobileOpen(false)}
                  >
                    Modül Seç
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
