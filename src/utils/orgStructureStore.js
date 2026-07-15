/**
 * Enterprise multi-company / branch / warehouse directory.
 * Scoped under tenant workspace (localStorage → Neon sync).
 */

export const ORG_STRUCTURE_KEY = 'bach-org-structure'
export const ORG_CONTEXT_KEY = 'bach-org-context'
export const ORG_EVENT = 'bach:org-updated'
export const ORG_CONTEXT_EVENT = 'bach:org-context-changed'

export const WAREHOUSE_TYPES = [
  'Merkez',
  'Üretim',
  'Mamül',
  'Yarı Mamül',
  'Hammadde',
  'İade',
  'Transit',
  'Sevkiyat',
  'Konsinye',
  'Sanal Depo',
]

export const DEPARTMENT_PRESETS = [
  'Muhasebe',
  'Satış',
  'CRM',
  'Üretim',
  'İK',
  'Depo',
  'Satın Alma',
  'Servis',
  'Pazarlama',
  'Finans',
]

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value, eventName) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(eventName || ORG_EVENT))
}

export function emptyCompany(partial = {}) {
  return {
    id: uid('co'),
    name: '',
    legalName: '',
    taxOffice: '',
    taxNo: '',
    mersis: '',
    tradeRegistry: '',
    phone: '',
    email: '',
    web: '',
    address: '',
    country: 'Türkiye',
    city: '',
    district: '',
    currency: 'TRY',
    language: 'tr',
    timezone: 'Europe/Istanbul',
    logoUrl: '',
    stampUrl: '',
    signatureUrl: '',
    defaultPrinter: '',
    eInvoice: { enabled: false, gibAlias: '' },
    eArchive: { enabled: false },
    accounting: { fiscalYearStart: '01-01' },
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  }
}

export function emptyBranch(partial = {}) {
  return {
    id: uid('br'),
    companyId: '',
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    lat: null,
    lng: null,
    defaultWarehouseId: '',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  }
}

export function emptyWarehouse(partial = {}) {
  return {
    id: uid('wh'),
    companyId: '',
    branchId: '',
    name: '',
    code: '',
    type: 'Merkez',
    address: '',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  }
}

export function emptyDepartment(partial = {}) {
  return {
    id: uid('dep'),
    companyId: '',
    branchId: '',
    name: '',
    code: '',
    active: true,
    createdAt: new Date().toISOString(),
    ...partial,
  }
}

export function emptyOrgStructure() {
  return {
    companies: [],
    branches: [],
    warehouses: [],
    departments: [],
    companyUsers: [],
    branchUsers: [],
    warehouseUsers: [],
    logs: [],
    limits: {
      maxCompanies: 0, // 0 = unlimited
      maxBranches: 0,
      maxWarehouses: 0,
    },
    updatedAt: new Date().toISOString(),
  }
}

export function readOrgStructure() {
  const data = readJson(ORG_STRUCTURE_KEY, null)
  if (!data || typeof data !== 'object') return emptyOrgStructure()
  return {
    ...emptyOrgStructure(),
    ...data,
    companies: Array.isArray(data.companies) ? data.companies : [],
    branches: Array.isArray(data.branches) ? data.branches : [],
    warehouses: Array.isArray(data.warehouses) ? data.warehouses : [],
    departments: Array.isArray(data.departments) ? data.departments : [],
    companyUsers: Array.isArray(data.companyUsers) ? data.companyUsers : [],
    branchUsers: Array.isArray(data.branchUsers) ? data.branchUsers : [],
    warehouseUsers: Array.isArray(data.warehouseUsers) ? data.warehouseUsers : [],
    logs: Array.isArray(data.logs) ? data.logs : [],
    limits: { ...emptyOrgStructure().limits, ...(data.limits || {}) },
  }
}

export function saveOrgStructure(patch) {
  const current = readOrgStructure()
  const next = {
    ...current,
    ...(typeof patch === 'function' ? patch(current) : patch),
    updatedAt: new Date().toISOString(),
  }
  writeJson(ORG_STRUCTURE_KEY, next, ORG_EVENT)
  return next
}

export function appendOrgLog(action, detail = {}) {
  saveOrgStructure((s) => ({
    ...s,
    logs: [
      {
        id: uid('log'),
        action,
        detail,
        at: new Date().toISOString(),
      },
      ...(s.logs || []),
    ].slice(0, 500),
  }))
}

export function ensureDefaultCompanyFromSettings(settings = {}) {
  const structure = readOrgStructure()
  if (structure.companies.length > 0) return structure
  const company = emptyCompany({
    name: settings.companyName || 'Ana Şirket',
    legalName: settings.companyName || 'Ana Şirket',
    taxOffice: settings.taxOffice || '',
    taxNo: settings.taxNo || '',
    phone: settings.phone || '',
    email: settings.email || '',
    address: settings.address || '',
    city: settings.city || '',
  })
  const branch = emptyBranch({
    companyId: company.id,
    name: 'Merkez',
    code: 'MRK',
  })
  const warehouse = emptyWarehouse({
    companyId: company.id,
    branchId: branch.id,
    name: 'Merkez Depo',
    code: 'DEP-01',
    type: 'Merkez',
  })
  branch.defaultWarehouseId = warehouse.id
  return saveOrgStructure({
    companies: [company],
    branches: [branch],
    warehouses: [warehouse],
    departments: DEPARTMENT_PRESETS.map((name) =>
      emptyDepartment({ companyId: company.id, branchId: branch.id, name, code: name.slice(0, 3).toUpperCase() }),
    ),
  })
}

export function countOrgUsage(structure = readOrgStructure()) {
  return {
    companies: (structure.companies || []).filter((c) => c.active !== false).length,
    branches: (structure.branches || []).filter((b) => b.active !== false).length,
    warehouses: (structure.warehouses || []).filter((w) => w.active !== false).length,
  }
}

export function checkOrgLimit(kind, structure = readOrgStructure()) {
  const usage = countOrgUsage(structure)
  const limits = structure.limits || {}
  const map = {
    companies: { used: usage.companies, max: limits.maxCompanies ?? 0 },
    branches: { used: usage.branches, max: limits.maxBranches ?? 0 },
    warehouses: { used: usage.warehouses, max: limits.maxWarehouses ?? 0 },
  }
  const row = map[kind]
  if (!row) return { ok: true, used: 0, max: 0 }
  if (!row.max || row.max <= 0) return { ok: true, used: row.used, max: 0 }
  return { ok: row.used < row.max, used: row.used, max: row.max }
}

export function readOrgContext() {
  return readJson(ORG_CONTEXT_KEY, {
    companyId: null,
    branchId: null,
    warehouseId: null,
  })
}

export function writeOrgContext(patch) {
  const current = readOrgContext()
  const next = { ...current, ...patch }
  writeJson(ORG_CONTEXT_KEY, next, ORG_CONTEXT_EVENT)
  return next
}

export function resolveActiveOrg(structure = readOrgStructure(), context = readOrgContext()) {
  const companies = structure.companies.filter((c) => c.active !== false)
  let company = companies.find((c) => c.id === context.companyId) || companies[0] || null
  const branches = structure.branches.filter((b) => b.companyId === company?.id && b.active !== false)
  let branch = branches.find((b) => b.id === context.branchId) || branches[0] || null
  const warehouses = structure.warehouses.filter(
    (w) => w.companyId === company?.id && (!branch || w.branchId === branch.id) && w.active !== false,
  )
  let warehouse =
    warehouses.find((w) => w.id === context.warehouseId) ||
    warehouses.find((w) => w.id === branch?.defaultWarehouseId) ||
    warehouses[0] ||
    null
  return { company, branch, warehouse, companies, branches, warehouses }
}
