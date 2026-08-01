import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  Banknote,
  Package,
  Headphones,
  MessageCircle,
  Bell,
  Megaphone,
  Sparkles,
  BarChart3,
  Server,
  Download,
  Shield,
  UserCheck,
  Store,
  Globe,
  Plug,
  Settings,
  Activity,
  UserCog,
  ScrollText,
  Boxes,
  Tags,
  Percent,
  Ticket,
  Timer,
  RefreshCw,
  Receipt,
  Mail,
  TestTube2,
  Link2,
} from 'lucide-react'

/** Staff roles that may see a nav item. Empty / omitted = all authenticated staff. */
export type StaffNavRole = 'super_admin' | 'admin' | 'support' | 'billing'

export interface NavItem {
  id: string
  label: string
  path: string
  icon: LucideIcon
  badge?: number
  group: string
  roles?: StaffNavRole[]
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Kontrol Paneli', path: '/', icon: LayoutDashboard, group: 'Ana' },
  {
    id: 'platform-ops',
    label: 'Platform Operasyon',
    path: '/platform-ops',
    icon: Activity,
    group: 'Platform',
    roles: ['super_admin'],
  },
  {
    id: 'quality-control',
    label: 'Kalite Kontrol',
    path: '/kalite-kontrol',
    icon: TestTube2,
    group: 'Platform',
    roles: ['super_admin'],
  },
  {
    id: 'social-connections',
    label: 'Sosyal Bağlantılar',
    path: '/sosyal-baglantilar',
    icon: Link2,
    group: 'Platform',
    roles: ['super_admin', 'admin', 'support'],
  },
  {
    id: 'user-management',
    label: 'Kullanıcı Yönetimi',
    path: '/user-management',
    icon: UserCog,
    group: 'Platform',
    roles: ['super_admin'],
  },
  {
    id: 'audit-logs',
    label: 'Denetim Kayıtları',
    path: '/audit-logs',
    icon: ScrollText,
    group: 'Platform',
    roles: ['super_admin'],
  },
  {
    id: 'customers',
    label: 'Müşteri Yönetimi',
    path: '/musteriler',
    icon: Users,
    group: 'Müşteri',
  },
  { id: 'memberships', label: 'Üye Hesapları', path: '/uyeler', icon: UserCheck, group: 'Müşteri' },
  {
    id: 'legal',
    label: 'Hukuki İçerikler',
    path: '/hukuki',
    icon: ScrollText,
    group: 'Müşteri',
  },
  { id: 'dealers', label: 'Bayi Yönetimi', path: '/bayiler', icon: Store, group: 'Müşteri' },
  { id: 'accounts', label: 'Cari Hesaplar', path: '/cari-hesaplar', icon: Wallet, group: 'Finans' },
  {
    id: 'payments-finance',
    label: 'Tahsilatlar',
    path: '/tahsilatlar',
    icon: Banknote,
    group: 'Finans',
  },
  {
    id: 'payment-requests',
    label: 'Ödeme Talepleri',
    path: '/odeme-talepleri',
    icon: Banknote,
    group: 'Finans',
  },

  {
    id: 'billing-plans',
    label: 'Paketler',
    path: '/abonelik/paketler',
    icon: Package,
    group: 'Abonelik Yönetimi',
  },
  {
    id: 'billing-modules',
    label: 'Modüller',
    path: '/abonelik/moduller',
    icon: Boxes,
    group: 'Abonelik Yönetimi',
  },
  {
    id: 'billing-pricing',
    label: 'Fiyatlandırma',
    path: '/abonelik/fiyatlandirma',
    icon: Tags,
    group: 'Abonelik Yönetimi',
  },
  {
    id: 'billing-campaigns',
    label: 'Kampanyalar',
    path: '/abonelik/kampanyalar',
    icon: Percent,
    group: 'Abonelik Yönetimi',
  },
  {
    id: 'billing-coupons',
    label: 'Kuponlar',
    path: '/abonelik/kuponlar',
    icon: Ticket,
    group: 'Abonelik Yönetimi',
  },
  {
    id: 'billing-trials',
    label: 'Deneme Süreleri',
    path: '/abonelik/deneme',
    icon: Timer,
    group: 'Abonelik Yönetimi',
  },
  {
    id: 'billing-subscriptions',
    label: 'Abonelikler',
    path: '/abonelik/abonelikler',
    icon: CreditCard,
    group: 'Abonelik Yönetimi',
  },
  {
    id: 'billing-payments',
    label: 'Ödemeler',
    path: '/abonelik/odemeler',
    icon: Banknote,
    group: 'Abonelik Yönetimi',
  },
  {
    id: 'billing-invoices',
    label: 'Faturalar',
    path: '/abonelik/faturalar',
    icon: Receipt,
    group: 'Abonelik Yönetimi',
  },
  {
    id: 'billing-renewals',
    label: 'Otomatik Yenilemeler',
    path: '/abonelik/yenilemeler',
    icon: RefreshCw,
    group: 'Abonelik Yönetimi',
  },
  {
    id: 'billing-history',
    label: 'Abonelik Logları',
    path: '/abonelik/loglar',
    icon: ScrollText,
    group: 'Abonelik Yönetimi',
  },

  {
    id: 'mail-center',
    label: 'E-posta Merkezi',
    path: '/eposta',
    icon: Mail,
    group: 'Destek',
    roles: ['super_admin', 'admin', 'support'],
  },

  {
    id: 'support',
    label: 'Destek / Ticket',
    path: '/destek',
    icon: Headphones,
    badge: 12,
    group: 'Destek',
  },
  {
    id: 'live-support',
    label: 'Canlı Destek',
    path: '/canli-destek',
    icon: MessageCircle,
    badge: 3,
    group: 'Destek',
  },
  {
    id: 'notifications',
    label: 'Bildirim Merkezi',
    path: '/bildirimler',
    icon: Bell,
    badge: 5,
    group: 'Destek',
  },
  {
    id: 'announcements',
    label: 'Duyurular',
    path: '/duyurular',
    icon: Megaphone,
    group: 'Destek',
    roles: ['super_admin', 'admin', 'support'],
  },
  { id: 'ai', label: 'AI Control Center', path: '/ai-yonetimi', icon: Sparkles, group: 'Sistem' },
  {
    id: 'analytics',
    label: 'Kullanım Analitikleri',
    path: '/analitik',
    icon: BarChart3,
    group: 'Sistem',
  },
  { id: 'server', label: 'Sunucu İzleme', path: '/sunucu-izleme', icon: Server, group: 'Sistem' },
  {
    id: 'updates',
    label: 'Güncelleme Yönetimi',
    path: '/guncellemeler',
    icon: Download,
    group: 'Sistem',
  },
  { id: 'security', label: 'Güvenlik Merkezi', path: '/guvenlik', icon: Shield, group: 'Sistem' },
  { id: 'staff', label: 'Personel Yönetimi', path: '/personel', icon: UserCheck, group: 'Sistem' },
  { id: 'website', label: 'Web Sitesi Yönetimi', path: '/website', icon: Globe, group: 'Sistem' },
  { id: 'api', label: 'API ve Entegrasyonlar', path: '/api', icon: Plug, group: 'Sistem' },
  { id: 'settings', label: 'Genel Ayarlar', path: '/ayarlar', icon: Settings, group: 'Sistem' },
]

export function filterNavItemsForRole(role: string | null | undefined): NavItem[] {
  const normalized = String(role || '').toLowerCase()
  if (!normalized) return navItems
  return navItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true
    return item.roles.some((r) => r.toLowerCase() === normalized)
  })
}

export const quickActions = [
  { label: 'Yeni Müşteri', color: 'bg-violet-500 hover:bg-violet-600', path: '/musteriler/yeni' },
  { label: 'Yeni Ticket', color: 'bg-sky-500 hover:bg-sky-600', path: '/destek/yeni' },
  { label: 'Fatura Oluştur', color: 'bg-blue-500 hover:bg-blue-600', path: '/faturalar/yeni' },
  {
    label: 'Tahsilat Kaydet',
    color: 'bg-emerald-500 hover:bg-emerald-600',
    path: '/tahsilatlar/yeni',
  },
]

export function getNavItemById(id: string) {
  return navItems.find((n) => n.id === id)
}

export function getNavItemByPath(pathname: string): NavItem | undefined {
  return navItems.find((n) => n.path === pathname || pathname.startsWith(`${n.path}/`))
}

export function getBreadcrumbs(pathname: string): { label: string; path?: string }[] {
  const item = getNavItemByPath(pathname)
  if (!item) return [{ label: 'Dashboard', path: '/' }]
  return [{ label: 'Dashboard', path: '/' }, { label: item.group }, { label: item.label }]
}
