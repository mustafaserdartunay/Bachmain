import { getCustomerDisplay } from './customerDisplay'
import { resolveCustomerContactInfo } from './customerContacts'
import { getCustomerMetaSelection, readCustomerMeta } from './customerMeta'

/** Map a customer profile onto quote/order/document draft fields. */
export function customerToDocumentPatch(customer) {
  if (!customer) return {}
  const display = getCustomerDisplay(customer)
  const contactInfo = resolveCustomerContactInfo(customer)
  const meta = getCustomerMetaSelection(customer, readCustomerMeta()[customer.id] || {})
  return {
    customerId: customer.id || '',
    customer: customer.companyTitle || customer.company || display.companyTitle || '',
    contact: contactInfo.contactName || '',
    email: contactInfo.email || '',
    phone: contactInfo.phone || '',
    owner:
      meta.representative || customer.representative || customer.assignedTo || customer.owner || '',
  }
}
