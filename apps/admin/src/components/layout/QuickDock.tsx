import { Headphones, Shield, Server, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as Tooltip from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

const dockItems = [
  { icon: Headphones, label: 'Canlı Destek', color: 'text-sky-500', path: '/canli-destek' },
  { icon: Shield, label: 'Güvenlik', color: 'text-rose-500', path: '/guvenlik' },
  { icon: Server, label: 'Sunucu', color: 'text-emerald-500', path: '/sunucu-izleme' },
  { icon: Users, label: 'Müşteriler', color: 'text-violet-500', path: '/musteriler' },
]

const avatars = ['EK', 'AD', 'CB', 'SA']

export function QuickDock() {
  return (
    <aside
      className="hidden w-12 shrink-0 flex-col items-center gap-3 border-l border-border bg-surface-elevated py-4 xl:flex"
      aria-label="Hızlı erişim"
    >
      <Tooltip.Provider delayDuration={200}>
        {dockItems.map(({ icon: Icon, label, color, path }) => (
          <Tooltip.Root key={label}>
            <Tooltip.Trigger asChild>
              <Link
                to={path}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface transition hover:border-bach-blue/30 hover:shadow-sm"
                aria-label={label}
              >
                <Icon className={cn('h-4 w-4', color)} />
              </Link>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="left"
                className="rounded-lg bg-bach-navy px-2 py-1 text-xs text-white shadow-lg"
                sideOffset={8}
              >
                {label}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </Tooltip.Provider>

      <div className="mt-2 flex flex-col gap-2">
        {avatars.map((a, i) => (
          <div
            key={a}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white',
              ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500'][i],
            )}
          >
            {a}
          </div>
        ))}
      </div>
    </aside>
  )
}
