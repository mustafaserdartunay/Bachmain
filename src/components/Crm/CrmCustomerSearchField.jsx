import { useEffect, useMemo, useRef, useState } from 'react'
import { findCustomerProfileByReference, getCustomerProfiles } from '../../data/customerProfiles'
import { getCustomerDisplay } from '../../utils/customerDisplay'
import { resolveCustomerContactInfo } from '../../utils/customerContacts'
import { resolveCustomerRepresentative } from '../../utils/customerMeta'

const FIELD_LABEL = 'mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-500'

function customerSearchTexts(customer) {
  const display = getCustomerDisplay(customer)
  const contactInfo = resolveCustomerContactInfo(customer)
  const savedContacts = (customer.contacts || []).flatMap((row) => [row.name, row.phone, row.email, row.instagram])
  return [
    customer.company,
    customer.companyTitle,
    display.brandShortName,
    display.companyTitle,
    customer.contact,
    customer.email,
    customer.phone,
    customer.address,
    customer.city,
    customer.taxNumber,
    customer.taxOffice,
    contactInfo.contactName,
    contactInfo.email,
    contactInfo.phone,
    ...savedContacts,
  ]
}

function resolveCustomerQuery(value) {
  const profile = findCustomerProfileByReference(value)
  if (profile) return getCustomerDisplay(profile).brandShortName || profile.company || value || ''
  return value || ''
}

function resolveStoredCustomer(customer) {
  const display = getCustomerDisplay(customer)
  return customer.companyTitle || customer.company || display.companyTitle || display.brandShortName
}

function getCustomerRepresentative(customer) {
  return resolveCustomerRepresentative(customer)
}

export default function CrmCustomerSearchField({ label = 'Müşteri', value, onChange, placeholder = 'Müşteri adı, yetkili veya e-posta ile ara...' }) {
  const pickerRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState(() => resolveCustomerQuery(value))
  const [customers, setCustomers] = useState(() => getCustomerProfiles())

  useEffect(() => {
    setQuery(resolveCustomerQuery(value))
  }, [value])

  useEffect(() => {
    function refreshProfiles() {
      setCustomers(getCustomerProfiles())
    }
    window.addEventListener('bach:customers-updated', refreshProfiles)
    return () => window.removeEventListener('bach:customers-updated', refreshProfiles)
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined
    function handleOutsideClick(event) {
      if (!pickerRef.current?.contains(event.target)) {
        setIsOpen(false)
        setQuery(resolveCustomerQuery(value))
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen, value])

  const normalizedQuery = query.trim().toLowerCase()
  const filteredCustomers = useMemo(() => (
    normalizedQuery
      ? customers.filter((customer) => customerSearchTexts(customer)
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(normalizedQuery)))
      : customers
  ), [customers, normalizedQuery])

  function selectCustomer(customer) {
    const contactInfo = resolveCustomerContactInfo(customer)
    onChange({
      customer: resolveStoredCustomer(customer),
      contact: contactInfo.contactName,
      email: contactInfo.email,
      phone: contactInfo.phone,
      representative: getCustomerRepresentative(customer),
    })
    setQuery(getCustomerDisplay(customer).brandShortName || resolveStoredCustomer(customer))
    setIsOpen(false)
  }

  return (
    <div ref={pickerRef} className="relative">
      <label className={FIELD_LABEL}>{label}</label>
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          onChange({ customer: event.target.value })
          setIsOpen(true)
        }}
        onFocus={() => {
          setCustomers(getCustomerProfiles())
          setIsOpen(true)
        }}
        placeholder={placeholder}
        className="form-input text-sm"
        autoComplete="off"
      />
      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-2xl border border-dark-500 bg-dark-900 p-2 shadow-card">
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {filteredCustomers.map((customer) => {
              const display = getCustomerDisplay(customer)
              const contactInfo = resolveCustomerContactInfo(customer)
              return (
                <button
                  key={customer.id || customer.company}
                  type="button"
                  onClick={() => selectCustomer(customer)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-dark-700"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{display.brandShortName}</p>
                    <p className="truncate text-xs text-gray-500">
                      {display.companyTitle}
                      {contactInfo.contactName ? ` · ${contactInfo.contactName}` : ''}
                      {contactInfo.email ? ` · ${contactInfo.email}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-300">
                    Seç
                  </span>
                </button>
              )
            })}
            {filteredCustomers.length === 0 && (
              <div className="rounded-xl border border-dashed border-dark-500/70 px-3 py-4 text-center text-xs font-semibold text-gray-500">
                Eşleşen müşteri bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
