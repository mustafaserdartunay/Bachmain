import { Plus, StickyNote } from 'lucide-react'
import { noteTone } from '../../utils/crmMeta'
import { CrmDeleteAction, CrmEditAction } from './CrmListActions'

function formatNoteDate(value) {
  if (!value) return ''
  return new Date(`${value}T12:00:00`).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  })
}

function NoteCard({ entry, onEdit, onDelete }) {
  const { record } = entry
  const toneClass = noteTone[record.color] || noteTone.Mavi

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onEdit?.(entry)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onEdit?.(entry)
        }
      }}
      className={`group cursor-pointer rounded-xl border border-dark-500/40 px-3 py-3 transition-colors hover:border-dark-500/60 ${toneClass}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <StickyNote className="h-3.5 w-3.5 shrink-0 opacity-70" />
            <p className="truncate text-sm font-black text-white" title={record.title}>
              {record.title}
            </p>
          </div>
          <p className="mt-1 text-[10px] font-bold text-gray-500">
            {formatNoteDate(record.date)}
            {record.time ? ` · ${record.time}` : ''}
          </p>
          {record.content && (
            <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-gray-400">
              {record.content}
            </p>
          )}
        </div>
        <div
          className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(event) => event.stopPropagation()}
        >
          <CrmEditAction onEdit={() => onEdit?.(entry)} />
          <CrmDeleteAction onDelete={() => onDelete?.(entry)} />
        </div>
      </div>
    </article>
  )
}

function NotesEmptyState({ message = 'Yeni not eklemek için üstteki butonu kullanın.' }) {
  return (
    <div className="rounded-xl border border-dashed border-dark-500/50 bg-dark-800/30 px-6 py-10 text-center">
      <StickyNote className="mx-auto mb-2 h-6 w-6 text-gray-600" />
      <p className="text-sm font-black text-white">Not yok</p>
      <p className="mt-1 text-xs text-gray-500">{message}</p>
    </div>
  )
}

export default function CrmProcessNotesPanel({
  entries = [],
  onAdd,
  onEdit,
  onDelete,
  variant = 'sidebar',
}) {
  const isEmbedded = variant === 'embedded'
  const isStack = variant === 'stack'

  if (isStack) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {entries.length === 0 ? (
            <NotesEmptyState />
          ) : (
            entries.map((entry) => (
              <NoteCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
            ))
          )}
        </div>
      </div>
    )
  }

  if (isEmbedded) {
    if (entries.length === 0) {
      return <NotesEmptyState />
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <NoteCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    )
  }

  return (
    <aside className="flex min-h-[320px] flex-col rounded-xl border border-dark-500/50 bg-dark-800/40 xl:sticky xl:top-4 xl:max-h-[calc(100vh-220px)]">
      <div className="flex items-center justify-between gap-2 border-b border-dark-500/40 px-4 py-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Notlar</p>
          <p className="text-sm font-black text-white">{entries.length} kayıt</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-[10px] font-black text-purple-200 transition-colors hover:bg-purple-500/15"
        >
          <Plus className="h-3 w-3" />
          Ekle
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-dark-500/50 bg-dark-800/30 px-4 py-8 text-center">
            <StickyNote className="mx-auto mb-2 h-6 w-6 text-gray-600" />
            <p className="text-xs font-black text-white">Not yok</p>
            <p className="mt-1 text-[11px] text-gray-500">Eklenen notlar burada listelenir.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <NoteCard key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>
    </aside>
  )
}
