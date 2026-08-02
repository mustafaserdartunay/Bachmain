import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CalendarPlus,
  Filter,
  Package,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
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
import { cn, formatDate } from '@/lib/utils'
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

type BulkPanel = 'demo' | 'package' | 'extend' | null

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

async function runForEachId(
  ids: string[],
  worker: (id: string) => Promise<unknown>,
): Promise<{ ok: number; fail: number; errors: string[] }> {
  let ok = 0
  let fail = 0
  const errors: string[] = []
  for (const id of ids) {
    try {
      await worker(id)
      ok += 1
    } catch (err) {
      fail += 1
      errors.push(err instanceof Error ? err.message : 'Bilinmeyen hata')
    }
  }
  return { ok, fail, errors }
}

function BulkFormDialog({
  open,
  title,
  description,
  busy,
  confirmLabel,
  tone = 'primary',
  onCancel,
  onConfirm,
  children,
}: {
  open: boolean
  title: string
  description?: string
  busy?: boolean
  confirmLabel: string
  tone?: 'danger' | 'primary'
  onCancel: () => void
  onConfirm: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        aria-label="Kapat"
        disabled={busy}
        onClick={onCancel}
      />
      <div
        className={cn(
          'relative w-full max-w-lg overflow-hidden rounded-2xl border bg-white shadow-2xl',
          tone === 'danger' ? 'border-rose-200' : 'border-border',
        )}
      >
        <div
          className={cn(
            'border-b px-5 py-4',
            tone === 'danger' ? 'border-rose-100 bg-rose-50/80' : 'border-border bg-surface',
          )}
        >
          <h2 className="text-base font-bold text-text">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-text-muted">{description}</p>
          ) : null}
        </div>
        <div className="space-y-3 px-5 py-4">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="secondary" size="sm" disabled={busy} onClick={onCancel}>
            Vazgeç
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            size="sm"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'İşleniyor…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function MembershipsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<MembershipRow | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkPanel, setBulkPanel] = useState<BulkPanel>(null)
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<{ ok: boolean; message: string } | null>(null)

  const [demoDays, setDemoDays] = useState(7)
  const [demoMode, setDemoMode] = useState<'extend' | 'convert'>('extend')
  const [packagePlan, setPackagePlan] = useState('starter')
  const [packageDays, setPackageDays] = useState(30)
  const [extendDays, setExtendDays] = useState(7)
  const [extendMode, setExtendMode] = useState<'trial' | 'active'>('trial')

  const pageSize = 12

  const fetcher = useMemo(() => () => membershipsApi.list(), [])
  const { status, data, reload } = usePageState({ fetcher, delay: 0 })

  const rows = (data?.rows ?? []) as unknown as MembershipRow[]

  const openDetail = (id: string) => {
    if (!id) return
    navigate(`/uyeler/${encodeURIComponent(id)}`)
  }

  const clearSelection = () => setSelected(new Set())

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function setFlashFromBulk(label: string, result: { ok: number; fail: number }) {
    if (result.fail === 0) {
      setFlash({ ok: true, message: `${result.ok} üye için ${label} tamamlandı` })
    } else if (result.ok === 0) {
      setFlash({ ok: false, message: `${label} başarısız (${result.fail} kayıt)` })
    } else {
      setFlash({
        ok: false,
        message: `${label}: ${result.ok} başarılı, ${result.fail} hatalı`,
      })
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setBusy(true)
    setFlash(null)
    try {
      await membershipsApi.delete(deleteTarget.id)
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(deleteTarget.id)
        return next
      })
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
      setBusy(false)
    }
  }

  async function confirmBulkDelete() {
    const ids = [...selected]
    if (!ids.length) return
    setBusy(true)
    setFlash(null)
    try {
      const result = await runForEachId(ids, (id) => membershipsApi.delete(id))
      setBulkDeleteOpen(false)
      clearSelection()
      setFlashFromBulk('toplu silme', result)
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function confirmBulkDemo() {
    const ids = [...selected]
    if (!ids.length) return
    setBusy(true)
    setFlash(null)
    try {
      const result = await runForEachId(ids, (id) =>
        demoMode === 'convert'
          ? membershipsApi.action(id, { action: 'convert_demo', days: demoDays })
          : membershipsApi.extend(id, {
              days: demoDays,
              mode: 'trial',
              note: `toplu demo +${demoDays}`,
            }),
      )
      setBulkPanel(null)
      clearSelection()
      setFlashFromBulk(
        demoMode === 'convert' ? 'demo → üyelik' : `demo (+${demoDays} gün)`,
        result,
      )
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function confirmBulkPackage() {
    const ids = [...selected]
    if (!ids.length) return
    setBusy(true)
    setFlash(null)
    try {
      const result = await runForEachId(ids, async (id) => {
        await membershipsApi.action(id, {
          action: 'set_plan',
          planCode: packagePlan,
          period: 'month',
        })
        await membershipsApi.extend(id, {
          days: packageDays,
          mode: 'active',
          note: `toplu paket ${packagePlan} +${packageDays}`,
        })
      })
      setBulkPanel(null)
      clearSelection()
      setFlashFromBulk(`paket (${packagePlan}, +${packageDays} gün)`, result)
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function confirmBulkExtend() {
    const ids = [...selected]
    if (!ids.length) return
    setBusy(true)
    setFlash(null)
    try {
      const result = await runForEachId(ids, (id) =>
        membershipsApi.extend(id, {
          days: extendDays,
          mode: extendMode,
          note: `toplu uzatma +${extendDays}`,
        }),
      )
      setBulkPanel(null)
      clearSelection()
      setFlashFromBulk(
        `süre uzatma (+${extendDays} gün / ${extendMode === 'trial' ? 'demo' : 'paket'})`,
        result,
      )
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function bulkStatus(action: 'activate' | 'suspend') {
    const ids = [...selected]
    if (!ids.length) return
    setBusy(true)
    setFlash(null)
    try {
      const result = await runForEachId(ids, (id) => membershipsApi.action(id, { action }))
      clearSelection()
      setFlashFromBulk(action === 'activate' ? 'aktifleştirme' : 'askıya alma', result)
      reload()
    } finally {
      setBusy(false)
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
  const selectedCount = selected.size
  const selectedRows = useMemo(
    () => filtered.filter((r) => selected.has(r.id)),
    [filtered, selected],
  )

  const toggleSelectAllPage = () => {
    const pageIds = paginated.map((r) => r.id)
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id))
      } else {
        pageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const selectAllFiltered = () => {
    setSelected(new Set(filtered.map((r) => r.id)))
  }

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
          <p className="text-xs text-text-subtle">
            {row.role === 'demo' ? 'Demo lead' : row.role}
          </p>
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
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
            title="Üyeyi sil"
            aria-label={`${row.fullName || row.email} sil`}
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 className="h-4 w-4" />
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
        confirmLabel="Evet, sil"
        cancelLabel="Hayır"
        tone="danger"
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`${selectedCount} üye silinsin mi?`}
        description={`${selectedCount} seçili hesap kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Evet, toplu sil"
        cancelLabel="Hayır"
        tone="danger"
        busy={busy}
        onCancel={() => setBulkDeleteOpen(false)}
        onConfirm={() => void confirmBulkDelete()}
      />

      <BulkFormDialog
        open={bulkPanel === 'demo'}
        title="Toplu demo işlemi"
        description={`${selectedCount} seçili üye için demo süresi tanımlanacak veya demo lead üyelik dönüşümü yapılacak.`}
        confirmLabel="Uygula"
        busy={busy}
        onCancel={() => setBulkPanel(null)}
        onConfirm={() => void confirmBulkDemo()}
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">İşlem türü</label>
          <Select
            value={demoMode}
            onChange={(e) => setDemoMode(e.target.value as 'extend' | 'convert')}
          >
            <option value="extend">Demo süresi ver / uzat</option>
            <option value="convert">Demo → Üyelik dönüştür</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Gün</label>
          <Select value={String(demoDays)} onChange={(e) => setDemoDays(Number(e.target.value))}>
            {[3, 7, 14, 30, 60].map((d) => (
              <option key={d} value={d}>
                {d} gün
              </option>
            ))}
          </Select>
        </div>
        <p className="text-xs text-text-subtle">
          Seçililer: {selectedRows.slice(0, 3).map((r) => r.fullName || r.email).join(', ')}
          {selectedCount > 3 ? ` +${selectedCount - 3}` : ''}
        </p>
      </BulkFormDialog>

      <BulkFormDialog
        open={bulkPanel === 'package'}
        title="Toplu paket tanımla"
        description={`${selectedCount} seçili üye için plan atanacak ve paket süresi uygulanacak.`}
        confirmLabel="Paketi uygula"
        busy={busy}
        onCancel={() => setBulkPanel(null)}
        onConfirm={() => void confirmBulkPackage()}
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Plan</label>
          <Select value={packagePlan} onChange={(e) => setPackagePlan(e.target.value)}>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Paket süresi</label>
          <Select
            value={String(packageDays)}
            onChange={(e) => setPackageDays(Number(e.target.value))}
          >
            {[30, 60, 90, 180, 365].map((d) => (
              <option key={d} value={d}>
                {d} gün
              </option>
            ))}
          </Select>
        </div>
      </BulkFormDialog>

      <BulkFormDialog
        open={bulkPanel === 'extend'}
        title="Toplu süre uzat"
        description={`${selectedCount} seçili üyenin lisans süresi uzatılacak.`}
        confirmLabel="Süreyi uzat"
        busy={busy}
        onCancel={() => setBulkPanel(null)}
        onConfirm={() => void confirmBulkExtend()}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Gün</label>
            <Select
              value={String(extendDays)}
              onChange={(e) => setExtendDays(Number(e.target.value))}
            >
              {[3, 7, 14, 30, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d} gün
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">Mod</label>
            <Select
              value={extendMode}
              onChange={(e) => setExtendMode(e.target.value as 'trial' | 'active')}
            >
              <option value="trial">Demo / Deneme</option>
              <option value="active">Paket (aktif)</option>
            </Select>
          </div>
        </div>
      </BulkFormDialog>

      <PageHeader
        title="Üye Hesapları"
        subtitle="Satıra tıklayın — demo ve paket süresini buradan yönetin. Çoklu seçimle toplu işlem yapın."
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
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
        {selectedCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-bach-blue/25 bg-bach-blue/5 px-3 py-2">
            <span className="text-sm font-semibold text-bach-blue">{selectedCount} seçili</span>
            {selectedCount < filtered.length ? (
              <Button variant="ghost" size="sm" onClick={selectAllFiltered} disabled={busy}>
                Tümünü seç ({filtered.length})
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={clearSelection} disabled={busy}>
              Seçimi temizle
            </Button>
            <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => setBulkPanel('demo')}
            >
              <Sparkles className="h-3.5 w-3.5" /> Toplu demo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => setBulkPanel('package')}
            >
              <Package className="h-3.5 w-3.5" /> Toplu paket
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => setBulkPanel('extend')}
            >
              <CalendarPlus className="h-3.5 w-3.5" /> Süre uzat
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => void bulkStatus('activate')}
            >
              <PlayCircle className="h-3.5 w-3.5" /> Aktifleştir
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => void bulkStatus('suspend')}
            >
              <PauseCircle className="h-3.5 w-3.5" /> Askıya al
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Toplu sil
            </Button>
          </div>
        ) : null}
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
            clearSelection()
          }}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={paginated}
            selected={selected}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAllPage}
            onRowClick={(row) => openDetail(row.id)}
          />
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
