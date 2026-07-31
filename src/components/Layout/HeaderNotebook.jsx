import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { StickyNote } from 'lucide-react'
import AgendaNoteBoard, {
  AGENDA_NOTE_BADGE_CLASS,
  countIncompleteAgendaNotes,
  getAgendaNoteStamp,
  sortAgendaNotes,
} from '../Crm/AgendaNoteBoard'
import {
  deleteAgendaNote,
  deleteCompletedAgendaNotes,
  loadAgendaNotes,
  upsertAgendaNote,
} from '../../utils/crmStore'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'

export default function HeaderNotebook() {
  const { open, toggle } = useHeaderPopover('notebook')
  const [notes, setNotes] = useState(() => loadAgendaNotes())
  const [focusToken, setFocusToken] = useState(0)
  const {
    anchorRef,
    menuRef,
    style: menuStyle,
  } = useAnchoredPortal(open, {
    align: 'center',
    matchWidth: false,
    offset: 8,
    flip: false,
    // Match glass-sidebar bottom: bottom-[var(--shell-gap)]
    maxBottomInset: 'var(--shell-gap)',
  })

  useEffect(() => {
    function refresh() {
      setNotes(loadAgendaNotes())
    }
    window.addEventListener('bach:crm-updated', refresh)
    return () => window.removeEventListener('bach:crm-updated', refresh)
  }, [])

  useEffect(() => {
    if (!open) return
    setFocusToken((value) => value + 1)
  }, [open])

  const sortedNotes = useMemo(() => sortAgendaNotes(notes), [notes])
  const incompleteCount = useMemo(() => countIncompleteAgendaNotes(notes), [notes])

  function refreshNotes() {
    setNotes(loadAgendaNotes())
  }

  function handleSave(content) {
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

  return (
    <div
      className="relative flex items-center"
      ref={anchorRef}
      onClick={(event) => event.stopPropagation()}
    >
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

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={
              menuStyle ?? {
                position: 'fixed',
                visibility: 'hidden',
                pointerEvents: 'none',
                zIndex: 10000,
              }
            }
            className="app-header-dropdown header-popover-panel header-notebook-dropdown overflow-hidden"
            data-header-popover="notebook"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="header-popover-head !px-3 !py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Not Defteri
              </p>
              <p className="shrink-0 text-[11px] font-normal text-[var(--muted)]">
                {sortedNotes.length} kayıt
              </p>
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
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
