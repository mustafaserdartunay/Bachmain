import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import HeaderCashActionsPanel from './HeaderCashActionsPanel'
import TeamHubPanel from './TeamHubPanel'
import BottomNav from './BottomNav'
import BachyProvider from '../Bachy/BachyProvider'

const SIDEBAR_KEY = 'bach-sidebar'
const LEGACY_SIDEBAR_KEY = 'erlenbox-sidebar'

function readSidebarCollapsed() {
  try {
    const next = localStorage.getItem(SIDEBAR_KEY)
    if (next === 'collapsed' || next === 'expanded') return next === 'collapsed'
    return localStorage.getItem(LEGACY_SIDEBAR_KEY) === 'collapsed'
  } catch {
    return false
  }
}

export default function Layout({ children }) {
  const { pathname } = useLocation()
  const hideChrome = pathname === '/paketler' || pathname.startsWith('/paketler/')
  const fullscreenWorkspace =
    pathname === '/otomasyon/designer' ||
    pathname.startsWith('/otomasyon/designer/') ||
    pathname === '/mes/operator' ||
    pathname.startsWith('/mes/operator/')

  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed)
  const [teamHubCollapsed, setTeamHubCollapsed] = useState(
    () => localStorage.getItem('bach-team-hub-panel') !== 'expanded',
  )
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  )
  const [isTablet, setIsTablet] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
  )

  useEffect(() => {
    function syncViewport() {
      const width = window.innerWidth
      const mobile = width < 1024
      const tablet = width >= 768 && width < 1024
      setIsMobile(mobile)
      setIsTablet(tablet)
      if (!mobile) setMobileSidebarOpen(false)
      // Tablet: auto-collapse sidebar
      if (tablet) {
        setSidebarCollapsed(true)
      }
    }

    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  function toggleSidebar() {
    if (isMobile) {
      setMobileSidebarOpen((open) => !open)
      return
    }

    setSidebarCollapsed((collapsed) => {
      const next = !collapsed
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? 'collapsed' : 'expanded')
        localStorage.setItem(LEGACY_SIDEBAR_KEY, next ? 'collapsed' : 'expanded')
      } catch {
        // ignore
      }
      return next
    })
  }

  function toggleTeamHub() {
    setTeamHubCollapsed((collapsed) => {
      const next = !collapsed
      localStorage.setItem('bach-team-hub-panel', next ? 'collapsed' : 'expanded')
      return next
    })
  }

  const effectiveCollapsed = isTablet ? true : isMobile ? false : sidebarCollapsed

  if (fullscreenWorkspace) {
    return (
      <div className="app-shell min-h-screen bg-[var(--ds-bg,var(--app-bg))]">
        <main className="min-h-screen w-full overflow-hidden p-0">{children}</main>
      </div>
    )
  }

  return (
    <div className="app-shell min-h-screen bg-[var(--ds-bg,var(--app-bg))] transition-colors">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
        />
      )}
      <Sidebar
        collapsed={effectiveCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onToggle={toggleSidebar}
      />
      <div
        className="app-shell-content min-w-0 transition-all duration-page pb-[calc(var(--ds-bottom-nav-h,4rem)+env(safe-area-inset-bottom))] lg:pb-[var(--shell-gap)]"
        data-sidebar-collapsed={!isMobile && effectiveCollapsed ? 'true' : 'false'}
        data-teamhub-collapsed={teamHubCollapsed ? 'true' : 'false'}
      >
        {!hideChrome ? <Header onMenuClick={() => setMobileSidebarOpen(true)} /> : null}
        {!hideChrome ? <HeaderCashActionsPanel /> : null}
        <main className="app-responsive min-w-0 flex-1 overflow-x-hidden px-3 sm:px-4 lg:px-0">
          {children}
        </main>
      </div>
      <TeamHubPanel collapsed={teamHubCollapsed} onToggle={toggleTeamHub} />
      {!hideChrome ? <BachyProvider /> : null}
      {!hideChrome ? <BottomNav /> : null}
    </div>
  )
}
