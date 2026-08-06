import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { MoreMenu } from './MoreMenu'
import { EmptyState } from './States'
import { Tooltip } from './Tooltip'

function getSortValue(row, sort, columns = []) {
  const col = columns.find((column) => (column.accessorKey || column.id) === sort.key)
  if (typeof col?.getSortValue === 'function') return col.getSortValue(row)
  return row[sort.key]
}

function sortRows(rows, sort, columns = []) {
  if (!sort?.key) return rows
  const dir = sort.dir === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const av = getSortValue(a, sort, columns)
    const bv = getSortValue(b, sort, columns)
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv), 'tr', { sensitivity: 'base' }) * dir
  })
}

/**
 * Adaptive DataTable — desktop grid, mobile cards, MoreMenu actions.
 *
 * columns: [{ id, header, accessorKey?, cell?, sortable?, getSortValue?, hideOnMobile?, className? }]
 * getRowActions?: (row) => MoreMenu items
 * headerActions?: MoreMenu items for the İşlemler header (⋯)
 * selectionEnabled / selectedIds / onToggleSelect / onToggleSelectAll — optional bulk select
 */
const DEFAULT_TH_CLASS =
  'h-[var(--ds-row-h,2.75rem)] px-3 min-w-0 truncate !text-[14px] !font-normal !leading-tight !tracking-normal uppercase !text-[var(--muted)]'
const DEFAULT_MOBILE_HEADER_CLASS =
  'min-w-0 truncate text-[14px] font-normal leading-tight tracking-normal uppercase text-[var(--muted)]'

const SELECT_CELL_CLASS =
  'h-[var(--ds-row-h,2.75rem)] w-12 px-2 text-center align-middle'

function SelectionCheckbox({ checked, indeterminate = false, onChange, 'aria-label': ariaLabel }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(node) => {
        if (node) node.indeterminate = Boolean(indeterminate)
      }}
      onChange={onChange}
      onClick={(event) => event.stopPropagation()}
      aria-label={ariaLabel}
      className="h-4 w-4 cursor-pointer rounded border-ds-border text-ds-ink accent-[var(--ds-ink,#1e2338)]"
    />
  )
}

export function DataTable({
  columns = [],
  data = [],
  getRowId = (row, index) => row.id ?? index,
  getRowActions,
  headerActions,
  selectionEnabled = false,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  emptyTitle = 'Kayıt bulunamadı',
  emptyDescription,
  className = '',
  onRowClick,
  onRowMouseEnter,
  onRowMouseLeave,
  headerClassName = DEFAULT_TH_CLASS,
  mobileHeaderClassName = DEFAULT_MOBILE_HEADER_CLASS,
  /** İlk açılış / yeni oturum sıralaması — örn. { key: 'balance', dir: 'desc' } */
  defaultSort = { key: null, dir: 'asc' },
}) {
  const [sort, setSort] = useState(() => ({
    key: defaultSort?.key ?? null,
    dir: defaultSort?.dir === 'desc' ? 'desc' : 'asc',
  }))
  const rows = useMemo(() => sortRows(data, sort, columns), [columns, data, sort])
  const selectedSet = useMemo(() => new Set(selectedIds.map(String)), [selectedIds])
  const rowIds = useMemo(() => rows.map((row, index) => String(getRowId(row, index))), [rows, getRowId])
  const selectedVisibleCount = rowIds.filter((id) => selectedSet.has(id)).length
  const allVisibleSelected = rows.length > 0 && selectedVisibleCount === rows.length
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected
  const showActionsColumn = Boolean(getRowActions || (headerActions && headerActions.length))

  function toggleSort(key) {
    setSort((current) => {
      if (current.key !== key) return { key, dir: 'asc' }
      return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
    })
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} className={className} />
  }

  return (
    <div className={className}>
      {/* Desktop / tablet */}
      <div className="hidden overflow-x-auto rounded-ds-lg border border-ds-border md:block">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead className="bg-[var(--ds-surface-muted)]">
            <tr>
              {selectionEnabled ? (
                <th className={SELECT_CELL_CLASS} aria-label="Seç">
                  <SelectionCheckbox
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    aria-label="Tümünü seç"
                    onChange={() => onToggleSelectAll?.(rowIds)}
                  />
                </th>
              ) : null}
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`${headerClassName} ${col.className || ''}`.trim()}
                >
                  <div className="inline-flex max-w-full items-center gap-1">
                    {col.sortable ? (
                      <button
                        type="button"
                        className="inline-flex min-w-0 items-center gap-1 hover:text-ds-ink"
                        onClick={() => toggleSort(col.accessorKey || col.id)}
                      >
                        <span className="truncate">{col.header}</span>
                        {sort.key === (col.accessorKey || col.id) ? (
                          sort.dir === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5 shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" />
                        )}
                      </button>
                    ) : (
                      <span className="truncate">{col.header}</span>
                    )}
                    {col.headerAccessory ? (
                      <span
                        className="inline-flex shrink-0"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {typeof col.headerAccessory === 'function'
                          ? col.headerAccessory({})
                          : col.headerAccessory}
                      </span>
                    ) : null}
                  </div>
                </th>
              ))}
              {showActionsColumn ? (
                <th
                  className="h-[var(--ds-row-h,2.75rem)] w-14 px-2 text-center align-middle"
                  aria-label="İşlemler"
                >
                  {headerActions?.length ? (
                    <div className="inline-flex h-[var(--ds-control-h,3rem)] w-[var(--ds-control-h,3rem)] items-center justify-center">
                      <MoreMenu items={headerActions} aria-label="Toplu işlemler" />
                    </div>
                  ) : (
                    <span
                      className="inline-flex h-[var(--ds-control-h,3rem)] w-[var(--ds-control-h,3rem)] items-center justify-center text-ds-muted"
                      title="İşlemler"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </span>
                  )}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const id = getRowId(row, index)
              const idKey = String(id)
              const actions = getRowActions?.(row) || []
              const isSelected = selectedSet.has(idKey)
              return (
                <tr
                  key={idKey}
                  className={`border-t border-ds-border transition-colors duration-hover hover:bg-[var(--ds-surface-muted)] ${onRowClick && !selectionEnabled ? 'cursor-pointer' : ''} ${isSelected ? 'bg-[var(--ds-surface-muted)]' : ''}`}
                  onMouseEnter={() => onRowMouseEnter?.(row)}
                  onMouseLeave={() => onRowMouseLeave?.(row)}
                  onClick={() => {
                    if (selectionEnabled) {
                      onToggleSelect?.(idKey)
                      return
                    }
                    onRowClick?.(row)
                  }}
                >
                  {selectionEnabled ? (
                    <td className={SELECT_CELL_CLASS} onClick={(event) => event.stopPropagation()}>
                      <SelectionCheckbox
                        checked={isSelected}
                        aria-label="Satırı seç"
                        onChange={() => onToggleSelect?.(idKey)}
                      />
                    </td>
                  ) : null}
                  {columns.map((col) => {
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
                  })}
                  {showActionsColumn ? (
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
          const idKey = String(id)
          const actions = getRowActions?.(row) || []
          const visibleCols = columns.filter((col) => !col.hideOnMobile)
          const isSelected = selectedSet.has(idKey)
          return (
            <article
              key={idKey}
              className={`rounded-ds-lg border border-ds-border bg-ds-surface p-4 shadow-ds-xs ${onRowClick && !selectionEnabled ? 'cursor-pointer' : ''} ${isSelected ? 'ring-1 ring-[var(--ds-ink,#1e2338)]/20' : ''}`}
              onMouseEnter={() => onRowMouseEnter?.(row)}
              onMouseLeave={() => onRowMouseLeave?.(row)}
              onClick={() => {
                if (selectionEnabled) {
                  onToggleSelect?.(idKey)
                  return
                }
                onRowClick?.(row)
              }}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {selectionEnabled ? (
                    <div className="pt-1" onClick={(event) => event.stopPropagation()}>
                      <SelectionCheckbox
                        checked={isSelected}
                        aria-label="Satırı seç"
                        onChange={() => onToggleSelect?.(idKey)}
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1 space-y-2">
                    {visibleCols.map((col) => {
                      const raw = col.accessorKey ? row[col.accessorKey] : undefined
                      const content = col.cell ? col.cell(row) : raw
                      return (
                        <div key={col.id} className="min-w-0">
                          <div className="mb-0.5 flex items-center gap-1">
                            <p className={`min-w-0 flex-1 ${mobileHeaderClassName}`}>{col.header}</p>
                            {col.headerAccessory ? (
                              <span
                                className="inline-flex shrink-0"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {typeof col.headerAccessory === 'function'
                                  ? col.headerAccessory({ row })
                                  : col.headerAccessory}
                              </span>
                            ) : null}
                          </div>
                          <div className="truncate text-ds-body font-medium text-ds-ink">
                            {content ?? '—'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                {actions.length && !selectionEnabled ? (
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
