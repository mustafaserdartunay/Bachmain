import { stageColors } from '../components/DocumentEditor/stageColors'
import { getCrmSoftStyleForColor } from './crmStageStyles'

const STORAGE_KEY = 'erlenbox-crm-process-templates'
const REMOVED_STORAGE_KEY = 'erlenbox-crm-process-templates-removed'

function loadRemovedTemplateIds() {
  try {
    const raw = localStorage.getItem(REMOVED_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
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

function createStage(id, label, index, extra = {}) {
  return {
    id,
    label,
    color: stageColors[index % stageColors.length],
    note: '',
    whatsappKey: extra.whatsappKey || 'waiting',
    showsSchedule: Boolean(extra.showsSchedule),
    isTerminal: Boolean(extra.isTerminal),
  }
}

export function getDefaultRawCrmProcessTemplates() {
  return {
    genel: {
      id: 'genel',
      label: 'Genel',
      stages: [
        { id: 'g-bekliyor', label: 'Bekliyor', whatsappKey: 'waiting', showsSchedule: false, isTerminal: false },
        { id: 'g-planlandi', label: 'Planlandı', whatsappKey: 'planned', showsSchedule: true, isTerminal: false },
        { id: 'g-devam', label: 'Devam Ediyor', whatsappKey: 'started', showsSchedule: false, isTerminal: false },
        { id: 'g-tamamlandi', label: 'Tamamlandı', whatsappKey: 'ready', showsSchedule: false, isTerminal: true },
      ],
    },
    numune: {
      id: 'numune',
      label: 'Numune',
      stages: [
        { id: 'n-bekliyor', label: 'Bekliyor', whatsappKey: 'waiting', showsSchedule: false, isTerminal: false },
        { id: 'n-hazirlaniyor', label: 'Hazırlanıyor', whatsappKey: 'started', showsSchedule: false, isTerminal: false },
        { id: 'n-gonderildi', label: 'Gönderildi', whatsappKey: 'planned', showsSchedule: false, isTerminal: false },
        { id: 'n-tamamlandi', label: 'Tamamlandı', whatsappKey: 'ready', showsSchedule: false, isTerminal: true },
      ],
    },
    ziyaret: {
      id: 'ziyaret',
      label: 'Ziyaret',
      stages: [
        { id: 'z-bekliyor', label: 'Bekliyor', whatsappKey: 'waiting', showsSchedule: false, isTerminal: false },
        { id: 'z-planlandi', label: 'Planlandı', whatsappKey: 'planned', showsSchedule: true, isTerminal: false },
        { id: 'z-gidildi', label: 'Gidildi', whatsappKey: 'started', showsSchedule: false, isTerminal: false },
        { id: 'z-tamamlandi', label: 'Tamamlandı', whatsappKey: 'ready', showsSchedule: false, isTerminal: true },
      ],
    },
    toplanti: {
      id: 'toplanti',
      label: 'Toplantı',
      stages: [
        { id: 't-bekliyor', label: 'Bekliyor', whatsappKey: 'waiting', showsSchedule: false, isTerminal: false },
        { id: 't-planlandi', label: 'Planlandı', whatsappKey: 'planned', showsSchedule: true, isTerminal: false },
        { id: 't-yapildi', label: 'Yapıldı', whatsappKey: 'started', showsSchedule: false, isTerminal: false },
        { id: 't-tamamlandi', label: 'Tamamlandı', whatsappKey: 'ready', showsSchedule: false, isTerminal: true },
      ],
    },
    teklif: {
      id: 'teklif',
      label: 'Teklif',
      stages: [
        { id: 'tk-bekliyor', label: 'Bekliyor', whatsappKey: 'waiting', showsSchedule: false, isTerminal: false },
        { id: 'tk-hazirlaniyor', label: 'Hazırlanıyor', whatsappKey: 'started', showsSchedule: false, isTerminal: false },
        { id: 'tk-gonderildi', label: 'Gönderildi', whatsappKey: 'planned', showsSchedule: false, isTerminal: false },
        { id: 'tk-onaylandi', label: 'Onaylandı', whatsappKey: 'ready', showsSchedule: false, isTerminal: true },
      ],
    },
    tahsilat: {
      id: 'tahsilat',
      label: 'Tahsilat',
      stages: [
        { id: 'th-bekliyor', label: 'Bekliyor', whatsappKey: 'waiting', showsSchedule: false, isTerminal: false },
        { id: 'th-takipte', label: 'Takipte', whatsappKey: 'started', showsSchedule: false, isTerminal: false },
        { id: 'th-tamamlandi', label: 'Tamamlandı', whatsappKey: 'ready', showsSchedule: false, isTerminal: true },
      ],
    },
  }
}

function inferStageMeta(stage, index, total) {
  const label = String(stage.label || '').toLocaleLowerCase('tr-TR')
  const isLast = index === total - 1
  return {
    whatsappKey: stage.whatsappKey
      || (index === 0 ? 'waiting' : isLast ? 'ready' : label.includes('plan') ? 'planned' : 'started'),
    showsSchedule: stage.showsSchedule ?? label.includes('plan'),
    isTerminal: stage.isTerminal ?? isLast,
  }
}

function sanitizeStage(stage, index, total) {
  const meta = inferStageMeta(stage, index, total)
  return {
    note: '',
    ...stage,
    ...meta,
    label: String(stage.label || '').trim(),
    color: stage.color || stageColors[index % stageColors.length],
  }
}

function sanitizeTemplate(template) {
  const stages = (template.stages || [])
    .filter((stage) => String(stage?.label || '').trim())
    .map((stage, index, list) => sanitizeStage(stage, index, list.length))

  return {
    id: template.id,
    label: String(template.label || template.id || '').trim(),
    stages: stages.length ? stages : getDefaultRawCrmProcessTemplates()[template.id]?.stages || [],
  }
}

function mergeWithDefaults(parsed) {
  const defaults = getDefaultRawCrmProcessTemplates()
  const removed = new Set(loadRemovedTemplateIds())
  const source = parsed && typeof parsed === 'object' ? parsed : {}
  const merged = {}

  Object.entries(defaults).forEach(([id, template]) => {
    if (!removed.has(id)) {
      merged[id] = sanitizeTemplate(template)
    }
  })

  Object.entries(source).forEach(([id, template]) => {
    if (removed.has(id)) return
    merged[id] = sanitizeTemplate({
      ...defaults[id],
      ...template,
      id,
      stages: Array.isArray(template?.stages) ? template.stages : defaults[id]?.stages || [],
    })
  })

  return merged
}

export function enrichCrmStage(stage, index = 0) {
  const softStyle = getCrmSoftStyleForColor(stage.color, index)
  return {
    ...stage,
    color: softStyle.accent,
    softStyle,
  }
}

export function enrichCrmTemplate(template) {
  return {
    ...template,
    stages: (template.stages || []).map((stage, index) => enrichCrmStage(stage, index)),
  }
}

export function loadRawCrmProcessTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return mergeWithDefaults(null)
    return mergeWithDefaults(JSON.parse(raw))
  } catch {
    return mergeWithDefaults(null)
  }
}

export function loadCrmProcessTemplates() {
  const raw = loadRawCrmProcessTemplates()
  return Object.fromEntries(
    Object.entries(raw).map(([id, template]) => [id, enrichCrmTemplate(template)]),
  )
}

export function saveRawCrmProcessTemplates(templates) {
  const next = mergeWithDefaults(templates)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('bach:crm-process-templates-updated'))
  return next
}

export function getCrmTemplateList() {
  return Object.values(loadRawCrmProcessTemplates()).map((template) => ({
    id: template.id,
    label: template.label,
  }))
}

export function updateCrmTemplateStages(templateId, stages) {
  const current = loadRawCrmProcessTemplates()
  const template = current[templateId]
  if (!template) return current

  const next = {
    ...current,
    [templateId]: sanitizeTemplate({
      ...template,
      stages,
    }),
  }
  return saveRawCrmProcessTemplates(next)
}

export function addCrmProcessTemplate(label) {
  const clean = String(label || '').trim()
  if (!clean) return loadRawCrmProcessTemplates()

  const current = loadRawCrmProcessTemplates()
  const id = `crm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const next = {
    ...current,
    [id]: {
      id,
      label: clean,
      stages: [createStage(`${id}-wait`, 'Beklemede', 0, { whatsappKey: 'waiting' })],
    },
  }
  return saveRawCrmProcessTemplates(next)
}

export function removeCrmProcessTemplate(templateId) {
  const current = loadRawCrmProcessTemplates()
  if (!current[templateId] || Object.keys(current).length <= 1) return current

  markTemplateRemoved(templateId)
  const next = { ...current }
  delete next[templateId]
  return saveRawCrmProcessTemplates(next)
}

export function renameCrmProcessTemplate(templateId, label) {
  const clean = String(label || '').trim()
  if (!clean) return loadRawCrmProcessTemplates()
  const current = loadRawCrmProcessTemplates()
  if (!current[templateId]) return current
  return saveRawCrmProcessTemplates({
    ...current,
    [templateId]: { ...current[templateId], label: clean },
  })
}

export const CRM_STAGE_COLORS = stageColors
