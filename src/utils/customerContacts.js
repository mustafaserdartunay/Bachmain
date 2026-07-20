function blankContactRow(id = `contact-${Date.now()}`) {
  return { id, title: '', locked: false }
}

export function createNextContactRow() {
  return blankContactRow()
}

const SOCIAL_HOSTS = {
  web: '',
  instagram: 'instagram.com',
  facebook: 'facebook.com',
  youtube: 'youtube.com',
  x: 'x.com',
  pinterest: 'pinterest.com',
  tiktok: 'tiktok.com',
}

export function resolveContactLinkHref(value = '', { platform = 'web', instagram = false } = {}) {
  const clean = String(value).trim()
  if (!clean) return ''

  const resolvedPlatform = instagram ? 'instagram' : platform

  if (/^https?:\/\//i.test(clean)) {
    return clean.replace(/^https?:\/\//i, (match) => match.toLowerCase())
  }

  if (clean.includes('.') || clean.includes('/')) {
    return `https://${clean.replace(/^\/+/, '')}`
  }

  const handle = clean.replace(/^@/, '')
  if (!handle) return ''

  switch (resolvedPlatform) {
    case 'instagram':
      return `https://instagram.com/${handle}`
    case 'facebook':
      return `https://facebook.com/${handle}`
    case 'youtube':
      return `https://youtube.com/@${handle}`
    case 'x':
      return `https://x.com/${handle}`
    case 'pinterest':
      return `https://pinterest.com/${handle}`
    case 'tiktok':
      return `https://tiktok.com/@${handle}`
    case 'web':
    default:
      return SOCIAL_HOSTS[resolvedPlatform]
        ? `https://${SOCIAL_HOSTS[resolvedPlatform]}/${handle}`
        : ''
  }
}

function contactHasContent(row = {}) {
  return Boolean(
    row.name
    || row.phone
    || row.email
    || row.website
    || row.instagram
    || row.facebook
    || row.youtube
    || row.x
    || row.pinterest
    || row.tiktok
    || row.title,
  )
}

function normalizeContactRow(row = {}) {
  return {
    id: String(row.id || ''),
    title: String(row.title || '').trim(),
    name: String(row.name || '').trim(),
    phone: String(row.phone || '').trim(),
    email: String(row.email || '').trim(),
    website: String(row.website || '').trim(),
    instagram: String(row.instagram || '').trim(),
    facebook: String(row.facebook || '').trim(),
    youtube: String(row.youtube || '').trim(),
    x: String(row.x || row.twitter || '').trim(),
    pinterest: String(row.pinterest || '').trim(),
    tiktok: String(row.tiktok || '').trim(),
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
      website: payload[`contactWebsite-${row.id}`] || '',
      instagram: payload[`contactInstagram-${row.id}`] || '',
      facebook: payload[`contactFacebook-${row.id}`] || '',
      youtube: payload[`contactYoutube-${row.id}`] || '',
      x: payload[`contactX-${row.id}`] || '',
      pinterest: payload[`contactPinterest-${row.id}`] || '',
      tiktok: payload[`contactTiktok-${row.id}`] || '',
    }))
    .filter((row) => contactHasContent(row))
}

export function initialContactRowsFromCustomer(customer) {
  if (!customer) {
    return [blankContactRow('contact-1')]
  }

  const savedContacts = Array.isArray(customer.contacts) ? customer.contacts.map(normalizeContactRow) : []
  const filledSaved = savedContacts.filter((row) => contactHasContent(row))

  if (filledSaved.length) {
    return filledSaved.map((row, index) => ({
      id: row.id || `contact-${index + 1}`,
      title: row.title || '',
      locked: false,
      defaultName: row.name,
      defaultPhone: row.phone,
      defaultEmail: row.email,
      defaultWebsite: row.website,
      defaultInstagram: row.instagram,
      defaultFacebook: row.facebook,
      defaultYoutube: row.youtube,
      defaultX: row.x,
      defaultPinterest: row.pinterest,
      defaultTiktok: row.tiktok,
    }))
  }

  if (customer.contact || customer.phone || customer.email || customer.website) {
    return [{
      ...blankContactRow('contact-1'),
      defaultName: customer.contact || '',
      defaultPhone: customer.phone || '',
      defaultEmail: customer.email || '',
      defaultWebsite: customer.website || '',
    }]
  }

  return [blankContactRow('contact-1')]
}

function pickContactByPriority(contacts, priorityIds) {
  for (const id of priorityIds) {
    const match = contacts.find((row) => row.id === id && contactHasContent(row))
    if (match) return match
  }
  return contacts.find((row) => contactHasContent(row)) || null
}

export function resolvePrimaryContact(contacts = [], fallback = {}) {
  const normalized = contacts.map(normalizeContactRow)
  const primary = pickContactByPriority(normalized, ['authorized', 'owner', 'other'])
    || normalizeContactRow({
      name: fallback.contact || '',
      phone: fallback.phone || '',
      email: fallback.email || '',
      website: fallback.website || '',
    })

  return {
    contactName: primary.name || fallback.contact || '',
    phone: primary.phone || fallback.phone || '',
    email: primary.email || fallback.email || '',
    website: primary.website || fallback.website || '',
    contacts: normalized,
  }
}

export function resolveCustomerContactInfo(customer) {
  if (!customer) {
    return { contactName: '', phone: '', email: '', website: '', contacts: [] }
  }

  const contacts = Array.isArray(customer.contacts) && customer.contacts.length
    ? customer.contacts.map(normalizeContactRow)
    : []

  return resolvePrimaryContact(contacts, customer)
}

export function getCustomerContacts(customer) {
  return resolveCustomerContactInfo(customer).contacts
}
