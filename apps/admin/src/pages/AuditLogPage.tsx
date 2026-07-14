import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Shield } from 'lucide-react'
import { PageHeader } from '@/components/ui/MetricCard'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { MetricSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePageState } from '@/hooks/usePageState'
import { platformAdminApi, type AuditLogEntry } from '@/services/platformAdminApi'
import { formatDateTime } from '@/lib/utils'
import type { TableColumn } from '@/types'

const ACTION_FILTERS = [
  { value: 'all', label: 'Tüm aksiyonlar' },
  { value: 'user.force_logout', label: 'user.force_logout' },
  { value: 'user.suspend', label: 'user.suspend' },
  { value: 'user.upgrade_plan', label: 'user.upgrade_plan' },
  { value: 'user.delete', label: 'user.delete' },
  { value: 'auth.login_failed', label: 'auth.login_failed' },
]

export function AuditLogPage() {
  const [actionFilter, setActionFilter] = useState('all')

  const fetcher = useMemo(
    () => () => platformAdminApi.listAuditLogs(actionFilter),
    [actionFilter],
  )
  const { status, data, reload } = usePageState({ fetcher, delay: 0 })

  const columns: TableColumn<AuditLogEntry>[] = useMemo(
    () => [
      {
        key: 'time',
        label: 'Zaman',
        sortable: true,
        render: (row) => (
          <span className="whitespace-nowrap text-xs tabular-nums">{formatDateTime(row.time)}</span>
        ),
      },
      {
        key: 'actor',
        label: 'Aktör',
        render: (row) => <span className="font-medium text-text">{row.actor}</span>,
      },
      {
        key: 'action',
        label: 'Aksiyon',
        render: (row) => (
          <Badge variant="default">
            <code className="font-mono text-[11px]">{row.action}</code>
          </Badge>
        ),
      },
      {
        key: 'target',
        label: 'Hedef',
        render: (row) => <span className="text-text">{row.target}</span>,
      },
      {
        key: 'ip',
        label: 'IP',
        render: (row) => <span className="font-mono text-xs">{row.ip}</span>,
      },
      {
        key: 'meta',
        label: 'Meta',
        render: (row) => (
          <pre className="max-w-[220px] overflow-x-auto rounded bg-border/40 px-2 py-1 font-mono text-[10px] text-text-muted">
            {JSON.stringify(row.meta)}
          </pre>
        ),
      },
    ],
    [],
  )

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Audit Logs" subtitle="Değiştirilemez denetim kayıtları" />
        <MetricSkeleton />
      </div>
    )
  }

  if (status === 'error') return <ErrorState onRetry={reload} />

  const rows = data?.rows ?? []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="SUPER_ADMIN — /v1/admin/audit-logs · silinemez kayıt defteri"
        actions={
          <Badge variant="gold" className="gap-1.5">
            <Lock className="h-3 w-3" />
            Immutable
          </Badge>
        }
      />

      <Card padding="md" hover={false} className="border-amber-500/25 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-text">Bu kayıtlar asla silinmez</p>
            <p className="mt-0.5 text-xs text-text-muted">
              Audit log append-only&apos;dır. Personel veya süper admin dahil hiç kimse satır silemez veya
              değiştiremez. Filtreleme yalnızca görünümü daraltır.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Aksiyon filtresi
        </label>
        <Select
          className="max-w-xs"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          {ACTION_FILTERS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Kayıt yok"
          description="Seçilen aksiyon için audit satırı bulunamadı."
        />
      ) : (
        <DataTable columns={columns} rows={rows} />
      )}
    </motion.div>
  )
}
