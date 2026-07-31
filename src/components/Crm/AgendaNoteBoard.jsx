import { useEffect, useRef, useState } from 'react'
import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { DeleteConfirmPopover } from '../Common/ListDeleteConfirmPanel'

export function getAgendaNoteStamp() {
  const now = new Date()
  return {
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
  }
}

export function formatAgendaNoteStamp(note) {
  const date = note.date || note.createdAt?.slice?.(0, 10) || ''
  const time = note.time || note.createdAt?.slice?.(11, 16) || ''
  const formattedDate = date ? date.split('-').reverse().join('.') : ''
  return [formattedDate, time].filter(Boolean).join(' ')
}

export function sortAgendaNotes(notes = []) {
  return [...notes].sort((left, right) => {
    const leftStamp = `${left.date || ''} ${left.time || ''} ${left.createdAt || ''}`
    const rightStamp = `${right.date || ''} ${right.time || ''} ${right.createdAt || ''}`
    return rightStamp.localeCompare(leftStamp)
  })
}

export function countIncompleteAgendaNotes(notes = []) {
  return notes.filter((note) => !note.completed).length
}

export function countCompletedAgendaNotes(notes = []) {
  return notes.filter((note) => note.completed).length
}

const AGENDA_NOTE_ACTION_BTN_CLASS = 'agenda-note-action-btn'

const AGENDA_NOTE_DELETE_BTN_CLASS = `${AGENDA_NOTE_ACTION_BTN_CLASS} inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[12px] font-semibold leading-none text-[#e11d48] transition-all disabled:pointer-events-none disabled:opacity-50`

const AGENDA_NOTE_SAVE_BTN_CLASS = `${AGENDA_NOTE_ACTION_BTN_CLASS} inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[12px] font-semibold leading-none text-[#10b981] transition-all disabled:cursor-not-allowed disabled:opacity-50`

const NOTE_ACTION_EDIT_CLASS = `${AGENDA_NOTE_ACTION_BTN_CLASS} inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg text-[#2563eb] transition-all`

const NOTE_ACTION_COMPLETE_CLASS = `${AGENDA_NOTE_ACTION_BTN_CLASS} inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg text-teal-600 transition-all`

const NOTE_ACTION_DELETE_CLASS = `${AGENDA_NOTE_ACTION_BTN_CLASS} inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg text-[#e11d48] transition-all`

const AGENDA_NOTE_CONFIRM_POPOVER_CLASS =
  'absolute right-0 top-[calc(100%+0.35rem)] z-40 w-[min(18rem,calc(100vw-2rem))]'

const NOTE_TEXTAREA_CLASS =
  'form-input agenda-note-textarea !h-auto !min-h-[60px] w-full !resize-none !rounded-md !py-2 !pl-3 !pr-3 !text-sm'

export const AGENDA_NOTE_BADGE_CLASS =
  'absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-[#7cf2c6] via-[#34d399] to-[#10b981] px-1 text-[11px] font-black text-white shadow-[0_0_10px_rgba(52,211,153,0.45)]'

export function AgendaNoteItem({
  note,
  onToggleComplete,
  onEdit,
  onUpdate,
  onDelete,
  confirmVariant = 'dark',
}) {
  const [pendingDelete, setPendingDelete] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState('')
  const isCompleted = Boolean(note.completed)

  useEffect(() => {
    setIsEditing(false)
    setEditDraft('')
  }, [note.id, note.content, note.title])

  function startEdit() {
    if (onUpdate) {
      setEditDraft(note.content || note.title || '')
      setIsEditing(true)
      return
    }
    onEdit?.(note)
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setEditDraft('')
  }

  function handleSaveEdit() {
    const content = editDraft.trim()
    if (!content) return
    onUpdate?.(note, content)
    setIsEditing(false)
    setEditDraft('')
  }

  if (isEditing) {
    return (
      <article
        className={`rounded-xl border px-3 py-2.5 ${
          isCompleted
            ? 'border-emerald-500/20 bg-emerald-500/5'
            : 'border-[rgba(140,145,165,0.14)] bg-white/35'
        }`}
      >
        {formatAgendaNoteStamp(note) ? (
          <p className="mb-1.5 text-[11px] font-semibold text-[var(--muted)]">
            {formatAgendaNoteStamp(note)}
          </p>
        ) : null}
        <textarea
          value={editDraft}
          onChange={(event) => setEditDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              handleCancelEdit()
            }
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              handleSaveEdit()
            }
          }}
          rows={2}
          autoFocus
          className={NOTE_TEXTAREA_CLASS}
        />
        <div className="mt-2 flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={handleCancelEdit}
            className="inline-flex h-7 items-center rounded-xl px-3 text-[12px] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSaveEdit}
            disabled={!editDraft.trim()}
            className={`${AGENDA_NOTE_SAVE_BTN_CLASS} !h-7`}
          >
            <Check className="h-3.5 w-3.5" />
            Kaydet
          </button>
        </div>
      </article>
    )
  }

  return (
    <article
      className={`rounded-xl border px-3 py-2.5 ${
        isCompleted
          ? 'border-emerald-500/20 bg-emerald-500/5'
          : 'border-[rgba(140,145,165,0.14)] bg-white/35'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {formatAgendaNoteStamp(note) ? (
            <p className="mb-1 text-[11px] font-semibold text-[var(--muted)]">
              {formatAgendaNoteStamp(note)}
            </p>
          ) : null}
          <p
            className={`text-sm font-normal leading-snug text-[var(--ink)] ${
              isCompleted ? 'line-through opacity-60' : ''
            }`}
          >
            {note.content || note.title}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 self-center">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              startEdit()
            }}
            className={NOTE_ACTION_EDIT_CLASS}
            title="Düzenle"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onToggleComplete?.(note)
            }}
            className={NOTE_ACTION_COMPLETE_CLASS}
            title={isCompleted ? 'Tamamlandı' : 'Tamamla'}
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setPendingDelete((value) => !value)
              }}
              className={NOTE_ACTION_DELETE_CLASS}
              title="Sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {pendingDelete ? (
              <DeleteConfirmPopover
                title="Not silinsin mi?"
                description="Bu not kalıcı olarak kaldırılacak."
                confirmLabel="Evet"
                cancelLabel="Hayır"
                variant={confirmVariant}
                onCancel={() => setPendingDelete(false)}
                onConfirm={() => {
                  onDelete?.(note.id)
                  setPendingDelete(false)
                }}
                className={AGENDA_NOTE_CONFIRM_POPOVER_CLASS}
              />
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

export default function AgendaNoteBoard({
  notes = [],
  onSave,
  onToggleComplete,
  onEdit,
  onUpdate,
  onDelete,
  onDeleteCompleted,
  confirmVariant = 'dark',
  showComposer = true,
  composerOnly = false,
  listOnly = false,
  totalRecordCount,
  showRecordCount = true,
  composerClassName = 'border-b border-[rgba(140,145,165,0.14)] p-3',
  listClassName = 'max-h-[22rem] overflow-y-auto p-2',
  emptyMessage = 'Henüz not yok. Yukarıdan hızlıca ekleyebilirsin.',
  fill = false,
  autoFocusComposer = false,
  enterToSave = false,
  focusToken = 0,
}) {
  const [draft, setDraft] = useState('')
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false)
  const composerRef = useRef(null)
  const sortedNotes = sortAgendaNotes(notes)
  const completedCount = countCompletedAgendaNotes(sortedNotes)
  const canSave = Boolean(draft.trim())

  useEffect(() => {
    if (!autoFocusComposer || !showComposer || listOnly) return undefined
    let cancelled = false
    const focusComposer = () => {
      if (cancelled) return
      const el = composerRef.current
      if (!el) return
      el.focus({ preventScroll: true })
      const len = el.value?.length ?? 0
      try {
        el.setSelectionRange(len, len)
      } catch {
        /* ignore */
      }
    }
    const raf = window.requestAnimationFrame(focusComposer)
    const t1 = window.setTimeout(focusComposer, 0)
    const t2 = window.setTimeout(focusComposer, 60)
    const t3 = window.setTimeout(focusComposer, 160)
    return () => {
      cancelled = true
      window.cancelAnimationFrame(raf)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [autoFocusComposer, showComposer, listOnly, focusToken])

  function commitDraft() {
    const content = draft.trim()
    if (!content || typeof onSave !== 'function') return false
    onSave(content)
    setDraft('')
    return true
  }

  function handleSave(event) {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    commitDraft()
  }

  function handleBulkDeleteConfirm() {
    if (typeof onDeleteCompleted !== 'function' || completedCount === 0) return
    onDeleteCompleted()
    setPendingBulkDelete(false)
  }

  return (
    <div className={fill ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : ''}>
      {showComposer && !listOnly ? (
        <form onSubmit={handleSave} className={composerClassName}>
          <textarea
            ref={composerRef}
            autoFocus={autoFocusComposer}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (enterToSave && event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSave(event)
                return
              }
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                handleSave(event)
              }
            }}
            placeholder="Notunuzu Yazınız..."
            rows={3}
            className="form-input agenda-note-textarea !h-auto !min-h-[72px] w-full !resize-none !rounded-md !py-2.5 !pl-3 !pr-3 text-sm"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            {showRecordCount ? (
              <p className="mr-auto text-[11px] font-normal text-[var(--muted)]">
                {totalRecordCount ?? sortedNotes.length} kayıt
              </p>
            ) : null}
            {!pendingBulkDelete ? (
              <>
                <button
                  type="button"
                  disabled={!canSave}
                  onClick={handleSave}
                  className={AGENDA_NOTE_SAVE_BTN_CLASS}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Kaydet
                </button>
                {onDeleteCompleted ? (
                  <button
                    type="button"
                    disabled={completedCount === 0}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setPendingBulkDelete(true)
                    }}
                    className={AGENDA_NOTE_DELETE_BTN_CLASS}
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" />
                    Tamamlananların Hepsini Sil
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
          {pendingBulkDelete ? (
            <div className="mt-2">
              <DeleteConfirmPopover
                title="Tamamlanan notlar silinsin mi?"
                description={`${completedCount} tamamlanmış not kalıcı olarak kaldırılacak.`}
                confirmLabel="Evet"
                cancelLabel="Hayır"
                variant={confirmVariant}
                onCancel={() => setPendingBulkDelete(false)}
                onConfirm={handleBulkDeleteConfirm}
                className="w-full max-w-none"
              />
            </div>
          ) : null}
        </form>
      ) : null}

      {!composerOnly ? (
        <div className={fill ? 'min-h-0 flex-1 overflow-y-auto p-2' : listClassName}>
          {sortedNotes.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs font-normal text-[var(--muted)]">
              {emptyMessage}
            </p>
          ) : (
            <div className="space-y-1.5">
              {sortedNotes.map((note) => (
                <AgendaNoteItem
                  key={note.id}
                  note={note}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  confirmVariant={confirmVariant}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
