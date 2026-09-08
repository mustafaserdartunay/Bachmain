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

const CookieBanner = dynamic(() => import('../legal/CookieBanner'), {
  ssr: false,
  loading: () => null,
})

const AUTH_PATHS = new Set([
  '/giris',
  '/login',
  '/demo',
  '/register',
  '/uye-ol',
  '/forgot-password',
  '/sifremi-unuttum',
  '/reset-password',
  '/sifre-sifirla',
  '/email-degistir',
])

function isStudioPath(pathname: string) {
  return pathname === '/studio' || pathname.startsWith('/studio/')
}

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
  const isStudio = isStudioPath(pathname)
  const hideChrome = isAuth
  const isCineHome = pathname === '/'
  const isCineSite = !isAuth && !isStudio && !isCineHome

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('cine-home', isCineHome)
    root.classList.toggle('cine-site', isCineSite)
    root.classList.toggle('studio-site', isStudio && !isAuth)
    return () => {
      root.classList.remove('cine-home')
      root.classList.remove('cine-site')
      root.classList.remove('studio-site')
    }
  }, [isCineHome, isCineSite, isStudio, isAuth])

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
      >
        İçeriğe geç
      </a>
      <ScrollToTop />
      {hideChrome ? null : <Header />}
      <main
        id="main-content"
        className={hideChrome ? 'flex min-h-[100dvh] flex-col p-0' : 'pt-0 pb-24'}
        role="main"
      >
        {children}
      </main>
      {hideChrome ? null : <Footer />}
      {hideChrome || isStudio ? null : <StickyCta />}
      <CookieBanner />
    </>
  )
}
