import { Columns3, Download, Filter, Layers3, MoreHorizontal } from 'lucide-react'

const TOOL_BTN =
  'inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border,#E2E8F0)] bg-white/80 px-3 text-[12px] font-bold text-[var(--muted,#64748B)] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:scale-[1.02] hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] hover:text-[var(--accent,#2563EB)] dark:bg-white/5'

export default function ProductionToolbar({
  onFilter,
  onGroup,
  onColumns,
  onExport,
  onMore,
  showFilters = false,
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button type="button" className={TOOL_BTN} onClick={onFilter} aria-pressed={showFilters}>
        <Filter className="h-3.5 w-3.5" />
        Filtrele
      </button>
      <button type="button" className={TOOL_BTN} onClick={onGroup}>
        <Layers3 className="h-3.5 w-3.5" />
        Grupla
      </button>
      <button type="button" className={TOOL_BTN} onClick={onColumns}>
        <Columns3 className="h-3.5 w-3.5" />
        Kolonlar
      </button>
      <button type="button" className={TOOL_BTN} onClick={onExport}>
        <Download className="h-3.5 w-3.5" />
        Dışa Aktar
      </button>
      <button
        type="button"
        className={`${TOOL_BTN} px-2.5`}
        onClick={onMore}
        aria-label="Diğer işlemler"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  )
}
