import {
  getCrmProcessTemplates,
  getCrmTemplateByLabel,
  getCrmTemplateStage,
  resolveCrmProcessTemplate,
} from './crmProcessStages'

const CRM_DATETIME_SEPARATOR = ' · '

function nowStamp() {
  const now = new Date()
  const date = now.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const time = now.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${date}${CRM_DATETIME_SEPARATOR}${time}`
}

function normalizeCrmDateTimeLabel(value) {
  if (!value || value === '—') return value
  const text = String(value).trim()
  if (text.includes('·')) {
    return text.replace(/\s*·\s*/g, CRM_DATETIME_SEPARATOR)
  }
  const match = text.match(/^(\d{1,2}\.\d{1,2}\.\d{4})[,\s]+(\d{1,2}:\d{2})$/)
  if (match) {
    return `${match[1]}${CRM_DATETIME_SEPARATOR}${match[2]}`
  }
  return text
}

function formatScheduleAt(record) {
  const date = record?.date || record?.dueDate
  if (!date) return ''
  const time = record?.startTime || record?.time || ''
  const dayLabel = new Date(`${date}T12:00:00`).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
  })
  return time ? `${dayLabel} · ${time}` : dayLabel
}

function inferInitialStageId(record, template, kind) {
  const stages = template.stages
  const terminal = stages.find((stage) => stage.isTerminal)?.id || stages[stages.length - 1]?.id
  const waitId = stages[0]?.id
  const plannedId = stages.find((stage) => stage.showsSchedule)?.id || stages[1]?.id
  const startedId = stages.find((stage) => stage.label === 'Başladı' || stage.label === 'Takipte' || stage.label === 'Hazırlanıyor')?.id
    || stages[2]?.id

  const byStageLabel = stages.find((stage) => stage.label === record?.status)
  if (byStageLabel) return byStageLabel.id

  if (record?.status === 'Tamamlandı') return terminal
  if (kind === 'task') {
    if (record?.status === 'Bekliyor') return waitId
    if (record?.status === 'Devam Ediyor') return startedId || plannedId
    if (record?.status === 'Tamamlandı') return terminal
  }
  if (kind === 'appointment') {
    if (record?.status === 'Tamamlandı') return terminal
    if (record?.status === 'Onaylandı') return startedId || plannedId
    const today = new Date().toISOString().slice(0, 10)
    if (record?.date && record.date > today) return plannedId
    if (record?.date && record.date <= today) return startedId || plannedId
  }
  return waitId
}

export function createEmptyProcessTrack(record, kind = 'appointment') {
  const template = resolveCrmProcessTemplate(record, kind)
  const currentStageId = inferInitialStageId(record, template, kind)
  const reachedAt = nowStamp()
  const stageHistory = { [currentStageId]: { reachedAt } }
  const plannedStage = template.stages.find((stage) => stage.showsSchedule)
  if (plannedStage && currentStageId === plannedStage.id) {
    stageHistory[plannedStage.id] = {
      reachedAt,
      scheduledAt: formatScheduleAt(record),
    }
  }
  return {
    templateId: template.id,
    currentStageId,
    stageHistory,
    notifications: [],
  }
}

export function normalizeProcessTrack(record, kind = 'appointment') {
  const template = resolveCrmProcessTemplate(record, kind)
  const track = record?.processTrack
  if (!track?.currentStageId) {
    return createEmptyProcessTrack(record, kind)
  }
  const stageHistory = { ...(track.stageHistory || {}) }
  const currentStage = getCrmTemplateStage(template, track.currentStageId)
  if (currentStage?.showsSchedule && !stageHistory[track.currentStageId]?.scheduledAt) {
    stageHistory[track.currentStageId] = {
      ...stageHistory[track.currentStageId],
      scheduledAt: formatScheduleAt(record),
    }
  }
  return {
    templateId: template.id,
    currentStageId: track.currentStageId,
    stageHistory,
    notifications: Array.isArray(track.notifications) ? track.notifications : [],
  }
}

export function getCrmStageRingColor(step) {
  return step?.softStyle?.stroke || '#64748b'
}

export function getCrmProcessRingStage(steps = [], completed = false) {
  if (!steps.length) return null
  if (completed) return steps[steps.length - 1]
  return steps.find((step) => step.isActive) || steps[0]
}

export function getCrmProcessSteps(record, kind = 'appointment') {
  const template = resolveCrmProcessTemplate(record, kind)
  const track = normalizeProcessTrack(record, kind)
  const activeIndex = template.stages.findIndex((stage) => stage.id === track.currentStageId)

  return template.stages.map((stage, index) => {
    const history = track.stageHistory?.[stage.id] || {}
    const stageNotifications = (track.notifications || []).filter((entry) => entry.stageId === stage.id)
    const notificationCount = stageNotifications.filter((entry) => !entry.channel || entry.channel === 'whatsapp').length
    const emailNotificationCount = stageNotifications.filter((entry) => entry.channel === 'email').length
    return {
      id: stage.id,
      label: stage.label,
      color: stage.color,
      softStyle: stage.softStyle,
      whatsappKey: stage.whatsappKey,
      showsSchedule: stage.showsSchedule,
      isTerminal: stage.isTerminal,
      isActive: index === activeIndex,
      isComplete: activeIndex >= 0 && index < activeIndex,
      reachedAt: history.reachedAt || '',
      scheduledAt: history.scheduledAt || '',
      notificationCount,
      emailNotificationCount,
    }
  })
}

export function getCrmActiveProcessStep(record, kind = 'appointment') {
  return getCrmProcessSteps(record, kind).find((step) => step.isActive) || null
}

export function advanceCrmProcessStage(record, stageId, kind = 'appointment') {
  const template = resolveCrmProcessTemplate(record, kind)
  const track = normalizeProcessTrack(record, kind)
  const stage = getCrmTemplateStage(template, stageId)
  if (!stage) return record

  const reachedAt = nowStamp()
  const stageHistory = { ...track.stageHistory }
  stageHistory[stageId] = {
    ...stageHistory[stageId],
    reachedAt,
    ...(stage.showsSchedule ? { scheduledAt: formatScheduleAt(record) } : {}),
  }

  let nextStatus = record.status
  if (kind === 'task') {
    nextStatus = stage.label
  }
  if (kind === 'appointment') {
    if (stage.isTerminal) nextStatus = 'Tamamlandı'
    else if (stage.label === 'Başladı') nextStatus = 'Onaylandı'
    else if (stage.showsSchedule) nextStatus = 'Planlandı'
  }

  return {
    ...record,
    status: nextStatus,
    processTrack: {
      ...track,
      templateId: template.id,
      currentStageId: stageId,
      stageHistory,
    },
  }
}

export function recordCrmProcessNotification(record, stageId, kind = 'appointment', channel = 'whatsapp') {
  const track = normalizeProcessTrack(record, kind)
  return {
    ...record,
    processTrack: {
      ...track,
      notifications: [
        ...(track.notifications || []),
        { stageId, sentAt: nowStamp(), channel },
      ],
    },
  }
}

export function getCrmProcessScheduleHint(record, kind = 'appointment') {
  const active = getCrmActiveProcessStep(record, kind)
  if (!active) return null
  if (active.showsSchedule && active.scheduledAt) {
    return `${active.scheduledAt} tarihinde başlayacak`
  }
  if (active.isTerminal && active.reachedAt) {
    return `${active.reachedAt} tarihinde tamamlandı`
  }
  if (active.reachedAt && active.label === 'Başladı') {
    return `${active.reachedAt} tarihinde başladı`
  }
  if (active.label === 'Beklemede') {
    return 'Süreç beklemede'
  }
  return active.reachedAt ? `${active.reachedAt} · ${active.label}` : active.label
}

function formatCrmIsoDate(value) {
  if (!value) return ''
  return new Date(`${value}T12:00:00`).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatCrmScheduleEnd(record) {
  const date = record?.date || record?.dueDate
  if (!date) return ''
  const dayLabel = formatCrmIsoDate(date)
  const time = record?.endTime || record?.startTime || ''
  return time ? `${dayLabel}${CRM_DATETIME_SEPARATOR}${time}` : dayLabel
}

function parseTurkishDateTime(value) {
  if (!value || value === '—') return null
  const normalized = String(value).replace(/\s*·\s*/g, ' ')
  const match = normalized.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/)
  if (!match) return null
  const [, day, month, year, hour = '0', minute = '0'] = match
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
}

function parseScheduleDateTime(record) {
  const date = record?.date || record?.dueDate
  if (!date) return null
  const time = record?.endTime || record?.startTime || '23:59'
  const [hour = '23', minute = '59'] = time.split(':')
  return new Date(`${date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`)
}

/** Süreç başlangıç anı */
export function getCrmProcessStartDate(record, kind = 'appointment') {
  const fromLabel = parseTurkishDateTime(getCrmProcessStartLabel(record, kind))
  if (fromLabel) return fromLabel
  if (record?.date && record?.startTime) {
    const [hour, minute = '0'] = record.startTime.split(':')
    return new Date(`${record.date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`)
  }
  if (record?.createdAt) return new Date(`${record.createdAt}T00:00:00`)
  return null
}

/** Planlanan veya gerçekleşen bitiş anı */
export function getCrmProcessEndDate(record, kind = 'appointment') {
  const steps = getCrmProcessSteps(record, kind)
  const terminal = steps.find((step) => step.isTerminal)
  if (terminal?.isComplete && terminal.reachedAt) {
    return parseTurkishDateTime(terminal.reachedAt) || parseScheduleDateTime(record)
  }
  return parseScheduleDateTime(record)
}

/** Geri sayım penceresi — başlangıç ve bitiş Date nesneleri */
export function getCrmProcessCountdownWindow(record, kind = 'appointment') {
  const end = getCrmProcessEndDate(record, kind)
  if (!end) return null

  let start = getCrmProcessStartDate(record, kind)
  if (!start || start >= end) {
    const fallbackDate = record?.createdAt || record?.date || record?.dueDate
    start = fallbackDate ? new Date(`${fallbackDate}T00:00:00`) : new Date(end.getTime() - 86400000)
  }
  if (start >= end) return null
  return { start, end }
}

/** Kayıt oluşturulma tarihi */
export function getCrmProcessCreatedLabel(record) {
  return formatCrmIsoDate(record?.createdAt) || '—'
}

/** Sürecin fiilen başladığı an (ilk bekleme dışı aşama) */
export function getCrmProcessStartLabel(record, kind = 'appointment') {
  const template = resolveCrmProcessTemplate(record, kind)
  const steps = getCrmProcessSteps(record, kind)
  const waitId = template.stages[0]?.id
  const startedStep = steps.find((step) => step.id !== waitId && step.reachedAt)
  if (startedStep?.reachedAt) return normalizeCrmDateTimeLabel(startedStep.reachedAt)
  const firstReached = steps.find((step) => step.reachedAt)
  return normalizeCrmDateTimeLabel(firstReached?.reachedAt) || '—'
}

/** Tamamlanma tarihi veya planlanan bitiş */
export function getCrmProcessEndLabel(record, kind = 'appointment') {
  const steps = getCrmProcessSteps(record, kind)
  const terminal = steps.find((step) => step.isTerminal)
  if (terminal?.isComplete && terminal.reachedAt) {
    return normalizeCrmDateTimeLabel(terminal.reachedAt)
  }
  return normalizeCrmDateTimeLabel(formatCrmScheduleEnd(record)) || '—'
}

export function isCrmProcessCompleted(record, kind = 'appointment') {
  const terminal = getCrmProcessSteps(record, kind).find((step) => step.isTerminal)
  return Boolean(terminal?.isComplete)
}

export function isTaskCompleted(record) {
  if (isCrmProcessCompleted(record, 'task')) return true
  const template = resolveCrmProcessTemplate(record, 'task')
  const terminal = template.stages.find((stage) => stage.isTerminal)
  if (terminal && record?.status === terminal.label) return true
  return record?.status === 'Tamamlandı'
}

export function resolveTaskFormStatus(record, categoryLabel) {
  const template = getCrmTemplateByLabel(categoryLabel) || resolveCrmProcessTemplate(record, 'task')
  const byLabel = template.stages.find((stage) => stage.label === record?.status)
  if (byLabel) return byLabel.label
  const stageId = inferInitialStageId(record, template, 'task')
  return getCrmTemplateStage(template, stageId)?.label || template.stages[0]?.label || ''
}

export function getTaskToggleStatuses(record) {
  const template = resolveCrmProcessTemplate(record, 'task')
  const first = template.stages[0]
  const terminal = template.stages.find((stage) => stage.isTerminal) || template.stages[template.stages.length - 1]
  return {
    open: first?.label || 'Beklemede',
    done: terminal?.label || 'Tamamlandı',
  }
}

export function toggleTaskCompletionStatus(record) {
  const { open, done } = getTaskToggleStatuses(record)
  return isTaskCompleted(record) ? open : done
}

export function applyTaskStatusToProcessTrack(record) {
  const template = resolveCrmProcessTemplate(record, 'task')
  const stageId = inferInitialStageId(record, template, 'task')
  const stageIndex = template.stages.findIndex((stage) => stage.id === stageId)
  const stamp = nowStamp()
  const stageHistory = {}
  template.stages.forEach((stage, index) => {
    if (index <= stageIndex) {
      stageHistory[stage.id] = {
        reachedAt: record.processTrack?.stageHistory?.[stage.id]?.reachedAt || stamp,
        ...(stage.showsSchedule && index === stageIndex
          ? { scheduledAt: formatScheduleAt(record) }
          : {}),
      }
    }
  })
  return {
    templateId: template.id,
    currentStageId: stageId,
    stageHistory,
    notifications: record.processTrack?.notifications || [],
  }
}

export function buildCrmProcessRecords(tasks = [], appointments = []) {
  const records = [
    ...appointments
      .filter((item) => item.status !== 'İptal')
      .map((record) => ({
        id: record.id,
        kind: 'appointment',
        record: { ...record, processTrack: normalizeProcessTrack(record, 'appointment') },
        template: resolveCrmProcessTemplate(record, 'appointment'),
        sortKey: `${record.date || ''}${record.startTime || ''}`,
      })),
    ...tasks.map((record) => ({
      id: record.id,
      kind: 'task',
      record: { ...record, processTrack: normalizeProcessTrack(record, 'task') },
      template: resolveCrmProcessTemplate(record, 'task'),
      sortKey: record.dueDate || '',
    })),
  ]

  return records.sort((left, right) => {
    const leftCreated = left.record.createdAt || left.sortKey || ''
    const rightCreated = right.record.createdAt || right.sortKey || ''
    const createdCompare = rightCreated.localeCompare(leftCreated)
    if (createdCompare !== 0) return createdCompare
    const leftTerminal = getCrmActiveProcessStep(left.record, left.kind)?.isTerminal
    const rightTerminal = getCrmActiveProcessStep(right.record, right.kind)?.isTerminal
    if (leftTerminal !== rightTerminal) return leftTerminal ? 1 : -1
    return String(left.sortKey).localeCompare(String(right.sortKey))
  })
}

export { CRM_PROCESS_TEMPLATES, getCrmProcessTemplates, resolveCrmProcessTemplate, getCrmTemplateByLabel, getCrmTemplateCategoryOptions, getCrmTemplateStageOptions } from './crmProcessStages'
