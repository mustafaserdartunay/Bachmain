import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Download, Upload, Filter, Trash2, Search } from 'lucide-react'
import { PageHeader, MetricCard } from '@/components/ui/MetricCard'
import { DataTable } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { Badge, statusBadgeMap } from '@/components/ui/Badge'
import { usePageState } from '@/hooks/usePageState'
import { useListState } from '@/hooks/useListState'
import { MetricSkeleton, TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { getModuleById } from '@/data/modules'
import { fetchModulePage, modulesApi } from '@/services/api'
import type { BadgeVariant, TableColumn } from '@/types'

interface ModuleListPageProps {
  moduleId: string
}

export function ModuleListPage({ moduleId }: ModuleListPageProps) {
  const navigate = useNavigate()
  const config = getModuleById(moduleId)

  const fetcher = useMemo(
    () => () => fetchModulePage(moduleId),
    [moduleId],
  )

  const { status, data, reload } = usePageState({ fetcher, delay: 0 })

  const rows = (data?.rows ?? []) as Record<string, unknown>[]
  const searchKeys = (config?.columns.map((c) => c.key) ?? []) as (keyof Record<string, unknown>)[]

  const list = useListState({
    data: rows as (Record<string, unknown> & { id: string })[],
    searchKeys,
    defaultSortKey: config?.columns.find((c) => c.sortable)?.key as keyof Record<string, unknown> | undefined,
  })

  if (!config) {
    return <EmptyState title="Modül bulunamadı" description="Bu sayfa henüz yapılandırılmamış." />
  }

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <MetricSkeleton />
        <TableSkeleton />
      </div>
    )
  }

  if (status === 'error') {
    return <ErrorState onRetry={reload} />
  }

  const columns: TableColumn<Record<string, unknown> & { id: string }>[] = config.columns.map((col) => ({
    ...col,
    render: col.key === 'status' || col.key === 'priority' || col.key === 'severity'
      ? (row) => {
          const val = String(row[col.key] ?? '')
          const variant = statusBadgeMap[val.toLowerCase()] ?? 'default'
          return <Badge variant={variant as BadgeVariant}>{val}</Badge>
        }
      : undefined,
  }))

  const detailPath = (id: string) => {
    if (moduleId === 'customers') return `/musteriler/${id}`
    if (moduleId === 'support') return `/destek/${id}`
    return `${config.path}/${id}`
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Filter className="h-4 w-4" /> Filtrele
            </Button>
            <Button variant="secondary" size="sm">
              <Upload className="h-4 w-4" /> İçe Aktar
            </Button>
            <Button variant="secondary" size="sm">
              <Download className="h-4 w-4" /> Dışa Aktar
            </Button>
            <Button variant="gold" size="sm" onClick={() => navigate(`${config.path}/yeni`)}>
              <Plus className="h-4 w-4" /> Yeni {config.singularName}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data!.metrics.map((m, i) => (
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
          <Input
            placeholder="Ara..."
            value={list.search}
            onChange={(e) => { list.setSearch(e.target.value); list.setPage(1) }}
            className="pl-9"
          />
        </div>
        {list.selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">{list.selected.size} seçili</span>
            <Button variant="danger" size="sm" onClick={async () => {
              await modulesApi.bulkDelete(moduleId, [...list.selected])
              list.clearSelection()
              reload()
            }}>
              <Trash2 className="h-4 w-4" /> Sil
            </Button>
          </div>
        )}
      </div>

      {list.paginated.length === 0 ? (
        <EmptyState
          title={`${config.title} boş`}
          description="Arama kriterlerinize uygun kayıt bulunamadı."
          actionLabel={`Yeni ${config.singularName}`}
          onAction={() => navigate(`${config.path}/yeni`)}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={list.paginated as (Record<string, unknown> & { id: string })[]}
            selected={list.selected}
            onToggleSelect={list.toggleSelect}
            onToggleSelectAll={list.toggleSelectAll}
            sortKey={list.sortKey as string | null}
            sortDir={list.sortDir}
            onSort={(key) => list.toggleSort(key as keyof Record<string, unknown>)}
            onRowClick={(row) => navigate(detailPath(row.id))}
          />
          <Pagination
            page={list.page}
            totalPages={list.totalPages}
            totalCount={list.totalCount}
            onPageChange={list.setPage}
          />
        </>
      )}
    </motion.div>
  )
}
