import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { DeleteConfirmPopover } from '../Common/ListDeleteConfirmPanel'
import {
  COP_KUTUSU_BUTTON_CLASS,
  COP_KUTUSU_ICON_CLASS,
  KALEM_BUTTON_CLASS,
  KALEM_ICON_CLASS,
} from '../../utils/buttonStyles'
import { YF_TEXT_CLASS, YFB_TEXT_CLASS } from '../../utils/dashboardDesign'
import {
  appendNotebookCategoryNote,
  deleteNotebookCategory,
  deleteNotebookCategoryNote,
  getNotebookCategory,
  NOTEBOOK_NOTE_URGENCIES,
  reorderNotebookCategoryNotes,
  sortNotebookNotes,
  updateNotebookCategoryNote,
  upsertNotebookCategory,
} from '../../utils/notebookCategoryStore'

function formatStamp(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('tr-TR')
}

function UrgencyPill({ value, onChange }) {
  return (
    <div className="inline-flex shrink-0 overflow-hidden rounded-xl border border-[rgba(140,145,165,0.18)] bg-white/50">
      {NOTEBOOK_NOTE_URGENCIES.map((option) => {
        const active = value === option.id
        const isAcil = option.id === 'acil'
        return (
          <button
            key={option.id}
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onChange?.(option.id)
            }}
            className={`px-2.5 py-1 text-[11px] font-bold leading-none transition-colors ${
              active
                ? isAcil
                  ? 'bg-rose-500/15 text-rose-600'
                  : 'bg-blue-500/15 text-blue-700'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function DragHandle({ dragHandleProps }) {
  return (
    <div
      {...dragHandleProps}
      className="flex h-5 w-4 shrink-0 cursor-grab touch-none items-center justify-center self-center text-[var(--muted)] opacity-55 transition-opacity hover:opacity-100 active:cursor-grabbing"
      title="Sürükleyerek sırala"
      aria-label="Sürükleyerek sırala"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none grid grid-cols-2 gap-x-[3px] gap-y-[2.5px]"
      >
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} className="h-[2.5px] w-[2.5px] rounded-full bg-current" />
        ))}
      </span>
    </div>
  )
}

/**
 * Buton sayfası — header menü gibi cam panel; flu/koyu arka plan yok.
 */
export default function NotebookCategoryDetailModal({ open, category, onClose, onChanged }) {
  const [titleDraft, setTitleDraft] = useState('')
  const [draft, setDraft] = useState('')
  const [notes, setNotes] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  const [pendingDeletePage, setPendingDeletePage] = useState(false)
  const [pendingDeleteNoteId, setPendingDeleteNoteId] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  function syncFromStore(categoryId = category?.id) {
    if (!categoryId) {
      setNotes([])
      return null
    }
    const fresh = getNotebookCategory(categoryId)
    if (!fresh) {
      setNotes([])
      return null
    }
    setTitleDraft(fresh.title || '')
    setNotes(sortNotebookNotes(fresh.notes || []))
    return fresh
  }

  useEffect(() => {
    if (!open) return
    setDraft('')
    setEditingId(null)
    setEditDraft('')
    setPendingDeletePage(false)
    setPendingDeleteNoteId(null)
    if (category?.id) {
      syncFromStore(category.id)
    } else {
      setTitleDraft(category?.title || 'Yeni Buton')
      setNotes([])
    }
  }, [open, category?.id, category?.title])

  useEffect(() => {
    if (!open) return undefined
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const categoryId = category?.id
  const canSaveTitle = Boolean(titleDraft.trim())

  function notifyChanged(nextCategory) {
    onChanged?.(nextCategory)
  }

  function ensureCategory() {
    if (categoryId) return getNotebookCategory(categoryId)
    const created = upsertNotebookCategory({
      title: titleDraft.trim() || 'Yeni Buton',
      notes: [],
    })
    notifyChanged(created)
    return created
  }

  function handleSaveTitle() {
    const title = titleDraft.trim()
    if (!title) return
    const saved = upsertNotebookCategory({
      ...(categoryId ? getNotebookCategory(categoryId) || category : {}),
      id: categoryId,
      title,
      notes: categoryId ? getNotebookCategory(categoryId)?.notes || notes : notes,
    })
    notifyChanged(saved)
    syncFromStore(saved.id)
  }

  function handleAddNote() {
    const text = draft.trim()
    if (!text) return
    const target = ensureCategory()
    if (!target?.id) return
    if (!categoryId && titleDraft.trim() && titleDraft.trim() !== target.title) {
      upsertNotebookCategory({ ...target, title: titleDraft.trim() })
    }
    const next = appendNotebookCategoryNote(target.id, text, 'normal')
    setDraft('')
    notifyChanged(next)
    syncFromStore(target.id)
  }

  function handleSaveEdit(note) {
    const text = editDraft.trim()
    if (!text || !categoryId) return
    const next = updateNotebookCategoryNote(categoryId, note.id, { content: text })
    setEditingId(null)
    setEditDraft('')
    notifyChanged(next)
    syncFromStore(categoryId)
  }

  function handleUrgency(note, urgency) {
    if (!categoryId) return
    const next = updateNotebookCategoryNote(categoryId, note.id, { urgency })
    notifyChanged(next)
    syncFromStore(categoryId)
  }

  function handleDeleteNote(noteId) {
    if (!categoryId) return
    const next = deleteNotebookCategoryNote(categoryId, noteId)
    setPendingDeleteNoteId(null)
    notifyChanged(next)
    syncFromStore(categoryId)
  }

  function handleDeletePage() {
    if (!categoryId) {
      onClose?.()
      return
    }
    deleteNotebookCategory(categoryId)
    setPendingDeletePage(false)
    notifyChanged(null)
    onClose?.()
  }

  function endDrag() {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  function beginDrag(index, event) {
    setDraggedIndex(index)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }

  function handleDrop(targetIndex, event) {
    event.preventDefault()
    event.stopPropagation()
    if (!categoryId || draggedIndex == null || draggedIndex === targetIndex) {
      endDrag()
      return
    }
    const ordered = [...notes]
    const [moved] = ordered.splice(draggedIndex, 1)
    ordered.splice(targetIndex, 0, moved)
    const next = reorderNotebookCategoryNotes(
      categoryId,
      ordered.map((note) => note.id),
    )
    notifyChanged(next)
    syncFromStore(categoryId)
    endDrag()
  }

  return createPortal(
    <>
      <div
        className="notebook-category-page-scrim fixed inset-0 z-[10050]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="notebook-category-page-panel app-header-dropdown header-popover-panel fixed z-[10051] flex w-[min(28rem,calc(100vw-1.5rem))] max-h-[min(34rem,calc(100dvh-2rem))] flex-col overflow-hidden"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          visibility: 'visible',
          pointerEvents: 'auto',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={titleDraft || 'Buton sayfası'}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="header-popover-head !px-3 !py-2">
          <div className="min-w-0 flex-1">
            <p className={`${YFB_TEXT_CLASS} uppercase`}>Buton Sayfası</p>
            <p className={`${YF_TEXT_CLASS} mt-0.5`}>{notes.length} not</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="glass-sidebar-toggle flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            aria-label="Kapat"
            title="Kapat"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        <div className="border-b border-[rgba(140,145,165,0.14)] px-3 py-2.5">
          <label className="block">
            <span className={`${YF_TEXT_CLASS} mb-1.5 block`}>Buton Başlığı</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSaveTitle()
                  }
                }}
                placeholder="Başlık yazın..."
                className="form-input min-w-0 flex-1 rounded-xl px-3 py-2 text-sm"
                autoFocus={!categoryId}
              />
              <button
                type="button"
                disabled={!canSaveTitle}
                onClick={handleSaveTitle}
                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-[#8ad9ff] via-[#60a5fa] to-[#3b82f6] px-3 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                Başlık
              </button>
            </div>
          </label>
        </div>

        <div className="border-b border-[rgba(140,145,165,0.14)] px-3 py-2.5">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault()
                handleAddNote()
              }
            }}
            placeholder="Bu sayfaya not ekleyin..."
            rows={3}
            className="form-input agenda-note-textarea !h-auto !min-h-[72px] w-full !resize-none !rounded-md !py-2.5 !pl-3 !pr-3 text-sm"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={!draft.trim()}
              onClick={handleAddNote}
              className="inline-flex h-7 items-center gap-1.5 rounded-xl px-3 text-[12px] font-semibold text-[#10b981] transition-all disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Kaydet
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {notes.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs font-normal text-[var(--muted)]">
              Henüz not yok. Yukarıdan ekleyebilirsiniz.
            </p>
          ) : (
            <div className="space-y-1.5">
              {notes.map((note, index) => {
                const isDragging = draggedIndex === index
                const isDragOver = dragOverIndex === index && draggedIndex !== index
                const isEditing = editingId === note.id
                const shellClass = `rounded-xl border px-3 py-2.5 transition-colors ${
                  isDragOver
                    ? 'border-blue-400/70 bg-blue-500/10 ring-2 ring-blue-400/30'
                    : note.urgency === 'acil'
                      ? 'border-rose-500/25 bg-rose-500/5'
                      : 'border-[rgba(140,145,165,0.14)] bg-white/45'
                } ${isDragging ? 'opacity-40' : ''}`

                return (
                  <div
                    key={note.id}
                    onDragOver={(event) => {
                      if (draggedIndex == null) return
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                      if (draggedIndex !== index) setDragOverIndex(index)
                    }}
                    onDragLeave={() => {
                      if (dragOverIndex === index) setDragOverIndex(null)
                    }}
                    onDrop={(event) => handleDrop(index, event)}
                  >
                    <article className={shellClass}>
                      {isEditing ? (
                        <div className="min-w-0">
                          <textarea
                            value={editDraft}
                            onChange={(event) => setEditDraft(event.target.value)}
                            rows={3}
                            autoFocus
                            className="form-input agenda-note-textarea !h-auto !min-h-[60px] w-full !resize-none !rounded-md !py-2 !pl-3 !pr-3 !text-sm"
                          />
                          <div className="mt-2 flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null)
                                setEditDraft('')
                              }}
                              className="inline-flex h-7 items-center rounded-xl px-3 text-[12px] font-semibold text-[var(--muted)]"
                            >
                              İptal
                            </button>
                            <button
                              type="button"
                              disabled={!editDraft.trim()}
                              onClick={() => handleSaveEdit(note)}
                              className="inline-flex h-7 items-center gap-1.5 rounded-xl px-3 text-[12px] font-semibold text-[#10b981] disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Kaydet
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5">
                          <DragHandle
                            dragHandleProps={{
                              draggable: true,
                              onDragStart: (event) => {
                                event.stopPropagation()
                                beginDrag(index, event)
                              },
                              onDragEnd: endDrag,
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                              {formatStamp(note.createdAt) ? (
                                <p className="text-[11px] font-semibold text-[var(--muted)]">
                                  {formatStamp(note.createdAt)}
                                </p>
                              ) : null}
                              <UrgencyPill
                                value={note.urgency || 'normal'}
                                onChange={(urgency) => handleUrgency(note, urgency)}
                              />
                            </div>
                            <p className="whitespace-pre-wrap text-sm font-normal leading-snug text-[var(--ink)]">
                              {note.content}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5 self-start">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(note.id)
                                setEditDraft(note.content || '')
                              }}
                              className={KALEM_BUTTON_CLASS}
                              title="Düzenle"
                            >
                              <Pencil className={KALEM_ICON_CLASS} strokeWidth={2.25} />
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setPendingDeleteNoteId((current) =>
                                    current === note.id ? null : note.id,
                                  )
                                }
                                className={COP_KUTUSU_BUTTON_CLASS}
                                title="Sil"
                                aria-label="Notu sil"
                              >
                                <Trash2 className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} />
                              </button>
                              {pendingDeleteNoteId === note.id ? (
                                <DeleteConfirmPopover
                                  title="Not silinsin mi?"
                                  description="Bu not kalıcı olarak kaldırılacak."
                                  confirmLabel="Evet"
                                  cancelLabel="Hayır"
                                  variant="warm"
                                  onCancel={() => setPendingDeleteNoteId(null)}
                                  onConfirm={() => handleDeleteNote(note.id)}
                                  className="absolute right-0 top-[calc(100%+0.35rem)] z-40 w-[min(16rem,calc(100vw-2rem))]"
                                />
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-[rgba(140,145,165,0.14)] px-3 py-2.5">
          {categoryId ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setPendingDeletePage((value) => !value)}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-[12px] font-semibold text-[#e11d48] transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Sayfayı Sil
              </button>
              {pendingDeletePage ? (
                <DeleteConfirmPopover
                  title="Buton sayfası silinsin mi?"
                  description="Başlık ve içindeki notlar kalıcı olarak kaldırılacak."
                  confirmLabel="Evet"
                  cancelLabel="Hayır"
                  variant="warm"
                  onCancel={() => setPendingDeletePage(false)}
                  onConfirm={handleDeletePage}
                  className="absolute bottom-[calc(100%+0.35rem)] left-0 z-10 w-[min(18rem,calc(100vw-2rem))]"
                />
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex h-8 items-center rounded-xl px-3 text-[12px] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            Kapat
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}
