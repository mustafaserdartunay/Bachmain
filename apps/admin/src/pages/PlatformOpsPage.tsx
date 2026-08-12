import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, Cpu, Database, HardDrive, Mail, Ticket,
  TrendingUp, Users, UserX, UserCheck, Wifi, Server,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge, statusBadgeMap } from '@/components/ui/Badge'
import { MetricCard, PageHeader } from '@/components/ui/MetricCard'
import { MetricSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { usePageState } from '@/hooks/usePageState'
import { platformAdminApi, type ServiceStatus } from '@/services/platformAdminApi'
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils'
import type { BadgeVariant } from '@/types'

function statusLabel(s: ServiceStatus) {
  if (s === 'healthy') return 'Sağlıklı'
  if (s === 'degraded') return 'Yavaş'
  if (s === 'down') return 'Kapalı'
  return 'Bilinmiyor'
}

function statusVariant(s: ServiceStatus): BadgeVariant {
  if (s === 'healthy') return 'success'
  if (s === 'degraded') return 'warning'
  if (s === 'down') return 'danger'
  return 'default'
}

function gaugeColor(pct: number) {
  if (pct >= 85) return 'bg-rose-500'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function ResourceGauge({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-text">
          {icon}
          {label}
        </span>
        <span className="text-sm font-bold tabular-nums text-text">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border/60">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full ${gaugeColor(value)}`}
        />
      </div>
    </div>
  )
}

export function PlatformOpsPage() {
  const fetcher = useMemo(() => () => platformAdminApi.getSystemHealth(), [])
  const { status, data, reload } = usePageState({ fetcher, delay: 0 })

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Platform Ops" subtitle="Super Admin üretim paneli" />
        <MetricSkeleton />
      </div>
    )
  }

  if (status === 'error' || !data) return <ErrorState onRetry={reload} />

  const services = [
    { name: 'Neon Database', icon: Database, ...data.database },
    { name: 'API Runtime', icon: Server, ...data.api },
    {
      name: 'Email Queue',
      icon: Mail,
      pending: data.emailQueue.pending,
      status: data.emailQueue.status,
      latencyMs: undefined as number | undefined,
      detail: undefined as string | undefined,
    },
    { name: 'Redis', icon: Wifi, ...data.redis },
    ...(data.github
      ? [
          {
            name: 'GitHub',
            icon: Activity,
            status: data.github.status,
            latencyMs: data.github.latencyMs,
            pending: undefined as number | undefined,
            detail: data.github.detail,
          },
        ]
      : []),
    ...(data.vercel
      ? [
          {
            name: `Vercel (${data.vercel.env || '—'})`,
            icon: Server,
            status: data.vercel.status,
            latencyMs: undefined as number | undefined,
            pending: undefined as number | undefined,
            detail: data.vercel.region ? `region ${data.vercel.region}` : undefined,
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Ops"
        subtitle="SUPER_ADMIN — yonetim.bachmain.com Control Center"
        actions={
          <Badge variant={data.mock ? 'warning' : 'success'}>
            {data.mock ? 'Mock' : 'Live'} · {data.source}
          </Badge>
        }
      />

      <p className="text-xs text-text-subtle">
        Metrikler canlı olarak <code className="rounded bg-border/50 px-1.5 py-0.5 font-mono">/v1/admin/system-health</code> üzerinden
        gelir. Son örnek: {formatDateTime(data.sampledAt)}
        {data.hostname ? ` · ${data.hostname}` : ''}
        {data.platform ? ` · ${data.platform}` : ''}
        {data.github?.repository ? ` · ${data.github.repository}` : ''}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Online Users', value: formatNumber(data.onlineUsers), icon: <Activity className="h-4 w-4" />, change: 'Anlık oturum' },
          { label: 'Tickets', value: formatNumber(data.ticketsOpen), icon: <Ticket className="h-4 w-4" />, change: 'Açık destek' },
          { label: 'Revenue (MRR)', value: formatCurrency(data.revenueMrr), icon: <TrendingUp className="h-4 w-4" />, change: 'Aylık yinelenen', trend: 'up' as const },
          { label: 'Paid Users', value: formatNumber(data.paidUsers), icon: <UserCheck className="h-4 w-4" />, change: 'Aktif abone', trend: 'up' as const },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <MetricCard {...kpi} />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <MetricCard
            label="Trial Users"
            value={formatNumber(data.trialUsers)}
            icon={<Users className="h-4 w-4" />}
            change="Deneme hesabı"
            trend="neutral"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <MetricCard
            label="Expired Users"
            value={formatNumber(data.expiredUsers)}
            icon={<UserX className="h-4 w-4" />}
            change="Süresi dolmuş"
            trend="down"
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <MetricCard
            label="Paid Users"
            value={formatNumber(data.paidUsers)}
            icon={<UserCheck className="h-4 w-4" />}
            change="Ödemeli"
            trend="up"
          />
        </motion.div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card padding="lg" className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Kaynak Kullanımı</CardTitle>
              <Badge variant="default">CPU · RAM · Storage</Badge>
            </CardHeader>
            <div className="space-y-3">
              <ResourceGauge label="CPU" value={data.cpuPercent} icon={<Cpu className="h-4 w-4 text-bach-blue" />} />
              <ResourceGauge label="RAM" value={data.ramPercent} icon={<Server className="h-4 w-4 text-bach-blue" />} />
              <ResourceGauge label="Storage" value={data.storagePercent} icon={<HardDrive className="h-4 w-4 text-bach-blue" />} />
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card padding="lg" className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Servis Durumu</CardTitle>
              <Badge variant={(statusBadgeMap.healthy ?? 'success') as BadgeVariant}>Infrastructure</Badge>
            </CardHeader>
            <ul className="space-y-3">
              {services.map((srv) => (
                <li
                  key={srv.name}
                  className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-center gap-2">
                    <srv.icon className="h-4 w-4 text-bach-blue" />
                    <div>
                      <p className="text-sm font-medium text-text">{srv.name}</p>
                      {'pending' in srv && srv.pending !== undefined && (
                        <p className="text-xs text-text-subtle">{srv.pending} bekleyen</p>
                      )}
                      {'detail' in srv && srv.detail ? (
                        <p className="text-xs text-text-subtle">{String(srv.detail)}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {srv.latencyMs !== undefined && (
                      <span className="text-xs tabular-nums text-text-subtle">{srv.latencyMs} ms</span>
                    )}
                    <Badge variant={statusVariant(srv.status)}>{statusLabel(srv.status)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
