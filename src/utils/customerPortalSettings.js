import { readCompanySettings } from './companySettings'

const SETTINGS_KEY = 'erlenbox-customer-portal-settings'

export function defaultPortalSettings(customer) {
  const company = readCompanySettings()
  return {
    paymentReminder: false,
    onlineCollection: false,
    sharedIbanIds: company.bankAccounts.map((account) => account.id),
    accessEmails: customer?.email ? [customer.email] : [],
  }
}

function readAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(map) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(map))
  window.dispatchEvent(new CustomEvent('erlenbox:portal-settings-updated'))
}

export function readCustomerPortalSettings(customerId, customer) {
  const saved = readAll()[customerId]
  if (!saved) return defaultPortalSettings(customer)
  return { ...defaultPortalSettings(customer), ...saved }
}

export function saveCustomerPortalSettings(customerId, settings) {
  const map = readAll()
  map[customerId] = settings
  writeAll(map)
  return settings
}

export function updateCustomerPortalSettings(customerId, customer, partial) {
  const current = readCustomerPortalSettings(customerId, customer)
  return saveCustomerPortalSettings(customerId, { ...current, ...partial })
}
