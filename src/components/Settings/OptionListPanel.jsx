import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import InlineDeleteConfirm from '../Common/InlineDeleteConfirm'
import ProcessPanelModule from '../DocumentEditor/ProcessPanelModule'
import {
  isReservedPlaceholderLabel,
  mapProcessOptions,
  matchProcessOption,
  optionsToProcessRecord,
  processRecordToOptions,
} from '../DocumentEditor/processPanelUtils'
import { stageColors } from '../DocumentEditor/stageColors'

function normalizeLabel(label) {
  return label.trim().toLocaleLowerCase('tr-TR')
}

function createOptionId() {
  return `opt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function buildCopyLabel(label, options) {
  const base = `${String(label || 'Seçenek').trim()} Kopya`
  const used = new Set((options || []).map((option) => normalizeLabel(option.label)))
  if (!used.has(normalizeLabel(base))) return base
  let index = 2
  while (used.has(normalizeLabel(`${base} ${index}`))) index += 1
  return `${base} ${index}`
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
  onRemove,
  compact = false,
  dragHandleProps = null,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [stageInput, setStageInput] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [pendingRemovePanel, setPendingRemovePanel] = useState(false)
  const [previewId, setPreviewId] = useState(null)

  const activeKey = previewId && options.some((option) => option.id === previewId) ? previewId : ''

  const record = useMemo(() => optionsToProcessRecord(options, activeKey), [options, activeKey])

  function toggleEditor() {
    setIsOpen((current) => !current)
    setPendingDeleteId(null)
  }

  function addStage(chosenColor, inputLabel) {
    const label = (inputLabel || stageInput).trim()
    if (
      !label ||
      isReservedPlaceholderLabel(label) ||
      options.some((option) => normalizeLabel(option.label) === normalizeLabel(label))
    )
      return
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
    if (
      options.some(
        (option) =>
          !matchProcessOption(option, stage) &&
          normalizeLabel(option.label) === normalizeLabel(clean),
      )
    ) {
      return
    }
    onChange(mapProcessOptions(options, stage, (option) => ({ ...option, label: clean })))
  }

  function copyStage(stage) {
    const sourceIndex = options.findIndex((option) => matchProcessOption(option, stage))
    if (sourceIndex < 0) return
    const source = options[sourceIndex]
    const nextOption = {
      ...source,
      id: createOptionId(),
      label: buildCopyLabel(source.label || stage.label, options),
      color: source.color || stage.color || stageColors[(options.length + 1) % stageColors.length],
    }
    const next = [...options]
    next.splice(sourceIndex + 1, 0, nextOption)
    onChange(next)
    setPreviewId(nextOption.id)
    setPendingDeleteId(null)
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
    <section className={compact ? 'space-y-1.5' : 'space-y-3'}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className={`font-black text-white ${compact ? 'text-xs tracking-wide' : 'text-sm'}`}>
            {title}
          </h3>
          {description || compact ? (
            <p
              className={`font-semibold text-gray-500 ${compact ? 'mt-0.5 text-[11px]' : 'mt-1 text-xs'}`}
            >
              {[description, compact ? `${(options || []).length} ${countSuffix}` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
        </div>
        {typeof onRemove === 'function' ? (
          pendingRemovePanel ? (
            <InlineDeleteConfirm
              onConfirm={() => {
                setPendingRemovePanel(false)
                onRemove()
              }}
              onCancel={() => setPendingRemovePanel(false)}
              className="ml-0"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPendingRemovePanel(true)}
              className="rounded-md bg-transparent p-1 text-gray-500 transition-colors hover:text-red-300"
              aria-label={`${title} sürecini kaldır`}
              title="Süreç başlığını kaldır"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )
        ) : null}
      </div>
      <ProcessPanelModule
        compact={compact}
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
        onCopyStage={copyStage}
        onReorderStages={reorderStages}
        pendingStageDeleteId={pendingDeleteId}
        setPendingStageDeleteId={setPendingDeleteId}
        onRemoveStage={removeStage}
        summaryLine={compact ? <span /> : undefined}
        dragHandleProps={dragHandleProps}
      />
    </section>
  )
}
