import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Building2,
  Check,
  ChevronDown,
  ExternalLink,
  Facebook,
  Globe,
  Hash,
  Instagram,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Music2,
  Phone,
  PhoneCall,
  Pin,
  Plus,
  Save,
  Smartphone,
  Twitter,
  UserRound,
  WalletCards,
  X,
  Youtube,
} from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AppPageBackLink, AppPageHeader } from '../components/Layout/AppPageLayout'
import {
  PAGE_CENTER_TITLE_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  YF_TEXT_CLASS,
  YF_TEXT_ON_COLOR_CLASS,
} from '../utils/dashboardDesign'
import {
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_CTA_DIVIDER_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_CTA_SHELL_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../components/Layout/HeaderCashActionsPanel'
import ConfirmModal from '../components/Common/ConfirmModal'
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
const CUSTOMER_FILTER_MENU_CLASS = 'az customer-filter-dropdown-menu customers-page-menu'

/** Kırmızı Vazgeç CTA — başlık ve alt panelde aynı. */
function CancelCta({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.danger}`}
    >
      <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
        <X className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
      </span>
      <span className={YF_TEXT_ON_COLOR_CLASS}>Vazgeç</span>
    </button>
  )
}

/** Yeşil split CTA: Kaydet + açılır "Kaydet ve devam et". Başlık ve alt panelde aynı. */
function SaveSplitAction({ onSaveAndContinue, savePhase = 'idle' }) {
  const [open, setOpen] = useState(false)
  const busy = savePhase !== 'idle'
  const { anchorRef, menuRef, style } = useAnchoredPortal(open, {
    align: 'right',
    width: 224,
    matchWidth: false,
  })

  const label =
    savePhase === 'saving'
      ? 'Kaydediliyor…'
      : savePhase === 'saved'
        ? 'Kaydedildi'
        : 'Kaydet'

  useEffect(() => {
    if (!open) return undefined

    function closeMenu(event) {
      if (anchorRef.current?.contains(event.target)) return
      if (menuRef.current?.contains(event.target)) return
      setOpen(false)
    }

    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [anchorRef, menuRef, open])

  useEffect(() => {
    if (busy) setOpen(false)
  }, [busy])

  return (
    <div ref={anchorRef} className="relative inline-flex items-center">
      <div
        className={`${HEADER_ACTION_CTA_SHELL_CLASS} overflow-hidden ${HEADER_ACTION_GRADIENTS.success}`}
      >
        <button
          type="submit"
          disabled={busy}
          aria-busy={savePhase === 'saving'}
          className="inline-flex h-full items-center gap-2.5 bg-transparent px-3"
        >
          <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
            {savePhase === 'saving' ? (
              <Loader2
                className={`${HEADER_ACTION_CTA_ICON_CLASS} animate-spin`}
                strokeWidth={2.25}
                aria-hidden
              />
            ) : savePhase === 'saved' ? (
              <Check className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
            ) : (
              <Save className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
            )}
          </span>
          <span
            key={label}
            className={`${YF_TEXT_ON_COLOR_CLASS} min-w-[7.5rem] animate-[saveLabelIn_280ms_ease-out]`}
          >
            {label}
          </span>
        </button>
        <span className={HEADER_ACTION_CTA_DIVIDER_CLASS} aria-hidden="true" />
        <button
          type="button"
          disabled={busy}
          onClick={() => setOpen((current) => !current)}
          className="inline-flex h-full w-12 items-center justify-center bg-transparent"
          aria-label="Kaydet işlemleri"
          aria-expanded={open}
        >
          <ChevronDown
            className={`${HEADER_ACTION_CTA_ICON_CLASS} transition-transform ${
              open ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>
      </div>
      {open &&
        style &&
        createPortal(
          <div
            ref={menuRef}
            style={{ ...style, zIndex: 120 }}
            className={`${DROPDOWN_MENU_PORTAL_CLASS} customer-save-action-menu w-56`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onSaveAndContinue()
              }}
              className={`${HEADER_ACTION_CTA_CLASS} w-full ${HEADER_ACTION_GRADIENTS.success}`}
            >
              <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                <Save className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
              </span>
              <span className={YF_TEXT_ON_COLOR_CLASS}>Kaydet ve devam et</span>
            </button>
          </div>,
          document.body,
        )}
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

/** Kayıtlı adresleri satırlara açar; hiç yoksa taslak/müşteri verisiyle tek satır kurar. */
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

/** Kaydet butonunda her fazın (Kaydediliyor… → Kaydedildi) görünür kalma süresi. */
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
  /** Düzenlemeden vazgeçince müşteri/tedarikçi detayına; yeni kayıtta listeye dön. */
  const cancelPath = editingCustomer?.id
    ? isSupplierForm
      ? `/suppliers/${editingCustomer.id}`
      : `/musteriler/${editingCustomer.id}`
    : backPath
  const pageHeading = editingCustomer
    ? isSupplierForm
      ? 'Tedarikçi Düzenle'
      : 'Müşteri Düzenle'
    : isSupplierForm
      ? 'Yeni Tedarikçi'
      : 'Yeni Müşteri'
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
  /** idle | saving | saved — Kaydet CTA metin fazları */
  const [savePhase, setSavePhase] = useState('idle')
  /** Kaydetmeyi engelleyen durumların sayfa içi bildirimi (tarayıcı diyaloğu değil). */
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
  /** Çift kayıt onayının sonucunu kaydetme akışına geri veren çözümleyici. */
  const duplicateResolveRef = useRef(null)
  /** "Kaydet ve devam et" sonrası imleci ilk alana taşımak için işaret. */
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

  /** Formdaki her adres satırını toplar; ilk satır kartın birincil adresi olur. */
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

  /**
   * Olası çift kayıtları sayfa içi onay kutusuyla sorar. Tarayıcı diyaloglarını
   * engelleyen ayarlar kaydetmeyi sessizce iptal edemesin diye window.confirm yok.
   */
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
      // Çift kayıt kontrolü yardımcı bir adım: başarısızsa kaydetmeyi engellemez.
      console.warn('Çift kayıt kontrolü yapılamadı', error)
      return true
    }
    const strong = matches.filter((m) => m.score >= 0.7)
    if (!strong.length) return true
    const summary = strong
      .slice(0, 5)
      .map((m) => `${m.name || m.id} (%${Math.round(m.score * 100)})`)
      .join(' · ')
    // Onay kullanıcıda: buton "Kaydediliyor…" durumunda beklemesin.
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

  /**
   * Her iki kaydet akışının paylaştığı rutin: doğrula, formun tamamını kalıcı hale
   * getir, alanları boşalt. Kaydedip kaydetmediğini döndürür.
   */
  async function saveForm(form) {
    if (!String(meta.type || '').trim()) {
      setFormNotice('Kaydetmeden önce Tipi alanını seçin.')
      document
        .querySelector('#customer-edit-form .customer-form-primary-panel')
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return false
    }
    setFormNotice(null)
    // Geri bildirim ilk adımda görünür: sonraki adımlar beklerse buton sessiz kalmaz.
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

  /** saveForm'un beklenmedik hatası butonu sessizce ölü bırakmasın. */
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

  /** Kaydediliyor… en az 1 sn, ardından Kaydedildi 1 sn — kullanıcı geçişi görsün. */
  async function playSaveButtonPhases(startedAt) {
    const remainingSaving = Math.max(0, SAVE_PHASE_MS - (Date.now() - startedAt))
    if (remainingSaving > 0) await waitMs(remainingSaving, saveTimer)
    setSavePhase('saved')
    await waitMs(SAVE_PHASE_MS, saveTimer)
  }

  async function collectAndSave(event) {
    event?.preventDefault()
    if (savePhase !== 'idle') return
    // currentTarget await sonrası boşalır; formu şimdi yakala.
    const form = event.currentTarget
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
      <ConfirmModal
        open={Boolean(duplicatePrompt)}
        title="Olası çift kayıt"
        description={`Bu bilgilerle eşleşen kayıtlar bulundu: ${duplicatePrompt || ''}. Yine de kaydetmek istiyor musunuz?`}
        confirmLabel="Yine de kaydet"
        cancelLabel="Vazgeç"
        onConfirm={() => resolveDuplicatePrompt(true)}
        onCancel={() => resolveDuplicatePrompt(false)}
      />

      <div className="space-y-5">
        <AppPageHeader
          showBack={false}
          title={
            <AppPageBackLink to={backPath} label={isSupplierForm ? 'Tedarikçiler' : 'Müşteriler'} />
          }
          centerTitle={String(pageHeading || '').toLocaleUpperCase('tr-TR')}
          centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
          titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
          actions={
            <div className="relative flex items-center gap-2.5 bg-transparent">
              <CancelCta onClick={() => navigate(cancelPath)} />
              <SaveSplitAction onSaveAndContinue={saveAndContinue} savePhase={savePhase} />
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

        <div className="space-y-5">
        <div data-tour="customer-form">
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
        </div>

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
              {addressRows.map((row) => (
                <AddressLine
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
              className={`btn-ghost mt-2 inline-flex items-center gap-2 !px-3 !py-1.5 ${YF_TEXT_CLASS}`}
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
              className={`btn-ghost mt-2 inline-flex items-center gap-2 !px-3 !py-1.5 ${YF_TEXT_CLASS}`}
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
                defaultValue={editingCustomer?.priceList || ''}
              />
              <SelectLine
                icon={WalletCards}
                label="Döviz Kuru:"
                name="currencyRate"
                options={['Alış', 'Satış', 'Merkez Bankası', 'Sabit Kur']}
                defaultValue={editingCustomer?.currencyRate || ''}
              />
              <FormFieldCompact icon={WalletCards} label="Açılış Bakiyesi:">
                <label className="flex min-h-8 items-center gap-3 text-[14px] font-normal leading-tight tracking-normal text-[var(--ink)]">
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
                defaultValue={
                  editingCustomer?.hasOpeningBalance && editingCustomer?.balance
                    ? String(editingCustomer.balance)
                    : ''
                }
                disabled={!openingEnabled}
              />
            </div>
          </FormSectionPanel>
        </div>
      </div>

      <section
        className={`${APP_SURFACE_PANEL_CLASS} flex h-[4.625rem] items-center justify-between px-5`}
      >
        <div className="flex min-w-0 items-center gap-3 text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]">
          <UserRound className="h-4 w-4 shrink-0" />
          <span className="truncate">
            Kaydettiğiniz bilgiler müşteri kartı taslak kayıtlarına işlenir.
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 bg-transparent">
          <CancelCta onClick={() => navigate(cancelPath)} />
          <SaveSplitAction onSaveAndContinue={saveAndContinue} savePhase={savePhase} />
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
  disabled = false,
}) {
  return (
    <FormFieldCompact icon={Icon} label={label} as="label">
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        className={`form-input !h-8 !min-h-8 !py-1 ${disabled ? 'opacity-60' : ''}`}
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

function SelectLine({ icon: Icon, label, name, options, defaultValue = '' }) {
  return (
    <FormFieldCompact icon={Icon} label={label} as="label">
      <select name={name} defaultValue={defaultValue} className="form-input !h-8 !min-h-8 !py-1">
        <option value="">Seçiniz</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </FormFieldCompact>
  )
}

/** Adres ve kullanıcı adları küçük harfle başlar; ilk harfi büyütmeyi engeller. */
function toLeadingLowerCase(raw) {
  const text = String(raw ?? '')
  const first = text.search(/\p{L}/u)
  if (first < 0) return text
  return (
    text.slice(0, first) + text.charAt(first).toLocaleLowerCase('tr-TR') + text.slice(first + 1)
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
        className="form-input min-w-0 flex-1 !h-8 !min-h-8 !py-1"
      />
      {/* Slot her zaman ayrılır: bağlantı ikonu belirince satır büyümez, kaymaz. */}
      <span className="contact-link-action flex h-8 w-8 shrink-0 items-center justify-center">
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

/** Cümle düzeni: yalnızca ilk harf büyük, kalanı küçük (Türkçe kurallı). */
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

/**
 * Yazarken cümle düzenine çeviren metin alanı. Dönüşüm uzunluğu değiştirmediği
 * için imleç konumu korunur — aksi halde her tuşta sonuna atlar.
 */
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

function ContactLine({
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
    <div className={canDelete ? 'grid grid-cols-[minmax(0,1fr)_28px] items-start gap-2' : 'w-full'}>
      <div className={FORM_FIELD_RULED_STACK_CLASS}>
        <FormFieldCompact icon={Hash} label="Başlık:">
          {lockedTitle ? (
            <div className="flex min-h-8 items-center text-[14px] font-normal leading-tight tracking-normal text-[var(--ink)]">
              {defaultTitle}
              <input type="hidden" name={`contactTitle-${id}`} value={defaultTitle} />
            </div>
          ) : (
            <SentenceCaseInput
              name={`contactTitle-${id}`}
              defaultValue={defaultTitle}
              className="form-input !h-8 !min-h-8 !py-1"
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
        <FormFieldCompact icon={Smartphone} label="Gsm:" as="label">
          <input
            name={`contactGsm-${id}`}
            defaultValue={gsmDefault}
            className="form-input !h-8 !min-h-8 !py-1"
          />
        </FormFieldCompact>
        <FormFieldCompact icon={PhoneCall} label="Sipariş hattı:" as="label">
          <input
            name={`contactOrderLine-${id}`}
            defaultValue={orderLineDefault}
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
