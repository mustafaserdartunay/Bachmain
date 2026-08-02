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
  MessageCircle,
  Receipt,
  BarChart3,
  Settings,
  FolderPlus,
  FolderKanban,
  List,
  PlayCircle,
  CheckCircle2,
  Ban,
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
  Sparkles,
  Share2,
  BookOpen,
  Search,
  Megaphone,
  Clapperboard,
  Instagram,
  PlugZap,
  Mail,
  PanelsTopLeft,
  Binoculars,
  KeyRound,
  Palette,
  Image,
  Frame,
  Camera,
  Film,
  Bot,
  Network,
  Activity,
  Puzzle,
  Workflow,
  Target,
  GitBranch,
  UserPlus,
  FileBarChart,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { readCompanySettings } from '../../utils/companySettings'
import { visibleCustomerSubMenus, isSalesRoute } from '../../data/customerMenu'
import { expensesSubMenus, isExpensesRoute } from '../../data/expensesMenu'
import { treasurySubMenus, isTreasuryRoute, CASH_BASE_PATH } from '../../data/treasuryMenu'
import { stockSubMenus, isStockRoute, STOCK_PRODUCTS_PATH } from '../../data/stockMenu'
import {
  fieldSalesSubMenus,
  isFieldSalesRoute,
  FIELD_SALES_HOME_PATH,
} from '../../data/fieldSalesMenu'
import { hrSubMenus, isHrRoute, HR_HOME_PATH } from '../../data/hrMenu'
import {
  socialMediaSubMenus,
  isSocialMediaRoute,
  SOCIAL_MEDIA_HOME_PATH,
} from '../../data/socialMediaMenu'
import { crmSubMenus, isCrmMenuRoute } from '../../data/crmMenu'
import { visibleProcessSubMenus, isProcessRoute } from '../../data/processMenu'
import { logisticsSubMenus, isLogisticsRoute, LOGISTICS_HOME_PATH } from '../../data/logisticsMenu'
import { projectsSubMenus, isProjectsRoute, PROJECTS_HOME_PATH } from '../../data/projectsMenu'
import { settingsSubMenus } from '../../data/settingsMenu'
import {
  documentCenterChildMenus,
  isDocumentCenterRoute,
  DOCUMENT_CENTER_BASE,
} from '../../data/documentCenterMenu'
import { getMessageCenterBadge } from '../../omnichannel/store'
import BrandLogo from './BrandLogo'
import TrialBanner from '../TrialBanner'
import { APP_VERSION } from '../../version/appVersion'
import { useAuth } from '../../auth/AuthContext'
import { filterMenuByEntitlements } from '../../utils/entitlements'
import { canUseMultiCompany } from '../../utils/orgScope'

const projectsMenuGate = {
  label: 'Projeler',
  path: PROJECTS_HOME_PATH,
  moduleCode: 'crm',
}

const baseMenuItems = [
  { icon: Truck, label: 'Kurye Takip', path: '/kurye-takip', moduleCode: 'courier' },
  { icon: ShoppingBag, label: 'Pos', path: '/shopping', moduleCode: 'pos' },
  { icon: Landmark, label: 'Finans', path: '/finans', moduleCode: 'finance' },
  { icon: Receipt, label: 'E-Fatura', path: '/finans?tab=einvoice', moduleCode: 'einvoice' },
  { icon: BarChart3, label: 'Analytics', path: '/analitik', moduleCode: 'reporting' },
  { icon: Bot, label: 'AIOS', path: '/aios', moduleCode: 'ai_growth' },
  { icon: Network, label: 'AI Org', path: '/ai-organizasyon', moduleCode: 'ai_growth' },
  { icon: Activity, label: 'Otonom', path: '/ai-otonom', moduleCode: 'ai_growth' },
  { icon: Puzzle, label: 'App Builder', path: '/ai-uygulama', moduleCode: 'ai_growth' },
]

const customerSubMenuIcons = {
  users: Users,
  'user-search': UserSearch,
  receipt: Receipt,
  'bar-chart': BarChart3,
  wallet: Wallet,
  'pie-chart': PieChart,
  sparkles: Sparkles,
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
  banknote: Banknote,
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
const projectsSubMenuIcons = {
  'folder-plus': FolderPlus,
  list: List,
  play: PlayCircle,
  check: CheckCircle2,
  cancel: Ban,
}
const fieldSalesSubMenuIcons = {
  'map-pinned': MapPinned,
  'user-search': UserSearch,
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
const socialMediaSubMenuIcons = {
  instagram: Instagram,
  plug: PlugZap,
  clock: Clock,
  'check-square': CheckSquare,
  'layout-dashboard': LayoutDashboard,
  sparkles: Sparkles,
  'share-2': Share2,
  'book-open': BookOpen,
  search: Search,
  megaphone: Megaphone,
  clapperboard: Clapperboard,
  mail: Mail,
  'message-circle': MessageCircle,
  smartphone: Smartphone,
  target: Target,
  'panels-top-left': PanelsTopLeft,
  'git-branch': GitBranch,
  'user-plus': UserPlus,
  users: Users,
  binoculars: Binoculars,
  'trending-up': TrendingUp,
  'key-round': KeyRound,
  palette: Palette,
  image: Image,
  frame: Frame,
  camera: Camera,
  film: Film,
  bot: Bot,
  network: Network,
  workflow: Workflow,
  'bar-chart-3': BarChart3,
  'file-bar-chart': FileBarChart,
  settings: Settings,
}
const menuButtonBase =
  'sidebar-menu-button sidebar-item w-full flex items-center gap-2.5 transition-colors'
const menuLabelClass = 'sidebar-menu-label flex-1 text-left'
const subMenuButtonBase =
  'sidebar-submenu-leaf sidebar-menu-button block w-full px-2.5 py-1.5 rounded-xl text-[13px] font-semibold transition-colors whitespace-nowrap'

function SidebarSubMenu({ children, className = '' }) {
  return <div className={`sidebar-submenu${className ? ` ${className}` : ''}`}>{children}</div>
}

function SubMenuIcon({ children }) {
  return <span className="submenu-icon-wrap shrink-0">{children}</span>
}

function MenuIcon({ children, collapsed }) {
  return <span className={`icon-wrap ${collapsed ? 'mx-auto' : ''}`}>{children}</span>
}

function SidebarSection({ label, collapsed }) {
  if (collapsed) {
    return <div className="sidebar-section-divider" aria-hidden="true" />
  }
  return (
    <div className="sidebar-section-label" role="presentation">
      {label}
    </div>
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
  const isSocialMediaRouteActive = isSocialMediaRoute(location.pathname)
  const isDocumentCenterRouteActive = isDocumentCenterRoute(location.pathname)
  const isCrmRouteActive = isCrmMenuRoute(location.pathname)
  const isProjectsRouteActive = isProjectsRoute(location.pathname)
  const isSettingsRoute = location.pathname.startsWith('/ayarlar') || isDocumentCenterRouteActive
  const resolveOpenMenuId = () => {
    if (isSalesRouteActive) return 'customer'
    if (isProcessRouteActive) return 'process'
    if (isExpensesRouteActive) return 'expenses'
    if (isTreasuryRouteActive) return 'treasury'
    if (isStockRouteActive) return 'stock'
    if (isProjectsRouteActive) return 'projects'
    if (isFieldSalesRouteActive) return 'fieldSales'
    if (isCrmRouteActive) return 'crm'
    if (isSocialMediaRouteActive) return 'socialMedia'
    if (isHrRouteActive) return 'hr'
    if (isLogisticsRouteActive) return 'logistics'
    if (isSettingsRoute) return 'settings'
    return null
  }

  const [openMenuId, setOpenMenuId] = useState(resolveOpenMenuId)
  const [documentCenterOpen, setDocumentCenterOpen] = useState(isDocumentCenterRouteActive)
  const [messageBadge, setMessageBadge] = useState(() => getMessageCenterBadge())

  const customerOpen = openMenuId === 'customer'
  const processOpen = openMenuId === 'process'
  const expensesOpen = openMenuId === 'expenses'
  const treasuryOpen = openMenuId === 'treasury'
  const stockOpen = openMenuId === 'stock'
  const projectsOpen = openMenuId === 'projects'
  const fieldSalesOpen = openMenuId === 'fieldSales'
  const logisticsOpen = openMenuId === 'logistics'
  const hrOpen = openMenuId === 'hr'
  const socialMediaOpen = openMenuId === 'socialMedia'
  const crmOpen = openMenuId === 'crm'
  const settingsOpen = openMenuId === 'settings'

  function toggleMenu(menuId) {
    setOpenMenuId((current) => (current === menuId ? null : menuId))
  }

  useEffect(() => {
    const next = resolveOpenMenuId()
    if (next) setOpenMenuId(next)
  }, [
    isSalesRouteActive,
    isProcessRouteActive,
    isExpensesRouteActive,
    isTreasuryRouteActive,
    isStockRouteActive,
    isProjectsRouteActive,
    isFieldSalesRouteActive,
    isCrmRouteActive,
    isSocialMediaRouteActive,
    isHrRouteActive,
    isLogisticsRouteActive,
    isSettingsRoute,
  ])

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
  const showProjects = filterMenuByEntitlements([projectsMenuGate], user?.entitlements).length > 0
  const isMessageCenterActive =
    location.pathname === '/mesajlar' || location.pathname.startsWith('/mesajlar/')
  const brandLabel = company.companyName || 'Bach'
  const sidebarWidthClass = collapsed
    ? 'lg:w-[var(--ds-sidebar-collapsed,5.5rem)] w-[var(--ds-sidebar-expanded,17.5rem)]'
    : 'w-[var(--ds-sidebar-expanded,17.5rem)]'
  const sidebarPaddingClass = collapsed ? 'p-4 lg:px-2 lg:py-4' : 'px-3 py-4'
  const mobileStateClass = mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'

  function handleNavigate() {
    onCloseMobile?.()
  }

  return (
    <aside
      data-collapsed={collapsed ? 'true' : 'false'}
      className={`glass-sidebar app-sidebar fixed top-[var(--shell-gap)] left-[var(--shell-gap)] z-50 flex flex-col transition-all duration-300 bottom-[calc(var(--ds-bottom-nav-h,4rem)+env(safe-area-inset-bottom)+var(--shell-gap))] h-auto lg:bottom-[var(--shell-gap)] lg:h-[calc(100dvh-(2*var(--shell-gap)))] ${sidebarPaddingClass} ${sidebarWidthClass} ${mobileStateClass}`}
    >
      <div
        className={`flex w-full items-center gap-1.5 ${collapsed ? 'flex-col justify-center px-0 pt-2' : 'justify-between px-1 pt-1 pb-1'}`}
      >
        <div className={`flex min-w-0 items-center gap-1 ${collapsed ? 'flex-col' : 'flex-1'}`}>
          <NavLink
            to="/"
            onClick={handleNavigate}
            className={`flex min-w-0 hover:opacity-90 transition-opacity ${collapsed ? 'items-center justify-center' : 'items-center'}`}
            title={brandLabel}
          >
            {company?.logoDataUrl ? (
              <img
                src={company.logoDataUrl}
                alt={brandLabel}
                className={
                  collapsed
                    ? 'h-8 w-8 object-contain'
                    : 'h-9 max-h-9 w-auto max-w-[7rem] shrink-0 object-contain object-center'
                }
              />
            ) : (
              <BrandLogo collapsed={collapsed} />
            )}
          </NavLink>
        </div>
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

      <nav
        className={`flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-0.5 ${collapsed ? 'px-0' : 'px-1'}`}
      >
        {/* Ana: Güncel Durum */}
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

        <SidebarSection label="ERP" collapsed={collapsed} />

        {/* 2. Satışlar */}
        <div className={`sidebar-menu-group ${customerOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            onClick={() => toggleMenu('customer')}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              collapsed && isSalesRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <TrendingUp className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Satışlar</span>
                {customerOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                )}
              </>
            )}
          </button>

          {customerOpen && !collapsed && (
            <SidebarSubMenu>
              {visibleCustomerSubMenus.map((sub) => {
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
            </SidebarSubMenu>
          )}
        </div>

        {/* 2b. Süreç Yönetimi (Satışlar altında, bağımsız grup) */}
        <div className={`sidebar-menu-group ${processOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            onClick={() => toggleMenu('process')}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              collapsed && isProcessRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <ClipboardList className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Süreç Yönetimi</span>
                {processOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                )}
              </>
            )}
          </button>

          {processOpen && !collapsed && (
            <SidebarSubMenu>
              {visibleProcessSubMenus.map((sub) => (
                <NavLink
                  key={sub.path}
                  to={sub.path}
                  onClick={handleNavigate}
                  className={({ isActive }) =>
                    `${subMenuButtonBase} ${isActive ? 'sidebar-menu-active font-medium' : ''}`
                  }
                >
                  {sub.label}
                </NavLink>
              ))}
            </SidebarSubMenu>
          )}
        </div>

        {/* 3. Giderler */}
        <div className={`sidebar-menu-group ${expensesOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            onClick={() => toggleMenu('expenses')}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              collapsed && isExpensesRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <Banknote className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Giderler</span>
                {expensesOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                )}
              </>
            )}
          </button>

          {expensesOpen && !collapsed && (
            <SidebarSubMenu>
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
            </SidebarSubMenu>
          )}
        </div>

        {/* 4. Nakit */}
        <div className={`sidebar-menu-group ${treasuryOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            onClick={() => toggleMenu('treasury')}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              collapsed && isTreasuryRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <Coins className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Nakit</span>
                {treasuryOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                )}
              </>
            )}
          </button>

          {treasuryOpen && !collapsed && (
            <SidebarSubMenu>
              {treasurySubMenus.map((sub) => {
                const SubIcon = sub.icon ? treasurySubMenuIcons[sub.icon] : null
                return (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    end
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
            </SidebarSubMenu>
          )}
        </div>

        {/* 5. Stok */}
        <div className={`sidebar-menu-group ${stockOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            onClick={() => toggleMenu('stock')}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              collapsed && isStockRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <Boxes className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Stok</span>
                {stockOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                )}
              </>
            )}
          </button>

          {stockOpen && !collapsed && (
            <SidebarSubMenu>
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
            </SidebarSubMenu>
          )}
        </div>

        {showProjects && (
          <div className={`sidebar-menu-group ${projectsOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              onClick={() => toggleMenu('projects')}
              className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
                collapsed && isProjectsRouteActive ? 'sidebar-menu-active font-medium' : ''
              }`}
            >
              <MenuIcon collapsed={collapsed}>
                <FolderKanban className="w-4 h-4 shrink-0" />
              </MenuIcon>
              {!collapsed && (
                <>
                  <span className={menuLabelClass}>Projeler</span>
                  {projectsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  )}
                </>
              )}
            </button>

            {projectsOpen && !collapsed && (
              <SidebarSubMenu>
                {projectsSubMenus.map((sub) => {
                  const SubIcon = sub.icon ? projectsSubMenuIcons[sub.icon] : null
                  return (
                    <NavLink
                      key={sub.path}
                      to={sub.path}
                      end={sub.path === PROJECTS_HOME_PATH}
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
              </SidebarSubMenu>
            )}
          </div>
        )}

        <SidebarSection label="CRM" collapsed={collapsed} />

        {/* Ajanda (görev / not / randevu) */}
        <div className={`sidebar-menu-group ${crmOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            onClick={() => toggleMenu('crm')}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              collapsed && isCrmRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <CalendarDays className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Ajanda</span>
                {crmOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                )}
              </>
            )}
          </button>

          {crmOpen && !collapsed && (
            <SidebarSubMenu>
              {crmSubMenus.map((sub) => (
                <NavLink
                  key={sub.path}
                  to={sub.path}
                  end={Boolean(sub.end)}
                  onClick={handleNavigate}
                  className={({ isActive }) =>
                    `${subMenuButtonBase} ${isActive ? 'sidebar-menu-active font-medium' : ''}`
                  }
                >
                  {sub.label}
                </NavLink>
              ))}
            </SidebarSubMenu>
          )}
        </div>

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
          {messageBadge.count > 0 &&
            (collapsed ? (
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
            ))}
        </NavLink>

        {/* Saha Satış */}
        <div className={`sidebar-menu-group ${fieldSalesOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            onClick={() => toggleMenu('fieldSales')}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              collapsed && isFieldSalesRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <MapPinned className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Saha Satış</span>
                {fieldSalesOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                )}
              </>
            )}
          </button>

          {fieldSalesOpen && !collapsed && (
            <SidebarSubMenu>
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
            </SidebarSubMenu>
          )}
        </div>

        <SidebarSection label="AI GROWTH" collapsed={collapsed} />

        <div className={`sidebar-menu-group ${socialMediaOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            onClick={() => toggleMenu('socialMedia')}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              collapsed && isSocialMediaRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <Sparkles className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Social Media Center</span>
                {socialMediaOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                )}
              </>
            )}
          </button>
          {socialMediaOpen && !collapsed && (
            <SidebarSubMenu className="sidebar-submenu--scroll">
              {socialMediaSubMenus.map((sub) => {
                const SubIcon = socialMediaSubMenuIcons[sub.icon] || Sparkles
                return (
                  <NavLink
                    key={sub.path}
                    to={sub.path}
                    end={sub.path === SOCIAL_MEDIA_HOME_PATH}
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
            </SidebarSubMenu>
          )}
        </div>

        <SidebarSection label="İK" collapsed={collapsed} />

        {/* İnsan Kaynakları / PDKS */}
        <div className={`sidebar-menu-group ${hrOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            onClick={() => toggleMenu('hr')}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              collapsed && isHrRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <UserCog className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>İnsan Kaynakları</span>
                {hrOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                )}
              </>
            )}
          </button>

          {hrOpen && !collapsed && (
            <SidebarSubMenu>
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
            </SidebarSubMenu>
          )}
        </div>

        <SidebarSection label="LOJİSTİK" collapsed={collapsed} />

        {/* Lojistik */}
        <div className={`sidebar-menu-group ${logisticsOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            onClick={() => toggleMenu('logistics')}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              collapsed && isLogisticsRouteActive ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <Container className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Lojistik</span>
                {logisticsOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                )}
              </>
            )}
          </button>
          {logisticsOpen && !collapsed && (
            <SidebarSubMenu>
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
            </SidebarSubMenu>
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
        <div className={`sidebar-menu-group ${settingsOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            onClick={() => toggleMenu('settings')}
            className={`${menuButtonBase} ${collapsed ? 'justify-center' : ''} ${
              collapsed && isSettingsRoute ? 'sidebar-menu-active font-medium' : ''
            }`}
          >
            <MenuIcon collapsed={collapsed}>
              <Settings className="w-4 h-4 shrink-0" />
            </MenuIcon>
            {!collapsed && (
              <>
                <span className={menuLabelClass}>Ayarlar</span>
                {settingsOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                )}
              </>
            )}
          </button>

          {settingsOpen && !collapsed && (
            <SidebarSubMenu>
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
                      `${subMenuButtonBase} ${isActive ? 'sidebar-menu-active font-medium' : ''}`
                    }
                  >
                    {sub.label}
                  </NavLink>
                ))}

              <>
                <div className="sidebar-submenu-leaf flex items-center gap-0.5">
                  <NavLink
                    to={DOCUMENT_CENTER_BASE}
                    end
                    onClick={handleNavigate}
                    className={({ isActive }) =>
                      `sidebar-menu-button block w-full flex-1 px-2.5 py-1.5 rounded-xl text-[13px] font-semibold transition-colors whitespace-nowrap ${
                        isActive ? 'sidebar-menu-active font-medium' : ''
                      }`
                    }
                  >
                    Belge Merkezi
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => setDocumentCenterOpen((open) => !open)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-white/20"
                    aria-label={
                      documentCenterOpen
                        ? 'Belge Merkezi menüsünü kapat'
                        : 'Belge Merkezi menüsünü aç'
                    }
                  >
                    {documentCenterOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    )}
                  </button>
                </div>
                {documentCenterOpen ? (
                  <SidebarSubMenu className="sidebar-submenu--nested">
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
                  </SidebarSubMenu>
                ) : null}
              </>
            </SidebarSubMenu>
          )}
        </div>
      </nav>

      <div className={`mt-auto shrink-0 ${collapsed ? 'px-0 pb-0.5' : 'px-1 pb-1'}`}>
        <TrialBanner collapsed={collapsed} />
        <NavLink
          to="/surum"
          onClick={handleNavigate}
          title={`Sürüm ${APP_VERSION}`}
          className={({ isActive }) =>
            `sidebar-version-label mt-1 block w-full truncate text-center font-mono leading-none transition-opacity hover:opacity-100 ${
              collapsed ? 'px-0 py-1 text-[8px]' : 'px-1 py-1.5 text-[9px]'
            } ${isActive ? 'opacity-100' : 'opacity-70'}`
          }
        >
          {APP_VERSION}
        </NavLink>
      </div>
    </aside>
  )
}
