import { assigneeOptions } from './crmMeta'
import {
  getCrmProcessTemplates,
  getCrmActiveProcessStep,
  getCrmProcessCountdownWindow,
  isCrmProcessCompleted,
  normalizeProcessTrack,
} from './crmProcessHelpers'

const filterAllOption = { label: 'Tümü', color: 'bg-gray-500' }

export const CRM_PROCESS_FILTER_OPTIONS = ['active', 'done', 'all']
export const DEFAULT_CRM_PROCESS_FILTER = 'all'
const CRM_PROCESS_FILTER_STORAGE_KEY = 'bach-crm-process-filter'

export function readCrmProcessFilter() {
  try {
    const saved = localStorage.getItem(CRM_PROCESS_FILTER_STORAGE_KEY)
    if (CRM_PROCESS_FILTER_OPTIONS.includes(saved)) return saved
  } catch {
    // depolama kapalı
  }
  return DEFAULT_CRM_PROCESS_FILTER
}

export function saveCrmProcessFilter(filterId) {
  if (!CRM_PROCESS_FILTER_OPTIONS.includes(filterId)) return
  try {
    localStorage.setItem(CRM_PROCESS_FILTER_STORAGE_KEY, filterId)
  } catch {
    // depolama kapalı
  }
}

export const CRM_WHATSAPP_FILTER_OPTIONS = [
  filterAllOption,
  { label: 'Gönderildi', color: 'bg-cyan-500' },
  { label: 'Gönderilmedi', color: 'bg-gray-500' },
]

export const CRM_OVERDUE_FILTER_OPTIONS = [
  filterAllOption,
  { label: 'Gecikenler', color: 'bg-red-500' },
]

export function createDefaultCrmProcessFilters() {
  return {
    dateFrom: '',
    dateTo: '',
    timeFrom: '',
    timeTo: '',
    includeTime: false,
    assignee: 'Tümü',
    template: 'Tümü',
    stage: 'Tümü',
    whatsapp: 'Tümü',
    overdue: 'Tümü',
  }
}

export function getCrmAssigneeFilterOptions() {
  return [filterAllOption, ...assigneeOptions]
}

export function getCrmTemplateFilterOptions() {
  return [
    filterAllOption,
    ...Object.values(getCrmProcessTemplates()).map((template) => ({
      label: template.label,
      color: 'bg-violet-500',
    })),
  ]
}

export function getCrmStageFilterOptions() {
  const labels = new Set()
  Object.values(getCrmProcessTemplates()).forEach((template) => {
    template.stages.forEach((stage) => labels.add(stage.label))
  })
  return [
    filterAllOption,
    ...Array.from(labels)
      .sort((left, right) => left.localeCompare(right, 'tr'))
      .map((label) => ({ label, color: 'bg-blue-500' })),
  ]
}

function parseMinutes(value) {
  if (!value) return null
  const [hour = '0', minute = '0'] = value.split(':')
  return Number(hour) * 60 + Number(minute)
}

export function getCrmBoardEntryTime(entry) {
  const { kind, record } = entry
  if (kind === 'note') return record.timeFrom || record.time || ''
  if (kind === 'task') return ''
  return record.startTime || record.time || ''
}

function matchesDate(entry, filters) {
  const date = getCrmBoardEntryDate(entry)
  if (filters.dateFrom && (!date || date < filters.dateFrom)) return false
  if (filters.dateTo && (!date || date > filters.dateTo)) return false

  if (!filters.includeTime || (!filters.timeFrom && !filters.timeTo)) {
    return true
  }

  const time = getCrmBoardEntryTime(entry)
  if (!time) return true

  const entryMinutes = parseMinutes(time)
  if (entryMinutes == null) return true

  if (filters.timeFrom && date === filters.dateFrom) {
    const fromMinutes = parseMinutes(filters.timeFrom)
    if (fromMinutes != null && entryMinutes < fromMinutes) return false
  }

  if (filters.timeTo && date === filters.dateTo) {
    const toMinutes = parseMinutes(filters.timeTo)
    if (toMinutes != null && entryMinutes > toMinutes) return false
  }

  return true
}

export function getCrmBoardEntryDate(entry) {
  const { kind, record } = entry
  if (kind === 'note') return record.dateFrom || record.date || ''
  if (kind === 'task') return record.dueDate || ''
  return record.date || ''
}

export function isCrmBoardEntryOverdue(entry) {
  const { kind, record } = entry
  const today = new Date().toISOString().slice(0, 10)

  if (kind === 'note') {
    const date = record.dateFrom || record.date
    return Boolean(date && date < today)
  }

  if (kind === 'task') {
    return record.status !== 'Tamamlandı' && Boolean(record.dueDate && record.dueDate < today)
  }

  if (isCrmProcessCompleted(record, kind)) return false
  const window = getCrmProcessCountdownWindow(record, kind)
  if (!window) return false
  return Date.now() > window.end.getTime()
}

export function hasCrmBoardWhatsAppSent(entry) {
  if (entry.kind === 'note') return false
  const { record, kind } = entry
  const active = getCrmActiveProcessStep(record, kind)
  if (!active) return false
  const track = normalizeProcessTrack(record, kind)
  return (track.notifications || []).some((item) => item.stageId === active.id)
}

export function buildCrmNoteBoardEntries(notes = []) {
  return notes.map((record) => ({
    id: record.id,
    kind: 'note',
    record,
    template: { id: 'note', label: 'Not' },
    sortKey: `${record.dateFrom || record.date || ''}${record.timeFrom || record.time || ''}`,
  }))
}

export function filterCrmBoardEntries(entries, filters, { searchQuery = '', processFilter = DEFAULT_CRM_PROCESS_FILTER } = {}) {
  const query = searchQuery.trim().toLowerCase()

  return entries.filter((entry) => {
    if (entry.kind !== 'note') {
      const terminalId = entry.template.stages?.find((stage) => stage.isTerminal)?.id
      const isTerminal = entry.record.processTrack?.currentStageId === terminalId
      if (processFilter === 'active' && isTerminal) return false
      if (processFilter === 'done' && !isTerminal) return false
    } else if (processFilter === 'done') {
      return false
    }

    if (filters.assignee !== 'Tümü' && entry.record.assignee !== filters.assignee) return false

    if (entry.kind !== 'note') {
      if (filters.template !== 'Tümü' && entry.template.label !== filters.template) return false
      const activeStage = getCrmActiveProcessStep(entry.record, entry.kind)
      if (filters.stage !== 'Tümü' && activeStage?.label !== filters.stage) return false
    }

    if (filters.whatsapp === 'Gönderildi' && !hasCrmBoardWhatsAppSent(entry)) return false
    if (filters.whatsapp === 'Gönderilmedi' && hasCrmBoardWhatsAppSent(entry)) return false

    if (filters.overdue === 'Gecikenler' && !isCrmBoardEntryOverdue(entry)) return false

    if (!matchesDate(entry, filters)) return false

    if (query) {
      const haystack = [
        entry.record.title,
        entry.record.customer,
        entry.record.contact,
        entry.record.assignee,
        entry.record.content,
        entry.template?.label,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }

    return true
  })
}
