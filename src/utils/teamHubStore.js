import { loadOrders } from './ordersStore'
import { loadQuotes } from './quotesStore'
import { loadTasks, upsertTask } from './crmStore'
import { loadPersonnel } from './personnelStore'
import { fullName } from './personnelHelpers'
import { getLoggedInUserDisplayName, ensureUserProfile } from './userProfile'

const STORAGE_KEY = 'bach-team-hub-state'
export const TEAM_HUB_EVENT = 'bach:team-hub-updated'
export const DAILY_WINNER_BONUS_POINTS = 15
const BONUS_TRY_PER_POINT = 100

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!saved || typeof saved !== 'object') return null
    return {
      messages: Array.isArray(saved.messages) ? saved.messages : [],
      monthlyBonusPoints: saved.monthlyBonusPoints && typeof saved.monthlyBonusPoints === 'object'
        ? saved.monthlyBonusPoints
        : {},
      dailyWinners: Array.isArray(saved.dailyWinners) ? saved.dailyWinners : [],
      lastReadChatAt: saved.lastReadChatAt || '',
    }
  } catch {
    return null
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new CustomEvent(TEAM_HUB_EVENT))
}

function seedState() {
  const employees = getActiveTeamMembers()
  const seeded = {
    messages: [
      {
        id: createId('msg'),
        authorId: employees[0]?.id || 'system',
        authorName: employees[0] ? fullName(employees[0]) : 'Ekip',
        text: 'Günaydın ekip! Bugünkü teklif ve sipariş hedeflerimizi buradan takip edelim.',
        createdAt: new Date().toISOString(),
      },
      {
        id: createId('msg'),
        authorId: employees[1]?.id || 'system',
        authorName: employees[1] ? fullName(employees[1]) : 'Ekip',
        text: 'Yeni gelen siparişleri ve teklifleri sağ panelden paylaşabiliriz.',
        createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      },
    ],
    monthlyBonusPoints: {},
    dailyWinners: [],
    lastReadChatAt: '',
  }
  writeState(seeded)
  return seeded
}

export function loadTeamHubState() {
  return readState() || seedState()
}

function saveTeamHubState(state) {
  writeState(state)
  return state
}

export function getTeamAvatarUrl(employeeId) {
  return `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${encodeURIComponent(employeeId || 'user')}`
}

export function getActiveTeamMembers() {
  return loadPersonnel().filter((employee) => employee.status === 'Aktif' || employee.active !== false)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function normalizeName(value) {
  return String(value || '').trim().toLocaleLowerCase('tr-TR')
}

function matchesEmployee(recordValue, employeeName) {
  return normalizeName(recordValue) === normalizeName(employeeName)
}

function isToday(isoDate) {
  return String(isoDate || '').slice(0, 10) === todayIso()
}

function countEmployeeActivity(employeeName) {
  const quotesToday = loadQuotes().filter((quote) => isToday(quote.createdAt) && matchesEmployee(quote.owner, employeeName))
  const ordersToday = loadOrders().filter((order) => isToday(order.createdAt) && matchesEmployee(order.owner, employeeName))
  const tasks = loadTasks()
  const tasksDoneToday = tasks.filter((task) => (
    matchesEmployee(task.assignee, employeeName) && task.status === 'Tamamlandı' && isToday(task.updatedAt || task.createdAt)
  ))
  const tasksOpen = tasks.filter((task) => (
    matchesEmployee(task.assignee, employeeName) && task.status !== 'Tamamlandı'
  ))

  const rawScore = (
    quotesToday.length * 24
    + ordersToday.length * 34
    + tasksDoneToday.length * 18
    + Math.min(tasksOpen.length, 4) * 6
  )

  return {
    quotesToday,
    ordersToday,
    tasksDoneToday,
    tasksOpen,
    rawScore,
  }
}

export function buildTeamPerformanceRows() {
  const members = getActiveTeamMembers()
  const rows = members.map((employee) => {
    const name = fullName(employee)
    const activity = countEmployeeActivity(name)
    return {
      employeeId: employee.id,
      name,
      department: employee.department || '—',
      position: employee.position || '—',
      avatarUrl: getTeamAvatarUrl(employee.id),
      ...activity,
    }
  })

  const maxRaw = Math.max(...rows.map((row) => row.rawScore), 1)
  return rows
    .map((row) => ({
      ...row,
      score: row.rawScore > 0 ? Math.min(100, Math.round((row.rawScore / maxRaw) * 100)) : 0,
    }))
    .sort((a, b) => b.score - a.score || b.rawScore - a.rawScore)
    .map((row, index) => ({ ...row, rank: index + 1 }))
}

export function getTodayDealFeed() {
  const quotes = loadQuotes()
    .filter((quote) => isToday(quote.createdAt))
    .map((quote) => ({
      id: quote.id,
      kind: 'quote',
      label: quote.id || 'Teklif',
      owner: quote.owner || '—',
      customer: quote.customer || quote.customerName || '—',
      href: '/teklifler',
      createdAt: quote.createdAt,
    }))

  const orders = loadOrders()
    .filter((order) => isToday(order.createdAt))
    .map((order) => ({
      id: order.id,
      kind: 'order',
      label: order.id || 'Sipariş',
      owner: order.owner || '—',
      customer: order.customerName || order.customer || '—',
      href: '/siparisler',
      createdAt: order.createdAt,
    }))

  return [...quotes, ...orders].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

function ensureMonthlyBucket(state, key = monthKey()) {
  if (!state.monthlyBonusPoints[key]) {
    state.monthlyBonusPoints[key] = {}
  }
  return state.monthlyBonusPoints[key]
}

export function ensureDailyWinnerRecorded() {
  const state = loadTeamHubState()
  const date = todayIso()
  const already = state.dailyWinners.some((entry) => entry.date === date)
  if (already) return state

  const leaderboard = buildTeamPerformanceRows()
  const winner = leaderboard[0]
  if (!winner || winner.score <= 0) return state

  const monthBucket = ensureMonthlyBucket(state)
  monthBucket[winner.employeeId] = (Number(monthBucket[winner.employeeId]) || 0) + DAILY_WINNER_BONUS_POINTS

  state.dailyWinners.unshift({
    id: createId('win'),
    date,
    employeeId: winner.employeeId,
    employeeName: winner.name,
    score: winner.score,
    bonusPoints: DAILY_WINNER_BONUS_POINTS,
  })
  state.dailyWinners = state.dailyWinners.slice(0, 120)
  return saveTeamHubState(state)
}

export function resolveCurrentTeamAuthor() {
  const authorName = getLoggedInUserDisplayName()
  const profile = ensureUserProfile()
  const members = getActiveTeamMembers()
  const matched = members.find((employee) => (
    normalizeName(fullName(employee)) === normalizeName(authorName)
  ))

  return {
    authorId: matched?.id || profile.tenantCode || 'current-user',
    authorName,
  }
}

export function canManageTeamMessage(message) {
  if (!message) return false
  const current = resolveCurrentTeamAuthor()
  if (message.authorId && message.authorId === current.authorId) return true
  if (message.authorId === 'current-user' && normalizeName(message.authorName) === normalizeName(current.authorName)) {
    return true
  }
  return normalizeName(message.authorName) === normalizeName(current.authorName)
}

export function getSortedTeamMessages(messages = []) {
  return [...messages].sort((left, right) => (
    String(right.createdAt || '').localeCompare(String(left.createdAt || ''))
  ))
}

export function markTeamHubChatRead() {
  const state = loadTeamHubState()
  state.lastReadChatAt = new Date().toISOString()
  return saveTeamHubState(state)
}

export function getTeamHubChatUnreadCount() {
  const state = loadTeamHubState()
  const lastRead = state.lastReadChatAt || ''
  return state.messages.filter((message) => {
    if (canManageTeamMessage(message)) return false
    if (!lastRead) return true
    return String(message.createdAt || '') > String(lastRead)
  }).length
}

export function getOpenTeamTaskCount() {
  return loadTasks().filter((task) => task.status !== 'Tamamlandı').length
}

export function getOpenTeamTaskCountForEmployee(employeeName) {
  return loadTasks().filter((task) => (
    task.status !== 'Tamamlandı' && matchesEmployee(task.assignee, employeeName)
  )).length
}

export function getOpenTeamTaskCountForCurrentUser() {
  const { authorName } = resolveCurrentTeamAuthor()
  return getOpenTeamTaskCountForEmployee(authorName)
}

export function getTeamHubTabBadgeCount(tabId) {
  if (tabId === 'chat') return getTeamHubChatUnreadCount()
  if (tabId === 'assign') return getOpenTeamTaskCount()
  if (tabId === 'race') return getOpenTeamTaskCountForCurrentUser()
  return 0
}

export function getEmployeeHubBadgeCount(employee, messages = loadTeamHubState().messages, lastReadChatAt = loadTeamHubState().lastReadChatAt) {
  if (!employee) return 0
  const employeeName = fullName(employee)
  const openTasks = getOpenTeamTaskCountForEmployee(employeeName)
  const unreadMessages = messages.filter((message) => {
    if (message.authorId !== employee.id) return false
    if (canManageTeamMessage(message)) return false
    if (!lastReadChatAt) return true
    return String(message.createdAt || '') > String(lastReadChatAt)
  }).length
  return openTasks + unreadMessages
}

export const TEAM_HUB_NOTICE_BADGE_CLASS =
  'absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-black text-white shadow-[0_0_10px_rgba(255,59,48,0.55)]'

export function getMonthlyBonusSummary(key = monthKey()) {
  const state = loadTeamHubState()
  const bucket = state.monthlyBonusPoints[key] || {}
  const members = getActiveTeamMembers()

  return members
    .map((employee) => {
      const points = Number(bucket[employee.id]) || 0
      return {
        employeeId: employee.id,
        name: fullName(employee),
        avatarUrl: getTeamAvatarUrl(employee.id),
        points,
        bonusTry: points * BONUS_TRY_PER_POINT,
      }
    })
    .filter((row) => row.points > 0)
    .sort((a, b) => b.points - a.points)
}

export function sendTeamMessage(text, author = {}) {
  const trimmed = String(text || '').trim()
  if (!trimmed) return loadTeamHubState()

  const current = resolveCurrentTeamAuthor()
  const state = loadTeamHubState()
  state.messages.unshift({
    id: createId('msg'),
    authorId: author.authorId || current.authorId,
    authorName: author.authorName || current.authorName,
    text: trimmed,
    createdAt: new Date().toISOString(),
  })
  state.messages = state.messages.slice(0, 200)
  return saveTeamHubState(state)
}

export function updateTeamMessage(messageId, text) {
  const trimmed = String(text || '').trim()
  if (!trimmed) return null

  const state = loadTeamHubState()
  const index = state.messages.findIndex((item) => item.id === messageId)
  if (index < 0) return null
  if (!canManageTeamMessage(state.messages[index])) return null

  state.messages[index] = {
    ...state.messages[index],
    text: trimmed,
    updatedAt: new Date().toISOString(),
  }
  return saveTeamHubState(state)
}

export function deleteTeamMessage(messageId) {
  const state = loadTeamHubState()
  const message = state.messages.find((item) => item.id === messageId)
  if (!message || !canManageTeamMessage(message)) return null
  state.messages = state.messages.filter((item) => item.id !== messageId)
  return saveTeamHubState(state)
}

export function assignTaskToEmployee(employee, payload = {}) {
  const title = String(payload.title || '').trim()
  if (!title) return null

  const employeeName = fullName(employee)
  return upsertTask({
    id: createId('task'),
    title,
    description: String(payload.description || '').trim(),
    assignee: employeeName,
    customer: String(payload.customer || '').trim(),
    category: payload.category || 'Genel',
    priority: payload.priority || 'Normal',
    status: 'Bekliyor',
    createdAt: todayIso(),
    updatedAt: todayIso(),
    createdBy: getLoggedInUserDisplayName(),
  })
}

export function formatTeamHubTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export function formatTeamHubDateTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const day = date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const time = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  return `${day} · ${time}`
}
