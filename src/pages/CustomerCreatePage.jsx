import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Landmark,
  MapPin,
  Phone,
  Plus,
  Save,
  Tags,
  UserRound,
  WalletCards,
} from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { DeleteTrashButton } from '../components/Common/ListDeleteConfirmPanel'
import {
  FormSectionPanel,
  FORM_FIELD_CELL_CLASS,
  FORM_FIELD_LABEL_CLASS,
  FORM_FIELD_ROW_CLASS,
} from '../components/Common/FormSectionPanel'
import { APP_FILTER_LABEL_CLASS } from '../utils/dashboardDesign'
import { findCustomerProfile, saveCustomerProfile } from '../data/customerProfiles'
import { getTreasuryAccounts, getTreasuryMovements, saveTreasuryMovements } from '../utils/treasuryStore'
import { getCustomerDisplay } from '../utils/customerDisplay'
import {
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
import { BTN_SUCCESS } from '../utils/buttonStyles'
import { useAnchoredPortal } from '../hooks/useAnchoredPortal'
import { DROPDOWN_MENU_PORTAL_CLASS } from '../components/Common/DropdownMenu'

const DRAFTS_KEY = 'erlenbox-customer-form-drafts'

const CREATE_PILL_CLASS = 'glass-pill !h-10'

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
    return [{
      id: 0,
      title: 'Google Maps',
      locked: false,
      defaultName: '',
      defaultPhone: draft.phone || '',
      defaultEmail: draft.email || '',
    }]
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
  const editingCustomer = searchParams.get('edit') ? findCustomerProfile(searchParams.get('edit')) : null
  const isSupplierForm = searchParams.get('kind') === 'supplier'
  const defaultPartyType = isSupplierForm ? SUPPLIER_TYPE_LABEL : 'Müşteri'
  const backPath = isSupplierForm ? '/suppliers' : '/musteriler'
  const pageHeading = editingCustomer
    ? (isSupplierForm ? 'Tedarikçi Düzenle' : 'Müşteri Düzenle')
    : (isSupplierForm ? 'Yeni Tedarikçi' : 'Yeni Müşteri')
  const incomingDraft = !editingCustomer ? location.state?.customerDraft : null
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [openingEnabled, setOpeningEnabled] = useState(false)
  const [addressRows, setAddressRows] = useState([{ id: 0 }])
  const [contactRows, setContactRows] = useState(() => initialContactRows(editingCustomer, incomingDraft))
  const [deleteDialog, setDeleteDialog] = useState(null)
  const [successVisible, setSuccessVisible] = useState(false)
  const [meta, setMeta] = useState(() => (
    incomingDraft?.category
      ? { ...emptyMeta(defaultPartyType), category: incomingDraft.category }
      : readMetaFor(editingCustomer?.id, defaultPartyType)
  ))
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [activeMenu, setActiveMenu] = useState(null)
  const successTimer = useRef(null)
  const { anchorRef: actionMenuAnchorRef, menuRef: actionMenuRef, style: actionMenuStyle } = useAnchoredPortal(actionMenuOpen, {
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
    setMeta(incomingDraft?.category
      ? { ...emptyMeta(defaultPartyType), category: incomingDraft.category }
      : readMetaFor(editingCustomer?.id, defaultPartyType))
  }, [defaultPartyType, editingCustomer?.id, formRouteKey, incomingDraft])

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
  }

  function persistMeta(customerId) {
    if (!customerId) return
    const current = readCustomerMeta()
    const next = {
      ...current,
      [customerId]: {
        ...(current[customerId] || {}),
        type: meta.type || defaultPartyType,
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
    localStorage.setItem(DRAFTS_KEY, JSON.stringify({
      ...saved,
      [draftId]: {
        ...payload,
        savedAt: new Date().toISOString(),
      },
    }))
  }

  function buildCustomerProfile(payload, rows = contactRows) {
    const addressId = addressRows[0]?.id ?? 0
    const city = payload[`city-${addressId}`] || ''
    const district = payload[`district-${addressId}`] || ''
    const companyTitle = payload.companyTitle || editingCustomer?.company || payload.shortBrandName || ''
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
      address: payload[`address-${addressId}`] || incomingDraft?.address || editingCustomer?.address || '',
      lat: incomingDraft?.lat ?? editingCustomer?.lat ?? null,
      lng: incomingDraft?.lng ?? editingCustomer?.lng ?? null,
      website: incomingDraft?.website || editingCustomer?.website || '',
      googleMapsUrl: incomingDraft?.mapsUrl || editingCustomer?.googleMapsUrl || '',
      googlePlaceId: incomingDraft?.placeId || editingCustomer?.googlePlaceId || '',
      taxOffice: payload.taxOffice || editingCustomer?.taxOffice || '',
      taxNumber: payload.taxNumber || editingCustomer?.taxNumber || '',
      balance: payload.hasOpeningBalance ? Number(payload.openingBalanceAmount || 0) : Number(editingCustomer?.balance || 0),
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

  function collectAndSave(event) {
    event?.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload = Object.fromEntries(formData.entries())
    payload.hasOpeningBalance = formData.has('hasOpeningBalance')
    saveDraft(payload)
    const savedProfile = saveCustomerProfile(buildCustomerProfile(payload, contactRows))
    persistMeta(savedProfile.id)
    syncOpeningBalance(payload)
    event.currentTarget.reset()
    setAddressRows([{ id: 0 }])
    setContactRows(initialContactRows(null, null))
    setOpeningEnabled(false)
    setMeta(emptyMeta(defaultPartyType))
    showSavedMessage()
    setTimeout(() => navigate(-1), 900)
  }

  function saveAndContinue() {
    const form = document.getElementById('customer-edit-form')
    if (!form) return
    const formData = new FormData(form)
    const payload = Object.fromEntries(formData.entries())
    payload.hasOpeningBalance = formData.has('hasOpeningBalance')
    saveDraft(payload)
    const savedProfile = saveCustomerProfile(buildCustomerProfile(payload, contactRows))
    persistMeta(savedProfile.id)
    syncOpeningBalance(payload)
    form.reset()
    setAddressRows([{ id: 0 }])
    setContactRows(initialContactRows(null, null))
    setOpeningEnabled(false)
    setMeta(emptyMeta(defaultPartyType))
    setActionMenuOpen(false)
    showSavedMessage()
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
    <form id="customer-edit-form" onSubmit={collectAndSave} className="space-y-5">
      {successVisible && (
        <div className="fixed right-6 top-20 z-[80] rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-3 text-sm font-black text-emerald-300 shadow-2xl shadow-emerald-950/20">
          Düzenlemeler kaydedildi
        </div>
      )}

      <section className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="absolute left-5 top-1/2 inline-flex -translate-y-1/2 items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-5 py-2.5 text-xs font-black uppercase text-gray-300 transition-colors hover:bg-dark-700 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> {isSupplierForm ? 'Tedarikçiler' : 'Müşteriler'}
        </button>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">{pageHeading}</h1>
        </div>
        <div ref={actionMenuAnchorRef} className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-5 py-2.5 text-xs font-black uppercase text-gray-300 transition-colors hover:bg-dark-700 hover:text-white"
          >
            Vazgeç
          </button>
          <button className={`${BTN_SUCCESS} gap-2 px-5 py-2.5 text-xs uppercase`}>
            <Save className="h-4 w-4" /> Kaydet
          </button>
          <button
            type="button"
            onClick={() => setActionMenuOpen((open) => !open)}
            className="relative flex h-10 w-11 items-center justify-center rounded-xl border border-dark-500/50 bg-dark-700/70 text-gray-300 transition-colors hover:bg-dark-700 hover:text-white"
            aria-label="Kaydet işlemleri"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${actionMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {actionMenuOpen && actionMenuStyle && createPortal(
            <div
              ref={actionMenuRef}
              style={actionMenuStyle}
              className={`${DROPDOWN_MENU_PORTAL_CLASS} w-56`}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={saveAndContinue}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-xs font-black uppercase tracking-wide text-[var(--ink)] transition-colors hover:bg-white/45"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Kaydet ve Devam Et
              </button>
            </div>,
            document.body,
          )}
        </div>
      </section>

      <section className="card overflow-visible p-0">
        <div className="space-y-6 p-8">
          <FormSectionPanel icon={UserRound} title="Müşteri Bilgileri" dotColor="blue">
            <div className="grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4">
              <div className={FORM_FIELD_CELL_CLASS}>
                <p className={APP_FILTER_LABEL_CLASS}>Tipi</p>
                <EditableDropdownPill
                  value={meta.type}
                  options={optionLists.type}
                  onOptionsChange={(next) => updateOptionList('type', next)}
                  openKey="create-type"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateMetaField('type', value)}
                  buttonClassName={CREATE_PILL_CLASS}
                />
              </div>
              <div className={FORM_FIELD_CELL_CLASS}>
                <p className={APP_FILTER_LABEL_CLASS}>Temsilci</p>
                <EditableDropdownPill
                  value={meta.representative}
                  options={optionLists.representative}
                  onOptionsChange={(next) => updateOptionList('representative', next)}
                  openKey="create-representative"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateMetaField('representative', value)}
                  buttonClassName={CREATE_PILL_CLASS}
                />
              </div>
              <div className={FORM_FIELD_CELL_CLASS}>
                <p className={APP_FILTER_LABEL_CLASS}>Puantaj</p>
                <EditableDropdownPill
                  value={meta.scoring}
                  options={optionLists.scoring}
                  onOptionsChange={(next) => updateOptionList('scoring', next)}
                  openKey="create-scoring"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateMetaField('scoring', value)}
                  buttonClassName={CREATE_PILL_CLASS}
                />
              </div>
              <div className={FORM_FIELD_CELL_CLASS}>
                <p className={`flex items-center gap-1 ${APP_FILTER_LABEL_CLASS}`}>
                  <Tags className="h-3.5 w-3.5" /> Kategori
                </p>
                <EditableDropdownPill
                  value={meta.category}
                  options={optionLists.category}
                  onOptionsChange={(next) => updateOptionList('category', next)}
                  openKey="create-category"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateMetaField('category', value)}
                  buttonClassName={CREATE_PILL_CLASS}
                />
              </div>
            </div>
          </FormSectionPanel>

          <FormSectionPanel icon={Building2} title="Ünvan Bilgileri" dotColor="violet">
            <div className="max-w-4xl space-y-3">
              <FieldLine icon={Building2} label="Kısa Marka Adı" name="shortBrandName" defaultValue={editingCustomer ? getCustomerDisplay(editingCustomer).brandShortName : incomingDraft?.shortBrandName || ''} />
              <FieldLine icon={Building2} label="Firma Ünvanı" name="companyTitle" defaultValue={editingCustomer ? getCustomerDisplay(editingCustomer).companyTitle : incomingDraft?.companyTitle || ''} />
              <FieldLine icon={Landmark} label="Vergi Dairesi" name="taxOffice" defaultValue={editingCustomer?.taxOffice || ''} />
              <FieldLine icon={Landmark} label="Vergi Numarası" name="taxNumber" defaultValue={editingCustomer?.taxNumber || ''} />
            </div>
          </FormSectionPanel>

          <FormSectionPanel icon={MapPin} title="Adres Bilgileri" dotColor="emerald">
            <div className="space-y-3">
              {addressRows.map((row, index) => (
                <AddressLine
                  key={row.id}
                  id={row.id}
                  defaultTitle={index === 0 && editingCustomer ? 'Merkez Adres' : ''}
                  defaultAddress={index === 0 ? incomingDraft?.address || editingCustomer?.address || '' : ''}
                  defaultLocation={index === 0 ? incomingDraft ? [incomingDraft.city, incomingDraft.district].filter(Boolean).join(' / ') : editingCustomer?.city || '' : ''}
                  deleteState={deleteDialog?.key === `address-${row.id}` ? deleteDialog : null}
                  onDelete={() => confirmTwoStepDelete('Adres', () => setAddressRows((rows) => rows.filter((item) => item.id !== row.id)), `address-${row.id}`)}
                  onCancel={closeDeleteDialog}
                  onApprove={approveDeleteDialog}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAddressRows((rows) => [...rows, { id: Date.now() }])}
              className="btn-ghost mt-4 inline-flex items-center gap-2 !px-4 !py-2 text-[12px] font-bold"
            >
              <Plus className="h-4 w-4" /> Yeni Adres Ekle
            </button>
          </FormSectionPanel>

          <FormSectionPanel icon={Phone} title="İletişim Bilgileri" dotColor="blue">
            <div className="space-y-3">
              {contactRows.map((row) => (
                <ContactLine
                  key={row.id}
                  id={row.id}
                  defaultTitle={row.title}
                  lockedTitle={row.locked}
                  defaultValue={row.defaultName || ''}
                  phoneDefault={row.defaultPhone || ''}
                  emailDefault={row.defaultEmail || ''}
                  instagramDefault={row.defaultInstagram || ''}
                  deleteState={deleteDialog?.key === `contact-${row.id}` ? deleteDialog : null}
                  onDelete={() => confirmTwoStepDelete('İletişim satırı', () => setContactRows((rows) => rows.filter((item) => item.id !== row.id)), `contact-${row.id}`)}
                  onCancel={closeDeleteDialog}
                  onApprove={approveDeleteDialog}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setContactRows((rows) => [...rows, { id: Date.now(), title: '' }])}
              className="btn-ghost mt-4 inline-flex items-center gap-2 !px-4 !py-2 text-[12px] font-bold"
            >
              <Plus className="h-4 w-4" /> İletişim Ekle
            </button>
          </FormSectionPanel>

          <FormSectionPanel icon={WalletCards} title="Finans Ayarları" dotColor="orange">
            <div className="max-w-4xl space-y-3">
              <SelectLine icon={WalletCards} label="Fiyat Listesi" name="priceList" options={['Hiçbiri', 'Standart Liste', 'Bayi Liste', 'Özel Fiyat Listesi']} />
              <SelectLine icon={WalletCards} label="Döviz Kuru" name="currencyRate" options={['Alış', 'Satış', 'Merkez Bankası', 'Sabit Kur']} />
              <label className={`${FORM_FIELD_ROW_CLASS} grid grid-cols-[180px_minmax(0,1fr)] items-center gap-4`}>
                <span className={`flex h-full items-center gap-2 self-center ${FORM_FIELD_LABEL_CLASS}`}>
                  <WalletCards className="h-4 w-4 shrink-0" /> Açılış Bakiyesi:
                </span>
                <span className="flex items-center gap-3 text-[12px] font-semibold text-[var(--muted)]">
                  <input
                    name="hasOpeningBalance"
                    type="checkbox"
                    checked={openingEnabled}
                    onChange={(event) => setOpeningEnabled(event.target.checked)}
                    className="h-4 w-4 rounded border-dark-500 bg-dark-700 accent-blue-500"
                  />
                  Hareketlere eklensin
                </span>
              </label>
              <FieldLine icon={WalletCards} label="Açılış Tutarı" name="openingBalanceAmount" type="number" disabled={!openingEnabled} />
            </div>
          </FormSectionPanel>

        </div>

        <div className="mx-10 flex items-center justify-between px-0 py-8">
          <div className="flex items-center gap-3 text-xs font-semibold text-gray-500">
            <UserRound className="h-4 w-4" />
            Kaydettiğiniz bilgiler müşteri kartı taslak kayıtlarına işlenir.
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate(-1)} className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-5 py-2.5 text-xs font-black uppercase text-gray-300 transition-colors hover:bg-dark-700 hover:text-white">
              Vazgeç
            </button>
            <button className={`${BTN_SUCCESS} gap-2 px-5 py-2.5 text-xs uppercase`}>
              <CheckCircle2 className="h-4 w-4" /> Kaydet
            </button>
          </div>
        </div>
      </section>
    </form>
  )
}

function FieldLine({ icon: Icon, label, name, defaultValue = '', type = 'text', large = false, disabled = false }) {
  return (
    <label className={`${FORM_FIELD_ROW_CLASS} grid grid-cols-[180px_minmax(0,1fr)] items-center gap-4`}>
      <span className={`flex h-full items-center gap-2 self-center ${FORM_FIELD_LABEL_CLASS}`}>
        <Icon className="h-4 w-4 shrink-0" /> {label}:
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        className={`form-input ${large ? 'py-3 text-base font-extrabold uppercase tracking-wide' : ''} ${disabled ? 'opacity-60' : ''}`}
      />
    </label>
  )
}

function CompactFieldLine({ icon: Icon, label, name, defaultValue = '' }) {
  return (
    <label className={`${FORM_FIELD_ROW_CLASS} grid grid-cols-[54px_minmax(0,1fr)] items-center gap-2`}>
      <span className={`flex h-full items-center justify-end gap-1 self-center text-right ${FORM_FIELD_LABEL_CLASS}`}>
        <Icon className="h-4 w-4 shrink-0" /> {label}:
      </span>
      <input name={name} defaultValue={defaultValue} className="form-input" />
    </label>
  )
}

function TextareaLine({ icon: Icon, label, name, defaultValue = '' }) {
  return (
    <label className={`${FORM_FIELD_ROW_CLASS} grid grid-cols-[150px_minmax(0,1fr)] items-start gap-4`}>
      <span className={`flex items-center gap-2 pt-2 ${FORM_FIELD_LABEL_CLASS}`}>
        <Icon className="h-4 w-4" /> {label}:
      </span>
      <textarea name={name} defaultValue={defaultValue} className="form-input min-h-28 resize-none" />
    </label>
  )
}

function DeleteConfirmInline({ deleteState, onDelete, onCancel, onApprove, title, description = 'Bu işlem geri alınamaz.' }) {
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

function AddressLine({ id, defaultTitle = '', defaultAddress = '', defaultLocation = '', deleteState, onDelete, onCancel, onApprove }) {
  const [city = '', district = ''] = String(defaultLocation).split('/').map((part) => part.trim())

  return (
    <div className={`${FORM_FIELD_ROW_CLASS} grid grid-cols-[minmax(0,1fr)_32px] items-center gap-4 p-4`}>
      <div className="space-y-4">
        <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-4">
          <input name={`addressTitle-${id}`} defaultValue={defaultTitle} placeholder="Adres başlığı..." className="form-input" />
          <textarea name={`address-${id}`} defaultValue={defaultAddress} placeholder="Adres..." className="form-input h-10 min-h-0 resize-none" />
        </div>
        <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-4">
          <span />
          <div className="grid grid-cols-2 gap-4">
            <CompactFieldLine icon={MapPin} label="İlçe" name={`district-${id}`} defaultValue={district} />
            <CompactFieldLine icon={MapPin} label="İl" name={`city-${id}`} defaultValue={city} />
          </div>
        </div>
      </div>
      <DeleteConfirmInline deleteState={deleteState} onDelete={onDelete} onCancel={onCancel} onApprove={onApprove} title="Sil" />
    </div>
  )
}

function SelectLine({ icon: Icon, label, name, options }) {
  return (
    <label className={`${FORM_FIELD_ROW_CLASS} grid grid-cols-[180px_minmax(0,1fr)] items-center gap-4`}>
      <span className={`flex h-full items-center gap-2 self-center ${FORM_FIELD_LABEL_CLASS}`}>
        <Icon className="h-4 w-4 shrink-0" /> {label}:
      </span>
      <select name={name} defaultValue="" className="form-input">
        <option value="">Seçiniz</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function ContactLinkInput({ name, defaultValue = '', placeholder }) {
  const [value, setValue] = useState(defaultValue)
  const href = resolveContactLinkHref(value, { instagram: true })

  return (
    <div className="flex min-w-0 items-center gap-1">
      <input
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="form-input min-w-0 flex-1"
      />
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="icon-btn flex h-[38px] w-9 shrink-0 items-center justify-center !rounded-lg text-[var(--muted)]"
          title="Sayfaya git"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  )
}

function ContactLine({ id, defaultTitle = '', lockedTitle = false, defaultValue = '', phoneDefault = '', emailDefault = '', instagramDefault = '', deleteState, onDelete, onCancel, onApprove }) {
  return (
    <div className={`${FORM_FIELD_ROW_CLASS} grid grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_32px] items-center gap-4`}>
      {lockedTitle ? (
        <div className="flex h-10 items-center rounded-lg bg-white/35 px-3 text-[12px] font-bold uppercase tracking-wider text-[var(--muted)]">
          {defaultTitle}
          <input type="hidden" name={`contactTitle-${id}`} value={defaultTitle} />
        </div>
      ) : (
        <input name={`contactTitle-${id}`} defaultValue={defaultTitle} placeholder="Başlık..." className="form-input h-10 text-[12px] font-bold uppercase tracking-wider text-[var(--muted)] placeholder:text-[var(--muted)]" />
      )}
      <input name={`contactName-${id}`} defaultValue={defaultValue} placeholder="İsim..." className="form-input" />
      <input name={`contactPhone-${id}`} defaultValue={phoneDefault} placeholder="Telefon..." className="form-input" />
      <input name={`contactEmail-${id}`} defaultValue={emailDefault} placeholder="E-posta..." className="form-input" />
      <ContactLinkInput name={`contactInstagram-${id}`} defaultValue={instagramDefault} placeholder="Instagram..." />
      <DeleteConfirmInline deleteState={deleteState} onDelete={onDelete} onCancel={onCancel} onApprove={onApprove} title="Sil" />
    </div>
  )
}
