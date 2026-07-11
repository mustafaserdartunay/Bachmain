import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, TrendingUp, Headphones, Activity, AlertTriangle, Clock, Server,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, statusBadgeMap } from '@/components/ui/Badge'
import { MetricCard } from '@/components/ui/MetricCard'
import { Timeline } from '@/components/ui/Timeline'
import { BarChart, Sparkline } from '@/components/charts/Charts'
import { quickActions } from '@/data/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { usePageState } from '@/hooks/usePageState'
import { MetricSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { dashboardApi } from '@/services/api'
import type { BadgeVariant } from '@/types'

const kpiIcons = [Users, TrendingUp, Headphones, Activity]

export function DashboardPage() {
  const fetcher = useMemo(() => () => dashboardApi.get(), [])
  const { status, data, reload } = usePageState({ fetcher, delay: 0 })

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <MetricSkeleton />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-xl bg-border/40" />
          <div className="h-80 animate-pulse rounded-xl bg-border/40" />
        </div>
      </div>
    )
  }

  if (status === 'error' || !data) return <ErrorState onRetry={reload} />

  const {
    kpis: dashboardKpis = [],
    revenueChart = [],
    recentActivities = [],
    expiringLicenses = [],
    openTickets: supportTickets = [],
    pendingPayments = [],
    systemHealth = [],
  } = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">BACHMAIN Control Center — Genel Bakış</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <Link key={action.label} to={action.path}>
            <motion.span
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-sm ${action.color}`}
            >
              {action.label}
            </motion.span>
          </Link>
        ))}
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardKpis.map((kpi, i) => {
          const Icon = kpiIcons[i]
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <MetricCard {...kpi} icon={<Icon className="h-4 w-4" />} />
            </motion.div>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card padding="lg" className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Aylık Gelir (MRR)</CardTitle>
              <Sparkline data={revenueChart.map((d) => d.value)} />
            </CardHeader>
            <BarChart
              data={revenueChart.map((d) => ({
                label: d.label,
                value: d.value,
                color: 'bg-bach-blue',
              }))}
              height={180}
            />
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card padding="lg" className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Sistem Sağlığı</CardTitle>
              <Link to="/sunucu-izleme">
                <Button variant="ghost" size="sm">Detay →</Button>
              </Link>
            </CardHeader>
            <ul className="space-y-3">
              {systemHealth.map((srv) => (
                <li key={srv.name} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-bach-blue" />
                    <span className="text-sm font-medium text-text">{srv.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-subtle">{srv.latency}</span>
                    <Badge variant={(statusBadgeMap[srv.status] ?? 'default') as BadgeVariant}>
                      {srv.status === 'healthy' ? 'Sağlıklı' : srv.status === 'warning' ? 'Uyarı' : 'Kritik'}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card padding="lg">
            <CardHeader>
              <CardTitle className="text-base">Son Aktiviteler</CardTitle>
            </CardHeader>
            <Timeline events={recentActivities} />
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card padding="lg">
            <CardHeader>
              <CardTitle className="text-base">Açık Destek Talepleri</CardTitle>
              <Link to="/destek">
                <Button variant="ghost" size="sm">Tümü →</Button>
              </Link>
            </CardHeader>
            <ul className="space-y-3">
              {supportTickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    to={`/destek/${ticket.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border/60 p-3 transition hover:border-bach-blue/20 hover:bg-bach-blue/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text">{ticket.subject}</p>
                      <p className="text-xs text-text-subtle">{ticket.customer}</p>
                    </div>
                    <Badge variant={(statusBadgeMap[ticket.priority] ?? 'default') as BadgeVariant}>
                      {ticket.priority === 'critical' ? 'Kritik' : ticket.priority === 'high' ? 'Yüksek' : ticket.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card padding="lg">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Lisansı Bitecek Müşteriler
              </CardTitle>
              <Link to="/abonelikler">
                <Button variant="ghost" size="sm">Tümü →</Button>
              </Link>
            </CardHeader>
            <ul className="space-y-3">
              {expiringLicenses.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/musteriler/${c.id}`}
                    className="flex items-center justify-between rounded-lg border border-border/60 p-3 transition hover:border-amber-500/20 hover:bg-amber-500/5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text">{c.company}</p>
                      <p className="text-xs text-text-subtle">{c.plan}</p>
                    </div>
                    <span className="text-sm font-bold text-amber-600">{formatDate(c.licenseExpiry)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card padding="lg">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                Bekleyen Tahsilatlar
              </CardTitle>
              <Link to="/tahsilatlar">
                <Button variant="ghost" size="sm">Tümü →</Button>
              </Link>
            </CardHeader>
            <ul className="space-y-3">
              {pendingPayments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-text">{p.customer}</p>
                    <p className="text-xs text-text-subtle">Vade: {formatDate(p.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums text-text">{formatCurrency(p.amount)}</p>
                    <Badge variant={(statusBadgeMap[p.status] ?? 'default') as BadgeVariant}>
                      {p.status === 'overdue' ? 'Gecikmiş' : 'Bekleyen'}
                    </Badge>
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
