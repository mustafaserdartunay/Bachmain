import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { isStudioFullscreenRoute } from '../../data/webMenu'
import Sidebar from './Sidebar'
import Header from './Header'
import HeaderCashActionsPanel from './HeaderCashActionsPanel'
import TeamHubPanel from './TeamHubPanel'
import BottomNav from './BottomNav'
import AppGuidedTour from '../Onboarding/AppGuidedTour'
import ModuleAccessGate from '../../auth/ModuleAccessGate'
import { GUIDED_TOUR_SIDEBAR_EVENT } from '../Onboarding/guidedTourStorage'

const STUDIO_ENTER_MS = 580
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
  const isStudioManagement = isStudioFullscreenRoute(pathname)

  // Web Studio artık normal sayfa — özel tam ekran modundan çıkarıldı
  const hideChrome =
    pathname === '/paketler' ||
    pathname.startsWith('/paketler/')

  const fullscreenWorkspace =
    pathname === '/otomasyon/designer' ||
    pathname.startsWith('/otomasyon/designer/') ||
    pathname === '/mes/operator' ||
    pathname.startsWith('/mes/operator/') ||
    isStudioManagement

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
  const [studioChromeVisible, setStudioChromeVisible] = useState(!isStudioManagement)
  const [studioEntering, setStudioEntering] = useState(false)
  const [tourUnlockSidebar, setTourUnlockSidebar] = useState(false)

  useEffect(() => {
    function syncViewport() {
      const width = window.innerWidth
      const mobile = width < 1024
      const tablet = width >= 768 && width < 1024
      setIsMobile(mobile)
      setIsTablet(tablet)
      if (!mobile) setMobileSidebarOpen(false)
      if (tablet) {
        setSidebarCollapsed(true)
      }
    }

    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  useEffect(() => {
    if (!isStudioManagement) {
      setStudioChromeVisible(true)
      setStudioExiting(false)
      return undefined
    }
    if (studioExiting) return undefined
    const timer = window.setTimeout(() => setStudioChromeVisible(false), STUDIO_ENTER_MS)
    return () => window.clearTimeout(timer)
  }, [isStudioManagement, studioExiting])

  useEffect(() => {
    function onStudioExit() {
      setStudioExiting(true)
      setStudioChromeVisible(true)
    }
    function onStudioEnter() {
      setStudioEntering(true)
    }
    window.addEventListener('bach:studio-exit-start', onStudioExit)
    window.addEventListener('bach:studio-enter-start', onStudioEnter)
    return () => {
      window.removeEventListener('bach:studio-exit-start', onStudioExit)
      window.removeEventListener('bach:studio-enter-start', onStudioEnter)
    }
  }, [])

  useEffect(() => {
    function onTourSidebar(event) {
      const expand = event.detail?.expand
      if (expand) {
        setTourUnlockSidebar(true)
        setSidebarCollapsed(false)
        setMobileSidebarOpen(true)
        return
      }
      if (expand === false) {
        setTourUnlockSidebar(false)
        setMobileSidebarOpen(false)
      }
    }
    window.addEventListener(GUIDED_TOUR_SIDEBAR_EVENT, onTourSidebar)
    return () => window.removeEventListener(GUIDED_TOUR_SIDEBAR_EVENT, onTourSidebar)
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

  const effectiveCollapsed = tourUnlockSidebar ? false : isTablet ? true : isMobile ? false : sidebarCollapsed
  const studioActive = isStudioManagement && !studioChromeVisible && !studioExiting
  const studioShellClass = [
    (isStudioManagement && studioChromeVisible && !studioExiting) || studioEntering
      ? 'app-shell--to-studio'
      : '',
    studioExiting ? 'app-shell--from-studio' : '',
    studioActive ? 'app-shell--studio-active' : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (fullscreenWorkspace && !isStudioManagement) {
    return (
      <div className="app-shell min-h-screen bg-[var(--ds-bg,var(--app-bg))]">
        <main className="min-h-screen w-full overflow-hidden p-0">{children}</main>
      </div>
    )
  }

  return (
    <div className={`app-shell min-h-screen bg-[var(--ds-bg,var(--app-bg))] transition-colors ${studioShellClass}`.trim()}>
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setMobileSidebarOpen(false)}
          className="app-mobile-sidebar-scrim fixed inset-y-0 right-0 z-40 bg-black/40 lg:hidden"
        />
      )}
      <Sidebar
        collapsed={effectiveCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onToggle={toggleSidebar}
      />
      <div
        className="app-shell-content min-w-0 transition-all duration-page pb-[calc(var(--ds-bottom-nav-h,4rem)+env(safe-area-inset-bottom)+(2*var(--shell-gap)))] lg:pb-[var(--shell-gap)]"
        data-sidebar-collapsed={!isMobile && effectiveCollapsed ? 'true' : 'false'}
        data-teamhub-collapsed={teamHubCollapsed ? 'true' : 'false'}
      >
        {!hideChrome ? <Header onMenuClick={() => setMobileSidebarOpen(true)} /> : null}
        {!hideChrome ? <HeaderCashActionsPanel /> : null}
        <main className="app-responsive min-w-0 flex-1 overflow-x-hidden px-3 sm:px-4 lg:px-0">
          <ModuleAccessGate>{children}</ModuleAccessGate>
        </main>
      </div>
      <TeamHubPanel collapsed={teamHubCollapsed} onToggle={toggleTeamHub} />
      {!hideChrome ? <BottomNav /> : null}
      {!hideChrome && !isStudioManagement ? <AppGuidedTour /> : null}
      {studioEntering ? (
        <div className="studio-enter-veil" aria-hidden="true">
          <p className="studio-enter-veil-mark">
            STUDIO<span>.</span>
          </p>
        </div>
      ) : null}
    </div>
  )
}
