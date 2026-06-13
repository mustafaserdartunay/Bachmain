import { getCustomerProfiles } from '../data/customerProfiles'

function normalizePhone(value = '') {
  return String(value).replace(/\D/g, '').slice(-10)
}

function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase()
}

export function matchCustomer({ phone, email, name }) {
  const customers = getCustomerProfiles()
  const phoneKey = normalizePhone(phone)
  const emailKey = normalizeEmail(email)
  const nameKey = String(name || '').trim().toLowerCase()

  return customers.find((customer) => {
    const customerPhone = normalizePhone(customer.phone || customer.contactPhone || '')
    const customerEmail = normalizeEmail(customer.email)
    const customerName = String(customer.contact || customer.company || '').toLowerCase()

    if (phoneKey && customerPhone && customerPhone === phoneKey) return true
    if (emailKey && customerEmail && customerEmail === emailKey) return true
    if (nameKey && customerName && (customerName.includes(nameKey) || nameKey.includes(customerName))) return true
    return false
  }) || null
}
