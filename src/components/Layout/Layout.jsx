import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('erlenbox-sidebar') === 'collapsed')
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

  return (
    <div className="min-h-screen bg-dark-900 transition-colors">
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
      <div className={`min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'}`}>
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="app-responsive min-w-0 overflow-x-hidden p-3 sm:p-4 lg:p-5">{children}</main>
      </div>
    </div>
  )
}
