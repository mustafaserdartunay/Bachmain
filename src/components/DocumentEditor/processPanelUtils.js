import { stageColors } from './stageColors'

function createFallbackOptionId(label, index) {
  return `opt-${index}-${String(label || 'item').trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, '-')}`
}

function buildStages(options) {
  const seen = new Set()
  return (options || []).map((option, index) => {
    let id = option?.id || createFallbackOptionId(option?.label, index)
    if (seen.has(id)) {
      id = `${id}-${index}`
    }
    seen.add(id)
    return {
      id,
      label: option.label,
      color: option.color || stageColors[index % stageColors.length],
    }
  })
}

export function optionsToProcessRecord(options, activeKey) {
  const stages = buildStages(options)
  if (!activeKey) {
    return { stages, currentStageId: '' }
  }
  const match = stages.find((stage) => stage.id === activeKey)
    || stages.find((stage) => stage.label === activeKey)
  return {
    stages,
    currentStageId: match?.id || '',
  }
}

export const PROCESS_EMPTY_LABEL = ''

export function isReservedPlaceholderLabel(label) {
  return !String(label || '').trim()
}

export function filterWorkflowStageList(stages) {
  return (stages || []).filter((stage) => String(stage?.label || '').trim())
}

export function resolveListColumnLabel(value, options) {
  if (value && (options || []).some((option) => option.label === value)) return value
  return options?.[0]?.label || ''
}

export function resolveProcessActiveStage(record) {
  const stages = record?.stages || []
  const selectedStages = (record?.selectedStageIds || [])
    .map((stageId) => stages.find((stage) => stage.id === stageId))
    .filter(Boolean)
  if (selectedStages.length > 0) return selectedStages[0]
  if (record?.currentStageId) {
    const byId = stages.find((stage) => stage.id === record.currentStageId)
    if (byId) return byId
  }
  return stages[0] || null
}

export function optionsToTagsRecord(options, quoteTags = []) {
  const stages = buildStages(options)
  const tagKeys = new Set((quoteTags || []).map((tag) => tag.toLocaleLowerCase('tr-TR')))
  const selectedStageIds = stages
    .filter((stage) => tagKeys.has(stage.label.toLocaleLowerCase('tr-TR')))
    .map((stage) => stage.id)
  const firstSelected = stages.find((stage) => selectedStageIds.includes(stage.id))
  return {
    stages,
    currentStageId: firstSelected?.id || '',
    selectedStageIds,
  }
}

export function processRecordToOptions(stages) {
  return (stages || []).map(({ id, label, color }) => ({
    ...(id ? { id } : {}),
    label,
    color,
  }))
}

export function matchProcessOption(option, stage) {
  if (!option || !stage) return false
  if (option.id && stage.id && option.id === stage.id) return true
  return option.label === stage.label
}

export function mapProcessOptions(options, stage, mapper) {
  return (options || []).map((option) => (
    matchProcessOption(option, stage) ? mapper(option) : option
  ))
}
