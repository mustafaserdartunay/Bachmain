import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import HeaderCashActionsPanel from './HeaderCashActionsPanel'
import TeamHubPanel from './TeamHubPanel'
import TrialBanner, { computeRemainingDays, isTrialActive } from '../TrialBanner'
import { useAuth } from '../../auth/AuthContext'

export default function Layout({ children }) {
  const { user } = useAuth()
  const remainingDays = computeRemainingDays(user)
  const showTrialBanner =
    isTrialActive(user) && typeof remainingDays === 'number' && remainingDays >= 0

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('erlenbox-sidebar') === 'collapsed')
  const [teamHubCollapsed, setTeamHubCollapsed] = useState(() => localStorage.getItem('bach-team-hub-panel') !== 'expanded')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false))

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)')
    function syncMobile(event) {
      setIsMobile(event.matches)
      if (!event.matches) setMobileSidebarOpen(false)
    }

    syncMobile(media)
    media.addEventListener('change', syncMobile)
    return () => media.removeEventListener('change', syncMobile)
  }, [])

  function toggleSidebar() {
    if (isMobile) {
      setMobileSidebarOpen((open) => !open)
      return
    }

    setSidebarCollapsed((collapsed) => {
      const next = !collapsed
      localStorage.setItem('erlenbox-sidebar', next ? 'collapsed' : 'expanded')
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

  return (
    <div
      className="app-shell min-h-screen bg-dark-900 transition-colors"
      style={showTrialBanner ? { paddingTop: 36 } : undefined}
    >
      {showTrialBanner ? (
        <TrialBanner
          remainingDays={remainingDays}
          trialEnd={user?.trialEnd || user?.trialEndsAt || user?.licenseExpiry}
          status={user?.status}
        />
      ) : null}
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
        />
      )}
      <Sidebar
        collapsed={isMobile ? false : sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onToggle={toggleSidebar}
      />
      <div
        className="app-shell-content min-w-0 transition-all duration-300"
        data-sidebar-collapsed={!isMobile && sidebarCollapsed ? 'true' : 'false'}
        data-teamhub-collapsed={teamHubCollapsed ? 'true' : 'false'}
      >
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        <HeaderCashActionsPanel />
        <main className="app-responsive min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
      <TeamHubPanel collapsed={teamHubCollapsed} onToggle={toggleTeamHub} />
    </div>
  )
}
