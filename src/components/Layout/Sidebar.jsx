import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Store,
  MessageCircle,
  Receipt,
  BarChart3,
  Settings,
  FolderPlus,
  WalletCards,
  MapPinned,
  PanelLeftClose,
  PanelLeftOpen,
  CalendarDays,
  ChevronRight,
  ChevronDown,
  UserCog,
  Workflow,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { readCompanySettings } from '../../utils/companySettings'
import bachLogo from '../../assets/bach-logo.png'
import { processSubMenus, isProcessRoute } from '../../data/processMenu'
import { stockSubMenus } from '../../data/stockMenu'
import { settingsSubMenus } from '../../data/settingsMenu'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Müşteriler', path: '/musteriler' },
  { icon: CalendarDays, label: 'Crm', path: '/crm' },
  { icon: MapPinned, label: 'Saha Satış', path: '/saha-satis' },
  { icon: UserCog, label: 'Personel', path: '/personel' },
  { icon: FolderPlus, label: 'Yeni Proje', path: '/projeler/yeni' },
  { icon: ShoppingBag, label: 'Shopping', path: '/shopping' },
  { icon: WalletCards, label: 'Kasa', path: '/kasa' },
  { icon: Store, label: 'Bayi Yönetimi', path: '/bayi' },
  { icon: MessageCircle, label: 'Mesaj Merkezi', path: '/mesajlar' },
  { icon: Receipt, label: 'E-Fatura', path: '/efatura' },
  { icon: BarChart3, label: 'Raporlar', path: '/raporlar' },
]

const processMenuIndex = 5
const DEFAULT_BRAND_LOGO = bachLogo
const menuButtonBase = 'sidebar-menu-button w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors'
const subMenuButtonBase = 'sidebar-menu-button block w-full px-3 py-1.5 rounded-lg text-xs transition-colors'

function resolveBrandLogo(company) {
  return company?.logoDataUrl || DEFAULT_BRAND_LOGO
}

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const [company, setCompany] = useState(() => readCompanySettings())
  const isProcessRouteActive = isProcessRoute(location.pathname)
  const isStockRoute = location.pathname.startsWith('/stok')
  const isSettingsRoute = location.pathname.startsWith('/ayarlar')
  const [processOpen, setProcessOpen] = useState(isProcessRouteActive)
  const [stockOpen, setStockOpen] = useState(isStockRoute)
  const [settingsOpen, setSettingsOpen] = useState(isSettingsRoute)

  useEffect(() => {
    if (isProcessRouteActive) setProcessOpen(true)
  }, [isProcessRouteActive])

  useEffect(() => {
    if (isStockRoute) setStockOpen(true)
  }, [isStockRoute])

  useEffect(() => {
    if (isSettingsRoute) setSettingsOpen(true)
  }, [isSettingsRoute])

  useEffect(() => {
    function syncCompany() {
      setCompany(readCompanySettings())
    }
    window.addEventListener('erlenbox:company-settings-updated', syncCompany)
    return () => window.removeEventListener('erlenbox:company-settings-updated', syncCompany)
  }, [])

  const itemsBeforeProcess = menuItems.slice(0, processMenuIndex)
  const itemsAfterProcess = menuItems.slice(processMenuIndex)
  const brandLogo = resolveBrandLogo(company)
  const brandLabel = company.companyName || 'Bach'

  return (
    <aside className={`app-sidebar fixed left-0 top-0 h-screen bg-dark-800 border-r border-dark-500/50 flex flex-col z-50 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
      <div className={`p-3 flex items-center gap-2 border-b border-dark-500/50 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <NavLink to="/" className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg hover:opacity-90 transition-opacity" title={brandLabel}>
              <img src={brandLogo} alt={brandLabel} className="h-full w-full object-contain" />
            </NavLink>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-dark-700 transition-colors"
              title="Menüyü aç"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <NavLink to="/" className="flex min-w-0 items-center gap-2.5 hover:opacity-90 transition-opacity">
              <img
                src={brandLogo}
                alt={brandLabel}
                className="h-6 max-h-6 w-auto max-w-[108px] shrink-0 object-contain object-left"
              />
            </NavLink>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-dark-700 transition-colors"
              title="Menüyü daralt"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {itemsBeforeProcess.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
                isActive
                  ? 'sidebar-menu-active font-medium'
                  : ''
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {/* Süreç Yönetimi */}
        <div>
          <button
            type="button"
            onClick={() => setProcessOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isProcessRouteActive
                ? 'sidebar-menu-active font-medium'
                : ''
            }`}
          >
            <Workflow className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Süreç Yönetimi</span>
                {processOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {processOpen && !collapsed && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-dark-500/50 space-y-0.5">
              {processSubMenus.map((sub) => (
                <NavLink
                  key={sub.path}
                  to={sub.path}
                  className={({ isActive }) =>
                    `${subMenuButtonBase} ${
                      isActive
                        ? 'sidebar-menu-active font-medium'
                        : ''
                    }`
                  }
                >
                  {sub.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Stok Yönetimi */}
        <div>
          <button
            type="button"
            onClick={() => setStockOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isStockRoute
                ? 'sidebar-menu-active font-medium'
                : ''
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Stok Yönetimi</span>
                {stockOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {stockOpen && !collapsed && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-dark-500/50 space-y-0.5">
              {stockSubMenus.map((sub) => (
                <NavLink
                  key={sub.path}
                  to={sub.path}
                  onClick={() => {
                    if (sub.path === '/stok/urunler') {
                      window.dispatchEvent(new CustomEvent('erlenbox:open-products-list'))
                    }
                  }}
                  className={({ isActive }) =>
                    `${subMenuButtonBase} ${
                      isActive
                        ? 'sidebar-menu-active font-medium'
                        : ''
                    }`
                  }
                >
                  {sub.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {itemsAfterProcess.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
                isActive
                  ? 'sidebar-menu-active font-medium'
                  : ''
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {/* Ayarlar */}
        <div>
          <button
            type="button"
            onClick={() => setSettingsOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isSettingsRoute
                ? 'sidebar-menu-active font-medium'
                : ''
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Ayarlar</span>
                {settingsOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {settingsOpen && !collapsed && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-dark-500/50 space-y-0.5">
              {settingsSubMenus.map((sub) => (
                <NavLink
                  key={sub.path}
                  to={sub.path}
                  end={sub.path === '/ayarlar'}
                  className={({ isActive }) =>
                    `${subMenuButtonBase} ${
                      isActive
                        ? 'sidebar-menu-active font-medium'
                        : ''
                    }`
                  }
                >
                  {sub.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="p-3 border-t border-dark-500/50">
        {!collapsed ? (
          <p className="text-[10px] text-gray-600 text-center">Erlenbox ERP v2.1.0</p>
        ) : (
          <p className="text-[10px] text-gray-600 text-center">v2.1</p>
        )}
      </div>
    </aside>
  )
}
