import { Headphones, Shield, Server, Ticket, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import * as Tooltip from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'
import { useSupportAlert } from '@/hooks/useSupportAlertCount'
import { CountBadge } from '@/components/ui/CountBadge'

const dockItems = [
  { icon: Ticket, label: 'Destek / Ticket', color: 'text-sky-500', path: '/destek', alert: true },
  { icon: Headphones, label: 'Canlı Destek', color: 'text-sky-500', path: '/canli-destek' },
  { icon: Shield, label: 'Güvenlik', color: 'text-rose-500', path: '/guvenlik' },
  { icon: Server, label: 'Sunucu', color: 'text-emerald-500', path: '/sunucu-izleme' },
  { icon: Users, label: 'Müşteriler', color: 'text-violet-500', path: '/musteriler' },
]

const avatars = ['EK', 'AD', 'CB', 'SA']

export function QuickDock() {
  const supportAlert = useSupportAlert()

  return (
    <aside
      className="hidden w-12 shrink-0 flex-col items-center gap-3 border-l border-border bg-surface-elevated py-4 xl:flex"
      aria-label="Hızlı erişim"
    >
      <Tooltip.Provider delayDuration={200}>
        {dockItems.map(({ icon: Icon, label, color, path, alert }) => (
          <Tooltip.Root key={label}>
            <Tooltip.Trigger asChild>
              <Link
                to={path}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface transition hover:border-bach-blue/30 hover:shadow-sm"
                aria-label={
                  alert && supportAlert > 0
                    ? `${label} · ${supportAlert} açık talep`
                    : label
                }
              >
                <Icon className={cn('h-4 w-4', color)} />
                {alert ? (
                  <CountBadge
                    count={supportAlert}
                    size="sm"
                    className="absolute -right-1 -top-1 ring-surface-elevated"
                  />
                ) : null}
              </Link>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="left"
                className="rounded-lg bg-bach-navy px-2 py-1 text-xs text-white shadow-lg"
                sideOffset={8}
              >
                {alert && supportAlert > 0 ? `${label} · ${supportAlert} açık` : label}
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
