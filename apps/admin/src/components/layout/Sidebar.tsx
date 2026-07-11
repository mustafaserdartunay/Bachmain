import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import { navItems } from '@/data/navigation'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const groups = [...new Set(navItems.map((n) => n.group))]

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-border bg-surface-elevated">
      <div className="flex h-14 items-center border-b border-border px-4">
        <img src="/assets/bachmain-logo.png" alt="BACHMAIN Control Center" className="brand-logo-img" draggable={false} />
      </div>

      <ScrollArea.Root className="flex-1 overflow-hidden">
        <ScrollArea.Viewport className="h-full w-full p-3">
          <nav aria-label="Ana menü">
            {groups.map((group) => (
              <div key={group} className="mb-4">
                <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-text-subtle">
                  {group}
                </p>
                <ul className="space-y-0.5">
                  {navItems
                    .filter((n) => n.group === group)
                    .map((item) => (
                      <li key={item.id}>
                        <NavLink
                          to={item.path}
                          end={item.path === '/'}
                          className={({ isActive }) =>
                            cn(
                              'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all',
                              isActive
                                ? 'bg-bach-blue/10 text-bach-blue'
                                : 'text-text-muted hover:bg-black/4 hover:text-text dark:hover:bg-white/5',
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <motion.span
                                  layoutId="sidebar-active"
                                  className="absolute inset-0 rounded-lg bg-bach-blue/10"
                                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                              )}
                              <item.icon className="relative h-4 w-4 shrink-0" aria-hidden />
                              <span className="relative truncate">{item.label}</span>
                              {item.badge && (
                                <span className="relative ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </nav>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" className="w-1.5 p-0.5">
          <ScrollArea.Thumb className="rounded-full bg-border-strong" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </aside>
  )
}
