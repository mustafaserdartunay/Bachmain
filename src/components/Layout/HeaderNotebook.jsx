import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { StickyNote, X } from 'lucide-react'
import AgendaNoteBoard, {
  AGENDA_NOTE_BADGE_CLASS,
  countIncompleteAgendaNotes,
  getAgendaNoteStamp,
  sortAgendaNotes,
} from '../Crm/AgendaNoteBoard'
import NotebookCategorySection from './NotebookCategorySection'
import NotebookCategoryDetailModal from './NotebookCategoryDetailModal'
import {
  deleteAgendaNote,
  deleteCompletedAgendaNotes,
  loadAgendaNotes,
  reorderAgendaNotes,
  upsertAgendaNote,
} from '../../utils/crmStore'
import {
  appendNotebookCategoryNote,
  loadNotebookCategories,
  NOTEBOOK_CATEGORIES_EVENT,
  sortNotebookCategories,
  uniqueNotebookCategoryTitle,
} from '../../utils/notebookCategoryStore'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'
import {
  clearMobileToolsHandoff,
  styleFromMobileToolsHandoff,
  useMobileToolsHandoff,
} from '../../hooks/useMobileToolsHandoff'
import { getHeaderAgendaAnchor } from '../../utils/headerAgendaAnchor'

export default function HeaderNotebook({ hideTrigger = false }) {
  const { open, setOpen, toggle } = useHeaderPopover('notebook')
  const mobileHandoff = useMobileToolsHandoff('notebook')
  const [notes, setNotes] = useState(() => loadAgendaNotes())
  const [categories, setCategories] = useState(() =>
    sortNotebookCategories(loadNotebookCategories()),
  )
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [detailCategory, setDetailCategory] = useState(null)
  const [focusToken, setFocusToken] = useState(0)
  const {
    anchorRef,
    menuRef,
    style: menuStyle,
  } = useAnchoredPortal(open && !mobileHandoff, {
    align: 'center',
    matchWidth: false,
    offset: 8,
    flip: false,
    maxBottomInset: 'var(--shell-gap)',
    getAnchor: hideTrigger ? getHeaderAgendaAnchor : null,
  })

  useEffect(() => {
    function refresh() {
      setNotes(loadAgendaNotes())
      setCategories(sortNotebookCategories(loadNotebookCategories()))
    }
    window.addEventListener('bach:crm-updated', refresh)
    window.addEventListener(NOTEBOOK_CATEGORIES_EVENT, refresh)
    return () => {
      window.removeEventListener('bach:crm-updated', refresh)
      window.removeEventListener(NOTEBOOK_CATEGORIES_EVENT, refresh)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      clearMobileToolsHandoff('notebook')
      return
    }
    setFocusToken((value) => value + 1)
  }, [open])

  useEffect(() => {
    if (!selectedCategoryId) return
    if (!categories.some((item) => item.id === selectedCategoryId)) {
      setSelectedCategoryId(null)
    }
  }, [categories, selectedCategoryId])

  const sortedNotes = useMemo(() => sortAgendaNotes(notes), [notes])
  const incompleteCount = useMemo(() => countIncompleteAgendaNotes(notes), [notes])
  const portalStyle = mobileHandoff
    ? styleFromMobileToolsHandoff(mobileHandoff, { maxBottomInset: 16 })
    : menuStyle

  function refreshNotes() {
    setNotes(loadAgendaNotes())
  }

  function refreshCategories() {
    setCategories(sortNotebookCategories(loadNotebookCategories()))
  }

  function handleSave(content) {
    if (selectedCategoryId) {
      appendNotebookCategoryNote(selectedCategoryId, content)
      refreshCategories()
      return
    }
    const stamp = getAgendaNoteStamp()
    const title =
      content
        .split('\n')
        .find((line) => line.trim())
        ?.trim()
        .slice(0, 80) || 'Not'
    upsertAgendaNote({
      title,
      content,
      date: stamp.date,
      time: stamp.time,
      completed: false,
      color: 'Mavi',
    })
    refreshNotes()
  }

  function handleToggleComplete(note) {
    upsertAgendaNote({
      ...note,
      completed: !note.completed,
    })
    refreshNotes()
  }

  function handleUpdateNote(note, content) {
    const title =
      content
        .split('\n')
        .find((line) => line.trim())
        ?.trim()
        .slice(0, 80) || 'Not'
    upsertAgendaNote({
      ...note,
      title,
      content,
    })
    refreshNotes()
  }

  function handleDelete(noteId) {
    deleteAgendaNote(noteId)
    refreshNotes()
  }

  function handleDeleteCompleted() {
    deleteCompletedAgendaNotes()
    refreshNotes()
  }

  function handleReorder(orderedIds) {
    reorderAgendaNotes(orderedIds)
    refreshNotes()
  }

  function handleCreateCategory() {
    setDetailCategory({
      title: uniqueNotebookCategoryTitle('Yeni Buton', categories),
      notes: [],
    })
  }

  function handleCategoryChanged(nextCategory) {
    refreshCategories()
    if (nextCategory?.id) {
      setDetailCategory(nextCategory)
      setSelectedCategoryId(nextCategory.id)
      return
    }
    setDetailCategory(null)
    setSelectedCategoryId(null)
  }

  return (
    <div
      className={
        hideTrigger
          ? 'pointer-events-none fixed left-0 top-0 h-0 w-0 overflow-hidden opacity-0'
          : 'relative flex items-center'
      }
      ref={anchorRef}
      onClick={(event) => event.stopPropagation()}
    >
      {!hideTrigger ? (
        <button
          type="button"
          data-header-popover-trigger="notebook"
          onClick={toggle}
          className={`${HEADER_CONTROL_BUTTON_CLASS} icon-only relative`}
          aria-label="Not Defteri"
          title="Not Defteri"
        >
          <span className="icon-wrap">
            <StickyNote className="h-4 w-4 shrink-0" />
          </span>
          {incompleteCount > 0 && (
            <span className={AGENDA_NOTE_BADGE_CLASS}>
              {incompleteCount > 99 ? '99+' : incompleteCount}
            </span>
          )}
        </button>
      ) : null}

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={
              portalStyle ?? {
                position: 'fixed',
                visibility: 'hidden',
                pointerEvents: 'none',
                zIndex: 10000,
              }
            }
            className="app-header-dropdown header-popover-panel header-notebook-dropdown overflow-hidden"
            data-header-popover="notebook"
            data-mobile-handoff={mobileHandoff ? 'true' : undefined}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="header-popover-head !px-3 !py-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Not Defteri
                </p>
                <p className="text-[11px] font-normal text-[var(--muted)]">
                  {sortedNotes.length} hızlı not · {categories.length} buton
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  clearMobileToolsHandoff('notebook')
                }}
                className="glass-sidebar-toggle glass-sidebar-collapse flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                aria-label="Not defterini kapat"
                title="Kapat"
              >
                <X className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </div>

            <div className="header-notebook-body">
              <AgendaNoteBoard
                fill
                notes={sortedNotes}
                confirmVariant="warm"
                autoFocusComposer
                enterToSave
                showRecordCount={false}
                focusToken={focusToken}
                onSave={handleSave}
                onToggleComplete={handleToggleComplete}
                onUpdate={handleUpdateNote}
                onDelete={handleDelete}
                onDeleteCompleted={handleDeleteCompleted}
                onReorder={handleReorder}
                afterComposer={
                  <NotebookCategorySection
                    categories={categories}
                    selectedId={selectedCategoryId}
                    onSelect={(category) => setSelectedCategoryId(category.id)}
                    onClearSelect={() => setSelectedCategoryId(null)}
                    onOpenCategory={(category) => {
                      const fresh =
                        loadNotebookCategories().find((item) => item.id === category.id) || category
                      setDetailCategory(fresh)
                    }}
                    onCreateCategory={handleCreateCategory}
                  />
                }
              />
            </div>
          </div>,
          document.body,
        )}

      <NotebookCategoryDetailModal
        open={Boolean(detailCategory)}
        category={detailCategory}
        onClose={() => setDetailCategory(null)}
        onChanged={handleCategoryChanged}
      />
    </div>
  )
}
