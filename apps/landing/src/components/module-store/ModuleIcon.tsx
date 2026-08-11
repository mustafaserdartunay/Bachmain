'use client'

import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Boxes,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  ClipboardList,
  Clock,
  Factory,
  FileText,
  FolderKanban,
  GitBranch,
  MapPin,
  MessageCircle,
  MonitorSmartphone,
  Package,
  Plug,
  ShoppingCart,
  Store,
  Truck,
  UserCog,
  Users,
  Wallet,
  Warehouse,
  Box,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  Users,
  Briefcase,
  MapPin,
  FileText,
  ShoppingCart,
  Factory,
  Warehouse,
  Boxes,
  Truck,
  Package,
  Store,
  MonitorSmartphone,
  ClipboardList,
  Wallet,
  BarChart3,
  UserCog,
  Clock,
  MessageCircle,
  FolderKanban,
  CheckSquare,
  Calendar,
  Building2,
  GitBranch,
  Plug,
  Box,
}

export function ModuleIcon({
  name,
  color,
  className = 'h-5 w-5',
}: {
  name: string
  color?: string
  className?: string
}) {
  const Icon = ICONS[name] || Box
  return <Icon className={className} style={color ? { color } : undefined} aria-hidden />
}
