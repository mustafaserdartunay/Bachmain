const companySuffixes = new Set(['Ltd.', 'Ltd', 'A.Ş.', 'A.Ş', 'Şti.', 'Şti'])

export function getBrandShortName(companyTitle = '') {
  const parts = String(companyTitle).split(' ').filter(Boolean)
  if (parts.length === 0) return ''

  const withoutSuffix = companySuffixes.has(parts.at(-1)) ? parts.slice(0, -1) : parts
  return withoutSuffix[0] || companyTitle
}

export function getCustomerDisplay(customerOrCompany = {}) {
  const isObject = customerOrCompany && typeof customerOrCompany === 'object'
  const companyTitle = isObject
    ? customerOrCompany.companyTitle || customerOrCompany.company || ''
    : String(customerOrCompany || '')
  const brandShortName = isObject
    ? customerOrCompany.shortBrandName || getBrandShortName(companyTitle)
    : getBrandShortName(companyTitle)

  return {
    brandShortName,
    companyTitle,
  }
}

/** Harita ve saha satış listeleri — şube + firma adı */
export function getCustomerBranchDisplay(customer = {}) {
  const display = getCustomerDisplay(customer)
  const cityParts = String(customer.city || '').split('/').map((part) => part.trim()).filter(Boolean)
  const district = cityParts[1] || cityParts[0] || ''

  return {
    branchName: display.brandShortName || String(customer.warehouse || '').trim() || district || 'Şube',
    companyName: display.companyTitle || customer.company || '',
    city: customer.city || '',
    address: customer.address || '',
  }
}
