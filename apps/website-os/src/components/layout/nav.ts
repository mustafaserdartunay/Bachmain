import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Paintbrush,
  PanelsTopLeft,
  Palette,
  FileStack,
  Menu,
  Images,
  FileText,
  Newspaper,
  Database,
  Package,
  Tags,
  ShoppingBag,
  Users,
  Megaphone,
  Search,
  Link2,
  BarChart3,
  Settings,
  CreditCard,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  group: 'site' | 'commerce' | 'growth' | 'account'
  mobile?: boolean
}

export const websiteNav: NavItem[] = [
  { to: '/website/dashboard', label: 'Genel Bakış', icon: LayoutDashboard, group: 'site', mobile: true },
  { to: '/website/builder', label: 'Website Builder', icon: Paintbrush, group: 'site', mobile: true },
  { to: '/website/pages', label: 'Sayfalar', icon: PanelsTopLeft, group: 'site', mobile: true },
  { to: '/website/designs', label: 'Tasarımlar', icon: Palette, group: 'site' },
  { to: '/website/templates', label: 'Şablonlar', icon: FileStack, group: 'site' },
  { to: '/website/menu', label: 'Menü', icon: Menu, group: 'site' },
  { to: '/website/media', label: 'Medya', icon: Images, group: 'site', mobile: true },
  { to: '/website/content', label: 'İçerikler', icon: FileText, group: 'site' },
  { to: '/website/collections', label: 'Koleksiyonlar', icon: Database, group: 'site' },
  { to: '/website/blog', label: 'Blog', icon: Newspaper, group: 'site' },
  { to: '/website/products', label: 'Ürünler', icon: Package, group: 'commerce' },
  { to: '/website/categories', label: 'Kategoriler', icon: Tags, group: 'commerce' },
  { to: '/website/orders', label: 'Siparişler', icon: ShoppingBag, group: 'commerce' },
  { to: '/website/customers', label: 'Müşteriler', icon: Users, group: 'commerce' },
  { to: '/website/campaigns', label: 'Kampanyalar', icon: Megaphone, group: 'growth' },
  { to: '/website/seo', label: 'SEO', icon: Search, group: 'growth' },
  { to: '/website/domains', label: 'Domain', icon: Link2, group: 'growth' },
  { to: '/website/analytics', label: 'Analytics', icon: BarChart3, group: 'growth', mobile: true },
  { to: '/website/settings', label: 'Ayarlar', icon: Settings, group: 'account' },
  { to: '/website/package', label: 'Paketim', icon: CreditCard, group: 'account' },
]

export const groupLabels: Record<NavItem['group'], string> = {
  site: 'Site',
  commerce: 'E-Ticaret',
  growth: 'Büyüme',
  account: 'Hesap',
}
