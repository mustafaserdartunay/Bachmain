import { getCrmActiveProcessStep, getCrmProcessSteps } from '../../utils/crmProcessHelpers'
import { getCustomerDisplay } from '../../utils/customerDisplay'
import { getModuleCatalog } from './moduleStages'

const VIEW_TO_MODULE = {
  all: 'crm',
  note: 'notes',
  task: 'tasks',
  appointment: 'appointments',
}

export function crmViewToModuleId(view = 'all') {
  return VIEW_TO_MODULE[view] || 'crm'
}

function recordTitle(entry) {
  const r = entry.record || {}
  if (entry.kind === 'note') return r.title || r.content?.slice?.(0, 80) || 'Not'
  return r.title || r.subject || r.customerName || 'Kayıt'
}

function progressFromEntry(entry) {
  if (entry.kind === 'note') return entry.record?.completed ? 100 : 0
  const steps = getCrmProcessSteps(entry.record, entry.kind)
  if (!steps.length) return 0
  const active = steps.findIndex((s) => s.isActive)
  if (active < 0) return 0
  return Math.round((active / Math.max(1, steps.length - 1)) * 100)
}

/** Map CRM board entries → ProcessItem[] */
export function crmEntriesToProcessItems(entries = []) {
  return entries.map((entry) => {
    const record = entry.record || {}
    const active = entry.kind === 'note'
      ? null
      : getCrmActiveProcessStep(record, entry.kind)
    const display =
      record.customer && typeof record.customer === 'object'
        ? getCustomerDisplay(record.customer)
        : null
    const customer =
      display?.companyTitle ||
      display?.brandShortName ||
      record.customerName ||
      (typeof record.customer === 'string' ? record.customer : '') ||
      ''
    const stageLabel =
      entry.kind === 'note'
        ? record.completed
          ? 'Arşiv'
          : record.color || 'Fikirler'
        : active?.label || record.status || '—'

    return {
      id: entry.id,
      title: recordTitle(entry),
      stageId: active?.id || (entry.kind === 'note' ? (record.completed ? 'archive' : 'ideas') : 'todo'),
      status: stageLabel,
      kind: entry.kind,
      company: record.company || record.firm || display?.brandShortName || '',
      customer,
      assignee: record.assignee || record.owner || '',
      tags: Array.isArray(record.tags) ? record.tags : record.tag ? [record.tag] : [],
      priority: record.priority || '',
      dueDate: record.dueDate || record.date || record.dateFrom || '',
      startDate: record.startDate || record.date || record.dateFrom || record.createdAt || '',
      endDate: record.endDate || record.dueDate || record.dateTo || '',
      progress: progressFromEntry(entry),
      fileCount: Array.isArray(record.stagePhotos)
        ? record.stagePhotos.length
        : Array.isArray(record.files)
          ? record.files.length
          : 0,
      commentCount: Array.isArray(record.comments) ? record.comments.length : 0,
      createdAt: record.createdAt || '',
      raw: entry,
    }
  })
}

/** Prefer live template stages from entries; fall back to module catalog. */
export function deriveCrmKanbanStages(entries = [], moduleId = 'crm') {
  const byId = new Map()
  for (const entry of entries) {
    if (entry.kind === 'note') continue
    for (const stage of entry.template?.stages || []) {
      if (!byId.has(stage.id)) {
        byId.set(stage.id, { id: stage.id, label: stage.label })
      }
    }
  }
  if (byId.size) return [...byId.values()]

  if (moduleId === 'notes' || entries.every((e) => e.kind === 'note')) {
    return getModuleCatalog('notes').stages
  }
  return getModuleCatalog(moduleId).stages
}

export function resolveCrmStageChange(entry, targetStageId) {
  if (!entry || entry.kind === 'note') return null
  const stages = entry.template?.stages || []
  const byId = stages.find((s) => s.id === targetStageId)
  if (byId) return byId.id
  const byLabel = stages.find((s) => s.label === targetStageId)
  return byLabel?.id || null
}
