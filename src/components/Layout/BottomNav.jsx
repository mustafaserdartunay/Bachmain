import { NavLink } from 'react-router-dom'
import { Gauge, Users, MessageCircle, Search, UserRound } from 'lucide-react'

const ITEMS = [
  { to: '/', label: 'Panel', icon: Gauge, end: true },
  { to: '/crm', label: 'CRM', icon: Users },
  { to: '/mesajlar', label: 'Mesaj', icon: MessageCircle },
  { to: '/musteri-bulucu', label: 'Arama', icon: Search },
  { to: '/profil', label: 'Profil', icon: UserRound },
]

/** Mobile bottom navigation — same glass chrome as desktop sidebar */
export default function BottomNav() {
  return (
    <nav
      className="glass-bottom-nav fixed inset-x-[var(--shell-gap)] bottom-[var(--shell-gap)] z-40 flex h-[var(--ds-bottom-nav-h,4rem)] items-stretch px-1 pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Alt navigasyon"
    >
      {ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `glass-bottom-nav-item flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[0.75rem] font-semibold transition-colors ${
              isActive ? 'is-active' : ''
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
