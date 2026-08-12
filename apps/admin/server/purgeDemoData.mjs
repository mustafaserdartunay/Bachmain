/**
 * Strip demo/seed rows from admin store while preserving real membership accounts.
 * Known seed customer ids: c1–c12, tickets t1–t5, module filler rows.
 */
const SEED_CUSTOMER_IDS = new Set([
  'c1',
  'c2',
  'c3',
  'c4',
  'c5',
  'c6',
  'c7',
  'c8',
  'c9',
  'c10',
  'c11',
  'c12',
])

const SEED_TICKET_IDS = new Set(['t1', 't2', 't3', 't4', 't5'])

const SEED_EMAIL_HINTS = [
  '@erlenbox.com',
  '@deltalojistik.com',
  '@novagida.com',
  '@atlasinsaat.com',
  '@zenithmedikal.com',
  '@pentaoto.com',
  '@kervantekstil.com',
  '@orionenerji.com',
  '@meridian.com',
  '@vegaperakende.com',
  '@titanmakine.com',
  '@siriusdan.com',
]

const EMPTY_MODULES = {
  customers: [],
  subscriptions: [],
  dealers: [],
  accounts: [],
  payments: [],
  invoices: [],
  packages: [],
  support: [],
  'live-support': [],
  notifications: [],
  ai: [],
  analytics: [],
  server: [],
  updates: [],
  security: [],
  staff: [],
  website: [],
  api: [],
  settings: [],
}

function isSeedEmail(email) {
  const e = String(email || '').toLowerCase()
  return SEED_EMAIL_HINTS.some((hint) => e.endsWith(hint) || e.includes(hint))
}

function isSeedCustomer(c) {
  if (!c) return false
  if (SEED_CUSTOMER_IDS.has(String(c.id))) return true
  if (isSeedEmail(c.email)) return true
  return false
}

function emptyDashboard() {
  return {
    kpis: [],
    revenueChart: [],
    recentActivities: [],
    pendingPayments: [],
    systemHealth: [],
  }
}

export function emptyModuleRows() {
  return structuredClone(EMPTY_MODULES)
}

/**
 * @returns {{ changed: boolean, removedCustomers: number, removedTickets: number }}
 */
export function purgeDemoData(store) {
  if (!store || typeof store !== 'object') {
    return { changed: false, removedCustomers: 0, removedTickets: 0 }
  }

  let changed = false
  const beforeCustomers = (store.customers || []).length
  const keepCustomerIds = new Set()

  // Prefer accounts as source of truth for real members
  const accounts = Array.isArray(store.accounts) ? store.accounts : []
  for (const a of accounts) {
    if (a?.customerId) keepCustomerIds.add(a.customerId)
  }

  const nextCustomers = (store.customers || []).filter((c) => {
    if (keepCustomerIds.has(c.id)) return true
    if (accounts.length && accounts.some((a) => a.customerId === c.id)) return true
    // Drop classic seed rows
    if (isSeedCustomer(c)) return false
    // If we have real accounts, drop orphan seed-looking customers without accounts
    if (accounts.length && !accounts.some((a) => a.customerId === c.id) && isSeedCustomer(c)) {
      return false
    }
    // Keep non-seed customers even without account (manual entries)
    return !isSeedCustomer(c)
  })

  if (nextCustomers.length !== beforeCustomers) {
    store.customers = nextCustomers
    changed = true
  }

  const keepIds = new Set((store.customers || []).map((c) => c.id))
  const beforeTickets = (store.supportTickets || []).length
  store.supportTickets = (store.supportTickets || []).filter((t) => {
    if (SEED_TICKET_IDS.has(String(t.id))) return false
    if (t.customerId && !keepIds.has(t.customerId) && String(t.customerId).match(/^c\d+$/)) {
      return false
    }
    // Drop tickets that reference purged seed companies by name pattern
    if (SEED_TICKET_IDS.has(String(t.id))) return false
    return true
  })
  if ((store.supportTickets || []).length !== beforeTickets) changed = true

  // Wipe demo module filler (live modules rebuild from real APIs where applicable)
  const modules = store.modules || {}
  let modulesDirty = false
  for (const key of Object.keys(EMPTY_MODULES)) {
    const rows = modules[key]
    if (!Array.isArray(rows)) {
      modules[key] = []
      modulesDirty = true
      continue
    }
    if (key === 'live-support' || key === 'server' || key === 'dealers' || key === 'analytics') {
      if (rows.length) {
        modules[key] = []
        modulesDirty = true
      }
      continue
    }
    // Strip rows that reference seed customers
    const filtered = rows.filter((r) => {
      const id = String(r?.id || '')
      if (SEED_CUSTOMER_IDS.has(id)) return false
      if (SEED_TICKET_IDS.has(id)) return false
      if (id.startsWith('ls') || id.startsWith('srv') || id.startsWith('d') && /^d\d+$/.test(id)) {
        return false
      }
      if (isSeedEmail(r?.email)) return false
      const company = String(r?.company || r?.customer || '')
      if (
        /Erlenbox|Delta Lojistik|Nova Gıda|Atlas İnşaat|Zenith|Penta Oto|Kervan|Orion Enerji|Meridian|Vega Perakende|Titan Makine|Sirius/.test(
          company,
        )
      ) {
        return false
      }
      return true
    })
    if (filtered.length !== rows.length) {
      modules[key] = filtered
      modulesDirty = true
    }
  }
  if (modulesDirty) {
    store.modules = modules
    changed = true
  }

  // Clear seeded dashboard cosmetics
  if (store.dashboard) {
    const dash = store.dashboard
    const fakeMrr = Array.isArray(dash.kpis)
      ? dash.kpis.some((k) => String(k?.value || '').includes('1.24') || String(k?.value || '').includes('248'))
      : false
    if (fakeMrr || (dash.recentActivities || []).some((a) => /Vega Perakende|Erlenbox/.test(String(a?.description || '')))) {
      store.dashboard = emptyDashboard()
      changed = true
    }
  } else {
    store.dashboard = emptyDashboard()
    changed = true
  }

  // Seed announcements
  if (Array.isArray(store.announcements)) {
    const nextAnn = store.announcements.filter((a) => !String(a?.id || '').startsWith('ann_seed_'))
    if (nextAnn.length !== store.announcements.length) {
      store.announcements = nextAnn
      changed = true
    }
  }

  // Customer extras tied to seed customers
  if (store.customerExtras && typeof store.customerExtras === 'object') {
    const extras = store.customerExtras
    for (const key of ['users', 'invoices', 'payments', 'loginHistory', 'timeline']) {
      if (!Array.isArray(extras[key])) continue
      const filtered = extras[key].filter((row) => {
        if (row?.customerId && SEED_CUSTOMER_IDS.has(String(row.customerId))) return false
        if (isSeedEmail(row?.email)) return false
        return true
      })
      if (filtered.length !== extras[key].length) {
        extras[key] = filtered
        changed = true
      }
    }
    if (extras.aiUsage && (extras.aiUsage.totalQueries === 1247 || extras.aiUsage.tokensUsed === 892000)) {
      extras.aiUsage = { totalQueries: 0, tokensUsed: 0, costEstimate: 0, topFeatures: [] }
      changed = true
    }
  }

  if (store._demoPurgeVersion !== 1) {
    store._demoPurgeVersion = 1
    changed = true
  }
  store._demoPurgedAt = new Date().toISOString()

  return {
    changed,
    removedCustomers: beforeCustomers - (store.customers || []).length,
    removedTickets: beforeTickets - (store.supportTickets || []).length,
  }
}

export function needsDemoPurge(store) {
  if (!store) return true
  if (store._demoPurgeVersion >= 1) {
    // Still scrub if classic seed ids reappear
    const hasSeedCustomer = (store.customers || []).some((c) => SEED_CUSTOMER_IDS.has(String(c.id)))
    const hasSeedTicket = (store.supportTickets || []).some((t) => SEED_TICKET_IDS.has(String(t.id)))
    const hasLiveSupportDemo = (store.modules?.['live-support'] || []).length > 0
    return hasSeedCustomer || hasSeedTicket || hasLiveSupportDemo
  }
  return true
}
