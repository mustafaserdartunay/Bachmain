import { useRef, useState } from 'react'
import { Check, Copy, GripVertical, Pencil, X } from 'lucide-react'
import InlineDeleteConfirm from '../Common/InlineDeleteConfirm'

export default function SegmentTabs({
  tabs,
  activeId,
  onSelect,
  onCopy,
  onRename,
  onDelete,
  onReorder,
  getCount,
  editId,
  setEditId,
  editDraft,
  setEditDraft,
  pendingDeleteId,
  setPendingDeleteId,
  allowDelete = true,
}) {
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const draggedIndexRef = useRef(null)
  const suppressClickRef = useRef(false)
  const canReorder = typeof onReorder === 'function'

  function beginDrag(index, event) {
    if (!canReorder || editId) return
    draggedIndexRef.current = index
    setDraggedIndex(index)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
    if (event.dataTransfer.setDragImage && event.currentTarget instanceof HTMLElement) {
      const chip = event.currentTarget.closest('[data-segment-chip]')
      if (chip) event.dataTransfer.setDragImage(chip, 24, 16)
    }
  }

  function handleDrop(targetIndex, event) {
    event.preventDefault()
    event.stopPropagation()
    if (!canReorder) return
    const transferRaw = event.dataTransfer?.getData('text/plain')
    const fromIndex =
      transferRaw !== '' && transferRaw != null ? Number(transferRaw) : draggedIndexRef.current
    if (fromIndex == null || Number.isNaN(fromIndex) || fromIndex === targetIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }
    const next = [...tabs]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(targetIndex, 0, moved)
    onReorder(next)
    suppressClickRef.current = true
    draggedIndexRef.current = null
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  function endDrag() {
    window.setTimeout(() => {
      draggedIndexRef.current = null
      setDraggedIndex(null)
      setDragOverIndex(null)
    }, 0)
  }

  return (
    <div className="flex min-w-0 flex-1 flex-wrap gap-2">
      {tabs.map((segment, index) => {
        const isActive = activeId === segment.id
        const isDragging = draggedIndex === index
        const isDragOver = dragOverIndex === index && draggedIndex !== index
        if (pendingDeleteId === segment.id) {
          return (
            <div
              key={segment.id}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-2 py-1.5"
            >
              <span className="text-[13px] font-black uppercase tracking-wide text-red-200">
                {segment.label}
              </span>
              <InlineDeleteConfirm
                onConfirm={() => onDelete(segment)}
                onCancel={() => setPendingDeleteId(null)}
              />
            </div>
          )
        }

        return (
          <div
            key={segment.id}
            data-segment-chip
            onDragOver={(event) => {
              if (!canReorder) return
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
              setDragOverIndex(index)
            }}
            onDrop={(event) => handleDrop(index, event)}
            className={`inline-flex items-center overflow-hidden rounded-xl border transition-all ${
              isDragging ? 'opacity-45' : ''
            } ${
              isDragOver
                ? 'border-blue-400/70 bg-blue-500/20 ring-2 ring-blue-400/35'
                : isActive
                  ? 'border-blue-500/50 bg-blue-500/15 shadow-[0_0_18px_rgba(59,130,246,0.12)]'
                  : 'border-white/10 bg-dark-800/80 hover:border-white/20'
            }`}
          >
            {editId === segment.id ? (
              <form
                className="flex items-center gap-1 px-1 py-1"
                onSubmit={(event) => {
                  event.preventDefault()
                  onRename(segment, editDraft)
                }}
              >
                <input
                  value={editDraft}
                  onChange={(event) => setEditDraft(event.target.value)}
                  onBlur={() => onRename(segment, editDraft)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      setEditId(null)
                      setEditDraft('')
                    }
                  }}
                  className="h-7 w-40 rounded-lg border border-blue-500/40 bg-dark-900/70 px-2 text-[13px] font-black uppercase text-white outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-md p-1 text-emerald-300 hover:bg-emerald-500/15"
                  title="Kaydet"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setEditId(null)
                    setEditDraft('')
                  }}
                  className="rounded-md p-1 text-gray-500 hover:bg-dark-600 hover:text-gray-300"
                  title="Vazgeç"
                >
                  <X className="h-3 w-3" />
                </button>
              </form>
            ) : (
              <>
                {canReorder && (
                  <div
                    draggable
                    onDragStart={(event) => beginDrag(index, event)}
                    onDragEnd={endDrag}
                    className="cursor-grab px-1.5 py-2 text-gray-500 opacity-70 transition-opacity hover:text-gray-300 hover:opacity-100 active:cursor-grabbing"
                    title="Sürükleyerek sırala"
                    aria-label={`${segment.label} sürükle`}
                  >
                    <GripVertical className="h-3.5 w-3.5 pointer-events-none" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false
                      return
                    }
                    onSelect(segment)
                  }}
                  className={`px-2.5 py-2 text-xs font-black uppercase tracking-wide transition-colors ${
                    isActive ? 'text-blue-300' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {segment.label}
                  <span className="ml-1.5 text-[12px] font-bold text-gray-500">
                    ({getCount(segment)})
                  </span>
                </button>
              </>
            )}
            {editId !== segment.id && (
              <>
                {onCopy ? (
                  <button
                    type="button"
                    onClick={() => onCopy(segment)}
                    className="rounded-md p-1 text-gray-500 transition-colors hover:bg-emerald-500/15 hover:text-emerald-300"
                    aria-label={`${segment.label} kopyala`}
                    title="Sekmeyi kopyala"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setEditId(segment.id)
                    setEditDraft(segment.label)
                    setPendingDeleteId(null)
                  }}
                  className="rounded-md p-1 text-gray-500 transition-colors hover:bg-blue-500/15 hover:text-blue-300"
                  aria-label={`${segment.label} düzenle`}
                  title="Sekmeyi düzenle"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                {allowDelete && tabs.length > 1 && onDelete ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPendingDeleteId(segment.id)
                      setEditId(null)
                    }}
                    className="mr-1.5 rounded-md p-1 text-gray-500 transition-colors hover:bg-red-500/20 hover:text-red-300"
                    aria-label={`${segment.label} sil`}
                    title="Sekmeyi sil"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
