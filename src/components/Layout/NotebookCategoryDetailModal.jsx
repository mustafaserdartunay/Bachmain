import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import NotebookCategoryInlinePanel from './NotebookCategoryInlinePanel'
import { YF_TEXT_CLASS, YFB_TEXT_CLASS } from '../../utils/dashboardDesign'
import { getNotebookCategory } from '../../utils/notebookCategoryStore'

/**
 * Buton sayfası — süreçler ayarları için tam ekran portal.
 * Header not defteri satır içi panel kullanır; burada modal kalır.
 */
export default function NotebookCategoryDetailModal({ open, category, onClose, onChanged }) {
  useEffect(() => {
    if (!open) return undefined
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const freshCategory = category?.id ? getNotebookCategory(category.id) || category : category
  const noteCount = Array.isArray(freshCategory?.notes) ? freshCategory.notes.length : 0

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
        aria-label={freshCategory?.title || 'Buton sayfası'}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="header-popover-head !px-3 !py-2">
          <div className="min-w-0 flex-1">
            <p className={`${YFB_TEXT_CLASS} uppercase`}>Buton Sayfası</p>
            <p className={`${YF_TEXT_CLASS} mt-0.5`}>{noteCount} not</p>
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

        <NotebookCategoryInlinePanel
          category={freshCategory}
          onChanged={onChanged}
          showComposer
          showHeader={false}
          fill
        />

        <div className="flex items-center justify-end border-t border-[rgba(140,145,165,0.14)] px-3 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 items-center rounded-xl px-3 text-[12px] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            Kapat
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}
