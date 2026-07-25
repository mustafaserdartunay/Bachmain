import { useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'

/**
 * Dikey sürükle-bırak liste kabuğu — süreç panelleri / sayfa bölümleri için.
 */
export default function SortableProcessList({
  items,
  getKey,
  onReorder,
  renderItem,
  className = 'flex flex-col gap-3',
}) {
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const draggedIndexRef = useRef(null)

  function beginDrag(index, event) {
    draggedIndexRef.current = index
    setDraggedIndex(index)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
    if (event.dataTransfer.setDragImage && event.currentTarget instanceof HTMLElement) {
      event.dataTransfer.setDragImage(event.currentTarget, 12, 12)
    }
  }

  function endDrag() {
    window.setTimeout(() => {
      draggedIndexRef.current = null
      setDraggedIndex(null)
      setDragOverIndex(null)
    }, 0)
  }

  function handleDrop(targetIndex, event) {
    event.preventDefault()
    event.stopPropagation()
    const transferRaw = event.dataTransfer?.getData('text/plain')
    const fromIndex =
      transferRaw !== '' && transferRaw != null ? Number(transferRaw) : draggedIndexRef.current
    if (fromIndex == null || Number.isNaN(fromIndex) || fromIndex === targetIndex) {
      endDrag()
      return
    }
    onReorder?.(fromIndex, targetIndex)
    endDrag()
  }

  return (
    <div className={className}>
      {items.map((item, index) => {
        const isDragging = draggedIndex === index
        const isDragOver = dragOverIndex === index && draggedIndex !== index
        const dragHandleProps = {
          draggable: true,
          onDragStart: (event) => beginDrag(index, event),
          onDragEnd: endDrag,
        }
        return (
          <div
            key={getKey(item, index)}
            className={`transition-opacity ${isDragging ? 'opacity-40' : ''} ${
              isDragOver ? 'rounded-lg ring-2 ring-blue-400/40' : ''
            }`}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
              if (draggedIndexRef.current !== null && draggedIndexRef.current !== index) {
                setDragOverIndex(index)
              }
            }}
            onDragLeave={() => {
              if (dragOverIndex === index) setDragOverIndex(null)
            }}
            onDrop={(event) => handleDrop(index, event)}
          >
            {renderItem(item, index, dragHandleProps)}
          </div>
        )
      })}
    </div>
  )
}

/** CollapsibleProcessSection başlığında kullanılan grip. */
export function SectionDragHandle({ dragHandleProps }) {
  if (!dragHandleProps) return null
  return (
    <div
      {...dragHandleProps}
      role="button"
      tabIndex={0}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      className={`flex cursor-grab items-center rounded-md p-1 text-gray-500 opacity-70 transition-opacity hover:text-gray-300 hover:opacity-100 active:cursor-grabbing ${dragHandleProps.className || ''}`.trim()}
      title="Sürükleyerek sırala"
      aria-label="Sürükleyerek sırala"
    >
      <GripVertical className="pointer-events-none h-4 w-4" />
    </div>
  )
}
