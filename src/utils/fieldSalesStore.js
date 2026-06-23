import { loadPersonnel } from './personnelStore'
import { readOptionLists } from './customerMeta'
import { appendActivityEntry } from './activityArchiveStore'

const STORAGE_KEY = 'erlenbox-field-sales'
const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export const FIELD_SALES_DAYS = [
  { id: 'monday', label: 'Pazartesi', short: 'Pzt' },
  { id: 'tuesday', label: 'Salı', short: 'Sal' },
  { id: 'wednesday', label: 'Çarşamba', short: 'Çar' },
  { id: 'thursday', label: 'Perşembe', short: 'Per' },
  { id: 'friday', label: 'Cuma', short: 'Cum' },
  { id: 'saturday', label: 'Cumartesi', short: 'Cmt' },
  { id: 'sunday', label: 'Pazar', short: 'Paz' },
]

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function emptyWeekSchedule() {
  return Object.fromEntries(WEEK_DAYS.map((day) => [day, []]))
}

function defaultState() {
  return {
    weeklyVisits: {},
    tasks: [],
    lastRoute: null,
  }
}

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    return {
      weeklyVisits: parsed.weeklyVisits || {},
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      lastRoute: parsed.lastRoute || null,
    }
  } catch {
    return defaultState()
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent('bach:field-sales-updated'))
  return state
}

export function loadFieldSalesState() {
  return readState()
}

/** Satış temsilcileri — personel (Satış) + temsilci listesi birleşimi */
export function getFieldSalesReps() {
  const personnel = loadPersonnel()
    .filter((employee) => employee.department === 'Satış' && employee.status !== 'Ayrıldı')
    .map((employee) => ({
      id: employee.id,
      label: `${employee.firstName} ${employee.lastName}`.trim(),
      source: 'personnel',
      color: 'bg-blue-500',
    }))

  const optionReps = readOptionLists().representative
    .filter((option) => option.label !== 'Satış Ekibi')
    .map((option) => ({
      id: option.id,
      label: option.label,
      source: 'option',
      color: option.color,
    }))

  const merged = new Map()
  personnel.forEach((rep) => merged.set(rep.label.toLocaleLowerCase('tr-TR'), rep))
  optionReps.forEach((rep) => {
    const key = rep.label.toLocaleLowerCase('tr-TR')
    if (!merged.has(key)) merged.set(key, rep)
  })
  return Array.from(merged.values())
}

export function getRepSchedule(repLabel) {
  const state = readState()
  return state.weeklyVisits[repLabel] || emptyWeekSchedule()
}

export function setRepDayCustomers(repLabel, dayId, customerIds) {
  const state = readState()
  const schedule = state.weeklyVisits[repLabel] || emptyWeekSchedule()
  const next = {
    ...state,
    weeklyVisits: {
      ...state.weeklyVisits,
      [repLabel]: {
        ...schedule,
        [dayId]: customerIds,
      },
    },
  }
  return writeState(next)
}

export function toggleRepDayCustomer(repLabel, dayId, customerId) {
  const schedule = getRepSchedule(repLabel)
  const current = schedule[dayId] || []
  const nextIds = current.includes(customerId)
    ? current.filter((id) => id !== customerId)
    : [...current, customerId]
  return setRepDayCustomers(repLabel, dayId, nextIds)
}

export function loadFieldSalesTasks(repLabel) {
  const tasks = readState().tasks
  if (!repLabel) return tasks
  return tasks.filter((task) => task.repLabel === repLabel)
}

export function addFieldSalesTask({ repLabel, customerId, title, dueDate, notes = '', stageId = '', assignedBy = '', priority = 'Normal' }) {
  const state = readState()
  const task = {
    id: createId('fst'),
    repLabel,
    customerId: customerId || '',
    title: String(title || '').trim(),
    dueDate: dueDate || '',
    notes,
    stageId: stageId || '',
    assignedBy: assignedBy || '',
    priority,
    status: 'open',
    createdAt: new Date().toISOString(),
  }
  if (!task.title) return state
  return writeState({ ...state, tasks: [task, ...state.tasks] })
}

export function updateFieldSalesTask(taskId, patch) {
  const state = readState()
  return writeState({
    ...state,
    tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
  })
}

export function removeFieldSalesTask(taskId) {
  const state = readState()
  const task = state.tasks.find((item) => item.id === taskId)
  if (task) {
    appendActivityEntry({
      module: 'fieldSales',
      action: 'delete',
      entityType: 'fieldSalesTask',
      entityId: task.id,
      entityLabel: task.title || 'Saha satış görevi',
      description: `${task.title || 'Saha satış görevi'} silindi.`,
      snapshot: task,
      undo: { type: 'fieldSales.restoreTask' },
    })
  }
  return writeState({
    ...state,
    tasks: state.tasks.filter((task) => task.id !== taskId),
  })
}

export function restoreFieldSalesTask(snapshot) {
  if (!snapshot?.id) return false
  const state = readState()
  if (state.tasks.some((task) => task.id === snapshot.id)) return true
  writeState({ ...state, tasks: [snapshot, ...state.tasks] })
  return true
}

export function saveLastRoute(route) {
  const state = readState()
  return writeState({ ...state, lastRoute: route })
}

export function loadLastRoute() {
  return readState().lastRoute
}
