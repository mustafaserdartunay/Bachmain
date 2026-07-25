import { customers } from './mockData'
import { getBrandShortName, getCustomerDisplay } from '../utils/customerDisplay'
import { resolvePrimaryContact } from '../utils/customerContacts'
import {
  softDeleteRecord,
  getDeletedRecords,
  restoreDeletedRecord,
  getDeletedRecord,
  purgeDeletedRecord,
} from '../utils/deletedRecordsStore'
import { filterByOrgScope, getActiveOrgScope, withOrgScope } from '../utils/orgScope'

const CREATED_CUSTOMERS_KEY = 'erlenbox-created-customers'

export const customerProfiles = []

const ARCHIVED_CUSTOMERS_KEY = 'erlenbox-archived-customers'
const DELETED_CUSTOMERS_KEY = 'erlenbox-deleted-customers'
const DELETED_COLLECTION = 'customers'

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

/** Legacy id-list + new soft-delete map (deletedRecordsStore). */
function readDeletedIdSet() {
  const fromStore = new Set(
    getDeletedRecords(DELETED_COLLECTION)
      .map((entry) => entry.record?.id)
      .filter(Boolean),
  )
  try {
    const parsed = JSON.parse(localStorage.getItem(DELETED_CUSTOMERS_KEY) || '[]')
    if (Array.isArray(parsed)) parsed.forEach((id) => fromStore.add(id))
    else if (parsed && typeof parsed === 'object')
      Object.keys(parsed).forEach((id) => fromStore.add(id))
  } catch {
    // ignore
  }
  return fromStore
}

export function getAllCustomerProfiles() {
  const created = readCreatedCustomers()
  const createdById = new Map(created.map((customer) => [customer.id, customer]))
  const mergedBase = customerProfiles.map((customer) => createdById.get(customer.id) || customer)
  const extras = created.filter(
    (customer) => !customerProfiles.some((baseCustomer) => baseCustomer.id === customer.id),
  )
  return [...mergedBase, ...extras]
}

export function getCustomerProfiles() {
  const archived = readArchivedMap()
  const deleted = readDeletedIdSet()
  const active = getAllCustomerProfiles().filter(
    (customer) => !archived[customer.id] && !deleted.has(customer.id),
  )
  return filterByOrgScope(active, getActiveOrgScope(), { loose: true })
}

export function isCustomerArchived(customerId) {
  return Boolean(readArchivedMap()[customerId])
}

export function getArchivedCustomers() {
  const archived = readArchivedMap()
  return Object.values(archived).sort((a, b) =>
    String(b.archivedAt).localeCompare(String(a.archivedAt)),
  )
}

export function getDeletedCustomers() {
  return getDeletedRecords(DELETED_COLLECTION)
}

export function archiveCustomer(customerId) {
  const customer = getAllCustomerProfiles().find((item) => item.id === customerId)
  if (!customer) return
  const map = readArchivedMap()
  map[customerId] = { customer, archivedAt: new Date().toISOString() }
  writeArchivedMap(map)
  window.dispatchEvent(new CustomEvent('bach:customers-updated'))
}

export function restoreCustomer(customerId) {
  const map = readArchivedMap()
  delete map[customerId]
  writeArchivedMap(map)
  window.dispatchEvent(new CustomEvent('bach:customers-updated'))
}

export function restoreDeletedCustomer(customer) {
  if (!customer?.id) return null
  const fromStore = restoreDeletedRecord(DELETED_COLLECTION, customer.id)
  const payload = fromStore || customer
  try {
    const legacy = JSON.parse(localStorage.getItem(DELETED_CUSTOMERS_KEY) || '[]')
    if (Array.isArray(legacy)) {
      localStorage.setItem(
        DELETED_CUSTOMERS_KEY,
        JSON.stringify(legacy.filter((id) => id !== customer.id)),
      )
    } else if (legacy && typeof legacy === 'object') {
      delete legacy[customer.id]
      localStorage.setItem(DELETED_CUSTOMERS_KEY, JSON.stringify(legacy))
    }
  } catch {
    // ignore
  }
  const map = readArchivedMap()
  delete map[customer.id]
  writeArchivedMap(map)
  return saveCustomerProfile(payload)
}

/** Silinenler / arşiv listesinden kalıcı kaldır (geri yüklenemez). */
export function purgeCustomerRecycleEntry(customerId, kind = 'deleted') {
  if (!customerId) return false
  if (kind === 'archived') {
    const map = readArchivedMap()
    if (!map[customerId]) return false
    delete map[customerId]
    writeArchivedMap(map)
  } else {
    purgeDeletedRecord(DELETED_COLLECTION, customerId)
    try {
      const legacy = JSON.parse(localStorage.getItem(DELETED_CUSTOMERS_KEY) || '[]')
      if (Array.isArray(legacy)) {
        localStorage.setItem(
          DELETED_CUSTOMERS_KEY,
          JSON.stringify(legacy.filter((id) => id !== customerId)),
        )
      } else if (legacy && typeof legacy === 'object') {
        delete legacy[customerId]
        localStorage.setItem(DELETED_CUSTOMERS_KEY, JSON.stringify(legacy))
      }
    } catch {
      // ignore
    }
  }
  window.dispatchEvent(new CustomEvent('bach:customers-updated'))
  return true
}

export function deleteCustomer(customerId) {
  const archivedEntry = readArchivedMap()[customerId]
  const customer =
    getAllCustomerProfiles().find((item) => item.id === customerId) ||
    archivedEntry?.customer ||
    getDeletedRecord(DELETED_COLLECTION, customerId)?.record
  if (!customer) return

  const created = readCreatedCustomers().filter((item) => item.id !== customerId)
  writeCreatedCustomers(created)

  const map = readArchivedMap()
  delete map[customerId]
  writeArchivedMap(map)

  softDeleteRecord(DELETED_COLLECTION, customer, {
    entityLabel: getCustomerDisplay(customer).brandShortName || customer.company || customerId,
  })

  // Keep legacy key as id list for older filters during transition
  try {
    const legacy = JSON.parse(localStorage.getItem(DELETED_CUSTOMERS_KEY) || '[]')
    const ids = Array.isArray(legacy) ? legacy : Object.keys(legacy || {})
    if (!ids.includes(customerId)) {
      localStorage.setItem(DELETED_CUSTOMERS_KEY, JSON.stringify([...ids, customerId]))
    }
  } catch {
    localStorage.setItem(DELETED_CUSTOMERS_KEY, JSON.stringify([customerId]))
  }

  window.dispatchEvent(new CustomEvent('bach:customers-updated'))
}

export function saveCustomerProfile(profile) {
  const created = readCreatedCustomers()
  const existing = getAllCustomerProfiles().find((item) => item.id === profile.id) || {}
  const contacts = Array.isArray(profile.contacts) ? profile.contacts : existing.contacts || []
  const primary = resolvePrimaryContact(contacts, profile)
  const scoped = withOrgScope({ ...existing, ...profile }, getActiveOrgScope())
  const nextProfile = {
    ...existing,
    ...scoped,
    id: profile.id || `MST-${Date.now()}`,
    company: profile.company || profile.shortBrandName || existing.company || 'Yeni Müşteri',
    shortBrandName:
      profile.shortBrandName || getBrandShortName(profile.company || existing.company),
    companyTitle: profile.companyTitle || profile.company || existing.companyTitle || '',
    contact: primary.contactName || profile.contact || existing.contact || '',
    email: primary.email || profile.email || existing.email || '',
    phone: primary.phone || profile.phone || existing.phone || '',
    contacts: primary.contacts.length ? primary.contacts : contacts,
    city: profile.city ?? existing.city ?? '',
    address: profile.address ?? existing.address ?? '',
    lat: profile.lat ?? existing.lat ?? null,
    lng: profile.lng ?? existing.lng ?? null,
    website: profile.website ?? existing.website ?? '',
    googleMapsUrl: profile.googleMapsUrl ?? existing.googleMapsUrl ?? '',
    googlePlaceId: profile.googlePlaceId ?? existing.googlePlaceId ?? '',
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
  return (
    getCustomerProfiles().find((customer) => {
      const display = getCustomerDisplay(customer)
      return (
        customer.company?.toLowerCase() === normalized ||
        customer.companyTitle?.toLowerCase() === normalized ||
        customer.shortBrandName?.toLowerCase() === normalized ||
        display.brandShortName.toLowerCase() === normalized ||
        display.companyTitle.toLowerCase() === normalized
      )
    }) || null
  )
}

export function getListCustomerDisplay(customerRef) {
  const profile = findCustomerProfileByReference(customerRef)
  return getCustomerDisplay(profile || customerRef)
}

export function findCustomerProfile(customerId) {
  return (
    getCustomerProfiles().find((customer) => customer.id === customerId) || getCustomerProfiles()[0]
  )
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
