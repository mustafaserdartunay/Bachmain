import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Users, CreditCard, Wallet, Banknote, FileText, Package,
  Headphones, MessageCircle, Bell, Sparkles, BarChart3, Server, Download,
  Shield, UserCheck, Store, Globe, Plug, Settings,
} from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  path: string
  icon: LucideIcon
  badge?: number
  group: string
}

export const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard, group: 'Ana' },
  { id: 'customers', label: 'Müşteri Yönetimi', path: '/musteriler', icon: Users, group: 'Müşteri' },
  { id: 'memberships', label: 'Üye Hesapları', path: '/uyeler', icon: UserCheck, group: 'Müşteri' },
  { id: 'subscriptions', label: 'Abonelik ve Lisanslar', path: '/abonelikler', icon: CreditCard, group: 'Müşteri' },
  { id: 'dealers', label: 'Bayi Yönetimi', path: '/bayiler', icon: Store, group: 'Müşteri' },
  { id: 'accounts', label: 'Cari Hesaplar', path: '/cari-hesaplar', icon: Wallet, group: 'Finans' },
  { id: 'payments', label: 'Tahsilatlar ve Ödemeler', path: '/tahsilatlar', icon: Banknote, group: 'Finans' },
  { id: 'payment-requests', label: 'Ödeme Talepleri', path: '/odeme-talepleri', icon: Banknote, group: 'Finans' },
  { id: 'invoices', label: 'Faturalar', path: '/faturalar', icon: FileText, group: 'Finans' },
  { id: 'packages', label: 'Paket Yönetimi', path: '/paketler', icon: Package, group: 'Finans' },
  { id: 'support', label: 'Destek / Ticket', path: '/destek', icon: Headphones, badge: 12, group: 'Destek' },
  { id: 'live-support', label: 'Canlı Destek', path: '/canli-destek', icon: MessageCircle, badge: 3, group: 'Destek' },
  { id: 'notifications', label: 'Bildirim Merkezi', path: '/bildirimler', icon: Bell, badge: 5, group: 'Destek' },
  { id: 'ai', label: 'AI Yönetimi', path: '/ai-yonetimi', icon: Sparkles, group: 'Sistem' },
  { id: 'analytics', label: 'Kullanım Analitikleri', path: '/analitik', icon: BarChart3, group: 'Sistem' },
  { id: 'server', label: 'Sunucu İzleme', path: '/sunucu-izleme', icon: Server, group: 'Sistem' },
  { id: 'updates', label: 'Güncelleme Yönetimi', path: '/guncellemeler', icon: Download, group: 'Sistem' },
  { id: 'security', label: 'Güvenlik Merkezi', path: '/guvenlik', icon: Shield, group: 'Sistem' },
  { id: 'staff', label: 'Personel Yönetimi', path: '/personel', icon: UserCheck, group: 'Sistem' },
  { id: 'website', label: 'Web Sitesi Yönetimi', path: '/website', icon: Globe, group: 'Sistem' },
  { id: 'api', label: 'API ve Entegrasyonlar', path: '/api', icon: Plug, group: 'Sistem' },
  { id: 'settings', label: 'Genel Ayarlar', path: '/ayarlar', icon: Settings, group: 'Sistem' },
]

export const quickActions = [
  { label: 'Yeni Müşteri', color: 'bg-violet-500 hover:bg-violet-600', path: '/musteriler/yeni' },
  { label: 'Yeni Ticket', color: 'bg-sky-500 hover:bg-sky-600', path: '/destek/yeni' },
  { label: 'Fatura Oluştur', color: 'bg-blue-500 hover:bg-blue-600', path: '/faturalar/yeni' },
  { label: 'Tahsilat Kaydet', color: 'bg-emerald-500 hover:bg-emerald-600', path: '/tahsilatlar/yeni' },
]

export function getNavItemById(id: string) {
  return navItems.find((n) => n.id === id)
}

export function getNavItemByPath(path: string) {
  return navItems.find((n) => n.path === path || path.startsWith(n.path + '/'))
}
