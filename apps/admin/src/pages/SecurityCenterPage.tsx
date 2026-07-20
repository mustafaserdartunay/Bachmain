import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Database,
  HardDrive,
  KeyRound,
  Lock,
  Server,
  Shield,
  ShieldCheck,
  Wifi,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MetricCard, PageHeader } from '@/components/ui/MetricCard'
import { MetricSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { usePageState } from '@/hooks/usePageState'
import { platformAdminApi, type SecurityOverview, type ServiceStatus } from '@/services/platformAdminApi'
import type { BadgeVariant } from '@/types'

function statusLabel(s: ServiceStatus) {
  if (s === 'healthy') return 'Sağlıklı'
  if (s === 'degraded') return 'Dikkat'
  if (s === 'down') return 'Kritik'
  return 'Bilinmiyor'
}

function statusVariant(s: ServiceStatus): BadgeVariant {
  if (s === 'healthy') return 'success'
  if (s === 'degraded') return 'warning'
  if (s === 'down') return 'danger'
  return 'default'
}

function scoreTone(score: number) {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 55) return 'text-amber-600'
  return 'text-rose-600'
}

const PANEL_ICONS: Record<string, typeof Shield> = {
  audit: Lock,
  sessions: KeyRound,
  env: ShieldCheck,
  api: Server,
  openai: Activity,
  rateLimit: Wifi,
  backup: Database,
  storage: HardDrive,
}

export function SecurityCenterPage() {
  const fetcher = useMemo(() => () => platformAdminApi.getSecurityOverview(), [])
  const { status, data, reload } = usePageState({ fetcher, delay: 0 })

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Güvenlik Merkezi" subtitle="Canlı güvenlik skoru ve telemetri" />
        <MetricSkeleton />
      </div>
    )
  }

  if (status === 'error' || !data) return <ErrorState onRetry={reload} />

  const overview = data as SecurityOverview
  const panels = Object.entries(overview.panels || {})

  return (
    <div className="space-y-6">
      <PageHeader
        title="Güvenlik Merkezi"
        subtitle={`Son örnekleme · ${new Date(overview.sampledAt).toLocaleString('tr-TR')}`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Security Score
            </CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-5xl font-bold tabular-nums ${scoreTone(overview.score)}`}
            >
              {overview.score}
            </motion.div>
            <p className="mt-2 text-sm text-text-muted">
              0–100 · SSL, JWT/ENV, Backup, Storage, API, AI ağırlıklı
            </p>
            <Badge variant={overview.production ? 'success' : 'warning'} className="mt-3">
              {overview.production ? 'production' : 'non-production'}
            </Badge>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
          <MetricCard label="Veri düzlemi" value={overview.database} change="Neon / JSON store" trend="neutral" />
          <MetricCard
            label="Öneri"
            value={String(overview.recommendations?.length ?? 0)}
            change="Açık hardening maddesi"
            trend="neutral"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {panels.map(([key, panel]) => {
          const Icon = PANEL_ICONS[key] || Shield
          return (
            <Card key={key}>
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-text">
                    <Icon className="h-4 w-4 text-text-muted" />
                    {panel.label}
                  </span>
                  <Badge variant={statusVariant(panel.status)}>{statusLabel(panel.status)}</Badge>
                </div>
                <p className="text-sm text-text-muted">{panel.detail}</p>
                {panel.placeholder ? (
                  <p className="text-xs text-amber-700">Placeholder — ops olgunluk fazı</p>
                ) : null}
              </div>
            </Card>
          )
        })}
      </div>

      {overview.recommendations?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Öneriler</CardTitle>
          </CardHeader>
          <ul className="space-y-2 px-6 pb-6 text-sm text-text">
            {overview.recommendations.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-text-muted">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  )
}
