import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import SearchInput from '../Common/SearchInput'
import { Instagram, Landmark, Mail, MapPin, Phone, UserPlus, UserRound, Warehouse } from 'lucide-react'
import { customers as customerData } from '../../data/mockData'
import { findCustomerProfileByReference, getCustomerProfiles } from '../../data/customerProfiles'
import { getCustomerDisplay } from '../../utils/customerDisplay'
import {
  getCustomerContacts,
  resolveContactLinkHref,
  resolveCustomerContactInfo,
} from '../../utils/customerContacts'
import {
  getCustomerMetaSelection,
  getDefaultCustomerScoring,
  getDefaultCustomerType,
  readCustomerMeta,
  readOptionLists,
} from '../../utils/customerMeta'
import {
  formatTreasuryCurrency,
  getCustomerBalanceColor,
  getCustomerLiveBalance,
  getTreasuryMovements,
} from '../../utils/treasuryStore'
import { AppPanelDot } from '../Layout/AppPageLayout'
import { DROPDOWN_MENU_PORTAL_CLASS } from '../Common/DropdownMenu'
import { APP_PANEL_TITLE_CLASS, PAGE_FILTER_MENU_CLASS } from '../../utils/dashboardDesign'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'

const MS_SEARCH_CLASS =
  'customer-filter-search !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]'
const MENU_SHELL = `${DROPDOWN_MENU_PORTAL_CLASS} ${PAGE_FILTER_MENU_CLASS}`
const LIST_SCROLL_HIDE =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

function resolveCustomerWarehouse(customer) {
  if (!customer) return ''
  if (customer.warehouse) return customer.warehouse
  const city = String(customer.city || '').toLowerCase()
  if (city.includes('bursa')) return 'Bursa Depo'
  if (city.includes('izmir')) return 'İzmir Depo'
  return 'Merkez Depo'
}

function findDocumentCustomer(customerName) {
  return (
    findCustomerProfileByReference(customerName) ||
    (customerData.list || []).find((customer) => {
      const normalized = String(customerName || '')
        .trim()
        .toLowerCase()
      if (!normalized) return false
      const display = getCustomerDisplay(customer)
      return (
        customer.company?.toLowerCase() === normalized ||
        display.brandShortName.toLowerCase() === normalized ||
        display.companyTitle.toLowerCase() === normalized
      )
    }) ||
    null
  )
}

function customerSearchTexts(customer) {
  const display = getCustomerDisplay(customer)
  const contactInfo = resolveCustomerContactInfo(customer)
  const savedContacts = (customer.contacts || []).flatMap((row) => [
    row.name,
    row.phone,
    row.email,
    row.instagram,
  ])
  return [
    customer.company,
    customer.companyTitle,
    display.brandShortName,
    display.companyTitle,
    customer.contact,
    customer.email,
    customer.phone,
    contactInfo.contactName,
    contactInfo.email,
    contactInfo.phone,
    ...savedContacts,
  ]
}

function getCustomerRepresentative(customer) {
  if (!customer) return ''
  return (
    getCustomerMetaSelection(customer, readCustomerMeta()[customer.id] || {}).representative ||
    customer.representative ||
    customer.assignedTo ||
    customer.owner ||
    ''
  )
}

function buildMetaPills(customer) {
  const savedMeta = readCustomerMeta()[customer.id] || {}
  const meta = getCustomerMetaSelection(customer, savedMeta)
  const lists = readOptionLists()
  const entries = [
    ['type', meta.type || getDefaultCustomerType(customer), 'Tip'],
    ['scoring', meta.scoring || getDefaultCustomerScoring(customer), 'Puantaj'],
    ['category', savedMeta.category, 'Kategori'],
  ]

  return entries
    .filter(([, label]) => Boolean(label))
    .map(([key, label, title]) => ({
      title,
      label,
      color: lists[key]?.find((option) => option.label === label)?.color || 'bg-slate-500',
    }))
}

function buildBalancePill(customer) {
  const liveBalance = getCustomerLiveBalance(customer, getTreasuryMovements())
  return {
    title: 'Bakiye',
    label: formatTreasuryCurrency(liveBalance),
    color: getCustomerBalanceColor(liveBalance),
  }
}

function getCustomerScoreColor(score) {
  const value = Number(score) || 0
  if (value >= 90) return 'bg-emerald-500'
  if (value >= 80) return 'bg-blue-500'
  if (value >= 65) return 'bg-amber-500'
  if (value > 0) return 'bg-orange-500'
  return 'bg-slate-500'
}

function buildScorePill(customer) {
  const score = Number(customer.score) || 0
  return {
    title: 'Skor',
    label: String(score),
    color: getCustomerScoreColor(score),
  }
}

function buildRepresentativePill(owner) {
  if (!owner) return null
  const lists = readOptionLists()
  const match = lists.representative.find((option) => option.label === owner)
  return {
    title: 'Temsilci',
    label: owner,
    color: match?.color || 'bg-blue-500',
  }
}

function buildCustomerContactRows(customer, record) {
  const contacts = getCustomerContacts(customer)
  const priorityIds = ['owner', 'authorized', 'other']
  const orderedContacts = [
    ...priorityIds.map((id) => contacts.find((row) => row.id === id)).filter(Boolean),
    ...contacts.filter((row) => !priorityIds.includes(row.id)),
  ]

  const rows = orderedContacts
    .map((row) => ({
      key: row.id || row.title || row.name,
      title: row.title || 'İletişim',
      name: row.name,
      phone: row.phone,
      email: row.email,
      instagram: row.instagram,
    }))
    .filter((row) => row.name || row.phone || row.email || row.instagram)

  if (rows.length) return rows

  const contact = record.contact || customer.contact || ''
  const phone = record.phone || customer.phone || ''
  const email = record.email || customer.email || ''
  if (!contact && !phone && !email) return []

  return [
    {
      key: 'primary',
      title: 'Yetkili',
      name: contact,
      phone,
      email,
    },
  ]
}

function CustomerInfoStrip({ customer, record }) {
  const display = getCustomerDisplay(customer)
  const pills = buildMetaPills(customer)
  const scorePill = buildScorePill(customer)
  const balancePill = buildBalancePill(customer)
  const representativePill = buildRepresentativePill(record.owner)
  const metaItems = [scorePill, balancePill, representativePill, ...pills].filter(Boolean)

  const contactRows = buildCustomerContactRows(customer, record)
  const detailedAddress = customer.address?.trim() || customer.city || ''
  const warehouse = resolveCustomerWarehouse(customer)

  const detailLine = [
    warehouse && { icon: Warehouse, text: warehouse },
    detailedAddress && { icon: MapPin, text: detailedAddress },
  ].filter(Boolean)

  const taxLine = [
    customer.taxNumber && { label: 'Vergi No', text: customer.taxNumber },
    customer.taxOffice && { label: 'Vergi Dairesi', text: customer.taxOffice },
  ].filter(Boolean)

  return (
    <div className="mt-2 rounded-xl border border-dark-500/30 bg-dark-800/35 px-3 py-2">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-black text-white">
          {display.brandShortName || record.customer}
        </span>
        {display.companyTitle && display.companyTitle !== display.brandShortName && (
          <>
            <span className="text-[12px] text-gray-600">·</span>
            <span className="min-w-0 truncate text-xs font-semibold text-gray-400">
              {display.companyTitle}
            </span>
          </>
        )}
        {metaItems.length > 0 && (
          <span className="ml-auto flex flex-wrap items-end justify-end gap-2">
            {metaItems.map((item) => (
              <div
                key={`${item.title}-${item.label}`}
                className="flex flex-col items-center gap-0.5"
              >
                <span className="text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                  {item.title}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-dark-700/80 px-1.5 py-0.5 text-[12px] font-bold text-gray-300">
                  <span className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
                  {item.label}
                </span>
              </div>
            ))}
          </span>
        )}
      </div>

      {taxLine.length > 0 && (
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5">
          {taxLine.map(({ label, text }) => (
            <span
              key={label}
              className="inline-flex min-w-0 max-w-full items-center gap-1 text-[13px] text-gray-500"
            >
              <Landmark className="h-3 w-3 shrink-0 text-gray-600" />
              <span className="truncate">
                <span className="font-semibold text-gray-400">{label}:</span> {text}
              </span>
            </span>
          ))}
        </div>
      )}

      {contactRows.length > 0 && (
        <div className="mt-1 space-y-1">
          {contactRows.map((row) => {
            const items = [
              row.name && { icon: UserRound, text: row.name },
              row.phone && {
                icon: Phone,
                text: row.phone,
                href: `tel:${row.phone.replace(/\s/g, '')}`,
              },
              row.email && { icon: Mail, text: row.email, href: `mailto:${row.email}` },
              row.instagram && {
                icon: Instagram,
                text: row.instagram,
                href: resolveContactLinkHref(row.instagram, { instagram: true }),
                external: true,
              },
            ].filter(Boolean)

            return (
              <div key={row.key} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="inline-flex min-w-[88px] shrink-0 items-center text-[12px] font-black uppercase tracking-wide text-gray-500">
                  {row.title}
                </span>
                {items.map(({ icon: Icon, text, href, external }) => (
                  <span
                    key={`${row.key}-${text}`}
                    className="inline-flex min-w-0 max-w-full items-center gap-1 text-[13px] text-gray-400"
                  >
                    <Icon className="h-3 w-3 shrink-0 text-gray-600" />
                    {href ? (
                      <a
                        href={href}
                        target={external ? '_blank' : undefined}
                        rel={external ? 'noopener noreferrer' : undefined}
                        className="truncate transition-colors hover:text-blue-300"
                      >
                        {text}
                      </a>
                    ) : (
                      <span className="truncate">{text}</span>
                    )}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {detailLine.length > 0 && (
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-dark-500/20 pt-1">
          {detailLine.map(({ icon: Icon, text, href }) => (
            <span
              key={text}
              className="inline-flex min-w-0 max-w-full items-center gap-1 text-[13px] text-gray-500"
            >
              <Icon className="h-3 w-3 shrink-0 text-gray-600" />
              {href ? (
                <a href={href} className="truncate transition-colors hover:text-blue-300">
                  {text}
                </a>
              ) : (
                <span className="truncate">{text}</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export const DOCUMENT_SIDE_ACTION_WIDTH = 'w-[11.5rem] shrink-0'

export default function CustomerPicker({ record, quote, onPatch, allowCreate = true }) {
  const navigate = useNavigate()
  const doc = record || quote
  const [isOpen, setIsOpen] = useState(false)
  const [profileVersion, setProfileVersion] = useState(0)
  const customerOptions = getCustomerProfiles()
  const query = doc.customer || ''
  const normalizedQuery = query.trim().toLowerCase()
  const filteredCustomers = normalizedQuery
    ? customerOptions.filter((customer) =>
        customerSearchTexts(customer)
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
      )
    : customerOptions
  const matchedCustomer = findDocumentCustomer(query)
  const { anchorRef, menuRef, style: menuStyle } = useAnchoredPortal(isOpen, {
    placement: 'below',
    matchWidth: true,
    offset: 6,
    flip: true,
  })

  useEffect(() => {
    function refreshProfiles() {
      setProfileVersion((value) => value + 1)
    }
    window.addEventListener('bach:customers-updated', refreshProfiles)
    return () => window.removeEventListener('bach:customers-updated', refreshProfiles)
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined

    function handleOutsideClick(event) {
      if (anchorRef.current?.contains(event.target)) return
      if (menuRef.current?.contains(event.target)) return
      setIsOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [anchorRef, isOpen, menuRef])

  function selectCustomer(customer) {
    const display = getCustomerDisplay(customer)
    const contactInfo = resolveCustomerContactInfo(customer)
    onPatch({
      customerId: customer.id || '',
      customer: customer.companyTitle || customer.company || display.companyTitle,
      contact: contactInfo.contactName,
      email: contactInfo.email,
      phone: contactInfo.phone,
      owner: getCustomerRepresentative(customer),
    })
    setIsOpen(false)
  }

  return (
    <div className="col-span-2">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex shrink-0 items-center gap-2">
          <AppPanelDot color="blue" />
          <h2 className={APP_PANEL_TITLE_CLASS}>Müşteri :</h2>
        </div>
        <div ref={anchorRef} className="relative min-w-0 flex-1">
          <SearchInput
            value={query}
            onChange={(event) => {
              onPatch({ customerId: '', customer: event.target.value })
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Müşteri adı, yetkili veya e-posta ile ara..."
            className={MS_SEARCH_CLASS}
          />
        </div>
        {allowCreate ? (
          <button
            type="button"
            onClick={() => navigate('/musteriler/yeni')}
            className="quote-ms-cta-plain group inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--search-border)] bg-transparent px-3 text-[14px] font-normal text-[var(--muted)] transition-colors hover:text-[#2563eb] focus:text-[#2563eb] active:text-[#2563eb] [&_svg]:text-[#2563eb]"
          >
            <UserPlus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            Yeni Müşteri Oluştur
          </button>
        ) : null}
      </div>

      {isOpen &&
        menuStyle &&
        createPortal(
          <div ref={menuRef} style={menuStyle} className={`${MENU_SHELL} p-2`}>
            <div className={`max-h-64 space-y-1 overflow-y-auto ${LIST_SCROLL_HIDE}`}>
              {filteredCustomers.map((customer) => {
                const display = getCustomerDisplay(customer)
                return (
                  <button
                    key={customer.id || customer.company}
                    type="button"
                    onClick={() => selectCustomer(customer)}
                    className="quote-customer-option group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors"
                    data-tone="primary"
                  >
                    <div className="min-w-0">
                      <p className="customer-name-primary truncate">{display.brandShortName}</p>
                      {display.companyTitle ? (
                        <p className="customer-name-secondary truncate">{display.companyTitle}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[14px] font-normal text-[#2563eb]">Seç</span>
                  </button>
                )
              })}
              {filteredCustomers.length === 0 && (
                <div className="rounded-xl border border-dashed border-[var(--search-border)] px-3 py-4 text-center text-[14px] font-normal text-[var(--muted)]">
                  Eşleşen müşteri bulunamadı.
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}

      {matchedCustomer && (
        <CustomerInfoStrip
          key={`${matchedCustomer.id}-${profileVersion}`}
          customer={matchedCustomer}
          record={doc}
        />
      )}
    </div>
  )
}

export { findDocumentCustomer }
