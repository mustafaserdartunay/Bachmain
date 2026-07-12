import { appendActivityEntry } from './activityArchiveStore'

const STORAGE_KEY = 'erlenbox-personnel'

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeRaw(employees) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees))
  window.dispatchEvent(new CustomEvent('bach:personnel-updated'))
}

export function loadPersonnel() {
  return readRaw() || []
}

export function savePersonnel(employees) {
  writeRaw(employees)
  return employees
}

export function getEmployeeById(employeeId) {
  return loadPersonnel().find((item) => item.id === employeeId) || null
}

export function updateEmployee(employeeId, patch) {
  const employees = loadPersonnel().map((item) => (
    item.id === employeeId ? { ...item, ...patch } : item
  ))
  savePersonnel(employees)
  return getEmployeeById(employeeId)
}

export function addEmployee(payload) {
  const employees = loadPersonnel()
  const employee = {
    id: createId('per'),
    employeeNo: payload.employeeNo || `P-${1000 + employees.length + 1}`,
    bonuses: [],
    attendance: [],
    absences: [],
    leaves: [],
    payrollHistory: [],
    documents: [],
    notes: '',
    status: 'Deneme Süreci',
    terminationDate: '',
    terminationReason: '',
    ...payload,
  }
  savePersonnel([employee, ...employees])
  return employee
}

export function appendEmployeeRecord(employeeId, field, record) {
  const employee = getEmployeeById(employeeId)
  if (!employee) return null
  const nextRecord = { id: createId(field.slice(0, 3)), ...record }
  const list = [...(employee[field] || []), nextRecord]
  return updateEmployee(employeeId, { [field]: list })
}

export function updateEmployeeRecord(employeeId, field, recordId, patch) {
  const employee = getEmployeeById(employeeId)
  if (!employee) return null
  const list = (employee[field] || []).map((item) => (
    item.id === recordId ? { ...item, ...patch } : item
  ))
  return updateEmployee(employeeId, { [field]: list })
}

export function removeEmployeeRecord(employeeId, field, recordId) {
  const employee = getEmployeeById(employeeId)
  if (!employee) return null
  const record = (employee[field] || []).find((item) => item.id === recordId)
  if (record) {
    appendActivityEntry({
      module: 'personnel',
      action: 'delete',
      entityType: field,
      entityId: recordId,
      entityLabel: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Personel kaydı',
      description: `Personel ${field} kaydı silindi.`,
      snapshot: { employeeId, field, record },
      undo: { type: 'personnel.restoreRecord' },
    })
  }
  const list = (employee[field] || []).filter((item) => item.id !== recordId)
  return updateEmployee(employeeId, { [field]: list })
}

export function terminateEmployee(employeeId, { terminationDate, terminationReason }) {
  const employee = getEmployeeById(employeeId)
  if (employee) {
    appendActivityEntry({
      module: 'personnel',
      action: 'archive',
      entityType: 'employee',
      entityId: employee.id,
      entityLabel: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Personel',
      description: `Personel ayrıldı olarak arşivlendi: ${terminationReason || 'Sebep belirtilmedi'}.`,
      snapshot: employee,
      undo: { type: 'personnel.restoreEmployeeStatus' },
    })
  }
  return updateEmployee(employeeId, {
    status: 'Ayrıldı',
    terminationDate,
    terminationReason,
  })
}

export function restoreEmployeeRecord(snapshot) {
  const { employeeId, field, record } = snapshot || {}
  if (!employeeId || !field || !record?.id) return false
  const employee = getEmployeeById(employeeId)
  if (!employee) return false
  const list = employee[field] || []
  if (!list.some((item) => item.id === record.id)) {
    updateEmployee(employeeId, { [field]: [record, ...list] })
  }
  return true
}

export function restoreEmployeeStatus(employee) {
  if (!employee?.id) return false
  updateEmployee(employee.id, employee)
  return true
}

export function rehireEmployee(employeeId, { hireDate, department, position, salary }) {
  return updateEmployee(employeeId, {
    status: 'Aktif',
    hireDate,
    department,
    position,
    salary,
    terminationDate: '',
    terminationReason: '',
  })
}

export function resetPersonnelSeed() {
  savePersonnel([])
  return []
}
