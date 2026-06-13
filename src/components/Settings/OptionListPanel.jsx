import { useMemo, useState } from 'react'
import ProcessPanelModule from '../DocumentEditor/ProcessPanelModule'
import { isReservedPlaceholderLabel, mapProcessOptions, matchProcessOption, optionsToProcessRecord, processRecordToOptions } from '../DocumentEditor/processPanelUtils'
import { stageColors } from '../DocumentEditor/stageColors'

function normalizeLabel(label) {
  return label.trim().toLocaleLowerCase('tr-TR')
}

function createOptionId() {
  return `opt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export default function OptionListPanel({
  title,
  description,
  options,
  onChange,
  placeholder = 'Yeni seçenek adı...',
  activeLabel = 'Aktif Seçenek',
  countSuffix = 'seçenek tanımlı',
  emptyMessage = 'Henüz seçenek eklenmedi.',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [stageInput, setStageInput] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [previewId, setPreviewId] = useState(null)

  const activeKey = previewId && options.some((option) => option.id === previewId)
    ? previewId
    : ''

  const record = useMemo(
    () => optionsToProcessRecord(options, activeKey),
    [options, activeKey],
  )

  function toggleEditor() {
    setIsOpen((current) => !current)
    setPendingDeleteId(null)
  }

  function addStage(chosenColor, inputLabel) {
    const label = (inputLabel || stageInput).trim()
    if (!label || isReservedPlaceholderLabel(label) || options.some((option) => normalizeLabel(option.label) === normalizeLabel(label))) return
    const nextId = createOptionId()
    const next = [
      ...options,
      {
        id: nextId,
        label,
        color: chosenColor || stageColors[options.length % stageColors.length],
      },
    ]
    onChange(next)
    setPreviewId(nextId)
    setStageInput('')
  }

  function selectStage(stage) {
    if (!stage) {
      setPreviewId(null)
      return
    }
    if (previewId === stage.id) {
      setPreviewId(null)
      return
    }
    setPreviewId(stage.id)
  }

  function updateStageColor(stage, color) {
    onChange(mapProcessOptions(options, stage, (option) => ({ ...option, color })))
  }

  function updateStageLabel(stage, label) {
    const clean = label.trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return
    if (options.some((option) => !matchProcessOption(option, stage) && normalizeLabel(option.label) === normalizeLabel(clean))) {
      return
    }
    onChange(mapProcessOptions(options, stage, (option) => ({ ...option, label: clean })))
  }

  function reorderStages(nextStages) {
    onChange(processRecordToOptions(nextStages))
  }

  function removeStage(stage) {
    const next = options.filter((option) => !matchProcessOption(option, stage))
    onChange(next)
    if (previewId === stage.id) setPreviewId(null)
    setPendingDeleteId(null)
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-black text-white">{title}</h3>
        {description ? <p className="mt-1 text-xs font-semibold text-gray-500">{description}</p> : null}
      </div>
      <ProcessPanelModule
        activeLabel={activeLabel}
        countSuffix={countSuffix}
        emptyMessage={emptyMessage}
        addPlaceholder={placeholder}
        record={record}
        isOpen={isOpen}
        onToggle={toggleEditor}
        stageInput={stageInput}
        setStageInput={setStageInput}
        onAddStage={addStage}
        onSelectStage={selectStage}
        onUpdateStageColor={updateStageColor}
        onUpdateStageLabel={updateStageLabel}
        onReorderStages={reorderStages}
        pendingStageDeleteId={pendingDeleteId}
        setPendingStageDeleteId={setPendingDeleteId}
        onRemoveStage={removeStage}
      />
    </section>
  )
}
