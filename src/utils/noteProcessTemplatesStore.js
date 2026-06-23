import { stageColors } from '../components/DocumentEditor/stageColors'

const STORAGE_KEY = 'erlenbox-note-process-templates'
const REMOVED_STORAGE_KEY = 'erlenbox-note-process-templates-removed'
export const NOTE_PROCESS_TEMPLATES_EVENT = 'bach:note-process-templates-updated'

function loadRemovedTemplateIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(REMOVED_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function markTemplateRemoved(templateId) {
  const removed = loadRemovedTemplateIds()
  if (removed.includes(templateId)) return
  localStorage.setItem(REMOVED_STORAGE_KEY, JSON.stringify([...removed, templateId]))
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function createStage(id, label, index, extra = {}) {
  return {
    id,
    label,
    color: stageColors[index % stageColors.length],
    note: '',
    isTerminal: Boolean(extra.isTerminal),
  }
}

function sanitizeStage(stage, index) {
  return {
    note: '',
    ...stage,
    id: stage.id || createId('note-status'),
    label: String(stage.label || '').trim(),
    color: stage.color || stageColors[index % stageColors.length],
    isTerminal: Boolean(stage.isTerminal),
  }
}

function sanitizeTemplate(template) {
  const stages = (template.stages || [])
    .filter((stage) => String(stage?.label || '').trim())
    .map((stage, index) => sanitizeStage(stage, index))

  return {
    id: template.id,
    label: String(template.label || template.id || '').trim(),
    stages,
  }
}

function mergeTemplates(parsed) {
  const removed = new Set(loadRemovedTemplateIds())
  const source = parsed && typeof parsed === 'object' ? parsed : {}
  return Object.fromEntries(
    Object.entries(source)
      .filter(([id]) => !removed.has(id))
      .map(([id, template]) => [id, sanitizeTemplate({ ...template, id })])
      .filter(([, template]) => template.label),
  )
}

export function loadRawNoteProcessTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return mergeTemplates(raw ? JSON.parse(raw) : null)
  } catch {
    return mergeTemplates(null)
  }
}

export function saveRawNoteProcessTemplates(templates) {
  const next = mergeTemplates(templates)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(NOTE_PROCESS_TEMPLATES_EVENT))
  return next
}

export function addNoteProcessTemplate(label) {
  const clean = String(label || '').trim()
  if (!clean) return loadRawNoteProcessTemplates()

  const current = loadRawNoteProcessTemplates()
  const id = createId('note-template')
  return saveRawNoteProcessTemplates({
    ...current,
    [id]: {
      id,
      label: clean,
      stages: [createStage(`${id}-waiting`, 'Beklemede', 0)],
    },
  })
}

export function updateNoteTemplateStages(templateId, stages) {
  const current = loadRawNoteProcessTemplates()
  const template = current[templateId]
  if (!template) return current
  return saveRawNoteProcessTemplates({
    ...current,
    [templateId]: {
      ...template,
      stages,
    },
  })
}

export function removeNoteProcessTemplate(templateId) {
  const current = loadRawNoteProcessTemplates()
  if (!current[templateId]) return current
  markTemplateRemoved(templateId)
  const next = { ...current }
  delete next[templateId]
  return saveRawNoteProcessTemplates(next)
}
