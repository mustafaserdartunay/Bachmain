import { customers } from './mockData'
import { getBrandShortName, getCustomerDisplay } from '../utils/customerDisplay'
import { resolvePrimaryContact } from '../utils/customerContacts'

const CREATED_CUSTOMERS_KEY = 'erlenbox-created-customers'

export const customerProfiles = customers.list.map((customer, index) => {
  const stages = ['Teklif', 'Sipariş', 'Numune', 'Tahsilat', 'Takip']
  const segments = ['Premium', 'Aktif', 'Takipte', 'Bayi Adayı', 'Riskli']
  const cities = ['İstanbul / Tuzla', 'Ankara / Ostim', 'İzmir / Kemalpaşa', 'Bursa / Nilüfer', 'Kocaeli / Gebze']
  const revenue = [840000, 620000, 310000, 480000, 260000][index] || 180000
  const score = [92, 86, 74, 81, 68][index] || 72

  return {
    id: `MST-${String(index + 1).padStart(3, '0')}`,
    ...customer,
    shortBrandName: customer.shortBrandName || getBrandShortName(customer.company),
    companyTitle: customer.companyTitle || customer.company,
    segment: segments[index % segments.length],
    stage: stages[index % stages.length],
    city: cities[index % cities.length],
    revenue,
    score,
    openQuotes: [3, 2, 1, 4, 1][index] || 1,
    activeOrders: [2, 3, 1, 2, 0][index] || 1,
    balance: [145000, 78500, 32000, 118000, 42000][index] || 24000,
    owner: ['Ayşe Demir', 'Mehmet Kaya', 'Selin Arslan', 'Fatma Öztürk', 'Ali Çelik'][index] || 'Satış Ekibi',
    nextAction: ['Teklif revizyonu', 'Teslim tarihi onayı', 'Numune takibi', 'Bayi iskonto görüşmesi', 'Tahsilat hatırlatma'][index] || 'Takip araması',
  }
})

const ARCHIVED_CUSTOMERS_KEY = 'erlenbox-archived-customers'
const DELETED_CUSTOMERS_KEY = 'erlenbox-deleted-customers'

function readCreatedCustomers() {
  try {
    const saved = localStorage.getItem(CREATED_CUSTOMERS_KEY)
    const parsed = saved ? JSON.parse(saved) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeCreatedCustomers(profiles) {
  localStorage.setItem(CREATED_CUSTOMERS_KEY, JSON.stringify(profiles))
}

function readArchivedMap() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ARCHIVED_CUSTOMERS_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeArchivedMap(map) {
  localStorage.setItem(ARCHIVED_CUSTOMERS_KEY, JSON.stringify(map))
}

function readDeletedIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DELETED_CUSTOMERS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeDeletedIds(ids) {
  localStorage.setItem(DELETED_CUSTOMERS_KEY, JSON.stringify(ids))
}

export function getAllCustomerProfiles() {
  const created = readCreatedCustomers()
  const createdById = new Map(created.map((customer) => [customer.id, customer]))
  const mergedBase = customerProfiles.map((customer) => createdById.get(customer.id) || customer)
  const extras = created.filter((customer) => !customerProfiles.some((baseCustomer) => baseCustomer.id === customer.id))
  return [...mergedBase, ...extras]
}

export function getCustomerProfiles() {
  const archived = readArchivedMap()
  const deleted = new Set(readDeletedIds())
  return getAllCustomerProfiles().filter((customer) => !archived[customer.id] && !deleted.has(customer.id))
}

export function isCustomerArchived(customerId) {
  return Boolean(readArchivedMap()[customerId])
}

export function getArchivedCustomers() {
  const archived = readArchivedMap()
  return Object.values(archived).sort((a, b) => String(b.archivedAt).localeCompare(String(a.archivedAt)))
}

export function archiveCustomer(customerId) {
  const customer = getAllCustomerProfiles().find((item) => item.id === customerId)
  if (!customer) return
  const map = readArchivedMap()
  map[customerId] = { customer, archivedAt: new Date().toISOString() }
  writeArchivedMap(map)
}

export function restoreCustomer(customerId) {
  const map = readArchivedMap()
  delete map[customerId]
  writeArchivedMap(map)
}

export function deleteCustomer(customerId) {
  const created = readCreatedCustomers().filter((customer) => customer.id !== customerId)
  writeCreatedCustomers(created)
  const map = readArchivedMap()
  delete map[customerId]
  writeArchivedMap(map)
  const deleted = readDeletedIds()
  if (!deleted.includes(customerId)) {
    writeDeletedIds([...deleted, customerId])
  }
}

export function saveCustomerProfile(profile) {
  const created = readCreatedCustomers()
  const existing = getAllCustomerProfiles().find((item) => item.id === profile.id) || {}
  const contacts = Array.isArray(profile.contacts) ? profile.contacts : (existing.contacts || [])
  const primary = resolvePrimaryContact(contacts, profile)
  const nextProfile = {
    ...existing,
    id: profile.id || `MST-${Date.now()}`,
    company: profile.company || profile.shortBrandName || existing.company || 'Yeni Müşteri',
    shortBrandName: profile.shortBrandName || getBrandShortName(profile.company || existing.company),
    companyTitle: profile.companyTitle || profile.company || existing.companyTitle || '',
    contact: primary.contactName || profile.contact || existing.contact || '',
    email: primary.email || profile.email || existing.email || '',
    phone: primary.phone || profile.phone || existing.phone || '',
    contacts: primary.contacts.length ? primary.contacts : contacts,
    city: profile.city ?? existing.city ?? '',
    address: profile.address ?? existing.address ?? '',
    lat: profile.lat ?? existing.lat ?? null,
    lng: profile.lng ?? existing.lng ?? null,
    taxOffice: profile.taxOffice ?? existing.taxOffice ?? '',
    taxNumber: profile.taxNumber ?? existing.taxNumber ?? '',
    warehouse: profile.warehouse ?? existing.warehouse ?? '',
    segment: profile.segment || existing.segment || 'Aktif',
    stage: profile.stage || existing.stage || 'Takip',
    revenue: Number(profile.revenue ?? existing.revenue ?? 0),
    score: Number(profile.score ?? existing.score ?? 70),
    openQuotes: Number(profile.openQuotes ?? existing.openQuotes ?? 0),
    activeOrders: Number(profile.activeOrders ?? existing.activeOrders ?? 0),
    balance: Number(profile.balance ?? existing.balance ?? 0),
    owner: profile.owner || existing.owner || 'Satış Ekibi',
    nextAction: profile.nextAction || existing.nextAction || 'Yeni kayıt',
  }
  const withoutCurrent = created.filter((customer) => customer.id !== nextProfile.id)
  writeCreatedCustomers([nextProfile, ...withoutCurrent])
  window.dispatchEvent(new CustomEvent('bach:customers-updated'))
  return nextProfile
}

export function findCustomerProfileByReference(customerRef) {
  const name = String(customerRef || '').trim()
  if (!name) return null
  const normalized = name.toLowerCase()
  return getCustomerProfiles().find((customer) => {
    const display = getCustomerDisplay(customer)
    return customer.company?.toLowerCase() === normalized
      || customer.companyTitle?.toLowerCase() === normalized
      || customer.shortBrandName?.toLowerCase() === normalized
      || display.brandShortName.toLowerCase() === normalized
      || display.companyTitle.toLowerCase() === normalized
  }) || null
}

export function getListCustomerDisplay(customerRef) {
  const profile = findCustomerProfileByReference(customerRef)
  return getCustomerDisplay(profile || customerRef)
}

export function findCustomerProfile(customerId) {
  return getCustomerProfiles().find((customer) => customer.id === customerId) || getCustomerProfiles()[0]
}

export function updateCustomerOpeningBalance(customerId, { balance, date, description }) {
  const customer = getAllCustomerProfiles().find((item) => item.id === customerId)
  if (!customer) return null

  const nextDate = date || customer.openingBalanceDate || '01.06.2026'
  const nextDescription = description || `${customer.company} cari açılış bakiyesi`

  return saveCustomerProfile({
    ...customer,
    balance: Number(balance) || 0,
    openingBalanceDate: nextDate,
    openingBalanceDescription: nextDescription,
  })
}

export function deleteCustomerOpeningBalance(customerId) {
  const customer = getAllCustomerProfiles().find((item) => item.id === customerId)
  if (!customer) return null

  return saveCustomerProfile({
    ...customer,
    balance: 0,
    openingBalanceDate: customer.openingBalanceDate || '01.06.2026',
    openingBalanceDescription: `${customer.company} cari açılış bakiyesi`,
  })
}
