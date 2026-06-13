import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('erlenbox-sidebar') === 'collapsed')

  function toggleSidebar() {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed
      localStorage.setItem('erlenbox-sidebar', next ? 'collapsed' : 'expanded')
      return next
    })
  }

  return (
    <div className="min-h-screen bg-dark-900 transition-colors">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-56'}`}>
        <Header />
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}
