import * as Checkbox from '@radix-ui/react-checkbox'
import { Check, ChevronDown, ChevronUp, ChevronsUpDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TableColumn } from '@/types'

interface DataTableProps<T extends { id: string }> {
  columns: TableColumn<T>[]
  rows: T[]
  selected?: Set<string>
  onToggleSelect?: (id: string) => void
  onToggleSelectAll?: () => void
  sortKey?: string | null
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  onRowClick?: (row: T) => void
  className?: string
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const selectable = !!onToggleSelect
  const pageSelectedCount = rows.filter((r) => selected?.has(r.id)).length
  const allPageSelected = rows.length > 0 && pageSelectedCount === rows.length
  const somePageSelected = pageSelectedCount > 0 && !allPageSelected

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-border', className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            {selectable && (
              <th className="w-10 px-4 py-3">
                <Checkbox.Root
                  checked={allPageSelected ? true : somePageSelected ? 'indeterminate' : false}
                  onCheckedChange={onToggleSelectAll}
                  aria-label="Hepsini seç"
                  className="flex h-4 w-4 items-center justify-center rounded border border-border bg-surface-elevated data-[state=checked]:border-bach-blue data-[state=checked]:bg-bach-blue data-[state=indeterminate]:border-bach-blue data-[state=indeterminate]:bg-bach-blue"
                >
                  <Checkbox.Indicator>
                    {somePageSelected && !allPageSelected ? (
                      <Minus className="h-3 w-3 text-white" />
                    ) : (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </Checkbox.Indicator>
                </Checkbox.Root>
              </th>
            )}
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3">
                {col.sortable && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(col.key)}
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text"
                  >
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === 'asc' ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </button>
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {col.label}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-border/60 transition-colors last:border-0',
                onRowClick && 'cursor-pointer hover:bg-bach-blue/5',
                !onRowClick && 'hover:bg-bach-blue/5',
                selected?.has(row.id) && 'bg-bach-blue/5',
              )}
            >
              {selectable && (
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox.Root
                    checked={selected?.has(row.id)}
                    onCheckedChange={() => onToggleSelect?.(row.id)}
                    aria-label="Satırı seç"
                    className="flex h-4 w-4 items-center justify-center rounded border border-border bg-surface-elevated data-[state=checked]:border-bach-blue data-[state=checked]:bg-bach-blue"
                  >
                    <Checkbox.Indicator>
                      <Check className="h-3 w-3 text-white" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                </td>
              )}
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-text-muted',
                    col.key === 'actions' && 'w-12 text-right',
                  )}
                >
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
