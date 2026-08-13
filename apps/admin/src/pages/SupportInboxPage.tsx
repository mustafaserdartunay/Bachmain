import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Plus, Search } from 'lucide-react'
import { PageHeader, MetricCard } from '@/components/ui/MetricCard'
import { DataTable } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Badge, statusBadgeMap } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { usePageState } from '@/hooks/usePageState'
import { MetricSkeleton, TableSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { modulesApi } from '@/services/api'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { BadgeVariant, TableColumn } from '@/types'

type SupportRow = Record<string, unknown> & { id: string }

const STATUS_OPTIONS = [
  { value: '', label: 'Tüm durumlar' },
  { value: 'open', label: 'Açık' },
  { value: 'in_progress', label: 'İşlemde' },
  { value: 'waiting', label: 'Bekliyor' },
  { value: 'resolved', label: 'Çözüldü' },
  { value: 'closed', label: 'Kapalı' },
]

const CATEGORY_OPTIONS = [
  { value: '', label: 'Tüm kategoriler' },
  { value: 'destek', label: 'Destek' },
  { value: 'talep', label: 'Talep' },
  { value: 'sikayet', label: 'Şikayet' },
  { value: 'not', label: 'Not' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'Tüm öncelikler' },
  { value: 'low', label: 'Düşük' },
  { value: 'medium', label: 'Orta' },
  { value: 'high', label: 'Yüksek' },
  { value: 'critical', label: 'Kritik' },
]

function isSlaBreached(row: SupportRow) {
  const sla = String(row.slaDeadline || '')
  if (!sla) return false
  const status = String(row.statusId || '').toLowerCase()
  if (status === 'resolved' || status === 'closed') return false
  return new Date(sla).getTime() < Date.now()
}

export function SupportInboxPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [slaOnly, setSlaOnly] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 15

  const fetcher = useMemo(() => () => modulesApi.list('support'), [])
  const { status, data, reload } = usePageState({ fetcher, delay: 0 })

  const rows = (data?.rows ?? []) as SupportRow[]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (statusFilter && String(row.statusId || '') !== statusFilter) return false
      if (categoryFilter && String(row.categoryId || '') !== categoryFilter) return false
      if (priorityFilter && String(row.priorityId || '') !== priorityFilter) return false
      if (slaOnly && !isSlaBreached(row)) return false
      if (!q) return true
      const hay = [
        row.subject,
        row.customer,
        row.contactName,
        row.contactEmail,
        row.assignee,
        row.descriptionPreview,
      ]
        .map((v) => String(v || '').toLowerCase())
        .join(' ')
      return hay.includes(q)
    })
  }, [rows, search, statusFilter, categoryFilter, priorityFilter, slaOnly])

  const metrics = useMemo(() => {
    const open = rows.filter((r) => String(r.statusId) === 'open').length
    const waiting = rows.filter((r) => String(r.statusId) === 'waiting').length
    const sla = rows.filter((r) => isSlaBreached(r)).length
    return [
      { label: 'Toplam', value: String(rows.length), change: 'Ticket', trend: 'neutral' as const },
      { label: 'Açık', value: String(open), change: '—', trend: 'up' as const },
      { label: 'Bekliyor', value: String(waiting), change: '—', trend: 'neutral' as const },
      { label: 'SLA kritik', value: String(sla), change: 'İhlal', trend: 'down' as const },
    ]
  }, [rows])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)

  const columns: TableColumn<SupportRow>[] = [
    {
      key: 'subject',
      label: 'Konu',
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-text">{String(row.subject || '—')}</p>
          <p className="truncate text-xs text-text-muted">
            {String(row.descriptionPreview || '')}
          </p>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Firma / iletişim',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-text">{String(row.customer || '—')}</p>
          <p className="text-xs text-text-muted">
            {String(row.contactName || '—')} · {String(row.contactEmail || '—')}
          </p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Kategori',
      render: (row) => <Badge variant="default">{String(row.category || '—')}</Badge>,
    },
    {
      key: 'priority',
      label: 'Öncelik',
      render: (row) => (
        <Badge
          variant={
            (statusBadgeMap[String(row.priorityId || '')] as BadgeVariant) || 'default'
          }
        >
          {String(row.priority || '—')}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Durum',
      render: (row) => (
        <Badge
          variant={
            (statusBadgeMap[String(row.statusId || '')] as BadgeVariant) || 'default'
          }
        >
          {String(row.status || '—')}
        </Badge>
      ),
    },
    { key: 'assignee', label: 'Atanan' },
    {
      key: 'slaDeadline',
      label: 'SLA',
      render: (row) => {
        const breached = isSlaBreached(row)
        return (
          <span
            className={`inline-flex items-center gap-1 text-xs tabular-nums ${
              breached ? 'font-semibold text-rose-600' : 'text-text-muted'
            }`}
          >
            {breached ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
            {row.slaDeadline ? formatDateTime(String(row.slaDeadline)) : '—'}
          </span>
        )
      },
    },
    {
      key: 'createdAt',
      label: 'Oluşturma',
      render: (row) => (
        <span className="text-xs tabular-nums">
          {row.createdAtFull
            ? formatDateTime(String(row.createdAtFull))
            : row.createdAt
              ? formatDate(String(row.createdAt))
              : '—'}
        </span>
      ),
    },
  ]

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <MetricSkeleton />
        <TableSkeleton />
      </div>
    )
  }

  if (status === 'error') return <ErrorState onRetry={reload} />

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Destek / Ticket"
        subtitle="Kullanıcılardan gelen talepler — çağrı merkezi gelen kutusu"
        actions={
          <Button variant="gold" size="sm" onClick={() => navigate('/destek/yeni')}>
            <Plus className="h-4 w-4" /> Yeni ticket
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <MetricCard {...m} />
          </motion.div>
        ))}
      </div>

      <Card padding="md" hover={false}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
            <Input
              className="pl-9"
              placeholder="Konu, firma, e-posta ara…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value)
              setPage(1)
            }}
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Button
            variant={slaOnly ? 'gold' : 'secondary'}
            size="sm"
            onClick={() => {
              setSlaOnly((v) => !v)
              setPage(1)
            }}
          >
            <AlertTriangle className="h-4 w-4" /> SLA ihlali
          </Button>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={pageRows}
        onRowClick={(row) => navigate(`/destek/${row.id}`)}
      />

      <Pagination
        page={page}
        totalPages={pageCount}
        totalCount={filtered.length}
        onPageChange={setPage}
      />
    </motion.div>
  )
}
