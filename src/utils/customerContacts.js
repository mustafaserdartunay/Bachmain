const DEFAULT_CONTACT_TITLES = [
  { id: 'owner', title: 'Firma Sahibi', locked: true },
  { id: 'authorized', title: 'Yetkili Kişi', locked: true },
  { id: 'other', title: 'Diğer Sorumlu', locked: true },
]

export function createNextContactRow(existingRows = []) {
  const usedIds = new Set(existingRows.map((row) => String(row.id)))
  const nextPreset = DEFAULT_CONTACT_TITLES.find((row) => !usedIds.has(row.id))
  if (nextPreset) return { ...nextPreset }
  return { id: `contact-${Date.now()}`, title: '' }
}

export function resolveContactLinkHref(value = '', { instagram = false } = {}) {
  const clean = String(value).trim()
  if (!clean) return ''

  if (/^https?:\/\//i.test(clean)) {
    return clean.replace(/^https?:\/\//i, (match) => match.toLowerCase())
  }

  if (clean.includes('.') || clean.includes('/')) {
    return `https://${clean.replace(/^\/+/, '')}`
  }

  if (instagram || clean.startsWith('@')) {
    const handle = clean.replace(/^@/, '')
    if (handle) return `https://instagram.com/${handle}`
  }

  return ''
}

function normalizeContactRow(row = {}) {
  return {
    id: String(row.id || ''),
    title: String(row.title || '').trim(),
    name: String(row.name || '').trim(),
    phone: String(row.phone || '').trim(),
    email: String(row.email || '').trim(),
    instagram: String(row.instagram || '').trim(),
  }
}

export function parseContactsFromFormPayload(payload, contactRows = []) {
  return contactRows
    .map((row) => normalizeContactRow({
      id: row.id,
      title: payload[`contactTitle-${row.id}`] || row.title || '',
      name: payload[`contactName-${row.id}`] || '',
      phone: payload[`contactPhone-${row.id}`] || '',
      email: payload[`contactEmail-${row.id}`] || '',
      instagram: payload[`contactInstagram-${row.id}`] || '',
    }))
    .filter((row) => row.name || row.phone || row.email || row.instagram)
}

export function initialContactRowsFromCustomer(customer) {
  if (!customer) {
    return [{ ...DEFAULT_CONTACT_TITLES[0] }]
  }

  const savedContacts = Array.isArray(customer.contacts) ? customer.contacts.map(normalizeContactRow) : []
  const byId = new Map(savedContacts.map((row) => [row.id, row]))
  const rows = DEFAULT_CONTACT_TITLES.map((row) => {
    const saved = byId.get(row.id)
    if (saved) {
      return {
        ...row,
        defaultName: saved.name,
        defaultPhone: saved.phone,
        defaultEmail: saved.email,
        defaultInstagram: saved.instagram,
      }
    }
    if (row.id === 'authorized') {
      return {
        ...row,
        defaultName: customer.contact || '',
        defaultPhone: customer.phone || '',
        defaultEmail: customer.email || '',
      }
    }
    return { ...row }
  })

  savedContacts
    .filter((row) => !DEFAULT_CONTACT_TITLES.some((item) => item.id === row.id))
    .forEach((row) => {
      rows.push({
        id: row.id,
        title: row.title || '',
        defaultName: row.name,
        defaultPhone: row.phone,
        defaultEmail: row.email,
        defaultInstagram: row.instagram,
      })
    })

  const filled = rows.filter((row) => (
    row.defaultName
    || row.defaultPhone
    || row.defaultEmail
    || row.defaultInstagram
    || row.id === 'owner'
    || !row.locked
  ))

  return filled.length ? filled : [{ ...DEFAULT_CONTACT_TITLES[0] }]
}

function pickContactByPriority(contacts, priorityIds) {
  for (const id of priorityIds) {
    const match = contacts.find((row) => row.id === id && (row.name || row.phone || row.email || row.instagram))
    if (match) return match
  }
  return contacts.find((row) => row.name || row.phone || row.email || row.instagram) || null
}

export function resolvePrimaryContact(contacts = [], fallback = {}) {
  const normalized = contacts.map(normalizeContactRow)
  const primary = pickContactByPriority(normalized, ['authorized', 'owner', 'other'])
    || normalizeContactRow({
      name: fallback.contact || '',
      phone: fallback.phone || '',
      email: fallback.email || '',
    })

  return {
    contactName: primary.name || fallback.contact || '',
    phone: primary.phone || fallback.phone || '',
    email: primary.email || fallback.email || '',
    contacts: normalized,
  }
}

export function resolveCustomerContactInfo(customer) {
  if (!customer) {
    return { contactName: '', phone: '', email: '', contacts: [] }
  }

  const contacts = Array.isArray(customer.contacts) && customer.contacts.length
    ? customer.contacts.map(normalizeContactRow)
    : []

  return resolvePrimaryContact(contacts, customer)
}

export function getCustomerContacts(customer) {
  return resolveCustomerContactInfo(customer).contacts
}
