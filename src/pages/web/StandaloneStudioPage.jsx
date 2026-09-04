import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FolderKanban,
  Globe2,
  LayoutDashboard,
  Link2,
  Menu,
  Package,
  Palette,
  ShoppingBag,
  Store,
} from 'lucide-react'
import BrandLogo from '../../components/Layout/BrandLogo'
import WebStudioDashboardPanels from '../../components/web/WebStudioDashboardPanels'
import GiftStorefront from '../../storefront/GiftStorefront'
import WebStudioCategoryCreatePage from './WebStudioCategoryCreatePage'
import WebStudioDomainConnectPage from './WebStudioDomainConnectPage'
import WebStudioOrdersPage from './WebStudioOrdersPage'
import WebStudioPage from './WebStudioPage'
import WebStudioPaymentPage from './WebStudioPaymentPage'
import WebStudioProductCreatePage from './WebStudioProductCreatePage'
import WebStudioSettingsPage from './WebStudioSettingsPage'
import '../../storefront/gift-storefront.css'

const SIDEBAR_KEY = 'bach-studio-sidebar'

const MENU_BUTTON =
  'sidebar-menu-button sidebar-item w-full flex items-center gap-2.5 transition-colors'

const STUDIO_PAGES = [
  { id: 'tasarim', label: 'Tasarım', icon: Palette },
  { id: 'panel', label: 'Güncel Durum', icon: LayoutDashboard },
  { id: 'siteler', label: 'Siteler', icon: Globe2 },
  { id: 'kategoriler', label: 'Kategoriler', icon: FolderKanban },
  { id: 'urunler', label: 'Ürünler', icon: ShoppingBag },
  { id: 'siparisler', label: 'Siparişler', icon: Package },
  { id: 'profil', label: 'Mağaza profili', icon: Store },
  { id: 'odeme', label: 'Ödeme ayarları', icon: CreditCard },
  { id: 'domain', label: 'Domain bağla', icon: Link2 },
]

function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === 'collapsed'
  } catch {
    return false
  }
}

function DesignView({ selectedBlock, onSelectBlock }) {
  return (
    <div className="standalone-studio-body">
      <GiftStorefront
        preview
        editable
        selectedBlock={selectedBlock}
        onSelectBlock={onSelectBlock}
      />
    </div>
  )
}

export default function StandaloneStudioPage() {
  const [view, setView] = useState('tasarim')
  const [selectedBlock, setSelectedBlock] = useState('hero')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  )

  useEffect(() => {
    function onResize() {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)
      if (desktop) setMobileOpen(false)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const collapsed = isDesktop ? sidebarCollapsed : false

  function toggleSidebar() {
    if (!isDesktop) {
      setMobileOpen((open) => !open)
      return
    }
    setSidebarCollapsed((current) => {
      const next = !current
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? 'collapsed' : 'expanded')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  function openView(id) {
    setView(id)
    setMobileOpen(false)
  }

  return (
    <div className="app-shell standalone-studio min-h-screen">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setMobileOpen(false)}
          className="app-mobile-sidebar-scrim fixed inset-y-0 right-0 z-40 bg-black/40 lg:hidden"
        />
      ) : null}

      <aside
        data-collapsed={collapsed ? 'true' : 'false'}
        className={`glass-sidebar app-sidebar fixed top-[var(--shell-gap)] left-[var(--shell-gap)] z-50 flex flex-col transition-all duration-300 bottom-[var(--shell-gap)] h-[calc(100dvh-(2*var(--shell-gap)))] ${
          collapsed
            ? 'lg:w-[var(--ds-sidebar-collapsed,5.5rem)] w-[var(--ds-sidebar-expanded,17.5rem)] p-4 lg:px-2 lg:py-4'
            : 'w-[var(--ds-sidebar-expanded,17.5rem)] px-3 py-4'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div
          className={`flex w-full items-center gap-1.5 ${collapsed ? 'flex-col justify-center px-0 pt-2' : 'justify-between px-1 pt-1 pb-1'}`}
        >
          <button
            type="button"
            onClick={() => openView('tasarim')}
            className={`flex min-w-0 hover:opacity-90 transition-opacity ${collapsed ? 'items-center justify-center' : 'items-center'}`}
            title="BACHMAIN Studio"
          >
            <BrandLogo collapsed={collapsed} />
          </button>
          <button
            type="button"
            onClick={toggleSidebar}
            className="glass-sidebar-toggle glass-sidebar-collapse hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl lg:flex"
            title={collapsed ? 'Menüyü aç' : 'Menüyü daralt'}
            aria-label={collapsed ? 'Menüyü aç' : 'Menüyü daralt'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav
          className={`flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-0.5 ${collapsed ? 'px-0' : 'px-1'}`}
        >
          {STUDIO_PAGES.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openView(item.id)}
                className={`${MENU_BUTTON} ${collapsed ? 'justify-center' : ''} ${
                  view === item.id ? 'sidebar-menu-active font-medium' : ''
                }`}
                title={item.label}
              >
                <span className={`icon-wrap ${collapsed ? 'mx-auto' : ''}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                </span>
                {!collapsed ? (
                  <span className="sidebar-menu-label flex-1 text-left">{item.label}</span>
                ) : null}
              </button>
            )
          })}
        </nav>
      </aside>

      <div
        className="app-shell-content standalone-studio-content min-w-0 transition-all duration-page"
        data-sidebar-collapsed={!isDesktop || sidebarCollapsed ? 'true' : 'false'}
      >
        <button
          type="button"
          className="standalone-studio-menu-fab glass-sidebar-toggle lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Menüyü aç"
        >
          <Menu className="h-4 w-4" />
        </button>

        <main className="app-responsive min-w-0 flex-1 overflow-x-hidden px-3 sm:px-4">
          {view === 'tasarim' ? (
            <DesignView selectedBlock={selectedBlock} onSelectBlock={setSelectedBlock} />
          ) : null}
          {view === 'panel' ? <WebStudioDashboardPanels /> : null}
          {view === 'siteler' ? <WebStudioPage /> : null}
          {view === 'kategoriler' ? <WebStudioCategoryCreatePage /> : null}
          {view === 'urunler' ? <WebStudioProductCreatePage /> : null}
          {view === 'siparisler' ? <WebStudioOrdersPage /> : null}
          {view === 'profil' ? <WebStudioSettingsPage /> : null}
          {view === 'odeme' ? <WebStudioPaymentPage /> : null}
          {view === 'domain' ? <WebStudioDomainConnectPage /> : null}
        </main>
      </div>
    </div>
  )
}
