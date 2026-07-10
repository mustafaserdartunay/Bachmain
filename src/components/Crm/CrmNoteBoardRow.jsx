import { StickyNote } from 'lucide-react'
import { noteTone } from '../../utils/crmMeta'
import { CrmDeleteAction, CrmEditAction } from './CrmListActions'

function buildRangeLabel(record) {
  if (!record.dateFrom && !record.dateTo) return ''
  const start = record.dateFrom || '...'
  const end = record.dateTo || '...'
  const startTime = record.includeTime && record.timeFrom ? ` ${record.timeFrom}` : ''
  const endTime = record.includeTime && record.timeTo ? ` ${record.timeTo}` : ''
  return `${start}${startTime} - ${end}${endTime}`
}

export default function CrmNoteBoardRow({ entry, onEdit, onDelete }) {
  const { record } = entry
  const toneClass = noteTone[record.color] || noteTone.Mavi
  const rangeLabel = buildRangeLabel(record)

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onEdit?.()
        }
      }}
      className="group relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-dark-500/40 bg-dark-800/55 px-3 py-3 transition-all hover:border-dark-500/60 hover:bg-dark-700/50"
    >
      <div className="flex min-w-[96px] shrink-0 flex-col gap-1">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-600">Oluşturma</p>
        <p className="text-[12px] font-black text-black">{record.date || '—'}</p>
        {rangeLabel && <p className="text-[12px] font-bold text-gray-500">{rangeLabel}</p>}
      </div>

      <div className="hidden h-10 w-px shrink-0 bg-dark-500/35 sm:block" aria-hidden />

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border px-2.5 text-[12px] font-black uppercase ${toneClass}`}>
          <StickyNote className="h-3.5 w-3.5" />
          Not
        </span>
        <h3 className="min-w-0 truncate text-sm font-black text-white" title={record.title}>
          {record.title}
        </h3>
        {record.content && (
          <p className="hidden min-w-0 truncate text-xs text-gray-500 xl:block" title={record.content}>
            {record.content}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2" onClick={(event) => event.stopPropagation()}>
        <CrmEditAction brand onEdit={onEdit} />
        <CrmDeleteAction brand onDelete={onDelete} />
      </div>
    </article>
  )
}
