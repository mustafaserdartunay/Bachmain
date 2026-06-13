import { loadAppointments, loadTasks, saveAppointments, saveTasks } from './crmStore'
import {
  loadRawCrmProcessTemplates,
  removeCrmProcessTemplate,
  saveRawCrmProcessTemplates,
} from './crmProcessTemplatesStore'
import { resolveCrmProcessTemplate } from './crmProcessStages'

function findStageByIdOrLabel(stages, stageId, labelHint = '') {
  const byId = stages.find((stage) => stage.id === stageId)
  if (byId) return byId
  const clean = String(labelHint || '').trim()
  if (clean) {
    return stages.find((stage) => stage.label === clean) || null
  }
  return null
}

function migrateRecordProcessTrack(record, kind, templates) {
  const template = resolveCrmProcessTemplate(record, kind)
  const stages = template?.stages || []
  if (!stages.length) return record

  const track = record.processTrack || {}
  const legacyStage = findStageByIdOrLabel(stages, track.currentStageId)
    || stages[0]

  const stageHistory = { ...(track.stageHistory || {}) }
  const nextHistory = {}
  stages.forEach((stage) => {
    if (stageHistory[stage.id]) {
      nextHistory[stage.id] = stageHistory[stage.id]
      return
    }
    const legacyEntry = Object.entries(stageHistory).find(([oldId]) => {
      const oldStage = findStageByIdOrLabel(stages, oldId, stage.label)
      return oldStage?.id === stage.id
    })
    if (legacyEntry) {
      nextHistory[stage.id] = legacyEntry[1]
    }
  })

  const notifications = (track.notifications || []).map((entry) => {
    const stage = findStageByIdOrLabel(stages, entry.stageId)
    return stage ? { ...entry, stageId: stage.id } : entry
  }).filter((entry) => stages.some((stage) => stage.id === entry.stageId))

  return {
    ...record,
    processTrack: {
      ...track,
      templateId: template.id,
      currentStageId: legacyStage?.id || stages[0].id,
      stageHistory: nextHistory,
      notifications,
    },
  }
}

function migrateCrmRecords(templates) {
  const tasks = loadTasks().map((record) => migrateRecordProcessTrack(record, 'task', templates))
  const appointments = loadAppointments().map((record) => migrateRecordProcessTrack(record, 'appointment', templates))
  saveTasks(tasks)
  saveAppointments(appointments)
}

export function publishCrmProcessTemplates(nextTemplates) {
  const saved = saveRawCrmProcessTemplates(nextTemplates)
  migrateCrmRecords(loadRawCrmProcessTemplates())
  window.dispatchEvent(new CustomEvent('bach:crm-updated'))
  return saved
}

export function publishCrmTemplateStages(templateId, stages) {
  const current = loadRawCrmProcessTemplates()
  const template = current[templateId]
  if (!template) return current

  return publishCrmProcessTemplates({
    ...current,
    [templateId]: {
      ...template,
      stages,
    },
  })
}

export function publishCrmProcessTemplateRemoval(templateId) {
  const current = loadRawCrmProcessTemplates()
  if (!current[templateId] || Object.keys(current).length <= 1) return current

  const saved = removeCrmProcessTemplate(templateId)
  migrateCrmRecords(loadRawCrmProcessTemplates())
  window.dispatchEvent(new CustomEvent('bach:crm-updated'))
  return saved
}
