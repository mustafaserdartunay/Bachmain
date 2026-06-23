import { useState, useEffect } from 'react'
import {
  Gauge,
  ShoppingBag,
  Package,
  TrendingUp,
  Users,
  UserSearch,
  Banknote,
  ClipboardList,
  Inbox,
  Percent,
  Store,
  MessageCircle,
  Receipt,
  BarChart3,
  Settings,
  FolderPlus,
  Wallet,
  MapPinned,
  Truck,
  Handshake,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  CalendarDays,
  ChevronRight,
  ChevronDown,
  UserCog,
  Workflow,
  Coins,
  Landmark,
  ScrollText,
  ArrowLeftRight,
  Boxes,
  Warehouse,
  History,
  Tags,
  LogIn,
  Clock,
  Timer,
  UserX,
  CheckSquare,
  Smartphone,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { readCompanySettings } from '../../utils/companySettings'
import bachLogo from '../../assets/bach-logo.png'
import { processSubMenus, isProcessRoute } from '../../data/processMenu'
import { customerSubMenus, isCustomerRoute } from '../../data/customerMenu'
import { expensesSubMenus, isExpensesRoute } from '../../data/expensesMenu'
import { treasurySubMenus, isTreasuryRoute, CASH_BASE_PATH } from '../../data/treasuryMenu'
import { stockSubMenus, isStockRoute, STOCK_PRODUCTS_PATH } from '../../data/stockMenu'
import { fieldSalesSubMenus, isFieldSalesRoute, FIELD_SALES_HOME_PATH } from '../../data/fieldSalesMenu'
import { hrSubMenus, isHrRoute, HR_HOME_PATH } from '../../data/hrMenu'
import { settingsSubMenus } from '../../data/settingsMenu'
import { getMessageCenterBadge } from '../../omnichannel/store'

const baseMenuItems = [
  { icon: Truck, label: 'Kurye Takip', path: '/kurye-takip' },
  { icon: FolderPlus, label: 'Yeni Proje', path: '/projeler/yeni' },
  { icon: ShoppingBag, label: 'Shopping', path: '/shopping' },
  { icon: Store, label: 'Bayi Yönetimi', path: '/bayi' },
  { icon: MessageCircle, label: 'Mesaj Merkezi', path: '/mesajlar' },
  { icon: Receipt, label: 'E-Fatura', path: '/efatura' },
  { icon: BarChart3, label: 'Raporlar', path: '/raporlar' },
]

const DEFAULT_BRAND_LOGO = bachLogo
const customerSubMenuIcons = {
  users: Users,
  'user-search': UserSearch,
  receipt: Receipt,
  'bar-chart': BarChart3,
  wallet: Wallet,
  'pie-chart': PieChart,
}
const expensesSubMenuIcons = {
  list: ClipboardList,
  inbox: Inbox,
  handshake: Handshake,
  users: Users,
  'bar-chart': BarChart3,
  wallet: Wallet,
  percent: Percent,
}
const treasurySubMenuIcons = {
  landmark: Landmark,
  'scroll-text': ScrollText,
  'bar-chart': BarChart3,
  'arrow-left-right': ArrowLeftRight,
}
const stockSubMenuIcons = {
  package: Package,
  warehouse: Warehouse,
  'arrow-left-right': ArrowLeftRight,
  truck: Truck,
  inbox: Inbox,
  tags: Tags,
  history: History,
  'bar-chart': BarChart3,
}
const fieldSalesSubMenuIcons = {
  'map-pinned': MapPinned,
  users: Users,
  'bar-chart': BarChart3,
}
const hrSubMenuIcons = {
  gauge: Gauge,
  users: Users,
  'log-in': LogIn,
  clock: Clock,
  calendar: CalendarDays,
  timer: Timer,
  'user-x': UserX,
  'check-square': CheckSquare,
  map: MapPinned,
  smartphone: Smartphone,
  settings: Settings,
}
const menuButtonBase = 'sidebar-menu-button w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors'
const subMenuButtonBase = 'sidebar-menu-button block w-full px-3 py-1.5 rounded-lg text-xs transition-colors'

function resolveBrandLogo(company) {
  return company?.logoDataUrl || DEFAULT_BRAND_LOGO
}

export default function Sidebar({ collapsed, mobileOpen = false, onCloseMobile, onToggle }) {
  const location = useLocation()
  const [company, setCompany] = useState(() => readCompanySettings())
  const isCustomerRouteActive = isCustomerRoute(location.pathname)
  const isExpensesRouteActive = isExpensesRoute(location.pathname)
  const isTreasuryRouteActive = isTreasuryRoute(location.pathname)
  const isStockRouteActive = isStockRoute(location.pathname)
  const isFieldSalesRouteActive = isFieldSalesRoute(location.pathname)
  const isHrRouteActive = isHrRoute(location.pathname)
  const isProcessRouteActive = isProcessRoute(location.pathname)
  const isCrmRouteActive = location.pathname === '/crm' || location.pathname.startsWith('/crm/')
  const isSettingsRoute = location.pathname.startsWith('/ayarlar')
  const [customerOpen, setCustomerOpen] = useState(isCustomerRouteActive)
  const [expensesOpen, setExpensesOpen] = useState(isExpensesRouteActive)
  const [treasuryOpen, setTreasuryOpen] = useState(isTreasuryRouteActive)
  const [stockOpen, setStockOpen] = useState(isStockRouteActive)
  const [fieldSalesOpen, setFieldSalesOpen] = useState(isFieldSalesRouteActive)
  const [hrOpen, setHrOpen] = useState(isHrRouteActive)
  const [processOpen, setProcessOpen] = useState(isProcessRouteActive)
  const [settingsOpen, setSettingsOpen] = useState(isSettingsRoute)
  const [messageBadge, setMessageBadge] = useState(() => getMessageCenterBadge())

  useEffect(() => {
    if (isCustomerRouteActive) setCustomerOpen(true)
  }, [isCustomerRouteActive])

  useEffect(() => {
    if (isExpensesRouteActive) setExpensesOpen(true)
  }, [isExpensesRouteActive])

  useEffect(() => {
    if (isTreasuryRouteActive) setTreasuryOpen(true)
  }, [isTreasuryRouteActive])

  useEffect(() => {
    if (isStockRouteActive) setStockOpen(true)
  }, [isStockRouteActive])

  useEffect(() => {
    if (isFieldSalesRouteActive) setFieldSalesOpen(true)
  }, [isFieldSalesRouteActive])

  useEffect(() => {
    if (isHrRouteActive) setHrOpen(true)
  }, [isHrRouteActive])

  useEffect(() => {
    if (isProcessRouteActive) setProcessOpen(true)
  }, [isProcessRouteActive])

  useEffect(() => {
    if (isSettingsRoute) setSettingsOpen(true)
  }, [isSettingsRoute])

  useEffect(() => {
    function syncMessageBadge() {
      setMessageBadge(getMessageCenterBadge())
    }
    syncMessageBadge()
    window.addEventListener('bach:omni-updated', syncMessageBadge)
    return () => window.removeEventListener('bach:omni-updated', syncMessageBadge)
  }, [])

  useEffect(() => {
    function syncCompany() {
      setCompany(readCompanySettings())
    }
    window.addEventListener('erlenbox:company-settings-updated', syncCompany)
    return () => {
      window.removeEventListener('erlenbox:company-settings-updated', syncCompany)
    }
  }, [])

  const menuItems = baseMenuItems
  const brandLogo = resolveBrandLogo(company)
  const brandLabel = company.companyName || 'Bach'
  const sidebarWidthClass = collapsed ? 'lg:w-16 w-56' : 'w-56'
  const mobileStateClass = mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'

  function handleNavigate() {
    onCloseMobile?.()
  }

  return (
    <aside className={`app-sidebar fixed left-0 top-0 z-50 flex h-dvh flex-col bg-dark-800 transition-all duration-300 ${sidebarWidthClass} ${mobileStateClass}`}>
      <div className={`p-3 flex items-center gap-2 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <NavLink to="/" onClick={handleNavigate} className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-lg hover:opacity-90 transition-opacity" title={brandLabel}>
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
            <NavLink to="/" onClick={handleNavigate} className="flex min-w-0 items-center gap-2.5 hover:opacity-90 transition-opacity">
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
        {/* 1. Güncel Durum */}
        <NavLink
          to="/"
          end
          onClick={handleNavigate}
          className={({ isActive }) =>
            `${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isActive ? 'sidebar-menu-active font-medium' : ''
            }`
          }
        >
          <Gauge className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Güncel Durum</span>}
        </NavLink>

        {/* 2. Satışlar */}
        <div>
          <button
            type="button"
            onClick={() => setCustomerOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isCustomerRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Satışlar</span>
                {customerOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {customerOpen && !collapsed && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-dark-500/50 space-y-0.5">
              {customerSubMenus.map((sub) => {
                const SubIcon = sub.icon ? customerSubMenuIcons[sub.icon] : null
                return (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    end={sub.path === '/musteriler'}
                    onClick={handleNavigate}
                    className={({ isActive }) =>
                      `${subMenuButtonBase} flex items-center gap-2 ${
                        isActive ? 'sidebar-menu-active font-medium' : ''
                      }`
                    }
                  >
                    {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />}
                    {sub.label}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>

        {/* 3. Giderler */}
        <div>
          <button
            type="button"
            onClick={() => setExpensesOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isExpensesRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <Banknote className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Giderler</span>
                {expensesOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {expensesOpen && !collapsed && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-dark-500/50 space-y-0.5">
              {expensesSubMenus.map((sub) => {
                const SubIcon = sub.icon ? expensesSubMenuIcons[sub.icon] : null
                return (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    onClick={handleNavigate}
                    className={({ isActive }) =>
                      `${subMenuButtonBase} flex items-center gap-2 ${
                        isActive ? 'sidebar-menu-active font-medium' : ''
                      }`
                    }
                  >
                    {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />}
                    {sub.label}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>

        {/* 4. Nakit */}
        <div>
          <button
            type="button"
            onClick={() => setTreasuryOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isTreasuryRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <Coins className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Nakit</span>
                {treasuryOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {treasuryOpen && !collapsed && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-dark-500/50 space-y-0.5">
              {treasurySubMenus.map((sub) => {
                const SubIcon = sub.icon ? treasurySubMenuIcons[sub.icon] : null
                return (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    end={sub.path === CASH_BASE_PATH}
                    onClick={handleNavigate}
                    className={({ isActive }) =>
                      `${subMenuButtonBase} flex items-center gap-2 ${
                        isActive ? 'sidebar-menu-active font-medium' : ''
                      }`
                    }
                  >
                    {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />}
                    {sub.label}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>

        {/* 5. Stok */}
        <div>
          <button
            type="button"
            onClick={() => setStockOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isStockRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <Boxes className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Stok</span>
                {stockOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {stockOpen && !collapsed && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-dark-500/50 space-y-0.5">
              {stockSubMenus.map((sub) => {
                const SubIcon = sub.icon ? stockSubMenuIcons[sub.icon] : null
                return (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    end={sub.path === STOCK_PRODUCTS_PATH}
                    onClick={() => {
                      handleNavigate()
                      if (sub.openProductsList) {
                        window.dispatchEvent(new CustomEvent('erlenbox:open-products-list'))
                      }
                    }}
                    className={({ isActive }) =>
                      `${subMenuButtonBase} flex items-center gap-2 ${
                        isActive ? 'sidebar-menu-active font-medium' : ''
                      }`
                    }
                  >
                    {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />}
                    {sub.label}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>

        {/* 6. Süreç Yönetimi */}
        <div>
          <button
            type="button"
            onClick={() => setProcessOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isProcessRouteActive ? 'sidebar-menu-active font-medium' : ''
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
                  onClick={handleNavigate}
                  className={({ isActive }) =>
                    `${subMenuButtonBase} ${
                      isActive ? 'sidebar-menu-active font-medium' : ''
                    }`
                  }
                >
                  {sub.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* 7. CRM */}
        <NavLink
          to="/crm"
          onClick={handleNavigate}
          className={({ isActive }) =>
            `${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isActive || isCrmRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`
          }
        >
          <CalendarDays className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Crm</span>}
        </NavLink>

        {/* İnsan Kaynakları / PDKS */}
        <div>
          <button
            type="button"
            onClick={() => setHrOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isHrRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <UserCog className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">İnsan Kaynakları</span>
                {hrOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {hrOpen && !collapsed && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-dark-500/50 space-y-0.5">
              {hrSubMenus.map((sub) => {
                const SubIcon = sub.icon ? hrSubMenuIcons[sub.icon] : null
                return (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    end={sub.path === HR_HOME_PATH}
                    onClick={handleNavigate}
                    className={({ isActive }) =>
                      `${subMenuButtonBase} flex items-center gap-2 ${
                        isActive ? 'sidebar-menu-active font-medium' : ''
                      }`
                    }
                  >
                    {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />}
                    {sub.label}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>

        {/* Saha Satış */}
        <div>
          <button
            type="button"
            onClick={() => setFieldSalesOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isFieldSalesRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MapPinned className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Saha Satış</span>
                {fieldSalesOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {fieldSalesOpen && !collapsed && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-dark-500/50 space-y-0.5">
              {fieldSalesSubMenus.map((sub) => {
                const SubIcon = sub.icon ? fieldSalesSubMenuIcons[sub.icon] : null
                return (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    end={sub.path === FIELD_SALES_HOME_PATH}
                    onClick={handleNavigate}
                    className={({ isActive }) =>
                      `${subMenuButtonBase} flex items-center gap-2 ${
                        isActive ? 'sidebar-menu-active font-medium' : ''
                      }`
                    }
                  >
                    {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />}
                    {sub.label}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              handleNavigate()
              if (item.openProductsList) {
                window.dispatchEvent(new CustomEvent('erlenbox:open-products-list'))
              }
            }}
            className={({ isActive }) =>
              `${menuButtonBase} relative ${collapsed ? 'justify-center' : ''} ${
                isActive ? 'sidebar-menu-active font-medium' : ''
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
            {item.path === '/mesajlar' && messageBadge.count > 0 && (
              collapsed ? (
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.75)] animate-pulse"
                  aria-label={`${messageBadge.count} okunmamış mesaj`}
                />
              ) : (
                <span
                  className="ml-auto flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 px-1.5 text-[10px] font-black text-white shadow-[0_0_10px_rgba(244,63,94,0.55)]"
                  title={`${messageBadge.unreadTotal > 0 ? `${messageBadge.unreadTotal} yeni mesaj` : `${messageBadge.unansweredCount} cevaplanmayan konuşma`}`}
                >
                  {messageBadge.count > 99 ? '99+' : messageBadge.count}
                </span>
              )
            )}
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
                  onClick={handleNavigate}
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

      <div className="p-3">
        {!collapsed ? (
          <p className="sidebar-version-label text-center text-xs font-black leading-none text-[#f8fafc]">BACH v1.0</p>
        ) : (
          <p className="sidebar-version-label text-center text-xs font-black leading-none text-[#f8fafc]">v1.0</p>
        )}
      </div>
    </aside>
  )
}
