import { NavLink } from 'react-router-dom'
import { Gauge, Users, MessageCircle, Search, UserRound } from 'lucide-react'

const ITEMS = [
  { to: '/', label: 'Panel', icon: Gauge, end: true },
  { to: '/crm', label: 'CRM', icon: Users },
  { to: '/mesajlar', label: 'Mesaj', icon: MessageCircle },
  { to: '/musteri-bulucu', label: 'Arama', icon: Search },
  { to: '/profil', label: 'Profil', icon: UserRound },
]

/** Mobile bottom navigation — Design System 3.0 */
export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-sticky flex h-[var(--ds-bottom-nav-h,4rem)] items-stretch border-t border-ds-border bg-ds-surface/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Alt navigasyon"
    >
      {ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-ds-caption font-semibold transition-colors duration-hover ${
              isActive ? 'text-ds-primary' : 'text-ds-muted'
            }`
          }
        >
          <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
