import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Building2,
  ChevronDown,
  ExternalLink,
  Facebook,
  Globe,
  Hash,
  Instagram,
  Landmark,
  Mail,
  MapPin,
  Music2,
  Phone,
  Pin,
  Plus,
  Save,
  Twitter,
  UserRound,
  Users,
  WalletCards,
  X,
  Youtube,
} from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AppPageHeader } from '../components/Layout/AppPageLayout'
import { DeleteTrashButton } from '../components/Common/ListDeleteConfirmPanel'
import {
  FormFieldCompact,
  FormSectionPanel,
  FORM_FIELD_RULED_STACK_CLASS,
} from '../components/Common/FormSectionPanel'
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
import { LIST_PILL_CLASS } from '../components/Common/ListDeleteConfirmPanel'
import { useAnchoredPortal } from '../hooks/useAnchoredPortal'
import { DROPDOWN_MENU_PORTAL_CLASS } from '../components/Common/DropdownMenu'
import { checkCustomerDuplicates } from '../utils/mdmDuplicateCheck'
import { APP_FILTER_LABEL_CLASS, APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'

const DRAFTS_KEY = 'erlenbox-customer-form-drafts'

const CUSTOMER_FILTER_FIELD_CLASS =
  'customer-filter-field grid h-9 min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-full px-3'
const CUSTOMER_FILTER_LABEL_CLASS = `${APP_FILTER_LABEL_CLASS} !mb-0 shrink-0 !font-normal !tracking-normal !text-[var(--muted)]`
const CUSTOMER_FILTER_PILL_CLASS = `${LIST_PILL_CLASS} customer-filter-pill`
const CUSTOMER_FILTER_MENU_CLASS = 'customer-filter-dropdown-menu'

const TEXT_ACTION_CLASS =
  'inline-flex items-center justify-center gap-1.5 origin-center bg-transparent p-0 text-xs font-normal leading-none transition-[transform,font-weight] duration-hover hover:scale-[1.06] hover:font-semibold [&_svg]:block [&_svg]:shrink-0'
const TEXT_CANCEL_CLASS = `${TEXT_ACTION_CLASS} text-[#e11d48]`
const TEXT_SAVE_CLASS = `${TEXT_ACTION_CLASS} text-[#2563eb]`
const TEXT_SAVE_MENU_ITEM_CLASS =
  'inline-flex w-full items-center justify-start gap-1.5 origin-left rounded-xl px-3 py-2.5 text-left text-xs font-normal leading-none text-[#2563eb] transition-[transform,font-weight] duration-hover hover:scale-[1.06] hover:font-semibold hover:bg-transparent [&_svg]:block [&_svg]:shrink-0'

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

function formatDateTime() {
  return new Date().toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
  const pageHeading = editingCustomer
    ? isSupplierForm
      ? 'Tedarikçi Düzenle'
      : 'Müşteri Düzenle'
    : isSupplierForm
      ? 'Yeni Tedarikçi'
      : 'Yeni Müşteri'
  const incomingDraft = !editingCustomer ? location.state?.customerDraft : null
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [openingEnabled, setOpeningEnabled] = useState(false)
  const [addressRows, setAddressRows] = useState([{ id: 0 }])
  const [contactRows, setContactRows] = useState(() =>
    initialContactRows(editingCustomer, incomingDraft),
  )
  const [deleteDialog, setDeleteDialog] = useState(null)
  const [successVisible, setSuccessVisible] = useState(false)
  const [formEpoch, setFormEpoch] = useState(0)
  const [meta, setMeta] = useState(() =>
    incomingDraft?.category
      ? { ...emptyMeta(), category: incomingDraft.category }
      : readMetaFor(editingCustomer?.id, ''),
  )
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [activeMenu, setActiveMenu] = useState(null)
  const successTimer = useRef(null)
  const {
    anchorRef: actionMenuAnchorRef,
    menuRef: actionMenuRef,
    style: actionMenuStyle,
  } = useAnchoredPortal(actionMenuOpen, {
    align: 'right',
    width: 224,
    matchWidth: false,
  })

  useEffect(() => {
    setAddressRows([{ id: 0 }])
    setContactRows(initialContactRows(editingCustomer, incomingDraft))
    setOpeningEnabled(false)
    setActionMenuOpen(false)
    setDeleteDialog(null)
    setMeta(
      incomingDraft?.category
        ? { ...emptyMeta(), category: incomingDraft.category }
        : readMetaFor(editingCustomer?.id, ''),
    )
  }, [defaultPartyType, editingCustomer?.id, formRouteKey, incomingDraft])

  useEffect(() => {
    if (!activeMenu) return undefined

    function closeActiveMenu() {
      setActiveMenu(null)
    }

    document.addEventListener('click', closeActiveMenu)
    return () => document.removeEventListener('click', closeActiveMenu)
  }, [activeMenu])

  useEffect(() => {
    if (!actionMenuOpen) return undefined

    function closeActionMenu(event) {
      const target = event.target
      if (actionMenuAnchorRef.current?.contains(target)) return
      if (actionMenuRef.current?.contains(target)) return
      setActionMenuOpen(false)
    }

    document.addEventListener('mousedown', closeActionMenu)
    return () => document.removeEventListener('mousedown', closeActionMenu)
  }, [actionMenuOpen, actionMenuAnchorRef, actionMenuRef])

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

  function showSavedMessage() {
    if (successTimer.current) clearTimeout(successTimer.current)
    setSuccessVisible(true)
    successTimer.current = setTimeout(() => setSuccessVisible(false), 2000)
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

  function buildCustomerProfile(payload, rows = contactRows) {
    const addressId = addressRows[0]?.id ?? 0
    const city = payload[`city-${addressId}`] || ''
    const district = payload[`district-${addressId}`] || ''
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
      city: [city, district].filter(Boolean).join(' / '),
      address:
        payload[`address-${addressId}`] || incomingDraft?.address || editingCustomer?.address || '',
      lat: incomingDraft?.lat ?? editingCustomer?.lat ?? null,
      lng: incomingDraft?.lng ?? editingCustomer?.lng ?? null,
      website: primary.website || incomingDraft?.website || editingCustomer?.website || '',
      googleMapsUrl:
        payload[`mapsUrl-${addressId}`] ||
        incomingDraft?.mapsUrl ||
        editingCustomer?.googleMapsUrl ||
        '',
      googlePlaceId: incomingDraft?.placeId || editingCustomer?.googlePlaceId || '',
      taxOffice: payload.taxOffice || editingCustomer?.taxOffice || '',
      taxNumber: payload.taxNumber || editingCustomer?.taxNumber || '',
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
    const primary = resolvePrimaryContact(contactRows)
    const { matches } = await checkCustomerDuplicates(
      {
        name: payload.companyTitle || payload.shortBrandName,
        email: primary.email || payload.email,
        phone: primary.phone || payload.phone,
        taxNo: payload.taxNumber,
      },
      { excludeId: editingCustomer?.id },
    )
    const strong = matches.filter((m) => m.score >= 0.7)
    if (!strong.length) return true
    const lines = strong
      .slice(0, 5)
      .map((m) => `• ${m.name || m.id} (%${Math.round(m.score * 100)} · ${m.reasons.join(', ')})`)
      .join('\n')
    return window.confirm(
      `MDM: Olası çift kayıt bulundu.\n\n${lines}\n\nYine de kaydetmek istiyor musunuz?`,
    )
  }

  async function collectAndSave(event) {
    event?.preventDefault()
    if (!String(meta.type || '').trim()) {
      window.alert('Kaydetmeden önce Tipi alanını seçin.')
      return
    }
    const formData = new FormData(event.currentTarget)
    const payload = Object.fromEntries(formData.entries())
    payload.hasOpeningBalance = formData.has('hasOpeningBalance')
    if (!(await assertNoStrongDuplicates(payload))) return
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
    event.currentTarget.reset()
    setAddressRows([{ id: 0 }])
    setContactRows(initialContactRows(null, null))
    setOpeningEnabled(false)
    setMeta(emptyMeta())
    showSavedMessage()
    flushWorkspaceNow()
    setTimeout(() => navigate(-1), 900)
  }

  async function saveAndContinue() {
    const form = document.getElementById('customer-edit-form')
    if (!form) return
    if (!String(meta.type || '').trim()) {
      window.alert('Kaydetmeden önce Tipi alanını seçin.')
      setActionMenuOpen(false)
      return
    }
    const formData = new FormData(form)
    const payload = Object.fromEntries(formData.entries())
    payload.hasOpeningBalance = formData.has('hasOpeningBalance')
    if (!(await assertNoStrongDuplicates(payload))) {
      setActionMenuOpen(false)
      return
    }
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
    setActionMenuOpen(false)
    showSavedMessage()
    flushWorkspaceNow()
    const nextParams = new URLSearchParams()
    if (isSupplierForm) nextParams.set('kind', 'supplier')
    nextParams.set('edit', savedProfile.id)
    navigate(`/musteriler/yeni?${nextParams.toString()}`, { replace: true })
    setFormEpoch((epoch) => epoch + 1)
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

  return (
    <form
      key={`customer-edit-form-${editingCustomer?.id || 'new'}-${formEpoch}`}
      id="customer-edit-form"
      onSubmit={collectAndSave}
      className="space-y-5"
    >
      {successVisible && (
        <div className="fixed right-6 top-20 z-[80] rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-300 shadow-2xl shadow-emerald-950/20">
          Düzenlemeler kaydedildi
        </div>
      )}

      <div className="space-y-5">
        <AppPageHeader
          title={
            <span className="inline-flex min-w-0 items-center gap-2 text-xs font-normal uppercase leading-none text-[var(--muted)]">
              <Users className="h-4 w-4 shrink-0" />
              <span className="truncate">{pageHeading}</span>
            </span>
          }
          titleClassName="!flex !items-center !text-xs !font-normal !uppercase !leading-none !text-[var(--muted)]"
          onBack={() => navigate(backPath)}
          backLabel={isSupplierForm ? 'Tedarikçilere dön' : 'Müşterilere dön'}
          actions={
            <div
              ref={actionMenuAnchorRef}
              className="relative flex items-center gap-2.5 bg-transparent"
            >
              <button
                type="button"
                onClick={() => navigate(backPath)}
                className={TEXT_CANCEL_CLASS}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="whitespace-nowrap leading-none">Vazgeç</span>
              </button>
              <button type="submit" className={TEXT_SAVE_CLASS}>
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="whitespace-nowrap leading-none">Kaydet</span>
              </button>
              <button
                type="button"
                onClick={() => setActionMenuOpen((open) => !open)}
                className={TEXT_SAVE_CLASS}
                aria-label="Kaydet işlemleri"
                aria-expanded={actionMenuOpen}
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${actionMenuOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {actionMenuOpen &&
                actionMenuStyle &&
                createPortal(
                  <div
                    ref={actionMenuRef}
                    style={actionMenuStyle}
                    className={`${DROPDOWN_MENU_PORTAL_CLASS} customer-save-action-menu w-56`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={saveAndContinue}
                      className={TEXT_SAVE_MENU_ITEM_CLASS}
                    >
                      <Save className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="whitespace-nowrap leading-none">Kaydet ve devam et</span>
                    </button>
                  </div>,
                  document.body,
                )}
            </div>
          }
        />

        <div className="space-y-5">
          <FormSectionPanel
            compact
            title={isSupplierForm ? 'Tedarikçi Bilgileri' : 'Müşteri Bilgileri'}
            dotColor="blue"
            className="customer-form-primary-panel"
          >
            <div className="app-filter-bar grid min-w-0 w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className={CUSTOMER_FILTER_FIELD_CLASS}>
                <p className={CUSTOMER_FILTER_LABEL_CLASS}>Tipi :</p>
                <EditableDropdownPill
                  value={meta.type}
                  options={optionLists.type}
                  onOptionsChange={(next) => updateOptionList('type', next)}
                  openKey="create-type"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateMetaField('type', value)}
                  buttonClassName={CUSTOMER_FILTER_PILL_CLASS}
                  menuClassName={CUSTOMER_FILTER_MENU_CLASS}
                />
              </div>
              <div className={CUSTOMER_FILTER_FIELD_CLASS}>
                <p className={CUSTOMER_FILTER_LABEL_CLASS}>Temsilci :</p>
                <EditableDropdownPill
                  value={meta.representative}
                  options={optionLists.representative}
                  onOptionsChange={(next) => updateOptionList('representative', next)}
                  openKey="create-representative"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateMetaField('representative', value)}
                  buttonClassName={CUSTOMER_FILTER_PILL_CLASS}
                  menuClassName={CUSTOMER_FILTER_MENU_CLASS}
                />
              </div>
              <div className={CUSTOMER_FILTER_FIELD_CLASS}>
                <p className={CUSTOMER_FILTER_LABEL_CLASS}>Puantaj :</p>
                <EditableDropdownPill
                  value={meta.scoring}
                  options={optionLists.scoring}
                  onOptionsChange={(next) => updateOptionList('scoring', next)}
                  openKey="create-scoring"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateMetaField('scoring', value)}
                  buttonClassName={CUSTOMER_FILTER_PILL_CLASS}
                  menuClassName={CUSTOMER_FILTER_MENU_CLASS}
                />
              </div>
              <div className={CUSTOMER_FILTER_FIELD_CLASS}>
                <p className={CUSTOMER_FILTER_LABEL_CLASS}>Kategori :</p>
                <EditableDropdownPill
                  value={meta.category}
                  options={optionLists.category}
                  onOptionsChange={(next) => updateOptionList('category', next)}
                  openKey="create-category"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateMetaField('category', value)}
                  buttonClassName={CUSTOMER_FILTER_PILL_CLASS}
                  menuClassName={CUSTOMER_FILTER_MENU_CLASS}
                />
              </div>
            </div>
          </FormSectionPanel>

          <FormSectionPanel compact icon={Building2} title="Firma Bilgileri" dotColor="violet">
            <div className={FORM_FIELD_RULED_STACK_CLASS}>
              <FieldLine
                icon={Building2}
                label="Kısa Marka Adı:"
                name="shortBrandName"
                defaultValue={
                  editingCustomer
                    ? getCustomerDisplay(editingCustomer).brandShortName
                    : incomingDraft?.shortBrandName || ''
                }
              />
              <FieldLine
                icon={Building2}
                label="Firma Ünvanı:"
                name="companyTitle"
                defaultValue={
                  editingCustomer
                    ? getCustomerDisplay(editingCustomer).companyTitle
                    : incomingDraft?.companyTitle || ''
                }
              />
              <FieldLine
                icon={Landmark}
                label="Vergi Dairesi:"
                name="taxOffice"
                defaultValue={editingCustomer?.taxOffice || ''}
              />
              <FieldLine
                icon={Landmark}
                label="Vergi Numarası:"
                name="taxNumber"
                defaultValue={editingCustomer?.taxNumber || ''}
              />
            </div>
          </FormSectionPanel>

          <FormSectionPanel compact icon={MapPin} title="Adres Bilgileri" dotColor="emerald">
            <div className="space-y-2">
              {addressRows.map((row, index) => (
                <AddressLine
                  key={row.id}
                  id={row.id}
                  defaultTitle={index === 0 && editingCustomer ? 'Merkez Adres' : ''}
                  defaultAddress={
                    index === 0 ? incomingDraft?.address || editingCustomer?.address || '' : ''
                  }
                  defaultLocation={
                    index === 0
                      ? incomingDraft
                        ? [incomingDraft.city, incomingDraft.district].filter(Boolean).join(' / ')
                        : editingCustomer?.city || ''
                      : ''
                  }
                  defaultMapsUrl={
                    index === 0
                      ? incomingDraft?.mapsUrl || editingCustomer?.googleMapsUrl || ''
                      : ''
                  }
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
              className="btn-ghost mt-2 inline-flex items-center gap-2 !px-3 !py-1.5 text-[12px] font-bold"
            >
              <Plus className="h-3.5 w-3.5" /> Yeni Adres Ekle
            </button>
          </FormSectionPanel>

          <FormSectionPanel compact icon={Phone} title="İletişim Bilgileri" dotColor="blue">
            <div className="space-y-2">
              {contactRows.map((row) => (
                <ContactLine
                  key={row.id}
                  id={row.id}
                  defaultTitle={row.title}
                  lockedTitle={row.locked}
                  defaultValue={row.defaultName || ''}
                  phoneDefault={row.defaultPhone || ''}
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
              className="btn-ghost mt-2 inline-flex items-center gap-2 !px-3 !py-1.5 text-[12px] font-bold"
            >
              <Plus className="h-3.5 w-3.5" /> İletişim Ekle
            </button>
          </FormSectionPanel>

          <FormSectionPanel compact icon={WalletCards} title="Finans Ayarları" dotColor="orange">
            <div className={FORM_FIELD_RULED_STACK_CLASS}>
              <SelectLine
                icon={WalletCards}
                label="Fiyat Listesi:"
                name="priceList"
                options={['Hiçbiri', 'Standart Liste', 'Bayi Liste', 'Özel Fiyat Listesi']}
              />
              <SelectLine
                icon={WalletCards}
                label="Döviz Kuru:"
                name="currencyRate"
                options={['Alış', 'Satış', 'Merkez Bankası', 'Sabit Kur']}
              />
              <FormFieldCompact icon={WalletCards} label="Açılış Bakiyesi:">
                <label className="flex min-h-8 items-center gap-3 text-[12px] font-semibold text-[var(--ink)]">
                  <input
                    name="hasOpeningBalance"
                    type="checkbox"
                    checked={openingEnabled}
                    onChange={(event) => setOpeningEnabled(event.target.checked)}
                    className="h-4 w-4 rounded border-dark-500 bg-dark-700 accent-blue-500"
                  />
                  Hareketlere eklensin
                </label>
              </FormFieldCompact>
              <FieldLine
                icon={WalletCards}
                label="Açılış Tutarı:"
                name="openingBalanceAmount"
                type="number"
                disabled={!openingEnabled}
              />
            </div>
          </FormSectionPanel>
        </div>
      </div>

      <section
        className={`${APP_SURFACE_PANEL_CLASS} flex h-[4.625rem] items-center justify-between px-5`}
      >
        <div className="flex min-w-0 items-center gap-3 text-xs font-normal text-[var(--muted)]">
          <UserRound className="h-4 w-4 shrink-0" />
          <span className="truncate">
            Kaydettiğiniz bilgiler müşteri kartı taslak kayıtlarına işlenir.
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 bg-transparent">
          <button type="button" onClick={() => navigate(-1)} className={TEXT_CANCEL_CLASS}>
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="whitespace-nowrap leading-none">Vazgeç</span>
          </button>
          <button type="submit" className={TEXT_SAVE_CLASS}>
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="whitespace-nowrap leading-none">Kaydet</span>
          </button>
        </div>
      </section>
    </form>
  )
}

function FieldLine({
  icon: Icon,
  label,
  name,
  defaultValue = '',
  type = 'text',
  large = false,
  disabled = false,
}) {
  return (
    <FormFieldCompact icon={Icon} label={label} as="label">
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        className={`form-input !h-8 !min-h-8 !py-1 ${large ? 'text-base font-extrabold uppercase tracking-wide' : ''} ${disabled ? 'opacity-60' : ''}`}
      />
    </FormFieldCompact>
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
    />
  )
}

function AddressLine({
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
    <div className={canDelete ? 'grid grid-cols-[minmax(0,1fr)_28px] items-start gap-2' : 'w-full'}>
      <div className={FORM_FIELD_RULED_STACK_CLASS}>
        <FieldLine
          icon={Hash}
          label="Adres Başlığı:"
          name={`addressTitle-${id}`}
          defaultValue={defaultTitle}
        />
        <FieldLine
          icon={MapPin}
          label="Adres:"
          name={`address-${id}`}
          defaultValue={defaultAddress}
        />
        <FieldLine icon={MapPin} label="İlçe:" name={`district-${id}`} defaultValue={district} />
        <FieldLine icon={MapPin} label="İl:" name={`city-${id}`} defaultValue={city} />
        <FormFieldCompact icon={MapPin} label="Konum:" as="label">
          <ContactLinkInput name={`mapsUrl-${id}`} defaultValue={defaultMapsUrl} platform="web" />
        </FormFieldCompact>
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

function SelectLine({ icon: Icon, label, name, options }) {
  return (
    <FormFieldCompact icon={Icon} label={label} as="label">
      <select name={name} defaultValue="" className="form-input !h-8 !min-h-8 !py-1">
        <option value="">Seçiniz</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </FormFieldCompact>
  )
}

function ContactLinkInput({ name, defaultValue = '', placeholder, platform = 'web' }) {
  const [value, setValue] = useState(defaultValue)
  const href = resolveContactLinkHref(value, { platform })

  return (
    <div className="flex min-w-0 items-center gap-1">
      <input
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="form-input min-w-0 flex-1 !h-8 !min-h-8 !py-1"
      />
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="icon-btn flex h-8 w-8 shrink-0 items-center justify-center !rounded-lg text-[var(--muted)]"
          title="Sayfaya git"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  )
}

function ContactLine({
  id,
  defaultTitle = '',
  lockedTitle = false,
  defaultValue = '',
  phoneDefault = '',
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
    <div className={canDelete ? 'grid grid-cols-[minmax(0,1fr)_28px] items-start gap-2' : 'w-full'}>
      <div className={FORM_FIELD_RULED_STACK_CLASS}>
        <FormFieldCompact icon={Hash} label="Başlık:">
          {lockedTitle ? (
            <div className="flex min-h-8 items-center text-[12px] font-semibold uppercase tracking-wide text-[var(--ink)]">
              {defaultTitle}
              <input type="hidden" name={`contactTitle-${id}`} value={defaultTitle} />
            </div>
          ) : (
            <input
              name={`contactTitle-${id}`}
              defaultValue={defaultTitle}
              className="form-input !h-8 !min-h-8 !py-1 text-[12px] font-semibold uppercase tracking-wide"
            />
          )}
        </FormFieldCompact>
        <FormFieldCompact icon={UserRound} label="İsim:" as="label">
          <input
            name={`contactName-${id}`}
            defaultValue={defaultValue}
            className="form-input !h-8 !min-h-8 !py-1"
          />
        </FormFieldCompact>
        <FormFieldCompact icon={Phone} label="Telefon:" as="label">
          <input
            name={`contactPhone-${id}`}
            defaultValue={phoneDefault}
            className="form-input !h-8 !min-h-8 !py-1"
          />
        </FormFieldCompact>
        <FormFieldCompact icon={Mail} label="E-posta:" as="label">
          <input
            name={`contactEmail-${id}`}
            defaultValue={emailDefault}
            className="form-input !h-8 !min-h-8 !py-1"
          />
        </FormFieldCompact>
        <FormFieldCompact icon={Globe} label="Web:" as="label">
          <ContactLinkInput
            name={`contactWebsite-${id}`}
            defaultValue={websiteDefault}
            platform="web"
          />
        </FormFieldCompact>
        <FormFieldCompact icon={Instagram} label="Instagram:" as="label">
          <ContactLinkInput
            name={`contactInstagram-${id}`}
            defaultValue={instagramDefault}
            platform="instagram"
          />
        </FormFieldCompact>
        <FormFieldCompact icon={Facebook} label="Facebook:" as="label">
          <ContactLinkInput
            name={`contactFacebook-${id}`}
            defaultValue={facebookDefault}
            platform="facebook"
          />
        </FormFieldCompact>
        <FormFieldCompact icon={Youtube} label="YouTube:" as="label">
          <ContactLinkInput
            name={`contactYoutube-${id}`}
            defaultValue={youtubeDefault}
            platform="youtube"
          />
        </FormFieldCompact>
        <FormFieldCompact icon={Twitter} label="X:" as="label">
          <ContactLinkInput name={`contactX-${id}`} defaultValue={xDefault} platform="x" />
        </FormFieldCompact>
        <FormFieldCompact icon={Pin} label="Pinterest:" as="label">
          <ContactLinkInput
            name={`contactPinterest-${id}`}
            defaultValue={pinterestDefault}
            platform="pinterest"
          />
        </FormFieldCompact>
        <FormFieldCompact icon={Music2} label="TikTok:" as="label">
          <ContactLinkInput
            name={`contactTiktok-${id}`}
            defaultValue={tiktokDefault}
            platform="tiktok"
          />
        </FormFieldCompact>
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
