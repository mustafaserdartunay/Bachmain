import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { PageHeader } from '@/components/ui/MetricCard'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { DataTable } from '@/components/ui/DataTable'
import { MetricSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePageState } from '@/hooks/usePageState'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { TableColumn } from '@/types'

export type PasswordResetEvent = {
  id: string
  type: string
  email?: string
  customerId?: string
  accountId?: string
  at: string
  ip?: string
  userAgent?: string
  result?: string
  success?: boolean
}

type ListResponse = { ok: boolean; rows: PasswordResetEvent[] }

const TYPE_FILTERS = [
  { value: 'all', label: 'Tüm olaylar' },
  { value: 'password_reset_request', label: 'Talep' },
  { value: 'password_changed', label: 'Şifre değişti' },
  { value: 'password_reset_failed', label: 'Başarısız' },
]

function resultBadge(row: PasswordResetEvent) {
  if (row.type === 'password_changed' || row.result === 'mail_queued') {
    return <Badge variant="success">{row.result || 'ok'}</Badge>
  }
  if (row.success === false || row.type === 'password_reset_failed') {
    return <Badge variant="danger">{row.result || 'fail'}</Badge>
  }
  return <Badge variant="default">{row.result || '—'}</Badge>
}

export function PasswordResetHistoryPage() {
  const [typeFilter, setTypeFilter] = useState('all')
  const [emailFilter, setEmailFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')

  const fetcher = useMemo(
    () => async () => {
      const qs = new URLSearchParams()
      if (emailFilter.trim()) qs.set('email', emailFilter.trim())
      if (customerFilter.trim()) qs.set('customerId', customerFilter.trim())
      qs.set('limit', '500')
      const q = qs.toString() ? `?${qs}` : ''
      return api.get<ListResponse>(`/auth/password-reset-events${q}`)
    },
    [emailFilter, customerFilter],
  )

  const { status, data, reload } = usePageState({ fetcher, delay: 0 })

  const rows = useMemo(() => {
    const all = data?.rows ?? []
    if (typeFilter === 'all') return all
    return all.filter((r) => r.type === typeFilter)
  }, [data, typeFilter])

  const columns: TableColumn<PasswordResetEvent>[] = useMemo(
    () => [
      {
        key: 'at',
        label: 'Zaman',
        sortable: true,
        render: (row) => (
          <span className="whitespace-nowrap text-xs tabular-nums">{formatDateTime(row.at)}</span>
        ),
      },
      {
        key: 'type',
        label: 'Olay',
        render: (row) => (
          <Badge variant="default">
            <code className="font-mono text-[11px]">{row.type}</code>
          </Badge>
        ),
      },
      {
        key: 'email',
        label: 'Kullanıcı',
        render: (row) => <span className="font-medium text-text">{row.email || '—'}</span>,
      },
      {
        key: 'customerId',
        label: 'Şirket / Müşteri',
        render: (row) => (
          <span className="font-mono text-xs text-text-muted">{row.customerId || '—'}</span>
        ),
      },
      {
        key: 'ip',
        label: 'IP',
        render: (row) => <span className="font-mono text-xs">{row.ip || '—'}</span>,
      },
      {
        key: 'userAgent',
        label: 'Cihaz',
        render: (row) => (
          <span className="max-w-[220px] truncate text-xs text-text-muted" title={row.userAgent}>
            {row.userAgent || '—'}
          </span>
        ),
      },
      {
        key: 'result',
        label: 'Sonuç',
        render: (row) => resultBadge(row),
      },
    ],
    [],
  )

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Şifre Sıfırlama Geçmişi" subtitle="Auth güvenlik olayları" />
        <MetricSkeleton />
      </div>
    )
  }

  if (status === 'error') return <ErrorState onRetry={reload} />

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Şifre Sıfırlama Geçmişi"
        subtitle="Talep · doğrulama · başarı / başarısız · IP ve cihaz"
        actions={
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Shield className="h-4 w-4" />
            <span>Staff only</span>
          </div>
        }
      />

      <Card padding="md" hover={false} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
            Olay tipi
            <Select
              className="mt-1"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {TYPE_FILTERS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
            Kullanıcı e-posta
            <Input
              className="mt-1"
              placeholder="ornek@firma.com"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
            Şirket / müşteri ID
            <Input
              className="mt-1"
              placeholder="cus_…"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => reload()}
          className="rounded-xl bg-bach-blue px-4 py-2 text-sm font-semibold text-white"
        >
          Filtrele / Yenile
        </button>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="Kayıt yok"
          description="Şifre sıfırlama talebi veya değişikliği henüz yok."
        />
      ) : (
        <DataTable columns={columns} rows={rows} />
      )}
    </motion.div>
  )
}
