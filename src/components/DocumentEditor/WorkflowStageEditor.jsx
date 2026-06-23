import { useEffect, useRef, useState } from 'react'
import { Copy, GripVertical, Pencil, Plus, X } from 'lucide-react'
import InlineDeleteConfirm from '../Common/InlineDeleteConfirm'
import { BTN_PRIMARY } from '../../utils/buttonStyles'
import StageColorSwatches from './StageColorSwatches'
import { stageColors } from './stageColors'
import { filterWorkflowStageList, isReservedPlaceholderLabel } from './processPanelUtils'

export default function WorkflowStageEditor({
  record,
  stageInput,
  setStageInput,
  onAddStage,
  onSelectStage,
  onUpdateStageColor,
  onUpdateStageLabel,
  onCopyStage,
  onReorderStages,
  pendingStageDeleteId,
  setPendingStageDeleteId,
  onRemoveStage,
  emptyMessage = 'Henüz süreç eklenmedi.',
  addPlaceholder = 'Yeni süreç adı...',
  allowDeselect = true,
}) {
  const stages = filterWorkflowStageList(record?.stages || [])
  const stageListRef = useRef(null)
  const previousStageCountRef = useRef(stages.length)
  const [newStageColor, setNewStageColor] = useState(stageColors[0])
  const [newStageName, setNewStageName] = useState('')
  const [isNewStageColorMode, setIsNewStageColorMode] = useState(false)
  const [draggedStageIndex, setDraggedStageIndex] = useState(null)
  const [dragOverStageIndex, setDragOverStageIndex] = useState(null)
  const [editingLabelStageId, setEditingLabelStageId] = useState(null)
  const [editingLabelDraft, setEditingLabelDraft] = useState('')
  const labelInputRef = useRef(null)
  const ignoreLabelBlurRef = useRef(false)
  const draggedIndexRef = useRef(null)
  const editingLabelDraftRef = useRef('')
  const editingStageIdRef = useRef(null)
  const newStageNameRef = useRef('')

  const [colorTargetStageId, setColorTargetStageId] = useState(null)

  const selectedStage = stages.find((stage) => stage.id === record?.currentStageId) || null
  const colorTargetStage = stages.find((stage) => stage.id === colorTargetStageId) || selectedStage || stages[0] || null

  useEffect(() => {
    if (!editingLabelStageId) return
    labelInputRef.current?.focus()
    labelInputRef.current?.select()
  }, [editingLabelStageId])

  useEffect(() => {
    setColorTargetStageId((current) => {
      if (current && stages.some((stage) => stage.id === current)) return current
      if (record?.currentStageId && stages.some((stage) => stage.id === record.currentStageId)) {
        return record.currentStageId
      }
      return stages[0]?.id || null
    })
  }, [record?.currentStageId, stages])

  useEffect(() => {
    if (stages.length <= previousStageCountRef.current) {
      previousStageCountRef.current = stages.length
      return
    }
    previousStageCountRef.current = stages.length
    const list = stageListRef.current
    if (!list) return
    list.scrollTop = list.scrollHeight
  }, [stages.length, stages.map((stage) => stage.id).join('|')])

  function handleAddStage(event) {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    const label = (newStageNameRef.current || newStageName || stageInput || '').trim()
    if (!label || isReservedPlaceholderLabel(label)) return
    if (typeof onAddStage !== 'function') return
    onAddStage(newStageColor, label)
    newStageNameRef.current = ''
    setNewStageName('')
    if (setStageInput) setStageInput('')
    setIsNewStageColorMode(false)
  }

  function handleSelectStage(stage) {
    if (editingLabelStageId) {
      commitLabelEdit(editingLabelStageId)
    }

    const isActive = record?.selectedStageIds?.length
      ? record.selectedStageIds.includes(stage.id)
      : Boolean(record?.currentStageId) && stage.id === record.currentStageId

    setIsNewStageColorMode(false)

    if (isActive && allowDeselect) {
      setColorTargetStageId(null)
      onSelectStage(null, stage)
      return
    }

    setColorTargetStageId(stage.id)
    onSelectStage(stage)
  }

  function startLabelEdit(stage) {
    if (editingLabelStageId && editingLabelStageId !== stage.id) {
      commitLabelEdit(editingLabelStageId)
    }
    ignoreLabelBlurRef.current = true
    setIsNewStageColorMode(false)
    setColorTargetStageId(stage.id)
    editingStageIdRef.current = stage.id
    editingLabelDraftRef.current = stage.label
    setEditingLabelStageId(stage.id)
    setEditingLabelDraft(stage.label)
    requestAnimationFrame(() => {
      ignoreLabelBlurRef.current = false
    })
  }

  function commitLabelEdit(stageId = editingStageIdRef.current) {
    const resolvedStageId = stageId || editingLabelStageId
    const clean = editingLabelDraftRef.current.trim()
    const current = stages.find((item) => item.id === resolvedStageId)

    if (current && clean && !isReservedPlaceholderLabel(clean) && typeof onUpdateStageLabel === 'function') {
      onUpdateStageLabel(current, clean)
    }

    editingStageIdRef.current = null
    editingLabelDraftRef.current = ''
    setEditingLabelStageId(null)
    setEditingLabelDraft('')
  }

  function cancelLabelEdit() {
    editingStageIdRef.current = null
    editingLabelDraftRef.current = ''
    setEditingLabelStageId(null)
    setEditingLabelDraft('')
  }

  function handleLabelBlur() {
    if (ignoreLabelBlurRef.current) return
    window.setTimeout(() => {
      if (editingStageIdRef.current) commitLabelEdit(editingStageIdRef.current)
    }, 0)
  }

  function handleDrop(targetIndex, event) {
    event.preventDefault()
    event.stopPropagation()
    const transferRaw = event.dataTransfer?.getData('text/plain')
    const fromIndex = transferRaw !== '' && transferRaw != null
      ? Number(transferRaw)
      : draggedIndexRef.current
    if (fromIndex == null || Number.isNaN(fromIndex) || fromIndex === targetIndex) return
    const nextStages = [...stages]
    const [moved] = nextStages.splice(fromIndex, 1)
    nextStages.splice(targetIndex, 0, moved)
    onReorderStages(nextStages)
    draggedIndexRef.current = null
    setDraggedStageIndex(null)
    setDragOverStageIndex(null)
  }

  function beginDrag(index, event) {
    draggedIndexRef.current = index
    setDraggedStageIndex(index)
    setIsNewStageColorMode(false)
    setColorTargetStageId(stages[index]?.id || null)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
    if (event.dataTransfer.setDragImage && event.currentTarget instanceof HTMLElement) {
      event.dataTransfer.setDragImage(event.currentTarget, 16, 16)
    }
  }

  function endDrag() {
    window.setTimeout(() => {
      draggedIndexRef.current = null
      setDraggedStageIndex(null)
      setDragOverStageIndex(null)
    }, 0)
  }

  const activeColorValue = isNewStageColorMode
    ? newStageColor
    : (colorTargetStage?.color || newStageColor)

  function handleColorChange(color) {
    if (isNewStageColorMode) {
      setNewStageColor(color)
      return
    }
    if (colorTargetStage) {
      onUpdateStageColor(colorTargetStage, color)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch gap-3">
        <div className="flex min-w-0 flex-col">
          {stages.length > 0 ? (
            <div ref={stageListRef} className="max-h-52 space-y-1.5 overflow-y-auto pr-0.5">
              {stages.map((stage, index) => {
                const isActive = record?.selectedStageIds?.length
                  ? record.selectedStageIds.includes(stage.id)
                  : Boolean(record?.currentStageId) && stage.id === record.currentStageId
                const isDragging = draggedStageIndex === index
                const isDragOver = dragOverStageIndex === index && draggedStageIndex !== index
                const isEditingLabel = editingLabelStageId === stage.id
                return (
                  <div
                    key={stage.id}
                    className={`transition-opacity ${isDragging ? 'opacity-40' : ''}`}
                    onDragOver={(event) => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                      if (draggedStageIndex !== null && draggedStageIndex !== index) {
                        setDragOverStageIndex(index)
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverStageIndex === index) setDragOverStageIndex(null)
                    }}
                    onDrop={(event) => handleDrop(index, event)}
                  >
                    {pendingStageDeleteId === stage.id ? (
                      <div className="flex w-full items-center rounded-xl border border-dark-500/50 bg-dark-700/70">
                        <div className="px-2 py-2 text-gray-500 opacity-40">
                          <GripVertical className="h-3.5 w-3.5 pointer-events-none" />
                        </div>
                        <span className={`mx-1 h-2.5 w-2.5 shrink-0 rounded-full ${stage.color || 'bg-blue-500'}`} />
                        <span className="min-w-0 flex-1 truncate px-1 py-2 text-xs font-bold text-gray-400">
                          {stage.label}
                        </span>
                        <InlineDeleteConfirm
                          onConfirm={() => onRemoveStage(stage)}
                          onCancel={() => setPendingStageDeleteId(null)}
                        />
                      </div>
                    ) : (
                      <div className={`group flex w-full items-center rounded-xl border transition-colors ${
                        isDragOver
                          ? 'border-blue-400/70 bg-blue-500/10 ring-2 ring-blue-400/40'
                          : isActive
                            ? 'border-blue-500/50 bg-blue-500/15'
                            : 'border-dark-500/50 bg-dark-700/70 hover:bg-dark-700/80'
                      }`}
                      >
                        <div
                          draggable={!isEditingLabel}
                          onDragStart={(event) => beginDrag(index, event)}
                          onDragEnd={endDrag}
                          className="cursor-grab px-2 py-2 text-gray-500 opacity-60 transition-opacity hover:text-gray-300 hover:opacity-100 active:cursor-grabbing"
                          title="Sürükleyerek sırala"
                          aria-label="Sürükleyerek sırala"
                        >
                          <GripVertical className="h-3.5 w-3.5 pointer-events-none" />
                        </div>
                        <span className={`mx-1 h-2.5 w-2.5 shrink-0 rounded-full ${stage.color || 'bg-blue-500'}`} />
                        {isEditingLabel ? (
                          <input
                            ref={labelInputRef}
                            type="text"
                            value={editingLabelDraft}
                            onChange={(event) => {
                              editingLabelDraftRef.current = event.target.value
                              setEditingLabelDraft(event.target.value)
                            }}
                            onBlur={handleLabelBlur}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                commitLabelEdit(stage.id)
                              }
                              if (event.key === 'Escape') {
                                event.preventDefault()
                                cancelLabelEdit()
                              }
                            }}
                            onMouseDown={(event) => event.stopPropagation()}
                            className={`min-w-0 flex-1 rounded-lg border border-blue-500/40 bg-dark-900/60 px-2 py-1.5 text-xs font-bold outline-none ring-0 ${
                              isActive ? 'text-white' : 'text-gray-300'
                            }`}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectStage(stage)}
                            onDoubleClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              startLabelEdit(stage)
                            }}
                            className={`min-w-0 flex-1 truncate px-1 py-2 text-left text-xs font-bold ${
                              isActive ? 'text-white' : 'text-gray-300'
                            }`}
                          >
                            {stage.label}
                          </button>
                        )}
                        {typeof onCopyStage === 'function' && (
                          <button
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                            }}
                            onClick={(event) => {
                              event.stopPropagation()
                              if (isEditingLabel) commitLabelEdit(stage.id)
                              onCopyStage(stage)
                            }}
                            className={`rounded-md p-2 text-gray-500 transition-all hover:bg-emerald-500/15 hover:text-emerald-300 ${
                              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                            title="Kopyala"
                            aria-label={`${stage.label} kopyala`}
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                          }}
                          onClick={(event) => {
                            event.stopPropagation()
                            if (isEditingLabel) commitLabelEdit(stage.id)
                            else startLabelEdit(stage)
                          }}
                          className={`rounded-md p-2 text-gray-500 transition-all hover:bg-blue-500/15 hover:text-blue-300 ${
                            isEditingLabel || isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          title="Süreç adını düzenle"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                          }}
                          onClick={(event) => {
                            event.stopPropagation()
                            setPendingStageDeleteId(stage.id)
                          }}
                          className={`rounded-md p-2 text-gray-500 transition-all hover:bg-red-500/15 hover:text-red-300 ${
                            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          title="Süreci sil"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="flex-1 py-6 text-center text-xs font-semibold text-gray-500">{emptyMessage}</p>
          )}

          <form
            className="mt-3 flex gap-2 border-t border-dark-500/35 pt-3"
            onSubmit={handleAddStage}
          >
            <input
              type="text"
              value={newStageName}
              onChange={(event) => {
                const nextValue = event.target.value
                newStageNameRef.current = nextValue
                setNewStageName(nextValue)
                if (setStageInput) setStageInput(nextValue)
                setIsNewStageColorMode(true)
              }}
              onFocus={() => setIsNewStageColorMode(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleAddStage(event)
                }
              }}
              placeholder={addPlaceholder}
              className="form-input h-9 min-w-0 flex-1"
            />
            <button
              type="button"
              onClick={handleAddStage}
              className={`${BTN_PRIMARY} h-9 shrink-0 gap-1.5 px-3 text-xs`}
            >
              <Plus className="h-3.5 w-3.5" /> Ekle
            </button>
          </form>
        </div>

        <div className="flex w-8 shrink-0 flex-col items-center gap-2 self-stretch border-l border-dark-500/35 pl-2.5">
          <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-gray-500">Renk</span>
          <StageColorSwatches
            value={activeColorValue}
            onChange={handleColorChange}
            size="sm"
            direction="vertical"
            fill
          />
        </div>
      </div>
    </div>
  )
}
