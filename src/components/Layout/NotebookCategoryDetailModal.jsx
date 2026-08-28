import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Trash2, X } from 'lucide-react'
import { DeleteConfirmPopover } from '../Common/ListDeleteConfirmPanel'
import { APP_SURFACE_PANEL_CLASS, YF_TEXT_CLASS, YFB_TEXT_CLASS } from '../../utils/dashboardDesign'

function formatStamp(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('tr-TR')
}

export default function NotebookCategoryDetailModal({ open, category, onClose, onSave, onDelete }) {
  const [titleDraft, setTitleDraft] = useState('')
  const [contentDraft, setContentDraft] = useState('')
  const [pendingDelete, setPendingDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitleDraft(category?.title || '')
    setContentDraft(category?.content || '')
    setPendingDelete(false)
  }, [open, category?.id, category?.title, category?.content, category?.notes?.length])

  useEffect(() => {
    if (!open) return undefined
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const canSave = Boolean(titleDraft.trim())
  const notes = Array.isArray(category?.notes) ? category.notes : []

  function handleSave() {
    const title = titleDraft.trim()
    if (!title) return
    const text = contentDraft.trim()
    onSave?.({
      ...category,
      title,
      content: text,
      notes: text
        ? [
            {
              id: notes[0]?.id || `nb-note-${Date.now()}`,
              content: text,
              createdAt: notes[0]?.createdAt || new Date().toISOString(),
            },
          ]
        : [],
    })
  }

  function handleDeleteConfirm() {
    if (!category?.id) return
    onDelete?.(category.id)
    setPendingDelete(false)
  }

  return createPortal(
    <div
      className="notebook-category-detail-backdrop fixed inset-0 z-[10050] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`notebook-category-detail-modal flex max-h-[min(36rem,calc(100dvh-2rem))] w-full max-w-lg flex-col overflow-hidden ${APP_SURFACE_PANEL_CLASS}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={titleDraft || 'Buton sayfası'}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--glass-border)] px-4 py-3">
          <div className="min-w-0">
            <p className={`${YFB_TEXT_CLASS} uppercase`}>Buton Sayfası</p>
            <p className={`${YF_TEXT_CLASS} mt-0.5`}>
              {notes.length} not · header not defteri ile bağlı
            </p>
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

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
          <label className="block">
            <span className={`${YF_TEXT_CLASS} mb-1.5 block`}>Buton Başlığı</span>
            <input
              type="text"
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              placeholder="Başlık yazın..."
              className="form-input w-full rounded-xl px-3 py-2 text-sm"
              autoFocus
            />
          </label>
          <label className="flex min-h-0 flex-1 flex-col">
            <span className={`${YF_TEXT_CLASS} mb-1.5 block`}>Sayfa Notları</span>
            <textarea
              value={contentDraft}
              onChange={(event) => setContentDraft(event.target.value)}
              placeholder="Bu buton sayfasındaki uzun notlar..."
              className="form-input agenda-note-textarea min-h-[12rem] flex-1 !resize-y rounded-xl px-3 py-2.5 text-sm leading-relaxed"
            />
          </label>
          {notes.length > 1 ? (
            <div className="space-y-1.5">
              <p className={`${YF_TEXT_CLASS}`}>Kayıt geçmişi</p>
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border border-[rgba(140,145,165,0.14)] bg-white/30 px-3 py-2"
                >
                  {formatStamp(note.createdAt) ? (
                    <p className="mb-1 text-[11px] font-semibold text-[var(--muted)]">
                      {formatStamp(note.createdAt)}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap text-[13px] leading-snug text-[var(--ink)]">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-t border-[var(--glass-border)] px-4 py-3">
          {category?.id ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setPendingDelete((value) => !value)}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-[12px] font-semibold text-[#e11d48] transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Sil
              </button>
              {pendingDelete ? (
                <DeleteConfirmPopover
                  title="Buton sayfası silinsin mi?"
                  description="Başlık ve içindeki notlar kalıcı olarak kaldırılacak."
                  confirmLabel="Evet"
                  cancelLabel="Hayır"
                  variant="warm"
                  onCancel={() => setPendingDelete(false)}
                  onConfirm={handleDeleteConfirm}
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
            Vazgeç
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#8ad9ff] via-[#60a5fa] to-[#3b82f6] px-3 text-[12px] font-semibold text-white shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            Kaydet
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
