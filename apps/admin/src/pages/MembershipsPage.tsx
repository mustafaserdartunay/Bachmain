import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Filter, Plus, Search, Trash2, X } from 'lucide-react'
import { PageHeader, MetricCard } from '@/components/ui/MetricCard'
import { DataTable } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Badge, statusBadgeMap } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { usePageState } from '@/hooks/usePageState'
import { MetricSkeleton, TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Card } from '@/components/ui/Card'
import { membershipsApi, type MembershipRow } from '@/services/api'
import { formatDate } from '@/lib/utils'
import type { BadgeVariant, TableColumn } from '@/types'

type Filters = {
  source: string
  statusKind: string
  plan: string
  city: string
  remaining: string
  dateFrom: string
  dateTo: string
}

const EMPTY_FILTERS: Filters = {
  source: '',
  statusKind: '',
  plan: '',
  city: '',
  remaining: '',
  dateFrom: '',
  dateTo: '',
}

function matchesRemaining(days: number | null | undefined, bucket: string) {
  if (!bucket) return true
  if (days == null) return bucket === 'unknown'
  if (bucket === 'ended') return days < 0
  if (bucket === '0-3') return days >= 0 && days <= 3
  if (bucket === '4-7') return days >= 4 && days <= 7
  if (bucket === '8+') return days >= 8
  return true
}

export function MembershipsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [deleteTarget, setDeleteTarget] = useState<MembershipRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [flash, setFlash] = useState<{ ok: boolean; message: string } | null>(null)
  const pageSize = 12

  const fetcher = useMemo(() => () => membershipsApi.list(), [])
  const { status, data, reload } = usePageState({ fetcher, delay: 0 })

  const rows = (data?.rows ?? []) as unknown as MembershipRow[]

  const openDetail = (id: string) => {
    if (!id) return
    navigate(`/uyeler/${encodeURIComponent(id)}`)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setFlash(null)
    try {
      await membershipsApi.delete(deleteTarget.id)
      setDeleteTarget(null)
      setFlash({
        ok: true,
        message: `${deleteTarget.fullName || deleteTarget.email} silindi`,
      })
      reload()
    } catch (err) {
      setFlash({
        ok: false,
        message: err instanceof Error ? err.message : 'Silme başarısız',
      })
    } finally {
      setDeleting(false)
    }
  }

  const cities = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => {
      if (r.city && r.city !== '—') set.add(r.city)
    })
    return [...set].sort((a, b) => a.localeCompare(b, 'tr'))
  }, [rows])

  const plans = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => {
      if (r.plan) set.add(String(r.plan))
    })
    return [...set].sort((a, b) => a.localeCompare(b, 'tr'))
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (q) {
        const hay = [row.fullName, row.email, row.company, row.gsm, row.taxNo, row.city, row.source]
          .map((v) => String(v ?? '').toLowerCase())
          .join(' ')
        if (!hay.includes(q)) return false
      }
      if (filters.source && row.source !== filters.source) return false
      if (filters.statusKind && row.statusKind !== filters.statusKind) return false
      if (filters.plan && row.plan !== filters.plan) return false
      if (filters.city && row.city !== filters.city) return false
      if (!matchesRemaining(row.remainingDays, filters.remaining)) return false
      const created = String(row.createdAt || '').slice(0, 10)
      if (filters.dateFrom && created && created < filters.dateFrom) return false
      if (filters.dateTo && created && created > filters.dateTo) return false
      return true
    })
  }, [rows, search, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const columns: TableColumn<MembershipRow>[] = [
    {
      key: 'fullName',
      label: 'Ad Soyad',
      sortable: true,
      render: (row) => (
        <Link
          to={`/uyeler/${encodeURIComponent(row.id)}`}
          className="group block"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-semibold text-bach-blue group-hover:underline">
            {row.fullName || '—'}
          </p>
          <p className="text-xs text-text-subtle">{row.role === 'demo' ? 'Demo lead' : row.role}</p>
        </Link>
      ),
    },
    { key: 'email', label: 'E-posta' },
    { key: 'company', label: 'Firma' },
    { key: 'city', label: 'Şehir' },
    {
      key: 'source',
      label: 'Kaynak',
      render: (row) => <Badge variant="default">{row.source || '—'}</Badge>,
    },
    {
      key: 'status',
      label: 'Durum',
      render: (row) => {
        const kind = row.statusKind || ''
        const variant =
          (statusBadgeMap[kind] as BadgeVariant) ||
          (statusBadgeMap[String(row.status).toLowerCase()] as BadgeVariant) ||
          'default'
        return <Badge variant={variant}>{row.status}</Badge>
      },
    },
    {
      key: 'licenseExpiry',
      label: 'Bitiş',
      render: (row) => (
        <span className="tabular-nums text-sm">
          {row.licenseExpiry && row.licenseExpiry !== '—' ? formatDate(row.licenseExpiry) : '—'}
        </span>
      ),
    },
    { key: 'plan', label: 'Plan' },
    {
      key: 'createdAt',
      label: 'Kayıt',
      render: (row) => (
        <span className="text-xs tabular-nums">
          {row.createdAt && row.createdAt !== '—' ? formatDate(row.createdAt) : '—'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'İşlem',
      render: (row) => (
        <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openDetail(row.id)}
          >
            Detay / Uzat <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            title="Üyeyi sil"
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Sil
          </Button>
        </div>
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
      <ConfirmDialog
        open={!!deleteTarget}
        title="Üye silinsin mi?"
        description={
          deleteTarget
            ? `${deleteTarget.fullName || deleteTarget.email} hesabı kalıcı olarak silinecek. Bu işlem geri alınamaz.`
            : undefined
        }
        confirmLabel="Evet"
        cancelLabel="Hayır"
        tone="danger"
        busy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
      <PageHeader
        title="Üye Hesapları"
        subtitle="Satıra veya Detay / Uzat’a tıklayın — demo ve paket süresini buradan yönetin"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setFiltersOpen((v) => !v)}>
              <Filter className="h-4 w-4" />
              Filtrele
              {activeFilterCount > 0 ? (
                <span className="ml-1 rounded-full bg-bach-blue/15 px-1.5 text-[10px] font-bold text-bach-blue">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
            <Button variant="gold" size="sm" onClick={() => navigate('/uyeler/yeni')}>
              <Plus className="h-4 w-4" /> Yeni Üye
            </Button>
          </>
        }
      />

      {flash && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            flash.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          {flash.message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(data?.metrics ?? []).map((m, i) => (
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

      {filtersOpen && (
        <Card padding="md" hover={false}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-text">Detaylı filtreler</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters(EMPTY_FILTERS)
                setPage(1)
              }}
            >
              <X className="h-3.5 w-3.5" /> Temizle
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Kaynak</label>
              <Select
                value={filters.source}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, source: e.target.value }))
                  setPage(1)
                }}
              >
                <option value="">Tümü</option>
                <option value="Web Üyelik">Web Üyelik</option>
                <option value="Demo Kullanıcısı">Demo Kullanıcısı</option>
                <option value="Demo → Üyelik">Demo → Üyelik</option>
                <option value="Manuel">Manuel</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Durum</label>
              <Select
                value={filters.statusKind}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, statusKind: e.target.value }))
                  setPage(1)
                }}
              >
                <option value="">Tümü</option>
                <option value="demo_active">Demo Kullanıcısı</option>
                <option value="demo_ended">Demo bitti</option>
                <option value="package_active">Paket aktif</option>
                <option value="package_ended">Paket bitti</option>
                <option value="suspended">Askıda</option>
                <option value="cancelled">İptal</option>
                <option value="pending_payment">Ödeme bekliyor</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Plan</label>
              <Select
                value={filters.plan}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, plan: e.target.value }))
                  setPage(1)
                }}
              >
                <option value="">Tümü</option>
                {plans.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Şehir</label>
              <Select
                value={filters.city}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, city: e.target.value }))
                  setPage(1)
                }}
              >
                <option value="">Tümü</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Kalan süre</label>
              <Select
                value={filters.remaining}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, remaining: e.target.value }))
                  setPage(1)
                }}
              >
                <option value="">Tümü</option>
                <option value="ended">Bitmiş</option>
                <option value="0-3">0–3 gün</option>
                <option value="4-7">4–7 gün</option>
                <option value="8+">8+ gün</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">
                Kayıt (başlangıç)
              </label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, dateFrom: e.target.value }))
                  setPage(1)
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">
                Kayıt (bitiş)
              </label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, dateTo: e.target.value }))
                  setPage(1)
                }}
              />
            </div>
          </div>
        </Card>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
        <Input
          placeholder="Ad, e-posta, firma, vergi no…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="pl-9"
        />
      </div>

      {paginated.length === 0 ? (
        <EmptyState
          title="Kayıt bulunamadı"
          description="Filtre veya arama kriterlerinize uygun üye yok."
          actionLabel="Filtreleri temizle"
          onAction={() => {
            setFilters(EMPTY_FILTERS)
            setSearch('')
            setPage(1)
          }}
        />
      ) : (
        <>
          <DataTable columns={columns} rows={paginated} onRowClick={(row) => openDetail(row.id)} />
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={filtered.length}
            onPageChange={setPage}
          />
        </>
      )}
    </motion.div>
  )
}
