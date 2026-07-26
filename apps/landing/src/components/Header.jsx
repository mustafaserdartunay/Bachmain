'use client'

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
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
  { label: 'Fiyatlandırma', href: '/fiyatlar' },
  { label: 'Referanslar', href: '/referanslar' },
  { label: 'Başarı Hikayeleri', href: '/basari-hikayeleri' },
  { label: 'Blog', href: '/blog' },
  { label: 'İletişim', href: '/iletisim' },
]

function Dropdown({ label, items, href }) {
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
    closeTimer.current = setTimeout(() => setOpen(false), 220)
  }

  return (
    <div className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenu}>
      {href ? (
        <Link
          to={href}
          className="flex items-center gap-1 px-2.5 py-2 text-[13px] font-semibold text-slate-600 transition hover:text-blue-600"
        >
          {label}
          <ChevronDown
            className={`h-3.5 w-3.5 opacity-50 transition ${open ? 'rotate-180' : ''}`}
          />
        </Link>
      ) : (
        <button
          type="button"
          className="flex items-center gap-1 px-2.5 py-2 text-[13px] font-semibold text-slate-600 transition hover:text-blue-600"
        >
          {label}
          <ChevronDown
            className={`h-3.5 w-3.5 opacity-50 transition ${open ? 'rotate-180' : ''}`}
          />
        </button>
      )}
      {open && items && (
        <div className="absolute left-0 top-full z-50 pt-2">
          <div className="min-w-[200px] rounded-2xl border border-slate-100 bg-white/95 p-2 shadow-xl backdrop-blur">
            {items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="block rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header className={`site-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <Logo />
        </div>

        <nav className="hidden items-center xl:flex">
          {nav.map((item) =>
            item.items ? (
              <Dropdown key={item.label} label={item.label} items={item.items} href={item.href} />
            ) : (
              <Link
                key={item.label}
                to={item.href}
                className="px-2.5 py-2 text-[13px] font-semibold text-slate-600 transition hover:text-blue-600"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="nav-cta-group hidden items-center lg:flex">
          <Link to="/demo" className="nav-cta nav-cta-demo">
            Demo Girişi
          </Link>
          <Link to="/giris" className="nav-cta nav-cta-login">
            Giriş Yap
          </Link>
          <Link to="/fiyatlar" className="nav-cta nav-cta-buy">
            Paket Satın Al
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 xl:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menü"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute left-0 right-0 top-[68px] border-b border-slate-100 bg-white px-4 py-4 shadow-lg xl:hidden">
          <div className="flex flex-col gap-1">
            {nav.map((item) => (
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
                      </Link>
                    ))}
                  </>
                )}
              </div>
            ))}
            <div className="nav-cta-group mt-3 flex flex-col gap-2 sm:flex-row">
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
                to="/fiyatlar"
                className="nav-cta nav-cta-buy flex-1"
                onClick={() => setMobileOpen(false)}
              >
                Paket Satın Al
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
