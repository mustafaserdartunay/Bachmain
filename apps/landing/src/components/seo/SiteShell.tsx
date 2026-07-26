'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import Header from '../Header'
import StickyCta from '../sales/StickyCta'
import { trackPageView } from '../../analytics/track'

const Footer = dynamic(() => import('../Footer'), {
  loading: () => null,
})

const AUTH_PATHS = new Set([
  '/giris',
  '/login',
  '/demo',
  '/forgot-password',
  '/sifremi-unuttum',
  '/reset-password',
  '/sifre-sifirla',
])

function ScrollToTop() {
  const pathname = usePathname()
  useEffect(() => {
    window.scrollTo(0, 0)
    if (pathname) trackPageView(pathname)
  }, [pathname])
  return null
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const isAuth = AUTH_PATHS.has(pathname)

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
      >
        İçeriğe geç
      </a>
      <ScrollToTop />
      <Header />
      <main
        id="main-content"
        className={isAuth ? 'flex min-h-[100dvh] flex-col p-0' : 'pt-0 pb-24'}
        role="main"
      >
        {children}
      </main>
      {isAuth ? null : <Footer />}
      {isAuth ? null : <StickyCta />}
    </>
  )
}
