import { useMemo, useState } from 'react'
import SearchInput from './SearchInput'
import { getCustomerProfiles } from '../../data/customerProfiles'
import {
  getCustomerMetaSelection,
  matchesPartyListFilter,
  readCustomerMeta,
} from '../../utils/customerMeta'

/** Shared modal for “Müşteri seçerek oluştur” flows on split create buttons. */
export default function CreateCustomerPickModal({
  open,
  onClose,
  onSelect,
  title = 'Müşteri Seçin',
  description = 'Oluşturmak için bir müşteri seçin.',
  listKind = 'all',
  searchPlaceholder = 'Müşteri ara...',
  emptyLabel = 'Müşteri bulunamadı.',
}) {
  const customers = useMemo(() => {
    if (listKind === 'all') return getCustomerProfiles()
    const settings = readCustomerMeta()
    return getCustomerProfiles().filter((profile) => {
      const selected = getCustomerMetaSelection(profile, settings[profile.id] || {})
      return matchesPartyListFilter(selected.type, listKind)
    })
  }, [open, listKind])
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return customers
    return customers.filter((item) =>
      [item.company, item.companyTitle, item.contact, item.phone, item.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [customers, search])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-dark-500/50 bg-dark-800 shadow-2xl">
        <div className="border-b border-dark-500/45 px-5 py-4">
          <h3 className="text-base font-black text-white">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
          <SearchInput
            wrapperClassName="mt-3"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-gray-500">{emptyLabel}</p>
          ) : (
            filtered.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => onSelect(customer)}
                className="flex w-full flex-col rounded-xl px-3 py-3 text-left transition-colors hover:bg-dark-700"
              >
                <span className="text-sm font-bold text-white">
                  {customer.company || customer.companyTitle}
                </span>
                <span className="text-xs text-gray-500">
                  {customer.contact || customer.phone || customer.email || '—'}
                </span>
              </button>
            ))
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-dark-500/45 px-5 py-4">
          <button type="button" onClick={onClose} className="btn-cancel px-4 text-xs font-bold">
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  )
}
