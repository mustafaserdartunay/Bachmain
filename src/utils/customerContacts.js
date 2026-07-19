function blankContactRow(id = `contact-${Date.now()}`) {
  return { id, title: '', locked: false }
}

export function createNextContactRow() {
  return blankContactRow()
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
    return [blankContactRow('contact-1')]
  }

  const savedContacts = Array.isArray(customer.contacts) ? customer.contacts.map(normalizeContactRow) : []
  const filledSaved = savedContacts.filter((row) => row.name || row.phone || row.email || row.instagram || row.title)

  if (filledSaved.length) {
    return filledSaved.map((row, index) => ({
      id: row.id || `contact-${index + 1}`,
      title: row.title || '',
      locked: false,
      defaultName: row.name,
      defaultPhone: row.phone,
      defaultEmail: row.email,
      defaultInstagram: row.instagram,
    }))
  }

  if (customer.contact || customer.phone || customer.email) {
    return [{
      ...blankContactRow('contact-1'),
      defaultName: customer.contact || '',
      defaultPhone: customer.phone || '',
      defaultEmail: customer.email || '',
    }]
  }

  return [blankContactRow('contact-1')]
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
