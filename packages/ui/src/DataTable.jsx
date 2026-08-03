import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { MoreMenu } from './MoreMenu'
import { EmptyState } from './States'
import { Tooltip } from './Tooltip'

function sortRows(rows, sort) {
  if (!sort?.key) return rows
  const dir = sort.dir === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const av = a[sort.key]
    const bv = b[sort.key]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv), 'tr') * dir
  })
}

/**
 * Adaptive DataTable — desktop grid, mobile cards, MoreMenu actions.
 *
 * columns: [{ id, header, accessorKey?, cell?, sortable?, hideOnMobile?, className? }]
 * getRowActions?: (row) => MoreMenu items
 * framed?: bordered table chrome (default true). false = panel/inset rows, no outer frame.
 */
const DEFAULT_TH_CLASS =
  'h-[var(--ds-row-h,2.75rem)] px-3 text-ds-caption font-semibold uppercase tracking-wide text-ds-muted'
const DEFAULT_MOBILE_HEADER_CLASS =
  'text-ds-caption font-semibold uppercase tracking-wide text-ds-muted'

export function DataTable({
  columns = [],
  data = [],
  getRowId = (row, index) => row.id ?? index,
  getRowActions,
  emptyTitle = 'Kayıt bulunamadı',
  emptyDescription,
  className = '',
  onRowClick,
  headerClassName = DEFAULT_TH_CLASS,
  mobileHeaderClassName = DEFAULT_MOBILE_HEADER_CLASS,
  framed = true,
}) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const rows = useMemo(() => sortRows(data, sort), [data, sort])

  function toggleSort(key) {
    setSort((current) => {
      if (current.key !== key) return { key, dir: 'asc' }
      if (current.dir === 'asc') return { key, dir: 'desc' }
      return { key: null, dir: 'asc' }
    })
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} className={className} />
  }

  const desktopShellClass = framed
    ? 'hidden overflow-x-auto rounded-ds-lg border border-ds-border md:block'
    : 'hidden overflow-x-auto md:block'
  const tableClass = framed
    ? 'w-full min-w-[640px] border-collapse text-left'
    : 'w-full min-w-[640px] border-separate border-spacing-y-2 text-left'
  const theadClass = framed ? 'bg-[var(--ds-surface-muted)]' : 'bg-transparent'
  const rowClass = framed
    ? `border-t border-ds-border transition-colors duration-hover hover:bg-[var(--ds-surface-muted)] ${onRowClick ? 'cursor-pointer' : ''}`
    : `app-metric-row transition-colors duration-hover ${onRowClick ? 'cursor-pointer' : ''}`
  const mobileCardClass = framed
    ? `rounded-ds-lg border border-ds-border bg-ds-surface p-4 shadow-ds-xs ${onRowClick ? 'cursor-pointer' : ''}`
    : `glass-inset glass-inset-hover app-metric-row p-4 ${onRowClick ? 'cursor-pointer' : ''}`

  return (
    <div className={className}>
      {/* Desktop / tablet */}
      <div className={desktopShellClass}>
        <table className={tableClass}>
          <thead className={theadClass}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`${headerClassName} ${col.className || ''}`.trim()}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-ds-ink"
                      onClick={() => toggleSort(col.accessorKey || col.id)}
                    >
                      <span className="truncate">{col.header}</span>
                      {sort.key === (col.accessorKey || col.id) ? (
                        sort.dir === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    <span className="truncate">{col.header}</span>
                  )}
                </th>
              ))}
              {getRowActions ? (
                <th
                  className="h-[var(--ds-row-h,2.75rem)] w-14 px-2 text-center align-middle"
                  aria-label="İşlemler"
                >
                  <span
                    className="inline-flex h-[var(--ds-control-h,3rem)] w-[var(--ds-control-h,3rem)] items-center justify-center text-ds-muted"
                    title="İşlemler"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const id = getRowId(row, index)
              const actions = getRowActions?.(row) || []
              const cells = columns.map((col) => {
                const raw = col.accessorKey ? row[col.accessorKey] : undefined
                const content = col.cell ? col.cell(row) : raw
                const text =
                  content == null
                    ? ''
                    : String(
                        typeof content === 'string' || typeof content === 'number'
                          ? content
                          : '',
                      )
                return (
                  <td
                    key={col.id}
                    className={`h-[var(--ds-row-h,2.75rem)] max-w-[16rem] px-3 text-ds-body text-ds-ink ${col.className || ''}`}
                  >
                    {typeof content === 'string' || typeof content === 'number' ? (
                      <Tooltip content={text.length > 28 ? text : undefined}>
                        <span className="block truncate">{content}</span>
                      </Tooltip>
                    ) : (
                      content
                    )}
                  </td>
                )
              })
              return (
                <tr
                  key={id}
                  className={rowClass}
                  onClick={() => onRowClick?.(row)}
                >
                  {cells}
                  {getRowActions ? (
                    <td
                      className="h-[var(--ds-row-h,2.75rem)] w-14 px-2 text-center align-middle"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {actions.length ? (
                        <div className="inline-flex h-[var(--ds-control-h,3rem)] w-[var(--ds-control-h,3rem)] items-center justify-center">
                          <MoreMenu items={actions} />
                        </div>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="space-y-3 md:hidden">
        {rows.map((row, index) => {
          const id = getRowId(row, index)
          const actions = getRowActions?.(row) || []
          const visibleCols = columns.filter((col) => !col.hideOnMobile)
          return (
            <article
              key={id}
              className={mobileCardClass}
              onClick={() => onRowClick?.(row)}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  {visibleCols.map((col) => {
                    const raw = col.accessorKey ? row[col.accessorKey] : undefined
                    const content = col.cell ? col.cell(row) : raw
                    return (
                      <div key={col.id} className="min-w-0">
                        <p className={mobileHeaderClassName}>
                          {col.header}
                        </p>
                        <div className="truncate text-ds-body font-medium text-ds-ink">
                          {content ?? '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {actions.length ? (
                  <div onClick={(event) => event.stopPropagation()}>
                    <MoreMenu items={actions} />
                  </div>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default DataTable
