import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  FolderKanban,
  Globe2,
  LayoutDashboard,
  Link2,
  Menu,
  Package,
  Palette,
  Pencil,
  Rocket,
  Save,
  ShoppingBag,
  Store,
} from 'lucide-react'
import BrandLogo from '../../components/Layout/BrandLogo'
import {
  HEADER_ACTION_GRADIENTS,
  HEADER_QUICK_ACTION_CHIP_CLASS,
  HEADER_QUICK_ACTION_CHIP_ICON_CLASS,
} from '../../components/Layout/HeaderCashActionsPanel'
import WebStudioDashboardPanels from '../../components/web/WebStudioDashboardPanels'
import HtmlPackSite from '../../templates/HtmlPackSite'
import { getHtmlPack, htmlPackGalleryItems } from '../../templates/htmlPacks'
import { YF_TEXT_ON_COLOR_CLASS } from '../../utils/dashboardDesign'
import {
  getWebTemplate,
  saveWebTemplate,
  selectReadySiteTemplate,
} from '../../utils/webTemplateStorage'
import WebStudioCategoryCreatePage from './WebStudioCategoryCreatePage'
import WebStudioDomainConnectPage from './WebStudioDomainConnectPage'
import WebStudioOrdersPage from './WebStudioOrdersPage'
import WebStudioPage from './WebStudioPage'
import WebStudioPaymentPage from './WebStudioPaymentPage'
import WebStudioProductCreatePage from './WebStudioProductCreatePage'
import WebStudioSettingsPage from './WebStudioSettingsPage'

const SIDEBAR_KEY = 'bach-studio-sidebar'
const FURNI_ID = 'furni-1.0.0'

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

function StudioActionBar({ editing, onToggleEdit, onOpenMenu }) {
  const [busy, setBusy] = useState('')

  function handleSave() {
    setBusy('save')
    try {
      const pack = getHtmlPack(FURNI_ID)
      selectReadySiteTemplate(pack || { id: FURNI_ID })
      saveWebTemplate({ selected: true })
    } finally {
      setBusy('')
    }
  }

  function handlePreview() {
    setBusy('preview')
    try {
      saveWebTemplate({ selected: true })
      window.open('/vitrin', 'bach-studio-preview')
    } finally {
      setBusy('')
    }
  }

  function handlePublish() {
    setBusy('publish')
    try {
      const pack = getHtmlPack(FURNI_ID)
      selectReadySiteTemplate(pack || { id: FURNI_ID })
      saveWebTemplate({ selected: true, published: true })
      window.open('/vitrin', 'bach-studio-live')
    } finally {
      setBusy('')
    }
  }

  const actions = [
    {
      id: 'edit',
      label: editing ? 'Bitir' : 'Düzenle',
      gradient: HEADER_ACTION_GRADIENTS.amber,
      icon: Pencil,
      pressed: editing,
      onClick: onToggleEdit,
    },
    {
      id: 'save',
      label: 'Kaydet',
      gradient: HEADER_ACTION_GRADIENTS.primary,
      icon: Save,
      disabled: Boolean(busy),
      onClick: handleSave,
    },
    {
      id: 'preview',
      label: 'Canlı göster',
      gradient: HEADER_ACTION_GRADIENTS.quote,
      icon: Eye,
      disabled: Boolean(busy),
      onClick: handlePreview,
    },
    {
      id: 'publish',
      label: 'Yayınla',
      gradient: HEADER_ACTION_GRADIENTS.success,
      icon: Rocket,
      disabled: Boolean(busy),
      onClick: handlePublish,
    },
  ]

  return (
    <header className="app-header-banner standalone-studio-bar flex h-[var(--ds-header-h,4.75rem)] min-h-[var(--ds-header-h,4.75rem)] shrink-0 items-center gap-2 px-4 py-2 sm:px-6">
      <button
        type="button"
        className="standalone-studio-menu-fab glass-sidebar-toggle lg:hidden"
        onClick={onOpenMenu}
        aria-label="Menüyü aç"
      >
        <Menu className="h-4 w-4" />
      </button>
      <div className="flex w-full gap-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-4 lg:gap-2 lg:overflow-visible">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              aria-pressed={action.pressed}
              className={`header-action-cta ${HEADER_QUICK_ACTION_CHIP_CLASS} flex-1 sm:min-w-0 ${action.gradient} ${
                action.pressed ? 'is-pressed' : ''
              }`}
            >
              <span className={HEADER_QUICK_ACTION_CHIP_ICON_CLASS}>
                <Icon className="h-4 w-4 shrink-0 text-[#ffffff]" strokeWidth={2.25} aria-hidden />
              </span>
              <span className={YF_TEXT_ON_COLOR_CLASS}>{action.label}</span>
            </button>
          )
        })}
      </div>
    </header>
  )
}

function FurniGallery({ onSelect }) {
  const items = htmlPackGalleryItems()
  const activeId = getWebTemplate().templateId
  return (
    <div className="space-y-3 px-4 pt-4 lg:px-6">
      <div>
        <h2 className="text-xl font-bold text-[#203375]">Hazır web siteleri</h2>
        <p className="mt-0.5 text-sm text-[#64748b]">
          Furni HTML5 temasını seçin. Canvas ve yayın aynı site state’ini kullanır.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((template) => {
          const selected = activeId === template.id
          return (
            <article
              key={template.id}
              className={`overflow-hidden rounded-2xl border border-[var(--glass-border,rgba(255,255,255,0.75))] bg-[var(--glass-bg,rgba(255,255,255,0.72))] shadow-[0_10px_36px_-14px_rgba(30,35,60,0.14)] ${
                selected ? 'ring-2 ring-[#203375]' : ''
              }`}
            >
              <div
                className="relative h-48 bg-cover bg-center"
                style={{ backgroundImage: `url(${template.preview.sky})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#203375]">
                  {template.category}
                </span>
                <span className="absolute right-4 top-4 rounded-full bg-[#3b5d50] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white">
                  HTML5
                </span>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-lg font-black tracking-tight">{template.name}</p>
                  <p className="text-sm text-white/80">{template.title}</p>
                </div>
              </div>
              <div className="flex items-end justify-between gap-3 p-4">
                <p className="text-sm text-[#55657d]">{template.description}</p>
                <button
                  type="button"
                  className="inline-flex items-center rounded-xl bg-[#203375] px-3 py-2 text-xs font-semibold text-white"
                  onClick={() => onSelect(template)}
                >
                  {selected ? 'Düzenle' : 'Seç'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default function StandaloneStudioPage() {
  const [view, setView] = useState('tasarim')
  const [editing, setEditing] = useState(false)
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
    setEditing(false)
  }

  function handleSelectFurni(template) {
    selectReadySiteTemplate(template)
    setView('tasarim')
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
        <StudioActionBar
          editing={editing}
          onToggleEdit={() => setEditing((current) => !current)}
          onOpenMenu={() => setMobileOpen(true)}
        />

        <main className="app-responsive min-w-0 flex-1 overflow-x-hidden px-3 sm:px-4">
          {view === 'tasarim' ? (
            <div className="standalone-studio-body">
              <HtmlPackSite templateId={FURNI_ID} editable={editing} />
            </div>
          ) : null}
          {view === 'panel' ? <WebStudioDashboardPanels /> : null}
          {view === 'siteler' ? (
            <>
              <FurniGallery onSelect={handleSelectFurni} />
              <WebStudioPage />
            </>
          ) : null}
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
