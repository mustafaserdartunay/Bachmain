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
  PieChart,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserCog,
  Coins,
  Landmark,
  ScrollText,
  ArrowLeftRight,
  Boxes,
  Warehouse,
  History,
  Tags,
  Calculator,
  LogIn,
  Clock,
  Timer,
  UserX,
  CheckSquare,
  Smartphone,
  Container,
  LayoutDashboard,
  PackageCheck,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { readCompanySettings } from '../../utils/companySettings'
import { customerSubMenus, isSalesRoute } from '../../data/customerMenu'
import { expensesSubMenus, isExpensesRoute } from '../../data/expensesMenu'
import { treasurySubMenus, isTreasuryRoute, CASH_BASE_PATH } from '../../data/treasuryMenu'
import { stockSubMenus, isStockRoute, STOCK_PRODUCTS_PATH } from '../../data/stockMenu'
import { fieldSalesSubMenus, isFieldSalesRoute, FIELD_SALES_HOME_PATH } from '../../data/fieldSalesMenu'
import { hrSubMenus, isHrRoute, HR_HOME_PATH } from '../../data/hrMenu'
import { crmSubMenus, isCrmMenuRoute } from '../../data/crmMenu'
import { processSubMenus, isProcessRoute } from '../../data/processMenu'
import { logisticsSubMenus, isLogisticsRoute, LOGISTICS_HOME_PATH } from '../../data/logisticsMenu'
import { settingsSubMenus } from '../../data/settingsMenu'
import {
  documentCenterChildMenus,
  isDocumentCenterRoute,
  DOCUMENT_CENTER_BASE,
} from '../../data/documentCenterMenu'
import { getMessageCenterBadge } from '../../omnichannel/store'
import BrandLogo from './BrandLogo'
import TrialBanner from '../TrialBanner'
import { useAuth } from '../../auth/AuthContext'
import { filterMenuByEntitlements } from '../../utils/entitlements'
import { canUseMultiCompany } from '../../utils/orgScope'

const baseMenuItems = [
  { icon: Truck, label: 'Kurye Takip', path: '/kurye-takip', moduleCode: 'courier' },
  { icon: FolderPlus, label: 'Yeni Proje', path: '/projeler/yeni', moduleCode: 'crm' },
  { icon: ShoppingBag, label: 'Pos', path: '/shopping', moduleCode: 'pos' },
  { icon: Store, label: 'Bayi Yönetimi', path: '/bayi', moduleCode: 'dealer' },
  { icon: Receipt, label: 'E-Fatura', path: '/efatura', moduleCode: 'einvoice' },
  { icon: BarChart3, label: 'Raporlar', path: '/raporlar', moduleCode: 'reporting' },
]

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
  landmark: Landmark,
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
  calculator: Calculator,
}
const fieldSalesSubMenuIcons = {
  'map-pinned': MapPinned,
  users: Users,
  'bar-chart': BarChart3,
}
const logisticsSubMenuIcons = {
  report: BarChart3,
  plan: ClipboardList,
  shipments: Truck,
  delivery: MapPinned,
  docs: PackageCheck,
  dashboard: LayoutDashboard,
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
const menuButtonBase = 'sidebar-menu-button sidebar-item w-full flex items-center gap-2.5 transition-colors'
const menuLabelClass = 'sidebar-menu-label flex-1 text-left'
const subMenuButtonBase = 'sidebar-menu-button block w-full px-2.5 py-1.5 rounded-xl text-[13px] font-semibold transition-colors whitespace-nowrap'

function SubMenuIcon({ children }) {
  return <span className="submenu-icon-wrap shrink-0">{children}</span>
}

function MenuIcon({ children, collapsed }) {
  return (
    <span className={`icon-wrap ${collapsed ? 'mx-auto' : ''}`}>
      {children}
    </span>
  )
}

export default function Sidebar({ collapsed, mobileOpen = false, onCloseMobile, onToggle }) {
  const location = useLocation()
  const { user } = useAuth()
  const [company, setCompany] = useState(() => readCompanySettings())
  const isSalesRouteActive = isSalesRoute(location.pathname)
  const isProcessRouteActive = isProcessRoute(location.pathname)
  const isExpensesRouteActive = isExpensesRoute(location.pathname)
  const isTreasuryRouteActive = isTreasuryRoute(location.pathname)
  const isStockRouteActive = isStockRoute(location.pathname)
  const isFieldSalesRouteActive = isFieldSalesRoute(location.pathname)
  const isLogisticsRouteActive = isLogisticsRoute(location.pathname)
  const isHrRouteActive = isHrRoute(location.pathname)
  const isDocumentCenterRouteActive = isDocumentCenterRoute(location.pathname)
  const isCrmRouteActive = isCrmMenuRoute(location.pathname)
  const isSettingsRoute = location.pathname.startsWith('/ayarlar') || isDocumentCenterRouteActive
  const [customerOpen, setCustomerOpen] = useState(isSalesRouteActive)
  const [processOpen, setProcessOpen] = useState(isProcessRouteActive)
  const [expensesOpen, setExpensesOpen] = useState(isExpensesRouteActive)
  const [treasuryOpen, setTreasuryOpen] = useState(isTreasuryRouteActive)
  const [stockOpen, setStockOpen] = useState(isStockRouteActive)
  const [fieldSalesOpen, setFieldSalesOpen] = useState(isFieldSalesRouteActive)
  const [logisticsOpen, setLogisticsOpen] = useState(isLogisticsRouteActive)
  const [hrOpen, setHrOpen] = useState(isHrRouteActive)
  const [crmOpen, setCrmOpen] = useState(isCrmRouteActive)
  const [settingsOpen, setSettingsOpen] = useState(isSettingsRoute)
  const [documentCenterOpen, setDocumentCenterOpen] = useState(isDocumentCenterRouteActive)
  const [messageBadge, setMessageBadge] = useState(() => getMessageCenterBadge())

  useEffect(() => {
    if (isSalesRouteActive) setCustomerOpen(true)
  }, [isSalesRouteActive])

  useEffect(() => {
    if (isProcessRouteActive) setProcessOpen(true)
  }, [isProcessRouteActive])

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
    if (isLogisticsRouteActive) setLogisticsOpen(true)
  }, [isLogisticsRouteActive])

  useEffect(() => {
    if (isHrRouteActive) setHrOpen(true)
  }, [isHrRouteActive])

  useEffect(() => {
    if (isCrmRouteActive) setCrmOpen(true)
  }, [isCrmRouteActive])

  useEffect(() => {
    if (isSettingsRoute) setSettingsOpen(true)
  }, [isSettingsRoute])

  useEffect(() => {
    if (isDocumentCenterRouteActive) setDocumentCenterOpen(true)
  }, [isDocumentCenterRouteActive])

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

  const menuItems = filterMenuByEntitlements(baseMenuItems, user?.entitlements)
  const isMessageCenterActive = location.pathname === '/mesajlar' || location.pathname.startsWith('/mesajlar/')
  const brandLabel = company.companyName || 'Bach'
  const sidebarWidthClass = collapsed ? 'lg:w-[var(--ds-sidebar-collapsed,5.5rem)] w-[var(--ds-sidebar-expanded,17.5rem)]' : 'w-[var(--ds-sidebar-expanded,17.5rem)]'
  const sidebarPaddingClass = collapsed ? 'p-4 lg:px-2 lg:py-4' : 'px-3 py-4'
  const mobileStateClass = mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'

  function handleNavigate() {
    onCloseMobile?.()
  }

  return (
    <aside
      data-collapsed={collapsed ? 'true' : 'false'}
      className={`glass-sidebar app-sidebar fixed top-[var(--shell-gap)] bottom-[var(--shell-gap)] left-0 z-50 flex h-[calc(100dvh-(2*var(--shell-gap)))] flex-col transition-all duration-300 lg:left-[var(--shell-gap)] ${sidebarPaddingClass} ${sidebarWidthClass} ${mobileStateClass}`}
    >
      <div className={`flex w-full items-center gap-1.5 ${collapsed ? 'flex-col justify-center px-0 pt-2' : 'justify-between px-1 pt-1 pb-1'}`}>
        <NavLink
          to="/"
          onClick={handleNavigate}
          className={`flex min-w-0 hover:opacity-90 transition-opacity ${collapsed ? 'items-center justify-center' : 'flex-1 items-center justify-center'}`}
          title={brandLabel}
        >
          {company?.logoDataUrl ? (
            <img
              src={company.logoDataUrl}
              alt={brandLabel}
              className={collapsed ? 'h-8 w-8 object-contain' : 'h-9 max-h-9 w-auto max-w-[10rem] shrink-0 object-contain object-center'}
            />
          ) : (
            <BrandLogo collapsed={collapsed} />
          )}
        </NavLink>
        <button
          type="button"
          onClick={onToggle}
          className="glass-sidebar-toggle glass-sidebar-collapse hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl lg:flex"
          title={collapsed ? 'Menüyü aç' : 'Menüyü daralt'}
          aria-label={collapsed ? 'Menüyü aç' : 'Menüyü daralt'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-0.5 ${collapsed ? 'px-0' : 'px-1'}`}>

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
          <MenuIcon collapsed={collapsed}>
            <Gauge className="w-4 h-4 shrink-0" />
          </MenuIcon>
          {!collapsed ? <span className={menuLabelClass}>Güncel Durum</span> : null}
        </NavLink>

        {/* Mesaj Merkezi — always visible */}
        <NavLink
          to="/mesajlar"
          onClick={handleNavigate}
          className={`${menuButtonBase} relative ${collapsed ? 'justify-center' : ''} ${
            isMessageCenterActive ? 'sidebar-menu-active font-medium' : ''
          }`}
        >
          <MenuIcon collapsed={collapsed}>
            <MessageCircle className="w-4 h-4 shrink-0" />
          </MenuIcon>
          {!collapsed && <span className={menuLabelClass}>Mesaj Merkezi</span>}
          {messageBadge.count > 0 && (
            collapsed ? (
              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.75)] animate-pulse"
                aria-label={`${messageBadge.count} okunmamış mesaj`}
              />
            ) : (
              <span
                className="ml-auto flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 px-1.5 text-[12px] font-black text-white shadow-[0_0_10px_rgba(244,63,94,0.55)]"
                title={`${messageBadge.unreadTotal > 0 ? `${messageBadge.unreadTotal} yeni mesaj` : `${messageBadge.unansweredCount} cevaplanmayan konuşma`}`}
              >
                {messageBadge.count > 99 ? '99+' : messageBadge.count}
              </span>
            )
          )}
        </NavLink>

        {/* 2. Satışlar (+ Süreç Yönetimi) */}
        <div className={`sidebar-menu-group ${customerOpen ? 'is-open' : ''} ${isSalesRouteActive ? 'is-active' : ''}`}>
          <button
            type="button"
            onClick={() => setCustomerOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isSalesRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <TrendingUp className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Satışlar</span>
                {customerOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {customerOpen && !collapsed && (
            <div className="mt-0.5 ml-3 space-y-0.5 border-l border-dark-500/50 pl-3">
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
                    {SubIcon ? (
                      <SubMenuIcon>
                        <SubIcon className="h-3.5 w-3.5" />
                      </SubMenuIcon>
                    ) : null}
                    {sub.label}
                  </NavLink>
                )
              })}
              <div>
                <button
                  type="button"
                  onClick={() => setProcessOpen((open) => !open)}
                  className={`${subMenuButtonBase} flex w-full items-center gap-2 ${
                    isProcessRouteActive ? 'sidebar-menu-active font-medium' : ''
                  }`}
                >
                  <SubMenuIcon>
                    <ClipboardList className="h-3.5 w-3.5" />
                  </SubMenuIcon>
                  <span className="min-w-0 flex-1 text-left">Süreç Yönetimi</span>
                  {processOpen
                    ? <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    : <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />}
                </button>
                {processOpen && (
                  <div className="mt-0.5 ml-2 space-y-0.5 border-l border-dark-500/40 pl-2">
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
            </div>
          )}
        </div>

        {/* 3. Giderler */}
        <div className={`sidebar-menu-group ${expensesOpen ? 'is-open' : ''} ${isExpensesRouteActive ? 'is-active' : ''}`}>
          <button
            type="button"
            onClick={() => setExpensesOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isExpensesRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <Banknote className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Giderler</span>
                {expensesOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {expensesOpen && !collapsed && (
            <div className="mt-0.5 ml-3 space-y-0.5 border-l border-dark-500/50 pl-3">
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
                    {SubIcon ? (
                      <SubMenuIcon>
                        <SubIcon className="h-3.5 w-3.5" />
                      </SubMenuIcon>
                    ) : null}
                    {sub.label}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>

        {/* 4. Nakit */}
        <div className={`sidebar-menu-group ${treasuryOpen ? 'is-open' : ''} ${isTreasuryRouteActive ? 'is-active' : ''}`}>
          <button
            type="button"
            onClick={() => setTreasuryOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isTreasuryRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <Coins className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Nakit</span>
                {treasuryOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {treasuryOpen && !collapsed && (
            <div className="mt-0.5 ml-3 space-y-0.5 border-l border-dark-500/50 pl-3">
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
                    {SubIcon ? (
                      <SubMenuIcon>
                        <SubIcon className="h-3.5 w-3.5" />
                      </SubMenuIcon>
                    ) : null}
                    {sub.label}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>

        {/* 5. Stok */}
        <div className={`sidebar-menu-group ${stockOpen ? 'is-open' : ''} ${isStockRouteActive ? 'is-active' : ''}`}>
          <button
            type="button"
            onClick={() => setStockOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isStockRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <Boxes className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Stok</span>
                {stockOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {stockOpen && !collapsed && (
            <div className="mt-0.5 ml-3 space-y-0.5 border-l border-dark-500/50 pl-3">
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
                    {SubIcon ? (
                      <SubMenuIcon>
                        <SubIcon className="h-3.5 w-3.5" />
                      </SubMenuIcon>
                    ) : null}
                    {sub.label}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>

        {/* CRM */}
        <div className={`sidebar-menu-group ${crmOpen ? 'is-open' : ''} ${isCrmRouteActive ? 'is-active' : ''}`}>
          <button
            type="button"
            onClick={() => setCrmOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isCrmRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <CalendarDays className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>CRM</span>
                {crmOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {crmOpen && !collapsed && (
            <div className="mt-0.5 ml-3 space-y-0.5 border-l border-dark-500/50 pl-3">
              {crmSubMenus.map((sub) => (
                <NavLink
                  key={sub.path}
                  to={sub.path}
                  end={Boolean(sub.end)}
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

        {/* İnsan Kaynakları / PDKS */}
        <div className={`sidebar-menu-group ${hrOpen ? 'is-open' : ''} ${isHrRouteActive ? 'is-active' : ''}`}>
          <button
            type="button"
            onClick={() => setHrOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isHrRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <UserCog className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>İnsan Kaynakları</span>
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
                    {SubIcon ? (
                      <SubMenuIcon>
                        <SubIcon className="h-3.5 w-3.5" />
                      </SubMenuIcon>
                    ) : null}
                    {sub.label}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>

        {/* Saha Satış */}
        <div className={`sidebar-menu-group ${fieldSalesOpen ? 'is-open' : ''} ${isFieldSalesRouteActive ? 'is-active' : ''}`}>
          <button
            type="button"
            onClick={() => setFieldSalesOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isFieldSalesRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <MapPinned className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Saha Satış</span>
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
                    {SubIcon ? (
                      <SubMenuIcon>
                        <SubIcon className="h-3.5 w-3.5" />
                      </SubMenuIcon>
                    ) : null}
                    {sub.label}
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>

        <div className={`sidebar-menu-group ${logisticsOpen ? 'is-open' : ''} ${isLogisticsRouteActive ? 'is-active' : ''}`}>
          <button
            type="button"
            onClick={() => setLogisticsOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isLogisticsRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <Container className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Lojistik</span>
                {logisticsOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>
          {logisticsOpen && !collapsed && (
            <div className="mt-0.5 ml-3 space-y-0.5 border-l border-dark-500/50 pl-3">
              {logisticsSubMenus.map((sub) => {
                const SubIcon = logisticsSubMenuIcons[sub.icon] || ClipboardList
                return (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    end={sub.path === LOGISTICS_HOME_PATH}
                    onClick={handleNavigate}
                    className={({ isActive }) =>
                      `${subMenuButtonBase} flex items-center gap-2 ${
                        isActive ? 'sidebar-menu-active font-medium' : ''
                      }`
                    }
                  >
                    <SubMenuIcon>
                      <SubIcon className="h-3.5 w-3.5" />
                    </SubMenuIcon>
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
            <MenuIcon collapsed={collapsed}>
              <item.icon className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && <span className={menuLabelClass}>{item.label}</span>}
          </NavLink>
        ))}

        {/* Ayarlar */}
        <div className={`sidebar-menu-group ${settingsOpen ? 'is-open' : ''} ${isSettingsRoute ? 'is-active' : ''}`}>
          <button
            type="button"
            onClick={() => setSettingsOpen((open) => !open)}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              isSettingsRoute
                ? 'sidebar-menu-active font-medium'
                : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <Settings className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Ayarlar</span>
                {settingsOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {settingsOpen && !collapsed && (
            <div className="mt-0.5 ml-3 pl-3 border-l border-dark-500/50 space-y-0.5">
              {filterMenuByEntitlements(settingsSubMenus, user?.entitlements)
                .filter((sub) => {
                  if (sub.moduleCode === 'multi_company') {
                    return canUseMultiCompany(user?.entitlements, user?.planCode)
                  }
                  return true
                })
                .map((sub) => (
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

              <div>
                <div className="flex items-center gap-0.5">
                  <NavLink
                    to={DOCUMENT_CENTER_BASE}
                    end
                    onClick={handleNavigate}
                    className={({ isActive }) =>
                      `${subMenuButtonBase} flex-1 ${
                        isActive || isDocumentCenterRouteActive
                          ? 'sidebar-menu-active font-medium'
                          : ''
                      }`
                    }
                  >
                    Belge Merkezi
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => setDocumentCenterOpen((open) => !open)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-white/20"
                    aria-label={documentCenterOpen ? 'Belge Merkezi menüsünü kapat' : 'Belge Merkezi menüsünü aç'}
                  >
                    {documentCenterOpen
                      ? <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                      : <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                  </button>
                </div>
                {documentCenterOpen && (
                  <div className="mt-0.5 ml-2 space-y-0.5 border-l border-dark-500/40 pl-2">
                    {documentCenterChildMenus.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={handleNavigate}
                        className={({ isActive }) =>
                          `${subMenuButtonBase} ${
                            isActive ? 'sidebar-menu-active font-medium' : ''
                          }`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className={`mt-auto shrink-0 ${collapsed ? 'px-0 pb-0.5' : 'px-1 pb-1'}`}>
        <TrialBanner collapsed={collapsed} />
      </div>
    </aside>
  )
}
