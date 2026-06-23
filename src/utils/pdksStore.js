import { readCompanySettings } from './companySettings'
import { getCompanyStartPoint } from './customerGeo'
import { getEmployeeById, loadPersonnel } from './personnelStore'

const STORAGE_KEY = 'erlenbox-pdks'

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function nowIso() {
  return new Date().toISOString()
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function randomToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

function encodePayload(payload) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
}

function haversineMeters(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 6371000 * 2 * Math.asin(Math.sqrt(h))
}

const DEFAULT_SHIFTS = [
  { id: 'shift-1', name: '08:00 - 18:00', start: '08:00', end: '18:00', type: 'normal', lateToleranceMin: 15, earlyLeaveToleranceMin: 15 },
  { id: 'shift-2', name: '09:00 - 19:00', start: '09:00', end: '19:00', type: 'normal', lateToleranceMin: 15, earlyLeaveToleranceMin: 15 },
  { id: 'shift-3', name: 'Gece Vardiyası', start: '22:00', end: '06:00', type: 'night', lateToleranceMin: 10, earlyLeaveToleranceMin: 10 },
  { id: 'shift-4', name: 'Esnek Vardiya', start: '09:00', end: '18:00', type: 'flex', lateToleranceMin: 30, earlyLeaveToleranceMin: 30 },
]

function defaultState() {
  const company = readCompanySettings()
  const start = getCompanyStartPoint(company)
  return {
    settings: {
      geofence: {
        lat: start.lat,
        lng: start.lng,
        radiusM: 50,
        address: company.address || start.label || '',
      },
      requireSelfie: false,
      requireGps: true,
      dynamicQrSeconds: 30,
      lateToleranceMin: 15,
      earlyLeaveToleranceMin: 15,
    },
    shifts: DEFAULT_SHIFTS,
    attendanceLogs: [],
    leaveRequests: [],
    overtimeRecords: [],
    gpsLogs: [],
    faceVerifications: [],
    notifications: [],
    auditLogs: [],
    employeeQrSecrets: {},
    dynamicQr: { token: '', expiresAt: 0 },
    tasks: [],
  }
}

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    return { ...defaultState(), ...JSON.parse(raw) }
  } catch {
    return defaultState()
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent('bach:pdks-updated'))
  return state
}

export function loadPdksState() {
  return readState()
}

export function savePdksSettings(patch) {
  const state = readState()
  return writeState({
    ...state,
    settings: { ...state.settings, ...patch, geofence: { ...state.settings.geofence, ...(patch.geofence || {}) } },
  })
}

export function getPdksSettings() {
  return readState().settings
}

export function getShifts() {
  return readState().shifts
}

export function saveShift(shift) {
  const state = readState()
  const exists = state.shifts.some((item) => item.id === shift.id)
  const shifts = exists
    ? state.shifts.map((item) => (item.id === shift.id ? shift : item))
    : [{ ...shift, id: shift.id || createId('shift') }, ...state.shifts]
  return writeState({ ...state, shifts })
}

export function deleteShift(shiftId) {
  const state = readState()
  return writeState({ ...state, shifts: state.shifts.filter((item) => item.id !== shiftId) })
}

export function appendAudit(action, detail = {}) {
  const state = readState()
  const entry = {
    id: createId('audit'),
    action,
    detail,
    createdAt: nowIso(),
    ip: detail.ip || 'local',
  }
  writeState({ ...state, auditLogs: [entry, ...state.auditLogs].slice(0, 500) })
  return entry
}

export function pushNotification(payload) {
  const state = readState()
  const item = {
    id: createId('ntf'),
    read: false,
    createdAt: nowIso(),
    ...payload,
  }
  writeState({ ...state, notifications: [item, ...state.notifications].slice(0, 200) })
  return item
}

export function rotateDynamicQr() {
  const state = readState()
  const seconds = Number(state.settings.dynamicQrSeconds) || 30
  const token = randomToken()
  const expiresAt = Date.now() + seconds * 1000
  writeState({ ...state, dynamicQr: { token, expiresAt } })
  appendAudit('dynamic_qr_rotate', { expiresAt })
  return { token, expiresAt, seconds }
}

export function getDynamicQr() {
  const state = readState()
  if (!state.dynamicQr?.token || state.dynamicQr.expiresAt <= Date.now()) {
    return rotateDynamicQr()
  }
  return state.dynamicQr
}

export function validateDynamicQr(token) {
  const state = readState()
  return state.dynamicQr?.token === token && state.dynamicQr.expiresAt > Date.now()
}

export function ensureEmployeeQr(employeeId) {
  const state = readState()
  const current = state.employeeQrSecrets[employeeId]
  if (current?.token) return current
  const secret = {
    employeeId,
    token: randomToken(),
    createdAt: nowIso(),
  }
  writeState({
    ...state,
    employeeQrSecrets: { ...state.employeeQrSecrets, [employeeId]: secret },
  })
  return secret
}

export function buildEmployeeQrPayload(employeeId) {
  const secret = ensureEmployeeQr(employeeId)
  return encodePayload({
    type: 'pdks_employee',
    employee_id: employeeId,
    encrypted_token: secret.token,
    created_at: secret.createdAt,
  })
}

export function buildDynamicQrPayload() {
  const dynamic = getDynamicQr()
  return encodePayload({
    type: 'pdks_dynamic',
    token: dynamic.token,
    expires_at: dynamic.expiresAt,
    created_at: nowIso(),
  })
}

export function validateGeofence(gps) {
  const settings = getPdksSettings()
  if (!settings.requireGps) return { ok: true }
  if (!gps?.lat || !gps?.lng) return { ok: false, message: 'GPS konumu alınamadı.' }
  const center = settings.geofence
  const distance = haversineMeters(
    { lat: Number(center.lat), lng: Number(center.lng) },
    { lat: Number(gps.lat), lng: Number(gps.lng) },
  )
  if (distance > Number(center.radiusM || 50)) {
    return { ok: false, message: 'İşletme alanı dışında bulunuyorsunuz.', distance: Math.round(distance) }
  }
  return { ok: true, distance: Math.round(distance) }
}

function parseTimeToMinutes(value) {
  const [h, m] = String(value || '0:0').split(':').map(Number)
  return h * 60 + (m || 0)
}

function diffMinutes(start, end) {
  return Math.max(0, parseTimeToMinutes(end) - parseTimeToMinutes(start))
}

export function getEmployeeShift(employee) {
  const shifts = getShifts()
  return shifts.find((item) => item.id === employee?.shiftId) || shifts[0] || null
}

export function getAttendanceLogs(filters = {}) {
  let rows = readState().attendanceLogs
  if (filters.employeeId) rows = rows.filter((item) => item.employeeId === filters.employeeId)
  if (filters.date) rows = rows.filter((item) => item.date === filters.date)
  if (filters.today) rows = rows.filter((item) => item.date === todayKey())
  return rows.sort((a, b) => `${b.date}${b.checkIn || ''}`.localeCompare(`${a.date}${a.checkIn || ''}`))
}

export function getOpenAttendance(employeeId, date = todayKey()) {
  return getAttendanceLogs({ employeeId, date }).find((item) => item.checkIn && !item.checkOut) || null
}

export function recordCheckIn({
  employeeId,
  gps,
  photo = '',
  device = '',
  ip = 'local',
  dynamicQrToken = '',
  employeeQrToken = '',
}) {
  const employee = getEmployeeById(employeeId)
  if (!employee) throw new Error('Personel bulunamadı.')
  if (employee.status === 'Ayrıldı') throw new Error('Pasif personel giriş yapamaz.')

  const secret = ensureEmployeeQr(employeeId)
  if (employeeQrToken && employeeQrToken !== secret.token) {
    throw new Error('Personel QR doğrulanamadı.')
  }
  if (dynamicQrToken && !validateDynamicQr(dynamicQrToken)) {
    throw new Error('Dinamik QR süresi dolmuş. Yeniden tarayın.')
  }

  const geo = validateGeofence(gps)
  if (!geo.ok) throw new Error(geo.message)

  const settings = getPdksSettings()
  if (settings.requireSelfie && !photo) {
    throw new Error('Selfie doğrulaması zorunlu.')
  }

  const date = todayKey()
  const open = getOpenAttendance(employeeId, date)
  if (open) throw new Error('Açık giriş kaydı var. Önce çıkış yapın.')

  const now = new Date()
  const checkIn = now.toTimeString().slice(0, 5)
  const shift = getEmployeeShift(employee)
  const shiftStart = shift?.start || '08:00'
  const tolerance = shift?.lateToleranceMin ?? settings.lateToleranceMin
  const lateMinutes = Math.max(0, parseTimeToMinutes(checkIn) - parseTimeToMinutes(shiftStart) - tolerance)
  const status = lateMinutes > 0 ? 'Geç Kaldı' : 'Giriş Yapıldı'

  const state = readState()
  const log = {
    id: createId('att'),
    employeeId,
    employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
    department: employee.department || '',
    date,
    checkIn,
    checkOut: '',
    totalHours: 0,
    overtimeHours: 0,
    status,
    lateMinutes,
    gps,
    phone: employee.phone || '',
    ip,
    device,
    photo,
    type: 'Giriş',
    createdAt: nowIso(),
  }

  writeState({ ...state, attendanceLogs: [log, ...state.attendanceLogs] })

  if (photo) {
    const next = readState()
    writeState({
      ...next,
      faceVerifications: [{
        id: createId('face'),
        employeeId,
        attendanceId: log.id,
        photo,
        createdAt: nowIso(),
      }, ...next.faceVerifications],
    })
  }

  if (gps) {
    appendGpsLog({ employeeId, lat: gps.lat, lng: gps.lng, source: 'check-in' })
  }

  appendAudit('check_in', { employeeId, logId: log.id })
  if (lateMinutes > 0) {
    pushNotification({ type: 'late', title: 'Geç kalan personel', body: `${log.employeeName} ${lateMinutes} dk geç kaldı.` })
  }

  return log
}

export function recordCheckOut({ employeeId, gps, ip = 'local' }) {
  const employee = getEmployeeById(employeeId)
  if (!employee) throw new Error('Personel bulunamadı.')

  const geo = validateGeofence(gps)
  if (!geo.ok) throw new Error(geo.message)

  const date = todayKey()
  const open = getOpenAttendance(employeeId, date)
  if (!open) throw new Error('Açık giriş kaydı bulunamadı.')

  const checkOut = new Date().toTimeString().slice(0, 5)
  const totalMinutes = diffMinutes(open.checkIn, checkOut)
  const shift = getEmployeeShift(employee)
  const plannedMinutes = diffMinutes(shift?.start || '08:00', shift?.end || '18:00')
  const overtimeHours = Math.max(0, Math.round(((totalMinutes - plannedMinutes) / 60) * 10) / 10)

  const state = readState()
  const logs = state.attendanceLogs.map((item) => (
    item.id === open.id
      ? {
        ...item,
        checkOut,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        overtimeHours,
        status: overtimeHours > 0 ? 'Mesai ile Çıkış' : 'Çıkış Yapıldı',
        type: 'Çıkış',
        checkoutGps: gps,
        checkoutIp: ip,
      }
      : item
  ))

  writeState({ ...state, attendanceLogs: logs })

  if (overtimeHours > 0) {
    createOvertimeRecord({
      employeeId,
      date,
      hours: overtimeHours,
      type: 'Fazla Mesai',
      note: 'Otomatik çıkış hesabı',
    })
  }

  if (gps) appendGpsLog({ employeeId, lat: gps.lat, lng: gps.lng, source: 'check-out' })
  appendAudit('check_out', { employeeId, attendanceId: open.id })
  return logs.find((item) => item.id === open.id)
}

export function appendGpsLog({ employeeId, lat, lng, source = 'track' }) {
  const employee = getEmployeeById(employeeId)
  const state = readState()
  writeState({
    ...state,
    gpsLogs: [{
      id: createId('gps'),
      employeeId,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}`.trim() : '',
      lat,
      lng,
      source,
      createdAt: nowIso(),
    }, ...state.gpsLogs].slice(0, 1000),
  })
}

export function getGpsLogs(employeeId) {
  const rows = readState().gpsLogs
  return employeeId ? rows.filter((item) => item.employeeId === employeeId) : rows
}

export function createLeaveRequest(payload) {
  const state = readState()
  const employee = getEmployeeById(payload.employeeId)
  const item = {
    id: createId('leave'),
    employeeId: payload.employeeId,
    employeeName: employee ? `${employee.firstName} ${employee.lastName}`.trim() : '',
    type: payload.type || 'Yıllık İzin',
    startDate: payload.startDate,
    endDate: payload.endDate,
    days: Number(payload.days) || 1,
    status: 'Yönetici Onayı Bekliyor',
    managerApproval: 'Bekliyor',
    hrApproval: 'Bekliyor',
    note: payload.note || '',
    createdAt: nowIso(),
  }
  writeState({ ...state, leaveRequests: [item, ...state.leaveRequests] })
  pushNotification({ type: 'leave', title: 'İzin talebi', body: `${item.employeeName} izin talebi oluşturdu.` })
  return item
}

export function updateLeaveRequest(id, patch) {
  const state = readState()
  const rows = state.leaveRequests.map((item) => (item.id === id ? { ...item, ...patch } : item))
  writeState({ ...state, leaveRequests: rows })
  return rows.find((item) => item.id === id)
}

export function getLeaveRequests() {
  return readState().leaveRequests
}

export function createOvertimeRecord(payload) {
  const state = readState()
  const employee = getEmployeeById(payload.employeeId)
  const item = {
    id: createId('ot'),
    employeeId: payload.employeeId,
    employeeName: employee ? `${employee.firstName} ${employee.lastName}`.trim() : '',
    date: payload.date || todayKey(),
    hours: Number(payload.hours) || 0,
    type: payload.type || 'Normal Mesai',
    note: payload.note || '',
    createdAt: nowIso(),
  }
  writeState({ ...state, overtimeRecords: [item, ...state.overtimeRecords] })
  return item
}

export function getOvertimeRecords() {
  return readState().overtimeRecords
}

export function getPdksTasks() {
  return readState().tasks
}

export function addPdksTask(payload) {
  const state = readState()
  const employee = getEmployeeById(payload.employeeId)
  const task = {
    id: createId('task'),
    employeeId: payload.employeeId,
    employeeName: employee ? `${employee.firstName} ${employee.lastName}`.trim() : '',
    title: payload.title,
    status: payload.status || 'Açık',
    dueDate: payload.dueDate || '',
    createdAt: nowIso(),
  }
  writeState({ ...state, tasks: [task, ...state.tasks] })
  return task
}

export function updatePdksTask(taskId, patch) {
  const state = readState()
  const tasks = state.tasks.map((item) => (item.id === taskId ? { ...item, ...patch } : item))
  writeState({ ...state, tasks })
}

export function getNotifications() {
  return readState().notifications
}

export function getAuditLogs() {
  return readState().auditLogs
}

export { todayKey, encodePayload }
