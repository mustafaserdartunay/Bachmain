import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { AppPagePanel } from '../Layout/AppPageLayout'
import { YFB_TEXT_CLASS } from '../../utils/dashboardDesign'

export const QUOTE_STYLE_LIST_ROW_PANEL_CLASS =
  'customer-filter-panel customer-list-panel quote-list-row-panel flex w-full items-center'

export function formatListColumnLabel(label) {
  const text = String(label || '').trim()
  if (!text) return ''
  const upper = text.replace(/\s*:\s*$/, '').toLocaleUpperCase('tr-TR')
  return `${upper} :`
}

export function QuoteStyleListColumnHeader({
  label,
  sortable = false,
  sortKey,
  sort,
  onToggleSort,
  align = 'center',
}) {
  const title = formatListColumnLabel(label)
  if (!label) {
    return <span className="inline-flex h-5 w-5" aria-hidden />
  }

  const sortIcon =
    sortable && sort?.key === sortKey ? (
      sort.dir === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden="true" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden="true" />
      )
    ) : (
      <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden="true" />
    )

  const justify =
    align === 'start' ? 'justify-start' : align === 'end' ? 'justify-end' : 'justify-center'

  return (
    <button
      type="button"
      className={`quote-list-header-btn flex min-h-[2.75rem] w-full min-w-0 items-center ${justify} gap-1`}
      title={`${label} sırala`}
      aria-label={`${label} sırala`}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (sortable) onToggleSort?.(sortKey)
      }}
    >
      <span className={`${YFB_TEXT_CLASS} quote-list-column-title`}>{title}</span>
      {sortIcon}
    </button>
  )
}

export function QuoteStyleListRowPanel({ header = false, gridTemplate, className = '', children }) {
  return (
    <AppPagePanel
      className={`${QUOTE_STYLE_LIST_ROW_PANEL_CLASS} min-h-[4.75rem] ${
        header ? 'quote-list-header-panel' : 'quote-list-data-panel'
      } ${className}`.trim()}
    >
      <div className="quote-list-row w-full min-w-0" style={{ gridTemplateColumns: gridTemplate }}>
        {children}
      </div>
    </AppPagePanel>
  )
}

export function QuoteStyleListCell({ className = '', align = 'center', children }) {
  const alignClass = align === 'start' ? 'is-start' : align === 'end' ? 'is-end' : ''
  return (
    <div className={`quote-list-cell min-w-0 ${alignClass} ${className}`.trim()}>{children}</div>
  )
}

export function QuoteStyleListSelectionCheckbox({
  checked,
  indeterminate = false,
  onChange,
  'aria-label': ariaLabel,
}) {
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
      className="h-4 w-4 cursor-pointer rounded border-ds-border accent-[var(--ds-ink,#1e2338)]"
    />
  )
}
