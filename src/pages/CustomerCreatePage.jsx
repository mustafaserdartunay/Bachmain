import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, ExternalLink, Loader2, Plus, Save, X } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Dropdown, DropdownItem, DropdownSeparator } from '@bachmain/ui'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
} from '../components/Layout/AppPageLayout'
import {
  PAGE_FILTER_FIELD_CLASS,
  PAGE_FILTER_LABEL_CLASS,
  PAGE_FILTER_MENU_CLASS,
  PAGE_FILTER_PILL_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  YF_TEXT_CLASS,
  YF_TEXT_ON_COLOR_CLASS,
} from '../utils/dashboardDesign'
import {
  HEADER_ACTION_CTA_DIVIDER_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_CTA_SHELL_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../components/Layout/HeaderCashActionsPanel'
import ConfirmModal from '../components/Common/ConfirmModal'
import { DeleteTrashButton } from '../components/Common/ListDeleteConfirmPanel'
import { findCustomerProfile, saveCustomerProfile } from '../data/customerProfiles'
import { flushWorkspaceNow } from '../utils/workspaceStorage'
import { publishDomainEvent } from '../workflow/eventBus'
import {
  getTreasuryAccounts,
  getTreasuryMovements,
  saveTreasuryMovements,
} from '../utils/treasuryStore'
import { getCustomerDisplay } from '../utils/customerDisplay'
import {
  createNextContactRow,
  initialContactRowsFromCustomer,
  parseContactsFromFormPayload,
  resolveContactLinkHref,
  resolvePrimaryContact,
} from '../utils/customerContacts'
import {
  CUSTOMER_META_KEY,
  SUPPLIER_TYPE_LABEL,
  notifyCustomerMetaUpdated,
  readCustomerMeta,
  readOptionLists,
  saveOptionList,
} from '../utils/customerMeta'
import EditableDropdownPill from '../components/EditableDropdownPill'
import { checkCustomerDuplicates } from '../utils/mdmDuplicateCheck'

const DRAFTS_KEY = 'erlenbox-customer-form-drafts'

const FORM_INPUT_CLASS =
  'form-input !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]'

const DOCUMENT_ADD_CTA_CLASS =
  'quote-ms-cta-plain group inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--search-border)] bg-transparent text-[14px] font-normal text-[var(--muted)] transition-colors hover:text-[#2563eb] focus:text-[#2563eb] active:text-[#2563eb] [&_svg]:text-[#2563eb]'

const LINE_DELETE_BTN_CLASS =
  'glass-sidebar-toggle flex h-7 w-7 items-center justify-center rounded-xl text-[var(--muted)] transition-colors'

function Field({ label, children, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <label className={`${YF_TEXT_CLASS} mb-1 block`}>{label}</label>
      {children}
    </div>
  )
}

function emptyMeta(defaultType = '') {
  return { type: defaultType, representative: '', scoring: '', category: '' }
}

function readMetaFor(customerId, defaultType = '') {
  if (!customerId) return emptyMeta(defaultType)
  const saved = readCustomerMeta()[customerId] || {}
  return {
    type: saved.type || defaultType,
    representative: saved.representative || '',
    scoring: saved.scoring || '',
    category: saved.category || '',
  }
}

function initialContactRows(customer, draft) {
  if (!customer && draft && (draft.phone || draft.email)) {
    return [
      {
        id: 0,
        title: 'Google Maps',
        locked: false,
        defaultName: '',
        defaultPhone: draft.phone || '',
        defaultEmail: draft.email || '',
      },
    ]
  }
  return initialContactRowsFromCustomer(customer)
}

function initialAddressRows(customer, draft) {
  const saved = Array.isArray(customer?.addresses) ? customer.addresses : []
  if (saved.length) {
    return saved.map((row, index) => ({
      id: row.id ?? index,
      defaultTitle: row.title || '',
      defaultAddress: row.address || '',
      defaultLocation: [row.city, row.district].filter(Boolean).join(' / '),
      defaultMapsUrl: row.mapsUrl || '',
    }))
  }
  return [
    {
      id: 0,
      defaultTitle: customer ? 'Merkez Adres' : '',
      defaultAddress: draft?.address || customer?.address || '',
      defaultLocation: draft
        ? [draft.city, draft.district].filter(Boolean).join(' / ')
        : customer?.city || '',
      defaultMapsUrl: draft?.mapsUrl || customer?.googleMapsUrl || '',
    },
  ]
}

const SAVE_PHASE_MS = 1000

function waitMs(ms, timerRef) {
  return new Promise((resolve) => {
    if (timerRef?.current) clearTimeout(timerRef.current)
    const id = setTimeout(resolve, ms)
    if (timerRef) timerRef.current = id
  })
}

function formatDateTime() {
  return new Date().toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toLeadingLowerCase(raw) {
  const text = String(raw ?? '')
  const first = text.search(/\p{L}/u)
  if (first < 0) return text
  return (
    text.slice(0, first) + text.charAt(first).toLocaleLowerCase('tr-TR') + text.slice(first + 1)
  )
}

function toSentenceCase(raw) {
  const text = String(raw ?? '')
  const first = text.search(/\p{L}/u)
  if (first < 0) return text.toLocaleLowerCase('tr-TR')
  return (
    text.slice(0, first) +
    text.charAt(first).toLocaleUpperCase('tr-TR') +
    text.slice(first + 1).toLocaleLowerCase('tr-TR')
  )
}

function ContactLinkInput({ name, defaultValue = '', placeholder, platform = 'web' }) {
  const [value, setValue] = useState(() => toLeadingLowerCase(defaultValue))
  const href = resolveContactLinkHref(value, { platform })

  return (
    <div className="flex min-w-0 items-center gap-1">
      <input
        name={name}
        value={value}
        onChange={(event) => setValue(toLeadingLowerCase(event.target.value))}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={`${FORM_INPUT_CLASS} min-w-0 flex-1`}
      />
      <span className="contact-link-action flex h-10 w-8 shrink-0 items-center justify-center">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-link-button flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
            title="Sayfaya git"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </span>
    </div>
  )
}

function SentenceCaseInput({ name, defaultValue = '', className = '' }) {
  const inputRef = useRef(null)
  const caretRef = useRef(null)
  const [value, setValue] = useState(() => toSentenceCase(defaultValue))

  useEffect(() => {
    const caret = caretRef.current
    if (caret == null || !inputRef.current) return
    caretRef.current = null
    inputRef.current.setSelectionRange(caret, caret)
  }, [value])

  return (
    <input
      ref={inputRef}
      name={name}
      value={value}
      onChange={(event) => {
        caretRef.current = event.target.selectionStart
        setValue(toSentenceCase(event.target.value))
      }}
      className={className}
    />
  )
}

function DeleteConfirmInline({
  deleteState,
  onDelete,
  onCancel,
  onApprove,
  title,
  description = 'Bu işlem geri alınamaz.',
}) {
  return (
    <DeleteTrashButton
      pending={deleteState}
      onClick={onDelete}
      onConfirm={onApprove}
      onCancel={onCancel}
      buttonTitle={title}
      title="Silinsin mi?"
      description={description}
      popoverClassName="absolute right-0 top-1/2 z-20 -translate-y-1/2"
      wrapperClassName="relative z-10 flex items-center justify-end gap-1.5"
      buttonClassName={LINE_DELETE_BTN_CLASS}
    />
  )
}

function AddressBlock({
  id,
  defaultTitle = '',
  defaultAddress = '',
  defaultLocation = '',
  defaultMapsUrl = '',
  canDelete = false,
  deleteState,
  onDelete,
  onCancel,
  onApprove,
}) {
  const [city = '', district = ''] = String(defaultLocation)
    .split('/')
    .map((part) => part.trim())

  return (
    <div
      className={
        canDelete
          ? 'grid grid-cols-[minmax(0,1fr)_28px] items-start gap-2 rounded-xl border border-[var(--glass-border)] p-3'
          : 'rounded-xl border border-[var(--glass-border)] p-3'
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Adres Başlığı :">
          <input
            name={`addressTitle-${id}`}
            defaultValue={defaultTitle}
            className={FORM_INPUT_CLASS}
          />
        </Field>
        <Field label="Konum :">
          <ContactLinkInput name={`mapsUrl-${id}`} defaultValue={defaultMapsUrl} platform="web" />
        </Field>
        <Field label="Adres :" className="sm:col-span-2">
          <input
            name={`address-${id}`}
            defaultValue={defaultAddress}
            className={FORM_INPUT_CLASS}
          />
        </Field>
        <Field label="İlçe :">
          <input name={`district-${id}`} defaultValue={district} className={FORM_INPUT_CLASS} />
        </Field>
        <Field label="İl :">
          <input name={`city-${id}`} defaultValue={city} className={FORM_INPUT_CLASS} />
        </Field>
      </div>
      {canDelete ? (
        <DeleteConfirmInline
          deleteState={deleteState}
          onDelete={onDelete}
          onCancel={onCancel}
          onApprove={onApprove}
          title="Sil"
        />
      ) : null}
    </div>
  )
}

function ContactBlock({
  id,
  defaultTitle = '',
  lockedTitle = false,
  defaultValue = '',
  phoneDefault = '',
  gsmDefault = '',
  orderLineDefault = '',
  emailDefault = '',
  websiteDefault = '',
  instagramDefault = '',
  facebookDefault = '',
  youtubeDefault = '',
  xDefault = '',
  pinterestDefault = '',
  tiktokDefault = '',
  canDelete = false,
  deleteState,
  onDelete,
  onCancel,
  onApprove,
}) {
  return (
    <div
      className={
        canDelete
          ? 'grid grid-cols-[minmax(0,1fr)_28px] items-start gap-2 rounded-xl border border-[var(--glass-border)] p-3'
          : 'rounded-xl border border-[var(--glass-border)] p-3'
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Başlık :">
          {lockedTitle ? (
            <div className={`${FORM_INPUT_CLASS} flex min-h-10 items-center`}>
              {defaultTitle}
              <input type="hidden" name={`contactTitle-${id}`} value={defaultTitle} />
            </div>
          ) : (
            <SentenceCaseInput
              name={`contactTitle-${id}`}
              defaultValue={defaultTitle}
              className={FORM_INPUT_CLASS}
            />
          )}
        </Field>
        <Field label="İsim :">
          <input
            name={`contactName-${id}`}
            defaultValue={defaultValue}
            className={FORM_INPUT_CLASS}
          />
        </Field>
        <Field label="Telefon :">
          <input
            name={`contactPhone-${id}`}
            defaultValue={phoneDefault}
            className={FORM_INPUT_CLASS}
          />
        </Field>
        <Field label="Gsm :">
          <input name={`contactGsm-${id}`} defaultValue={gsmDefault} className={FORM_INPUT_CLASS} />
        </Field>
        <Field label="Sipariş hattı :">
          <input
            name={`contactOrderLine-${id}`}
            defaultValue={orderLineDefault}
            className={FORM_INPUT_CLASS}
          />
        </Field>
        <Field label="E-posta :">
          <input
            name={`contactEmail-${id}`}
            defaultValue={emailDefault}
            className={FORM_INPUT_CLASS}
          />
        </Field>
        <Field label="Web :">
          <ContactLinkInput
            name={`contactWebsite-${id}`}
            defaultValue={websiteDefault}
            platform="web"
          />
        </Field>
        <Field label="Instagram :">
          <ContactLinkInput
            name={`contactInstagram-${id}`}
            defaultValue={instagramDefault}
            platform="instagram"
          />
        </Field>
        <Field label="Facebook :">
          <ContactLinkInput
            name={`contactFacebook-${id}`}
            defaultValue={facebookDefault}
            platform="facebook"
          />
        </Field>
        <Field label="YouTube :">
          <ContactLinkInput
            name={`contactYoutube-${id}`}
            defaultValue={youtubeDefault}
            platform="youtube"
          />
        </Field>
        <Field label="X :">
          <ContactLinkInput name={`contactX-${id}`} defaultValue={xDefault} platform="x" />
        </Field>
        <Field label="Pinterest :">
          <ContactLinkInput
            name={`contactPinterest-${id}`}
            defaultValue={pinterestDefault}
            platform="pinterest"
          />
        </Field>
        <Field label="TikTok :">
          <ContactLinkInput
            name={`contactTiktok-${id}`}
            defaultValue={tiktokDefault}
            platform="tiktok"
          />
        </Field>
      </div>
      {canDelete ? (
        <DeleteConfirmInline
          deleteState={deleteState}
          onDelete={onDelete}
          onCancel={onCancel}
          onApprove={onApprove}
          title="Sil"
        />
      ) : null}
    </div>
  )
}

export default function CustomerCreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const formRouteKey = searchParams.toString()
  const editingCustomer = searchParams.get('edit')
    ? findCustomerProfile(searchParams.get('edit'))
    : null
  const isSupplierForm = searchParams.get('kind') === 'supplier'
  const defaultPartyType = isSupplierForm ? SUPPLIER_TYPE_LABEL : 'Müşteri'
  const backPath = isSupplierForm ? '/suppliers' : '/musteriler'
  const cancelPath = editingCustomer?.id
    ? isSupplierForm
      ? `/suppliers/${editingCustomer.id}`
      : `/musteriler/${editingCustomer.id}`
    : backPath
  const pageHeading = editingCustomer
    ? isSupplierForm
      ? 'TEDARİKÇİ DÜZENLE'
      : 'MÜŞTERİ DÜZENLE'
    : isSupplierForm
      ? 'YENİ TEDARİKÇİ OLUŞTUR'
      : 'YENİ MÜŞTERİ OLUŞTUR'
  const listLabel = isSupplierForm ? 'Tedarikçiler' : 'Müşteriler'
  const incomingDraft = !editingCustomer ? location.state?.customerDraft : null
  const [openingEnabled, setOpeningEnabled] = useState(() =>
    Boolean(editingCustomer?.hasOpeningBalance),
  )
  const [addressRows, setAddressRows] = useState(() =>
    initialAddressRows(editingCustomer, incomingDraft),
  )
  const [contactRows, setContactRows] = useState(() =>
    initialContactRows(editingCustomer, incomingDraft),
  )
  const [deleteDialog, setDeleteDialog] = useState(null)
  const [savePhase, setSavePhase] = useState('idle')
  const [formNotice, setFormNotice] = useState(null)
  const [duplicatePrompt, setDuplicatePrompt] = useState(null)
  const [formEpoch, setFormEpoch] = useState(0)
  const [meta, setMeta] = useState(() =>
    incomingDraft?.category
      ? { ...emptyMeta(), category: incomingDraft.category }
      : readMetaFor(editingCustomer?.id, ''),
  )
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [activeMenu, setActiveMenu] = useState(null)
  const saveTimer = useRef(null)
  const duplicateResolveRef = useRef(null)
  const focusFirstFieldRef = useRef(false)

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    },
    [],
  )

  useEffect(() => {
    setAddressRows(initialAddressRows(editingCustomer, incomingDraft))
    setContactRows(initialContactRows(editingCustomer, incomingDraft))
    setOpeningEnabled(Boolean(editingCustomer?.hasOpeningBalance))
    setDeleteDialog(null)
    setMeta(
      incomingDraft?.category
        ? { ...emptyMeta(), category: incomingDraft.category }
        : readMetaFor(editingCustomer?.id, ''),
    )
  }, [defaultPartyType, editingCustomer?.id, formRouteKey, incomingDraft])

  useEffect(() => {
    if (!focusFirstFieldRef.current) return
    focusFirstFieldRef.current = false
    document
      .querySelector('#customer-edit-form input[name="shortBrandName"]')
      ?.focus({ preventScroll: false })
  }, [formEpoch])

  useEffect(() => {
    if (!activeMenu) return undefined
    function closeActiveMenu() {
      setActiveMenu(null)
    }
    document.addEventListener('click', closeActiveMenu)
    return () => document.removeEventListener('click', closeActiveMenu)
  }, [activeMenu])

  function updateOptionList(field, nextOptions) {
    setOptionLists((current) => ({ ...current, [field]: nextOptions }))
    saveOptionList(field, nextOptions)
  }

  useEffect(() => {
    function refreshOptionLists() {
      setOptionLists(readOptionLists())
    }
    window.addEventListener('bach:option-lists-updated', refreshOptionLists)
    return () => window.removeEventListener('bach:option-lists-updated', refreshOptionLists)
  }, [])

  function updateMetaField(field, value) {
    setMeta((current) => ({ ...current, [field]: value }))
    if (field === 'type' && String(value || '').trim()) setFormNotice(null)
  }

  function persistMeta(customerId) {
    if (!customerId) return
    const current = readCustomerMeta()
    const next = {
      ...current,
      [customerId]: {
        ...(current[customerId] || {}),
        type: meta.type,
        representative: meta.representative,
        scoring: meta.scoring,
        category: meta.category,
      },
    }
    localStorage.setItem(CUSTOMER_META_KEY, JSON.stringify(next))
    notifyCustomerMetaUpdated({ customerId, field: 'type' })
  }

  function saveDraft(payload) {
    const saved = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}')
    const draftId = editingCustomer?.id || `NEW-${Date.now()}`
    localStorage.setItem(
      DRAFTS_KEY,
      JSON.stringify({
        ...saved,
        [draftId]: {
          ...payload,
          savedAt: new Date().toISOString(),
        },
      }),
    )
  }

  function parseAddresses(payload) {
    return addressRows
      .map((row) => ({
        id: String(row.id),
        title: payload[`addressTitle-${row.id}`] || '',
        address: payload[`address-${row.id}`] || '',
        city: payload[`city-${row.id}`] || '',
        district: payload[`district-${row.id}`] || '',
        mapsUrl: payload[`mapsUrl-${row.id}`] || '',
      }))
      .filter((row) => row.title || row.address || row.city || row.district || row.mapsUrl)
  }

  function buildCustomerProfile(payload, rows = contactRows) {
    const addresses = parseAddresses(payload)
    const primaryAddress = addresses[0] || {}
    const companyTitle =
      payload.companyTitle || editingCustomer?.company || payload.shortBrandName || ''
    const shortBrandName = payload.shortBrandName || getCustomerDisplay(companyTitle).brandShortName
    const contacts = parseContactsFromFormPayload(payload, rows)
    const primary = resolvePrimaryContact(contacts, editingCustomer || {})
    return {
      id: editingCustomer?.id,
      company: companyTitle,
      shortBrandName,
      companyTitle,
      contact: primary.contactName,
      email: primary.email,
      phone: primary.phone,
      contacts,
      addresses,
      addressTitle: primaryAddress.title || '',
      city: [primaryAddress.city, primaryAddress.district].filter(Boolean).join(' / '),
      address: primaryAddress.address || incomingDraft?.address || editingCustomer?.address || '',
      lat: incomingDraft?.lat ?? editingCustomer?.lat ?? null,
      lng: incomingDraft?.lng ?? editingCustomer?.lng ?? null,
      website: primary.website || incomingDraft?.website || editingCustomer?.website || '',
      googleMapsUrl:
        primaryAddress.mapsUrl || incomingDraft?.mapsUrl || editingCustomer?.googleMapsUrl || '',
      googlePlaceId: incomingDraft?.placeId || editingCustomer?.googlePlaceId || '',
      taxOffice: payload.taxOffice || editingCustomer?.taxOffice || '',
      taxNumber: payload.taxNumber || editingCustomer?.taxNumber || '',
      priceList: payload.priceList || editingCustomer?.priceList || '',
      currencyRate: payload.currencyRate || editingCustomer?.currencyRate || '',
      hasOpeningBalance: Boolean(payload.hasOpeningBalance),
      balance: payload.hasOpeningBalance
        ? Number(payload.openingBalanceAmount || 0)
        : Number(editingCustomer?.balance || 0),
    }
  }

  function syncOpeningBalance(payload) {
    const draftId = editingCustomer?.id || payload.shortBrandName || `NEW-${Date.now()}`
    const movementId = `OPENING-${draftId}`
    const amount = Number(payload.openingBalanceAmount || 0)
    const currentMovements = getTreasuryMovements().filter((movement) => movement.id !== movementId)

    if (!payload.hasOpeningBalance || amount <= 0) {
      saveTreasuryMovements(currentMovements)
      return
    }

    const account = getTreasuryAccounts()[0]
    saveTreasuryMovements([
      {
        id: movementId,
        accountId: account?.id || 'cash-main',
        accountName: account?.name || 'Kasa',
        direction: 'in',
        type: 'Açılış Bakiyesi',
        customerName: payload.companyTitle || editingCustomer?.company || payload.shortBrandName,
        method: 'Açılış',
        amount,
        date: formatDateTime(),
        description: `${payload.companyTitle || editingCustomer?.company || payload.shortBrandName} açılış bakiyesi`,
        status: 'İşlendi',
      },
      ...currentMovements,
    ])
  }

  async function assertNoStrongDuplicates(payload) {
    if (editingCustomer?.id) return true
    let matches = []
    try {
      const primary = resolvePrimaryContact(contactRows)
      const result = await checkCustomerDuplicates(
        {
          name: payload.companyTitle || payload.shortBrandName,
          email: primary.email || payload.email,
          phone: primary.phone || payload.phone,
          taxNo: payload.taxNumber,
        },
        { excludeId: editingCustomer?.id },
      )
      matches = result?.matches || []
    } catch (error) {
      console.warn('Çift kayıt kontrolü yapılamadı', error)
      return true
    }
    const strong = matches.filter((m) => m.score >= 0.7)
    if (!strong.length) return true
    const summary = strong
      .slice(0, 5)
      .map((m) => `${m.name || m.id} (%${Math.round(m.score * 100)})`)
      .join(' · ')
    setSavePhase('idle')
    return new Promise((resolve) => {
      duplicateResolveRef.current = resolve
      setDuplicatePrompt(summary)
    })
  }

  function resolveDuplicatePrompt(confirmed) {
    const resolve = duplicateResolveRef.current
    duplicateResolveRef.current = null
    setDuplicatePrompt(null)
    resolve?.(confirmed)
  }

  async function saveForm(form) {
    if (!String(meta.type || '').trim()) {
      setFormNotice('Kaydetmeden önce Tipi alanını seçin.')
      document
        .querySelector('#customer-edit-form .customer-form-primary-panel')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return false
    }
    setFormNotice(null)
    setSavePhase('saving')
    const formData = new FormData(form)
    const payload = Object.fromEntries(formData.entries())
    payload.hasOpeningBalance = formData.has('hasOpeningBalance')
    if (!(await assertNoStrongDuplicates(payload))) {
      setSavePhase('idle')
      return false
    }

    setSavePhase('saving')
    try {
      saveDraft(payload)
      const savedProfile = saveCustomerProfile(buildCustomerProfile(payload, contactRows))
      persistMeta(savedProfile.id)
      syncOpeningBalance(payload)
      publishDomainEvent(
        editingCustomer?.id ? 'trigger.customer.updated' : 'trigger.customer.created',
        {
          customerId: savedProfile.id,
          name: savedProfile.name || payload.name || payload.firmaAdi,
        },
        { source: 'CustomerCreatePage' },
      )
      flushWorkspaceNow()
    } catch (error) {
      console.error('Müşteri kaydedilemedi', error)
      setSavePhase('idle')
      setFormNotice('Kayıt tamamlanamadı. Bilgileri kontrol edip yeniden deneyin.')
      return false
    }
    form.reset()
    setAddressRows(initialAddressRows(null, null))
    setContactRows(initialContactRows(null, null))
    setOpeningEnabled(false)
    setMeta(emptyMeta())
    return true
  }

  async function runSave(form) {
    try {
      return await saveForm(form)
    } catch (error) {
      console.error('Müşteri kaydedilemedi', error)
      setSavePhase('idle')
      setFormNotice('Kayıt tamamlanamadı. Bilgileri kontrol edip yeniden deneyin.')
      return false
    }
  }

  async function playSaveButtonPhases(startedAt) {
    const remainingSaving = Math.max(0, SAVE_PHASE_MS - (Date.now() - startedAt))
    if (remainingSaving > 0) await waitMs(remainingSaving, saveTimer)
    setSavePhase('saved')
    await waitMs(SAVE_PHASE_MS, saveTimer)
  }

  async function saveAndReturnToList() {
    if (savePhase !== 'idle') return
    const form = document.getElementById('customer-edit-form')
    if (!form) return
    const startedAt = Date.now()
    if (!(await runSave(form))) return
    await playSaveButtonPhases(startedAt)
    navigate(backPath)
  }

  async function saveAndContinue() {
    if (savePhase !== 'idle') return
    const form = document.getElementById('customer-edit-form')
    if (!form) return
    const startedAt = Date.now()
    if (!(await runSave(form))) return
    const nextSearch = isSupplierForm ? '?kind=supplier' : ''
    if (formRouteKey !== nextSearch.replace('?', '')) {
      navigate(`/musteriler/yeni${nextSearch}`, { replace: true })
    }
    await playSaveButtonPhases(startedAt)
    focusFirstFieldRef.current = true
    setFormEpoch((epoch) => epoch + 1)
    setSavePhase('idle')
  }

  async function collectAndSave(event) {
    event?.preventDefault()
    await saveAndReturnToList()
  }

  function confirmTwoStepDelete(label, onConfirm, key) {
    setDeleteDialog({ key, label, onConfirm })
  }

  function closeDeleteDialog() {
    setDeleteDialog(null)
  }

  function approveDeleteDialog() {
    deleteDialog?.onConfirm()
    setDeleteDialog(null)
  }

  const busy = savePhase !== 'idle'
  const saveLabel =
    savePhase === 'saving' ? 'Kaydediliyor...' : savePhase === 'saved' ? 'Kaydedildi' : 'Kaydet'

  return (
    <AppPageShell className="customers-page-type w-full">
      <ConfirmModal
        open={Boolean(duplicatePrompt)}
        title="Olası çift kayıt"
        description={`Bu bilgilerle eşleşen kayıtlar bulundu: ${duplicatePrompt || ''}. Yine de kaydetmek istiyor musunuz?`}
        confirmLabel="Yine de kaydet"
        cancelLabel="Vazgeç"
        onConfirm={() => resolveDuplicatePrompt(true)}
        onCancel={() => resolveDuplicatePrompt(false)}
      />

      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink to={backPath} label={listLabel} />}
        centerTitle={pageHeading}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
        actions={
          <div className="relative flex shrink-0 items-center gap-2" data-customer-dropdown>
            <div
              className={`relative inline-flex overflow-hidden ${HEADER_ACTION_CTA_SHELL_CLASS} ${HEADER_ACTION_GRADIENTS.success}`}
            >
              <button
                type="button"
                onClick={saveAndReturnToList}
                disabled={busy}
                aria-busy={savePhase === 'saving'}
                className="inline-flex h-full items-center gap-2.5 bg-transparent px-3 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                  {savePhase === 'saving' ? (
                    <Loader2
                      className={`${HEADER_ACTION_CTA_ICON_CLASS} animate-spin`}
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  ) : savePhase === 'saved' ? (
                    <Check
                      className={HEADER_ACTION_CTA_ICON_CLASS}
                      strokeWidth={2.25}
                      aria-hidden
                    />
                  ) : (
                    <Save className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
                  )}
                </span>
                <span className={YF_TEXT_ON_COLOR_CLASS}>{saveLabel}</span>
              </button>
              <span className={HEADER_ACTION_CTA_DIVIDER_CLASS} aria-hidden="true" />
              <Dropdown
                align="end"
                className="h-full"
                menuClassName={PAGE_FILTER_MENU_CLASS}
                trigger={
                  <button
                    type="button"
                    disabled={busy}
                    className="inline-flex h-full w-12 items-center justify-center bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    title="Kaydet seçenekleri"
                    aria-label="Kaydet seçenekleri"
                  >
                    <ChevronDown className={HEADER_ACTION_CTA_ICON_CLASS} aria-hidden="true" />
                  </button>
                }
              >
                {({ close }) => (
                  <>
                    <DropdownItem
                      icon={Save}
                      label="Kaydet ve Düzenlemeye Devam Et"
                      tone="primary"
                      close={close}
                      onClick={saveAndContinue}
                    />
                    <DropdownSeparator />
                    <DropdownItem
                      icon={X}
                      label="Vazgeç"
                      tone="danger"
                      close={close}
                      onClick={() => navigate(cancelPath)}
                    />
                  </>
                )}
              </Dropdown>
            </div>
          </div>
        }
      />

      {formNotice ? (
        <p
          role="alert"
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[14px] font-normal leading-tight tracking-normal text-rose-600"
        >
          {formNotice}
        </p>
      ) : null}

      <form
        key={`customer-edit-form-${editingCustomer?.id || 'new'}-${formEpoch}`}
        id="customer-edit-form"
        onSubmit={collectAndSave}
        className="space-y-5 document-compact-controls"
        data-tour="customer-form"
      >
        <AppPagePanel
          className="customer-list-panel customer-form-primary-panel w-full"
          title={isSupplierForm ? 'Tedarikçi Bilgileri :' : 'Müşteri Bilgileri :'}
          dotColor="blue"
        >
          <div className="app-filter-bar grid min-w-0 w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className={PAGE_FILTER_FIELD_CLASS}>
              <p className={PAGE_FILTER_LABEL_CLASS}>Tipi :</p>
              <EditableDropdownPill
                value={meta.type}
                options={optionLists.type}
                onOptionsChange={(next) => updateOptionList('type', next)}
                openKey="create-type"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateMetaField('type', value)}
                buttonClassName={PAGE_FILTER_PILL_CLASS}
                menuClassName={PAGE_FILTER_MENU_CLASS}
              />
            </div>
            <div className={PAGE_FILTER_FIELD_CLASS}>
              <p className={PAGE_FILTER_LABEL_CLASS}>Temsilci :</p>
              <EditableDropdownPill
                value={meta.representative}
                options={optionLists.representative}
                onOptionsChange={(next) => updateOptionList('representative', next)}
                openKey="create-representative"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateMetaField('representative', value)}
                buttonClassName={PAGE_FILTER_PILL_CLASS}
                menuClassName={PAGE_FILTER_MENU_CLASS}
              />
            </div>
            <div className={PAGE_FILTER_FIELD_CLASS}>
              <p className={PAGE_FILTER_LABEL_CLASS}>Puantaj :</p>
              <EditableDropdownPill
                value={meta.scoring}
                options={optionLists.scoring}
                onOptionsChange={(next) => updateOptionList('scoring', next)}
                openKey="create-scoring"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateMetaField('scoring', value)}
                buttonClassName={PAGE_FILTER_PILL_CLASS}
                menuClassName={PAGE_FILTER_MENU_CLASS}
              />
            </div>
            <div className={PAGE_FILTER_FIELD_CLASS}>
              <p className={PAGE_FILTER_LABEL_CLASS}>Kategori :</p>
              <EditableDropdownPill
                value={meta.category}
                options={optionLists.category}
                onOptionsChange={(next) => updateOptionList('category', next)}
                openKey="create-category"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => updateMetaField('category', value)}
                buttonClassName={PAGE_FILTER_PILL_CLASS}
                menuClassName={PAGE_FILTER_MENU_CLASS}
              />
            </div>
          </div>
        </AppPagePanel>

        <AppPagePanel
          className="customer-list-panel w-full"
          title="Firma Bilgileri :"
          dotColor="blue"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Kısa Marka Adı :">
              <input
                name="shortBrandName"
                defaultValue={
                  editingCustomer
                    ? getCustomerDisplay(editingCustomer).brandShortName
                    : incomingDraft?.shortBrandName || ''
                }
                className={FORM_INPUT_CLASS}
              />
            </Field>
            <Field label="Firma Ünvanı :">
              <input
                name="companyTitle"
                defaultValue={
                  editingCustomer
                    ? getCustomerDisplay(editingCustomer).companyTitle
                    : incomingDraft?.companyTitle || ''
                }
                className={FORM_INPUT_CLASS}
              />
            </Field>
            <Field label="Vergi Dairesi :">
              <input
                name="taxOffice"
                defaultValue={editingCustomer?.taxOffice || ''}
                className={FORM_INPUT_CLASS}
              />
            </Field>
            <Field label="Vergi Numarası :">
              <input
                name="taxNumber"
                defaultValue={editingCustomer?.taxNumber || ''}
                className={FORM_INPUT_CLASS}
              />
            </Field>
          </div>
        </AppPagePanel>

        <AppPagePanel
          className="customer-list-panel w-full"
          title="Adres Bilgileri :"
          dotColor="blue"
        >
          <div className="space-y-3">
            {addressRows.map((row) => (
              <AddressBlock
                key={row.id}
                id={row.id}
                defaultTitle={row.defaultTitle || ''}
                defaultAddress={row.defaultAddress || ''}
                defaultLocation={row.defaultLocation || ''}
                defaultMapsUrl={row.defaultMapsUrl || ''}
                canDelete={addressRows.length > 1}
                deleteState={deleteDialog?.key === `address-${row.id}` ? deleteDialog : null}
                onDelete={() =>
                  confirmTwoStepDelete(
                    'Adres',
                    () => setAddressRows((rows) => rows.filter((item) => item.id !== row.id)),
                    `address-${row.id}`,
                  )
                }
                onCancel={closeDeleteDialog}
                onApprove={approveDeleteDialog}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAddressRows((rows) => [...rows, { id: Date.now() }])}
            className={`${DOCUMENT_ADD_CTA_CLASS} mt-3 w-full`}
          >
            <Plus className="h-3.5 w-3.5" /> Yeni Adres Ekle
          </button>
        </AppPagePanel>

        <AppPagePanel
          className="customer-list-panel w-full"
          title="İletişim Bilgileri :"
          dotColor="blue"
        >
          <div className="space-y-3">
            {contactRows.map((row) => (
              <ContactBlock
                key={row.id}
                id={row.id}
                defaultTitle={row.title}
                lockedTitle={row.locked}
                defaultValue={row.defaultName || ''}
                phoneDefault={row.defaultPhone || ''}
                gsmDefault={row.defaultGsm || ''}
                orderLineDefault={row.defaultOrderLine || ''}
                emailDefault={row.defaultEmail || ''}
                websiteDefault={row.defaultWebsite || ''}
                instagramDefault={row.defaultInstagram || ''}
                facebookDefault={row.defaultFacebook || ''}
                youtubeDefault={row.defaultYoutube || ''}
                xDefault={row.defaultX || ''}
                pinterestDefault={row.defaultPinterest || ''}
                tiktokDefault={row.defaultTiktok || ''}
                canDelete={contactRows.length > 1}
                deleteState={deleteDialog?.key === `contact-${row.id}` ? deleteDialog : null}
                onDelete={() =>
                  confirmTwoStepDelete(
                    'İletişim satırı',
                    () => setContactRows((rows) => rows.filter((item) => item.id !== row.id)),
                    `contact-${row.id}`,
                  )
                }
                onCancel={closeDeleteDialog}
                onApprove={approveDeleteDialog}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setContactRows((rows) => [...rows, createNextContactRow()])}
            className={`${DOCUMENT_ADD_CTA_CLASS} mt-3 w-full`}
          >
            <Plus className="h-3.5 w-3.5" /> İletişim Ekle
          </button>
        </AppPagePanel>

        <AppPagePanel
          className="customer-list-panel w-full"
          title="Finans Ayarları :"
          dotColor="blue"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Fiyat Listesi :">
              <select
                name="priceList"
                defaultValue={editingCustomer?.priceList || ''}
                className={FORM_INPUT_CLASS}
              >
                <option value="">Seçiniz</option>
                {['Hiçbiri', 'Standart Liste', 'Bayi Liste', 'Özel Fiyat Listesi'].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </Field>
            <Field label="Döviz Kuru :">
              <select
                name="currencyRate"
                defaultValue={editingCustomer?.currencyRate || ''}
                className={FORM_INPUT_CLASS}
              >
                <option value="">Seçiniz</option>
                {['Alış', 'Satış', 'Merkez Bankası', 'Sabit Kur'].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </Field>
            <Field label="Açılış Bakiyesi :">
              <label className="flex min-h-10 items-center gap-3 text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]">
                <input
                  name="hasOpeningBalance"
                  type="checkbox"
                  checked={openingEnabled}
                  onChange={(event) => setOpeningEnabled(event.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-ds-border accent-[var(--ds-ink,#1e2338)]"
                />
                Hareketlere eklensin
              </label>
            </Field>
            <Field label="Açılış Tutarı :">
              <input
                name="openingBalanceAmount"
                type="number"
                defaultValue={
                  editingCustomer?.hasOpeningBalance && editingCustomer?.balance
                    ? String(editingCustomer.balance)
                    : ''
                }
                disabled={!openingEnabled}
                className={`${FORM_INPUT_CLASS} ${!openingEnabled ? 'opacity-60' : ''}`}
              />
            </Field>
          </div>
        </AppPagePanel>
      </form>
    </AppPageShell>
  )
}
