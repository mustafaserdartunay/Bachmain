import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import SearchInput from '../components/Common/SearchInput'
import { jsPDF } from 'jspdf'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  Mail,
  Pencil,
  Plus,
  Printer,
  Save,
  Send,
  ShoppingCart,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { DataTable, Dropdown, DropdownItem, DropdownSeparator } from '@bachmain/ui'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
  AppPanelDot,
} from '../components/Layout/AppPageLayout'
import {
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_CTA_DIVIDER_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_CTA_SHELL_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../components/Layout/HeaderCashActionsPanel'
import { customerToDocumentPatch } from '../utils/documentCustomerPatch'
import {
  captureDeleteConfirmAnchor,
  DeleteConfirmOverlay,
  DeleteConfirmPopover,
} from '../components/Common/ListDeleteConfirmPanel'
import NumericInput from '../components/Products/NumericInput'
import { formatTL } from '../utils/productPricing'
import { getCustomerDisplay } from '../utils/customerDisplay'
import { resolveCustomerContactInfo } from '../utils/customerContacts'
import {
  readOptionLists,
  saveOptionList,
  readCustomerMeta,
  getCustomerMetaSelection,
  getOptionLabels,
} from '../utils/customerMeta'
import EditableDropdownPill from '../components/EditableDropdownPill'
import { defaultQuoteStages, initialQuotes } from '../data/quotesData'
import { customers as customerData } from '../data/mockData'
import { getListCustomerDisplay, findCustomerProfile } from '../data/customerProfiles'
import { vatRates } from '../data/productsData'
import { getCatalogProducts, resolveProductImage } from '../utils/productCatalog'
import { cancelOrderFromQuote, createOrderFromQuote, loadOrders, updateOrder } from '../utils/ordersStore'
import { nextQuoteCode, resolveQuoteCode, sanitizeQuoteCode } from '../utils/documentCodes'
import {
  readVoiceQuoteOpenId,
  clearVoiceQuoteOpenId,
  softDeleteQuote,
  saveQuotes as persistQuotesStore,
  loadQuotes as reloadQuotesStore,
} from '../utils/quotesStore'
import { flushWorkspaceNow } from '../utils/workspaceStorage'
import { publishWorkflowStages } from '../utils/workflowStagePublish'
import {
  appendOrderStage,
  appendQuoteStage,
  getOrderStageOptions,
  getQuoteStageOptions,
  isOrderReceivedStage,
  loadWorkflowStages,
  mergeOrderStagesIntoWorkflow,
  mergeQuoteStagesIntoWorkflow,
  resolveOrderPanelCurrentStageId,
  resolveQuoteActiveStage,
  resolveQuoteProcessRecord,
} from '../utils/workflowStages'
import {
  documentMoneyParts,
  documentTotals,
  itemTotals,
  safeNumber,
  sanitizeDocumentDiscountFields,
} from '../utils/documentTotals'
import { BTN_PRIMARY } from '../utils/buttonStyles'
import DocumentActivityPanel from '../components/DocumentEditor/DocumentActivityPanel'
import DocumentTermsEditor from '../components/DocumentEditor/DocumentTermsEditor'
import DocumentTotalsPanel from '../components/DocumentEditor/DocumentTotalsPanel'
import DocumentBankAccountsPanel from '../components/DocumentEditor/DocumentBankAccountsPanel'
import WorkflowStagePanel from '../components/DocumentEditor/WorkflowStagePanel'
import ProcessPanelModule from '../components/DocumentEditor/ProcessPanelModule'
import {
  isReservedPlaceholderLabel,
  mapProcessOptions,
  matchProcessOption,
  optionsToProcessRecord,
  processRecordToOptions,
  resolveListColumnLabel,
} from '../components/DocumentEditor/processPanelUtils'
import {
  stageColors as processStageColors,
} from '../components/DocumentEditor/stageColors'
import CustomerPicker, {
  DOCUMENT_SIDE_ACTION_WIDTH,
  findDocumentCustomer as findQuoteCustomer,
} from '../components/DocumentEditor/CustomerPicker'
import ProductSearchSelect from '../components/DocumentEditor/ProductSearchSelect'
import { documentDropdownMenuClass } from '../components/DocumentEditor/documentItemLayout'
import { readCompanySettings } from '../utils/companySettings'
import {
  APP_PANEL_TITLE_CLASS,
  PAGE_BALANCE_AMOUNT_CLASS,
  PAGE_CENTER_TITLE_CLASS,
  PAGE_FILTER_FIELD_CLASS,
  PAGE_FILTER_LABEL_CLASS,
  PAGE_FILTER_MENU_CLASS,
  PAGE_FILTER_PILL_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  PAGE_LIST_MENU_CLASS,
  PAGE_LIST_PILL_CLASS,
  PAGE_LIST_PILL_WRAPPER_CLASS,
  PAGE_TABLE_HEADER_CLASS,
  YF_TEXT_CLASS,
  YF_TEXT_ON_COLOR_CLASS,
} from '../utils/dashboardDesign'

const STORAGE_KEY = 'erlenbox-quotes'
const TERMS_STORAGE_KEY = 'erlenbox-quote-terms'
const stageColors = [
  'bg-blue-500',
  'bg-sky-500',
  'bg-cyan-500',
  'bg-teal-500',
  'bg-emerald-500',
  'bg-lime-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-rose-500',
  'bg-pink-500',
  'bg-fuchsia-500',
  'bg-purple-500',
  'bg-violet-500',
  'bg-indigo-500',
  'bg-slate-500',
  'bg-stone-500',
  'bg-zinc-500',
]

function StageColorSwatches({
  value,
  onChange,
  size = 'md',
  direction = 'horizontal',
  fill = false,
}) {
  const dotClass = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'
  const layoutClass =
    direction === 'vertical'
      ? fill
        ? 'flex h-full min-h-0 flex-1 flex-col justify-between py-0.5'
        : 'flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-0.5'
      : 'flex flex-wrap items-center gap-1.5'

  return (
    <div className={layoutClass}>
      {stageColors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={`${dotClass} shrink-0 rounded-full ${color} transition-all ${
            value === color
              ? 'ring-2 ring-white ring-offset-1 ring-offset-dark-800 scale-110'
              : 'opacity-60 hover:scale-105 hover:opacity-100'
          }`}
          aria-label={`Renk seç: ${color}`}
        />
      ))}
    </div>
  )
}

const quoteItemGridClass = 'grid-cols-[72px_minmax(0,1fr)]'
const quoteItemFieldsGridClass = 'grid-cols-[minmax(0,1.5fr)_72px_108px_72px_112px_72px]'
const quoteItemFieldGapClass = 'gap-x-2'

const statusClasses = {
  Taslak: 'badge-gray',
  Hazırlanıyor: 'badge-blue',
  'Müşteriye Gönderildi': 'badge-orange',
  'Revize İstendi': 'badge-purple',
  Onaylandı: 'badge-green',
  Reddedildi: 'badge-red',
}

const filterAllOption = { label: 'Tümü', color: 'bg-gray-500', locked: true }
const sortFilterOptions = [
  { label: 'Son işleme göre', color: 'bg-blue-500' },
  { label: 'Tarihe göre', color: 'bg-purple-500' },
  { label: 'İsme göre', color: 'bg-orange-500' },
  { label: 'Fiyata göre', color: 'bg-emerald-500' },
]
const sortModeByLabel = {
  'Son işleme göre': 'latest',
  'Tarihe göre': 'date',
  'İsme göre': 'name',
  'Fiyata göre': 'price',
}
const sortLabelByMode = {
  latest: 'Son işleme göre',
  date: 'Tarihe göre',
  name: 'İsme göre',
  price: 'Fiyata göre',
}
const savedQuoteTerms = [
  'Fiyatlara KDV dahil değildir.',
  'Teklif geçerlilik süresi belirtilen tarih ile sınırlıdır.',
  'Teslimat süresi sipariş onayı ve avans ödemesi sonrası başlar.',
  'Baskı onayı alındıktan sonra üretim revizyonu ayrıca fiyatlandırılır.',
  'Nakliye ve sevkiyat bedeli ayrıca hesaplanır.',
  'Ödeme koşulları sipariş onayı öncesinde karşılıklı mutabakat ile netleştirilir.',
]

function QuoteListOrderModuleButton({
  quote,
  orderCreated,
  pendingAction,
  onRequestCreate,
  onRequestUndo,
  onConfirmCreate,
  onConfirmUndo,
  onCancelPending,
}) {
  if (pendingAction === 'create') {
    return (
      <DeleteConfirmPopover
        title="Sipariş oluşturmak istiyor musunuz?"
        description="Teklif siparişe aktarılacak."
        confirmLabel="Evet"
        cancelLabel="Hayır"
        inline
        compact
        onConfirm={onConfirmCreate}
        onCancel={onCancelPending}
      />
    )
  }

  if (pendingAction === 'undo') {
    return (
      <DeleteConfirmPopover
        title="Siparişi geri almak istiyor musunuz?"
        description="Sipariş kaydı kaldırılır; teklif listede kalır."
        confirmLabel="Evet"
        cancelLabel="Hayır"
        inline
        compact
        onConfirm={onConfirmUndo}
        onCancel={onCancelPending}
      />
    )
  }

  if (orderCreated) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2 text-[11px] font-bold text-emerald-700">
          <ShoppingCart className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          Sipariş Oluşturuldu
        </span>
        <button
          type="button"
          onClick={onRequestUndo}
          className="glass-sidebar-toggle glass-sidebar-collapse flex h-8 w-8 items-center justify-center rounded-xl"
          title="Siparişi geri al"
          aria-label="Siparişi geri al"
        >
          <Undo2 className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onRequestCreate}
      className="inline-flex h-8 items-center gap-1 rounded-lg border border-ds-border bg-transparent px-2 text-[11px] font-semibold text-[var(--muted)] transition-colors hover:border-emerald-500/40 hover:text-emerald-700"
      title={`${quote.customer || quote.id} teklifinden sipariş oluştur`}
      aria-label="Sipariş oluştur"
    >
      <ShoppingCart className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
      Sipariş Oluştur
    </button>
  )
}

function normalizeQuoteStages(quote) {
  const stages = loadWorkflowStages()
  const quoteStages = getQuoteStageOptions(stages)
  let currentStageId = quote.currentStageId
  if (!currentStageId || !quoteStages.some((stage) => stage.id === currentStageId)) {
    currentStageId = quoteStages[0]?.id || ''
  }

  return {
    ...quote,
    stages,
    currentStageId,
  }
}

function loadQuotes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return initialQuotes.map(normalizeQuoteStages)
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed)
      ? parsed.map(normalizeQuoteStages)
      : initialQuotes.map(normalizeQuoteStages)
  } catch {
    return initialQuotes.map(normalizeQuoteStages)
  }
}

function saveQuotes(quotes, { silent = false } = {}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes))
    if (!silent) {
      window.dispatchEvent(new CustomEvent('bach:quotes-updated'))
    }
    return true
  } catch {
    window.alert('Teklif kaydedilemedi. Tarayıcı depolama alanını veya izinleri kontrol edin.')
    return false
  }
}

function loadSavedQuoteTerms() {
  try {
    const saved = localStorage.getItem(TERMS_STORAGE_KEY)
    if (!saved) return savedQuoteTerms
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : savedQuoteTerms
  } catch {
    return savedQuoteTerms
  }
}

function saveSavedQuoteTerms(terms) {
  localStorage.setItem(TERMS_STORAGE_KEY, JSON.stringify(terms))
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function defaultValidUntilDate(fromDate = todayIsoDate()) {
  const base = new Date(`${fromDate}T12:00:00`)
  base.setDate(base.getDate() + 3)
  return base.toISOString().slice(0, 10)
}

function createEmptyQuoteItem() {
  return {
    id: createId('item'),
    product: '',
    description: '',
    extraDescription: '',
    lineImage: '',
    showDescription: true,
    showDiscount: false,
    showExciseTax: false,
    showAccommodationTax: false,
    quantity: 1,
    unitPrice: 0,
    discountRate: 0,
    exciseTaxRate: 0,
    accommodationTaxRate: 0,
    vatRate: 20,
  }
}

function safeText(value) {
  return String(value || '').trim()
}

function sanitizeQuoteItem(item) {
  return {
    ...createEmptyQuoteItem(),
    ...item,
    id: item.id || createId('item'),
    product: safeText(item.product),
    description: safeText(item.description),
    extraDescription: safeText(item.extraDescription),
    lineImage: typeof item.lineImage === 'string' ? item.lineImage : '',
    quantity: safeNumber(item.quantity, 0, 999999),
    unitPrice: safeNumber(item.unitPrice, 0, 999999999),
    discountRate: safeNumber(item.discountRate, 0, 100),
    exciseTaxRate: safeNumber(item.exciseTaxRate, 0, 100),
    accommodationTaxRate: safeNumber(item.accommodationTaxRate, 0, 100),
    vatRate: safeNumber(item.vatRate, 0, 100),
    showDescription: item.showDescription !== false,
    showDiscount: Boolean(item.showDiscount),
    showExciseTax: Boolean(item.showExciseTax),
    showAccommodationTax: Boolean(item.showAccommodationTax),
  }
}

function resolveQuoteBankAccounts(quote) {
  const accounts = readCompanySettings().bankAccounts || []
  const selectedIds = Array.isArray(quote.selectedBankAccountIds)
    ? quote.selectedBankAccountIds
    : []
  return selectedIds
    .map((accountId) => accounts.find((account) => account.id === accountId))
    .filter(Boolean)
}

function sanitizeQuoteForSave(quote) {
  const items = (quote.items || [])
    .map(sanitizeQuoteItem)
    .filter(
      (item) => item.product || item.description || item.extraDescription || item.unitPrice > 0,
    )

  return {
    ...quote,
    id: sanitizeQuoteCode(quote.id),
    title: safeText(quote.title),
    customer: safeText(quote.customer),
    contact: safeText(quote.contact),
    phone: safeText(quote.phone),
    email: safeText(quote.email),
    status: getOptionLabels('status').includes(quote.status)
      ? quote.status
      : getOptionLabels('status')[0] || 'Taslak',
    createdAt: quote.createdAt || todayIsoDate(),
    validUntil: quote.validUntil || defaultValidUntilDate(quote.createdAt || todayIsoDate()),
    tags: Array.isArray(quote.tags) ? quote.tags.map(safeText).filter(Boolean) : [],
    termsDescription: String(quote.termsDescription || '').trim(),
    terms: Array.isArray(quote.terms) ? quote.terms.map(safeText).filter(Boolean) : [],
    items,
    activities: Array.isArray(quote.activities) ? quote.activities : [],
    selectedBankAccountIds: Array.isArray(quote.selectedBankAccountIds)
      ? quote.selectedBankAccountIds.filter((id) => typeof id === 'string' && id.trim())
      : [],
    ...sanitizeDocumentDiscountFields(quote),
  }
}

function validateQuoteForSave(quote) {
  const safeQuote = sanitizeQuoteForSave(quote)
  if (!safeQuote.customer)
    return { ok: false, message: 'Kaydetmeden önce müşteri seçin veya müşteri adı girin.' }
  if (!safeQuote.createdAt) return { ok: false, message: 'Oluşturma tarihi boş olamaz.' }
  if (!safeQuote.validUntil) return { ok: false, message: 'Geçerlilik tarihi boş olamaz.' }
  if (new Date(safeQuote.validUntil) < new Date(safeQuote.createdAt)) {
    return { ok: false, message: 'Geçerlilik tarihi oluşturma tarihinden önce olamaz.' }
  }
  if (safeQuote.items.length === 0)
    return { ok: false, message: 'Kaydetmeden önce en az bir ürün satırı seçin.' }
  const invalidItem = safeQuote.items.find((item) => !item.product || item.quantity <= 0)
  if (invalidItem)
    return { ok: false, message: 'Ürün satırlarında ürün adı ve adet bilgisi zorunludur.' }
  if (!safeQuote.id) return { ok: false, message: 'Teklif kodu yalnızca rakamlardan oluşmalıdır.' }
  return { ok: true, quote: safeQuote }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function resolveQuoteItemImage(item) {
  if (typeof item?.lineImage === 'string' && item.lineImage) return item.lineImage
  const products = getCatalogProducts()
  const product =
    (item?.productId && products.find((entry) => entry.id === item.productId)) ||
    (item?.product && products.find((entry) => entry.name === item.product)) ||
    null
  return resolveProductImage(product) || ''
}

function getQuoteCustomerRepresentative(customer) {
  if (!customer) return ''
  return (
    getCustomerMetaSelection(customer, readCustomerMeta()[customer.id] || {}).representative ||
    customer.owner ||
    ''
  )
}

function getQuoteCustomerDetails(quote) {
  const matchedCustomer = findQuoteCustomer(quote.customer)
  const customer =
    matchedCustomer || customerData.list.find((item) => item.company === quote.customer)
  const display = getCustomerDisplay(customer || quote.customer)
  const contactInfo = resolveCustomerContactInfo(customer || {})
  return {
    company: display.brandShortName || 'Müşteri belirtilmedi',
    contact: display.companyTitle || 'Firma ünvanı belirtilmedi',
    authorizedName: quote.contact || contactInfo.contactName || '',
    email: quote.email || contactInfo.email || '',
    phone: quote.phone || contactInfo.phone || '',
    address: matchedCustomer?.address || matchedCustomer?.city || '',
    lastMeeting: customer?.lastMeeting || '',
  }
}

function buildQuoteShareText(quote) {
  const safeQuote = sanitizeQuoteForSave(quote)
  const totals = documentTotals(safeQuote)
  const customer = getQuoteCustomerDetails(safeQuote)
  const itemLines = safeQuote.items.map((item, index) => {
    const itemTotal = itemTotals(item)
    return `${index + 1}. ${item.product} | Adet: ${item.quantity} | KDV Hariç: ${formatTL(itemTotal.net)} | Toplam: ${formatTL(itemTotal.total)}`
  })
  const terms = safeQuote.termsDescription
    ? `\n\nTeklif Koşulları:\n${safeQuote.termsDescription}`
    : ''

  return [
    `Teklif: ${safeQuote.id}`,
    `Başlık: ${safeQuote.title || 'Teklif'}`,
    `Müşteri: ${customer.company}`,
    `Firma Ünvanı: ${customer.contact}`,
    `Tarih: ${formatListDate(safeQuote.createdAt)} - Geçerlilik: ${formatListDate(safeQuote.validUntil)}`,
    '',
    'Ürünler:',
    ...itemLines,
    '',
    `Ara Toplam: ${formatTL(totals.subtotal)}`,
    ...(totals.lineDiscount > 0 ? [`Satır İndirimi: ${formatTL(totals.lineDiscount)}`] : []),
    ...(totals.showDocumentDiscount
      ? [`Toplam İndirim: ${formatTL(totals.documentDiscount)}`]
      : []),
    `KDV: ${formatTL(totals.vat)}`,
    `Genel Toplam: ${formatTL(totals.grandTotal)}`,
    terms,
  ].join('\n')
}

function buildQuotePrintHtml(quote) {
  const safeQuote = sanitizeQuoteForSave(quote)
  const totals = documentTotals(safeQuote)
  const customer = getQuoteCustomerDetails(safeQuote)
  const bankAccounts = resolveQuoteBankAccounts(safeQuote)
  const rows = safeQuote.items
    .map((item, index) => {
      const row = itemTotals(item)
      return `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${escapeHtml(item.product)}</strong>${item.extraDescription ? `<br><small>${escapeHtml(item.extraDescription)}</small>` : ''}</td>
        <td>${escapeHtml(item.quantity)}</td>
        <td>${formatTL(item.unitPrice)}</td>
        <td>%${escapeHtml(item.vatRate)}</td>
        <td>${formatTL(row.total)}</td>
      </tr>
    `
    })
    .join('')

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(safeQuote.id)} - Teklif</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 32px; font-family: Inter, Arial, sans-serif; color: #0f172a; background: #f8fafc; }
          .quote { max-width: 960px; margin: 0 auto; background: white; border-radius: 28px; overflow: hidden; box-shadow: 0 24px 70px rgba(15, 23, 42, .12); }
          .hero { padding: 34px; color: white; background: linear-gradient(135deg, #0f172a, #1e3a8a 54%, #065f46); }
          .hero-top { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
          .brand { font-size: 13px; font-weight: 900; letter-spacing: .18em; text-transform: uppercase; opacity: .75; }
          h1 { margin: 10px 0 0; font-size: 34px; letter-spacing: -.04em; }
          .badge { border: 1px solid rgba(255,255,255,.24); border-radius: 16px; padding: 10px 14px; text-align: right; font-weight: 800; }
          .content { padding: 28px 34px 34px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 20px; }
          .card { border: 1px solid #e2e8f0; border-radius: 20px; padding: 18px; background: #f8fafc; }
          .label { color: #64748b; font-size: 11px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
          .value { margin-top: 7px; font-size: 15px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; overflow: hidden; border-radius: 18px; }
          th { background: #0f172a; color: white; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; padding: 13px; text-align: left; }
          td { border-bottom: 1px solid #e2e8f0; padding: 13px; font-size: 13px; vertical-align: top; }
          small { color: #64748b; line-height: 1.4; }
          .totals { margin-left: auto; margin-top: 22px; width: 360px; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; }
          .total-row { display: flex; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .grand { background: #064e3b; color: white; font-size: 18px; font-weight: 900; }
          .terms { margin-top: 22px; white-space: pre-line; line-height: 1.6; }
          @media print { body { background: white; padding: 0; } .quote { box-shadow: none; border-radius: 0; } }
        </style>
      </head>
      <body>
        <main class="quote">
          <section class="hero">
            <div class="hero-top">
              <div>
                <div class="brand">BACH</div>
                <h1>${escapeHtml(safeQuote.title || 'Fiyat Teklifi')}</h1>
              </div>
              <div class="badge">
                ${escapeHtml(safeQuote.id)}<br />
                <span style="font-size:12px; opacity:.75;">${formatListDate(safeQuote.createdAt)}</span>
              </div>
            </div>
          </section>
          <section class="content">
            <div class="grid">
              <div class="card"><div class="label">Müşteri</div><div class="value">${escapeHtml(customer.company)}</div><small>${escapeHtml(customer.contact)} ${customer.email ? `· ${escapeHtml(customer.email)}` : ''}</small></div>
              <div class="card"><div class="label">Geçerlilik</div><div class="value">${formatListDate(safeQuote.validUntil)}</div><small>Bu tarih sonuna kadar geçerlidir.</small></div>
            </div>
            <table>
              <thead><tr><th>#</th><th>Ürün</th><th>Adet</th><th>Birim Fiyat</th><th>KDV</th><th>Toplam</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="totals">
              <div class="total-row"><span>Ara Toplam</span><strong>${formatTL(totals.subtotal)}</strong></div>
              ${totals.lineDiscount > 0 ? `<div class="total-row"><span>Satır İndirimi</span><strong>${formatTL(totals.lineDiscount)}</strong></div>` : ''}
              ${totals.showDocumentDiscount ? `<div class="total-row"><span>Toplam İndirim</span><strong>${formatTL(totals.documentDiscount)}</strong></div>` : ''}
              <div class="total-row"><span>ÖTV</span><strong>${formatTL(totals.exciseTax)}</strong></div>
              <div class="total-row"><span>Konaklama Vergisi</span><strong>${formatTL(totals.accommodationTax)}</strong></div>
              <div class="total-row"><span>KDV</span><strong>${formatTL(totals.vat)}</strong></div>
              <div class="total-row grand"><span>Genel Toplam</span><strong>${formatTL(totals.grandTotal)}</strong></div>
            </div>
            ${safeQuote.termsDescription ? `<div class="terms"><div class="label">Teklif Koşulları</div>${escapeHtml(safeQuote.termsDescription)}</div>` : ''}
            ${
              bankAccounts.length > 0
                ? `
              <div class="terms">
                <div class="label">Banka Hesapları</div>
                ${bankAccounts
                  .map(
                    (account) => `
                  <p style="margin:8px 0 0; font-size:13px; font-weight:700;">
                    ${escapeHtml(account.bankName)}${account.label ? ` · ${escapeHtml(account.label)}` : ''}
                  </p>
                  ${account.branch ? `<p style="margin:4px 0 0; font-size:12px; color:#64748b;">Şube: ${escapeHtml(account.branch)}</p>` : ''}
                  ${account.iban ? `<p style="margin:4px 0 0; font-size:12px; color:#64748b;">IBAN: ${escapeHtml(account.iban)}</p>` : ''}
                `,
                  )
                  .join('')}
              </div>
            `
                : ''
            }
          </section>
        </main>
      </body>
    </html>
  `
}

async function createQuotePdfBlob(element) {
  if (!element) throw new Error('Teklif görsel alanı bulunamadı.')

  await document.fonts?.ready
  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#f8f2e9',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  const imageData = canvas.toDataURL('image/png', 1)
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imageHeight = (canvas.height * pageWidth) / canvas.width
  let heightLeft = imageHeight
  let position = 0

  pdf.addImage(imageData, 'PNG', 0, position, pageWidth, imageHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imageHeight
    pdf.addPage()
    pdf.addImage(imageData, 'PNG', 0, position, pageWidth, imageHeight)
    heightLeft -= pageHeight
  }

  return pdf.output('blob')
}

async function createQuotePdfFile(element, quoteId) {
  const blob = await createQuotePdfBlob(element)
  const filename = `${quoteId}-teklif-sunumu.pdf`
  return {
    blob,
    filename,
    file: new File([blob], filename, { type: 'application/pdf' }),
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function formatListDate(value) {
  if (!value) return ''
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) return value
  const [datePart] = String(value).split(' ')
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return value
  return `${day}.${month}.${year}`
}

function getQuoteListDateSource(quote) {
  return quote.activities?.[0]?.date || quote.createdAt || ''
}

function formatListDateParts(value) {
  if (!value) return { date: '', time: '' }
  const raw = String(value).trim()
  const trMatch = raw.match(/^(\d{2}\.\d{2}\.\d{4})(?:[, ]+\s*(\d{1,2}:\d{2}))/)
  if (trMatch) {
    const [hours, minutes] = (trMatch[2] || '').split(':')
    return {
      date: trMatch[1],
      time: hours && minutes ? `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}` : '',
    }
  }

  const formattedDate = formatListDate(raw.split(/[T ]/)[0] || raw)
  const timePart = raw.includes('T') ? raw.split('T')[1] : raw.split(' ')[1]
  if (!timePart || !timePart.includes(':')) return { date: formattedDate, time: '' }
  const [hours, minutes] = timePart.split(':')
  if (!hours || !minutes) return { date: formattedDate, time: '' }
  return {
    date: formattedDate,
    time: `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`,
  }
}

function getQuoteListAmount(quote) {
  const parts = documentMoneyParts(quote)
  const candidates = [
    parts.inclVat,
    Number(quote?.grandTotal),
    Number(quote?.total),
    Number(quote?.amount),
    parts.exclVat,
    Number(quote?.amountNet),
  ]
  for (const value of candidates) {
    if (Number.isFinite(value) && value > 0) return value
  }
  return 0
}

function TurkishLiraIcon({ className = '' }) {
  return (
    <span
      className={`${className} flex items-center justify-center text-base font-black leading-none`}
    >
      ₺
    </span>
  )
}

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <label className={`${YF_TEXT_CLASS} mb-1 block`}>{label}</label>
      {children}
    </div>
  )
}

function FieldLabelSpacer({ label = 'Alan' }) {
  return (
    <label className={`${YF_TEXT_CLASS} mb-1 block opacity-0`} aria-hidden>
      {label}
    </label>
  )
}

function QuotePriorityEditor({ quote, onPatch, optionLists, updateOptionList, compact = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [priorityInput, setPriorityInput] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  const priorityLabels = optionLists.priority.map((option) => option.label)
  const priorityValue = priorityLabels.includes(quote.priority) ? quote.priority : ''

  const record = useMemo(
    () => optionsToProcessRecord(optionLists.priority, priorityValue),
    [optionLists.priority, priorityValue],
  )

  function toggleEditor() {
    setIsOpen((current) => !current)
    setPendingDeleteId(null)
  }

  function addPriority(chosenColor, inputLabel) {
    const label = (inputLabel || priorityInput).trim()
    if (!label || optionLists.priority.some((option) => option.label === label)) return
    const next = [
      ...optionLists.priority,
      {
        label,
        color:
          chosenColor ||
          processStageColors[optionLists.priority.length % processStageColors.length],
      },
    ]
    updateOptionList('priority', next)
    onPatch({ priority: label })
    setPriorityInput('')
  }

  function selectPriority(stage) {
    if (!stage) {
      onPatch({ priority: '' })
      return
    }
    if (quote.priority === stage.label) {
      onPatch({ priority: '' })
      return
    }
    onPatch({ priority: stage.label })
  }

  function updateColor(stage, color) {
    updateOptionList(
      'priority',
      mapProcessOptions(optionLists.priority, stage, (option) => ({ ...option, color })),
    )
  }

  function updateLabel(stage, label) {
    const clean = label.trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return
    updateOptionList(
      'priority',
      mapProcessOptions(optionLists.priority, stage, (option) => ({ ...option, label: clean })),
    )
    if (quote.priority === stage.label) onPatch({ priority: clean })
  }

  function reorder(nextStages) {
    updateOptionList('priority', processRecordToOptions(nextStages))
  }

  function removePriority(stage) {
    const next = optionLists.priority.filter((option) => !matchProcessOption(option, stage))
    updateOptionList('priority', next)
    if (quote.priority === stage.label) onPatch({ priority: '' })
    setPendingDeleteId(null)
  }

  return (
    <ProcessPanelModule
      activeLabel="Aktif Öncelik"
      countSuffix="öncelik tanımlı"
      emptyMessage="Henüz öncelik eklenmedi."
      addPlaceholder="Yeni öncelik adı..."
      record={record}
      isOpen={isOpen}
      onToggle={toggleEditor}
      stageInput={priorityInput}
      setStageInput={setPriorityInput}
      onAddStage={addPriority}
      onSelectStage={selectPriority}
      onUpdateStageColor={updateColor}
      onUpdateStageLabel={updateLabel}
      onReorderStages={reorder}
      pendingStageDeleteId={pendingDeleteId}
      setPendingStageDeleteId={setPendingDeleteId}
      onRemoveStage={removePriority}
      compact={compact}
    />
  )
}

function QuoteProcessManagement({
  quote,
  onPatch,
  optionLists,
  updateOptionList,
  quoteStageRecord,
  isStageEditorOpen,
  toggleStageEditor,
  stageInput,
  setStageInput,
  onAddQuoteStage,
  onSelectQuoteStage,
  onUpdateQuoteStageColor,
  onUpdateQuoteStageLabel,
  onReorderQuoteStages,
  pendingStageDeleteId,
  setPendingStageDeleteId,
  onRemoveQuoteStage,
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-white">Süreçler</h2>
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0 space-y-1">
          <h3 className="text-xs font-bold text-white">Öncelik</h3>
          <QuotePriorityEditor
            quote={quote}
            onPatch={onPatch}
            optionLists={optionLists}
            updateOptionList={updateOptionList}
            compact
          />
        </div>

        <div className="min-w-0 space-y-1">
          <h3 className="text-xs font-bold text-white">Teklif Süreci</h3>
          <WorkflowStagePanel
            record={quoteStageRecord}
            isOpen={isStageEditorOpen}
            onToggle={toggleStageEditor}
            stageInput={stageInput}
            setStageInput={setStageInput}
            onAddStage={onAddQuoteStage}
            onSelectStage={onSelectQuoteStage}
            onUpdateStageColor={onUpdateQuoteStageColor}
            onUpdateStageLabel={onUpdateQuoteStageLabel}
            onReorderStages={onReorderQuoteStages}
            pendingStageDeleteId={pendingStageDeleteId}
            setPendingStageDeleteId={setPendingStageDeleteId}
            onRemoveStage={onRemoveQuoteStage}
            compact
          />
        </div>
      </div>
    </div>
  )
}

function QuoteNotesPanel({ quote, onPatch }) {
  return (
    <label className="block">
      <span className="mb-1 block text-base font-bold text-white">Notlar</span>
      <textarea
        value={quote.notes || ''}
        onChange={(event) => onPatch({ notes: event.target.value })}
        rows={3}
        placeholder="Teklif ile ilgili genel notlar..."
        className="form-input resize-none text-xs"
      />
    </label>
  )
}

function QuoteTermsEditor({ quote, onPatch, compact = false }) {
  const [customTerm, setCustomTerm] = useState('')
  const [savedTerms, setSavedTerms] = useState(loadSavedQuoteTerms)
  const [pendingDeleteTerm, setPendingDeleteTerm] = useState(null)

  function saveTerm(term) {
    const cleanTerm = term.trim()
    if (!cleanTerm || savedTerms.includes(cleanTerm)) return
    const nextTerms = [cleanTerm, ...savedTerms]
    setSavedTerms(nextTerms)
    saveSavedQuoteTerms(nextTerms)
    setCustomTerm('')
  }

  function appendTermToDescription(term) {
    const currentText = quote.termsDescription || ''
    const nextText = currentText.trim() ? `${currentText.trimEnd()}\n- ${term}` : `- ${term}`
    onPatch({ termsDescription: nextText })
  }

  function deleteSavedTerm(term) {
    const nextTerms = savedTerms.filter((item) => item !== term)
    setSavedTerms(nextTerms)
    saveSavedQuoteTerms(nextTerms)
    setPendingDeleteTerm(null)
  }

  return (
    <div
      className={
        compact ? '' : 'col-span-2 rounded-3xl border border-dark-500/45 bg-dark-900/35 p-4'
      }
    >
      {!compact && (
        <div className="mb-4 text-center">
          <h3 className="text-base font-bold text-white">Teklif Koşulları</h3>
        </div>
      )}
      {compact && <p className="mb-4 text-base font-bold text-white">Teklif Koşulları</p>}
      <div
        className={
          compact ? 'space-y-3' : 'grid grid-cols-[minmax(0,1fr)_390px] items-stretch gap-4'
        }
      >
        <div
          className={`flex flex-col rounded-2xl border border-dark-500/45 bg-dark-800/70 p-3 ${compact ? 'min-h-[180px]' : 'h-[332px]'}`}
        >
          <div className="mb-3">
            <h4 className="text-base font-bold text-white">Açıklama</h4>
          </div>
          <textarea
            value={quote.termsDescription || ''}
            onChange={(event) => onPatch({ termsDescription: event.target.value })}
            placeholder="Teklifin ödeme, teslimat, üretim veya özel açıklamalarını buraya yazın..."
            className="min-h-0 flex-1 resize-none rounded-2xl border border-dark-500/50 bg-dark-700/70 px-4 py-3 text-sm text-gray-200 placeholder-gray-500 outline-none transition-colors focus:border-blue-500/35 focus:bg-dark-700/80"
          />
        </div>

        <div
          className={`flex flex-col rounded-2xl border border-dark-500/45 bg-dark-800/70 p-3 ${compact ? 'min-h-[220px]' : 'h-[332px]'}`}
        >
          <div className="mb-3">
            <h3 className="text-base font-bold text-white">Hazır Teklif Koşulları</h3>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {savedTerms.map((term) => (
              <div key={term} className="relative rounded-xl bg-dark-700/70">
                {pendingDeleteTerm === term ? (
                  <DeleteConfirmPopover
                    description="Hazır koşul listeden kaldırılacak."
                    onConfirm={() => deleteSavedTerm(term)}
                    onCancel={() => setPendingDeleteTerm(null)}
                    className="w-full"
                  />
                ) : (
                  <div className="flex items-start gap-2 rounded-xl transition-colors hover:bg-blue-500/15">
                    <button
                      type="button"
                      onClick={() => appendTermToDescription(term)}
                      className="flex min-w-0 flex-1 items-start gap-2 px-3 py-2 text-left text-xs font-semibold text-gray-300"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" />
                      <span>{term}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteTerm(term)}
                      className="mr-2 mt-2 shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/15 hover:text-red-300"
                      title="Hazır koşulu sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {savedTerms.length === 0 && (
              <div className="rounded-xl border border-dashed border-dark-500/70 px-3 py-4 text-center text-xs font-semibold text-gray-500">
                Henüz kayıtlı hazır koşul yok.
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={customTerm}
              onChange={(event) => setCustomTerm(event.target.value)}
              placeholder="Hazır koşul kaydet..."
              className="h-10 min-w-0 flex-1 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 text-xs font-semibold text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/35"
            />
            <button
              type="button"
              onClick={() => saveTerm(customTerm)}
              className={`${BTN_PRIMARY} h-10 gap-1.5 px-3 text-xs`}
            >
              <Plus className="h-3.5 w-3.5" /> Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniButton({ children, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        danger
          ? 'inline-flex h-8 items-center rounded-lg border border-red-500/30 px-2.5 text-[12px] font-semibold text-red-300 transition-colors hover:bg-red-500/10'
          : `${BTN_PRIMARY} h-8 gap-1 px-2.5 text-[12px]`
      }
    >
      {!danger && <Plus className="h-3.5 w-3.5" />}
      {children}
    </button>
  )
}

function StageTracker({ quote, onUpdateStages }) {
  const [stageInput, setStageInput] = useState('')

  function addStage() {
    const label = stageInput.trim()
    if (!label) return
    const nextStage = {
      id: createId('stage'),
      label,
      color: stageColors[(quote.stages || []).length % stageColors.length],
      note: 'Yeni süreç aşaması eklendi.',
    }
    onUpdateStages([...(quote.stages || []), nextStage], nextStage.id)
    setStageInput('')
  }

  function removeStage(stage) {
    const first = window.confirm(`"${stage.label}" sürecini silmek istediğinize emin misiniz?`)
    if (!first) return
    const second = window.confirm(
      `Son onay: "${stage.label}" süreci tekliften kaldırılacak. Devam edilsin mi?`,
    )
    if (!second) return
    const nextStages = (quote.stages || []).filter((item) => item.id !== stage.id)
    onUpdateStages(nextStages, nextStages[0]?.id || '')
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          value={stageInput}
          onChange={(e) => setStageInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStage())}
          className="form-input"
        />
        <MiniButton onClick={addStage}>Süreç Ekle</MiniButton>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {(quote.stages || []).map((stage, index) => {
          const activeIndex = (quote.stages || []).findIndex(
            (item) => item.id === quote.currentStageId,
          )
          const isDone = index < activeIndex
          const isActive = stage.id === quote.currentStageId
          return (
            <div
              key={stage.id}
              className={`relative rounded-2xl border p-3 transition-all ${
                isActive
                  ? 'border-accent-blue bg-blue-500/10 shadow-lg'
                  : 'border-dark-500/50 bg-dark-700/35'
              }`}
            >
              <button
                type="button"
                onClick={() => onUpdateStages(quote.stages, stage.id)}
                className="w-full text-left"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${stage.color} text-xs font-bold text-white`}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </span>
                  <span
                    className={`text-xs font-semibold ${isActive ? 'text-accent-blue' : 'text-white'}`}
                  >
                    {stage.label}
                  </span>
                </div>
                <p className="line-clamp-2 text-[12px] text-gray-500">{stage.note}</p>
              </button>
              <button
                type="button"
                onClick={() => removeStage(stage)}
                className="absolute right-2 top-2 rounded-lg p-1 text-gray-600 hover:bg-red-500/10 hover:text-red-300"
                title="Süreci sil"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function QuotesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [quotes, setQuotes] = useState(loadQuotes)
  const [workflowStages, setWorkflowStages] = useState(loadWorkflowStages)
  const [draftQuote, setDraftQuote] = useState(null)
  const [selectedId, setSelectedId] = useState(quotes[0]?.id || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ priority: 'Tümü', status: 'Tümü', stage: 'Tümü' })
  const [sortMode, setSortMode] = useState('latest')
  const [viewMode, setViewMode] = useState('list')
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [deleteConfirmAnchor, setDeleteConfirmAnchor] = useState(null)
  const [openItemMenuId, setOpenItemMenuId] = useState(null)
  const [pendingItemDeleteId, setPendingItemDeleteId] = useState(null)
  const [openSaveMenu, setOpenSaveMenu] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingHeaderQuoteDelete, setPendingHeaderQuoteDelete] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [stageInput, setStageInput] = useState('')
  const [pendingStageDeleteId, setPendingStageDeleteId] = useState(null)
  const [isStageEditorOpen, setIsStageEditorOpen] = useState(false)
  const [isOrderStagePanelOpen, setIsOrderStagePanelOpen] = useState(false)
  const [orderStageInput, setOrderStageInput] = useState('')
  const [pendingOrderStageDeleteId, setPendingOrderStageDeleteId] = useState(null)
  const [isActivityOpen, setIsActivityOpen] = useState(false)
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [activeMenu, setActiveMenu] = useState(null)
  const [pendingQuoteOrderAction, setPendingQuoteOrderAction] = useState(null)
  const quotePreviewRef = useRef(null)
  const syncedCustomerKeyRef = useRef('')

  const selectedQuote =
    draftQuote || quotes.find((quote) => quote.id === selectedId) || quotes[0] || null
  const selectedCustomer =
    selectedQuote?.customerId || selectedQuote?.customer
      ? findQuoteCustomer(selectedQuote.customerId || selectedQuote.customer)
      : null
  const selectedTotals = selectedQuote ? documentTotals(selectedQuote) : null
  const isDraftQuote = Boolean(draftQuote)
  const resolvedQuoteCode = useMemo(
    () =>
      resolveQuoteCode(
        selectedQuote?.id,
        quotes.map((quote) => quote.id),
      ),
    [selectedQuote?.id, quotes],
  )
  const linkedOrderQuoteIds = useMemo(() => {
    const ids = new Set()
    loadOrders().forEach((order) => {
      if (order.quoteId) ids.add(order.quoteId)
      if (order.id) ids.add(order.id)
    })
    return ids
  }, [quotes])
  const quoteStageOptions = getQuoteStageOptions(workflowStages)
  const orderStageOptions = getOrderStageOptions(workflowStages)
  const quotePriorityFilterOptions = [filterAllOption, ...optionLists.priority]
  const quoteStatusFilterOptions = [filterAllOption, ...optionLists.status]

  function resolveListQuoteStage(quote) {
    return resolveQuoteActiveStage(quote, workflowStages)
  }

  function handleQuoteStageLabelChange(quote, stageLabel) {
    const stage = quoteStageOptions.find((item) => item.label === stageLabel)
    if (!stage) return

    const processRecord = resolveQuoteProcessRecord(quote, workflowStages)
    if (processRecord.currentStageId === stage.id) return

    patchQuote(quote.id, {
      currentStageId: stage.id,
      activities: [
        ...(quote.activities || []),
        {
          id: createId('act'),
          date: new Date().toLocaleString('tr-TR'),
          text: `Süreç "${stage.label}" olarak güncellendi.`,
        },
      ],
    })
    setActiveMenu(null)
  }

  useEffect(() => {
    function refreshOptionLists() {
      setOptionLists(readOptionLists())
    }
    window.addEventListener('bach:option-lists-updated', refreshOptionLists)
    return () => window.removeEventListener('bach:option-lists-updated', refreshOptionLists)
  }, [])

  useEffect(() => {
    function refreshWorkflowStages() {
      setWorkflowStages(loadWorkflowStages())
    }
    window.addEventListener('bach:workflow-stages-updated', refreshWorkflowStages)
    return () => window.removeEventListener('bach:workflow-stages-updated', refreshWorkflowStages)
  }, [])

  useEffect(() => {
    if (!openItemMenuId && !openSaveMenu) return undefined

    function closeDropdownsOnOutsideClick(event) {
      if (event.target.closest('[data-quote-dropdown]')) return
      setOpenItemMenuId(null)
      setOpenSaveMenu(false)
      setPendingHeaderQuoteDelete(false)
    }

    document.addEventListener('mousedown', closeDropdownsOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeDropdownsOnOutsideClick)
  }, [openItemMenuId, openSaveMenu])

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
    if (viewMode !== 'prepare' || !selectedQuote?.customer?.trim()) return
    const customer = findQuoteCustomer(selectedQuote.customer)
    if (!customer) return
    const representative = getQuoteCustomerRepresentative(customer)
    const contactInfo = resolveCustomerContactInfo(customer)
    const syncKey = `${selectedQuote.id}::${customer.id}`
    if (syncedCustomerKeyRef.current === syncKey) return
    syncedCustomerKeyRef.current = syncKey

    const patch = {}
    if (representative && selectedQuote.owner !== representative) patch.owner = representative
    if (contactInfo.contactName && selectedQuote.contact !== contactInfo.contactName)
      patch.contact = contactInfo.contactName
    if (contactInfo.email && selectedQuote.email !== contactInfo.email)
      patch.email = contactInfo.email
    if (contactInfo.phone && selectedQuote.phone !== contactInfo.phone)
      patch.phone = contactInfo.phone
    if (Object.keys(patch).length > 0) patchSelected(patch)
  }, [selectedQuote?.id, selectedQuote?.customer, viewMode])

  useEffect(() => {
    if (viewMode === 'list') {
      syncedCustomerKeyRef.current = ''
      setIsStageEditorOpen(false)
      setIsOrderStagePanelOpen(false)
      setPendingStageDeleteId(null)
      setPendingOrderStageDeleteId(null)
    }
  }, [viewMode])

  useEffect(() => {
    if (viewMode !== 'prepare' || !isDraftQuote || !selectedQuote) return
    setIsStageEditorOpen(true)
  }, [selectedQuote?.id, viewMode, isDraftQuote])

  useEffect(() => {
    if (viewMode !== 'prepare' || !selectedQuote) return
    if (sanitizeQuoteCode(selectedQuote.id)) return
    const code = resolvedQuoteCode
    if (draftQuote) {
      setDraftQuote((prev) => (prev ? { ...prev, id: code } : prev))
    } else {
      patchSelected({ id: code })
    }
    setSelectedId(code)
  }, [viewMode, selectedQuote?.id, draftQuote, resolvedQuoteCode])

  useEffect(() => {
    const voiceQuoteId = readVoiceQuoteOpenId()
    if (!voiceQuoteId) return
    clearVoiceQuoteOpenId()
    const freshQuotes = loadQuotes()
    setQuotes(freshQuotes)
    const match = freshQuotes.find((quote) => quote.id === voiceQuoteId)
    if (match) {
      setDraftQuote(null)
      setSelectedId(match.id)
      setViewMode('prepare')
    }
  }, [])

  useEffect(() => {
    function refreshQuotes() {
      setQuotes(loadQuotes())
    }
    window.addEventListener('bach:quotes-updated', refreshQuotes)
    return () => window.removeEventListener('bach:quotes-updated', refreshQuotes)
  }, [])

  useEffect(() => {
    if (viewMode === 'list' || !selectedQuote || (selectedQuote.items || []).length > 0) return
    patchSelected({ items: [createEmptyQuoteItem()] })
  }, [selectedQuote?.id, selectedQuote?.items?.length, viewMode])

  function updateQuotes(nextQuotes) {
    if (!saveQuotes(nextQuotes)) return false
    setQuotes(nextQuotes)
    return true
  }

  function persistWorkflowStagePatch(nextFullStages, quotePatch = {}) {
    if (!selectedQuote) return

    setWorkflowStages(nextFullStages)
    const syncedStages = publishWorkflowStages(nextFullStages) || loadWorkflowStages()
    setWorkflowStages([...syncedStages])

    const patch = {
      ...quotePatch,
      stages: syncedStages,
    }

    if (isDraftQuote) {
      setDraftQuote((prev) => ({ ...prev, ...patch }))
      return
    }

    const reloaded = loadQuotes().map((quote) =>
      quote.id === selectedQuote.id ? { ...quote, ...patch } : quote,
    )
    if (!saveQuotes(reloaded, { silent: true })) {
      window.alert('Süreç kaydedilemedi. Tarayıcı depolama alanı dolu olabilir.')
      return
    }
    setQuotes(reloaded)
  }

  function patchSelected(patch) {
    if (!selectedQuote) return

    if (patch.stages) {
      persistWorkflowStagePatch(patch.stages, patch)
      return
    }

    if (isDraftQuote) {
      setDraftQuote((prev) => ({ ...prev, ...patch }))
      return
    }
    setQuotes((current) => {
      const next = current.map((quote) =>
        quote.id === selectedQuote.id ? { ...quote, ...patch } : quote,
      )
      saveQuotes(next)
      return next
    })
  }

  function patchQuoteCode(rawValue) {
    if (!selectedQuote) return
    const nextCode = sanitizeQuoteCode(rawValue)
    const prevId = selectedQuote.id
    patchSelected({ id: nextCode })
    if (selectedId === prevId) {
      setSelectedId(nextCode || prevId)
    }
  }

  function addSelectedActivity(text, extraPatch = {}) {
    if (!selectedQuote) return
    const activity = {
      id: createId('act'),
      date: new Date().toLocaleString('tr-TR'),
      text,
    }
    const activities = [...(selectedQuote.activities || []), activity]
    if (extraPatch.stages) {
      persistWorkflowStagePatch(extraPatch.stages, { ...extraPatch, activities })
      return
    }
    patchSelected({ ...extraPatch, activities })
  }

  function patchQuote(id, patch) {
    if (draftQuote?.id === id) {
      setDraftQuote((prev) => ({ ...prev, ...patch }))
      return
    }
    setQuotes((current) => {
      const next = current.map((quote) => (quote.id === id ? { ...quote, ...patch } : quote))
      saveQuotes(next)
      return next
    })
  }

  function setQuoteWorkflow(quote, workflowStatus) {
    if (
      workflowStatus === 'Sipariş Alındı' ||
      String(workflowStatus || '').startsWith('Sipariş Alındı')
    ) {
      const ok = window.confirm(
        `"${quote.customer || quote.id}" teklifi siparişe aktarılsın mı? Teklif kaydı teklifler listesinde kalacak.`,
      )
      if (!ok) return
      const orderStage = orderStageOptions.find((item) => isOrderReceivedStage(item)) || {
        id: 'stage-8',
        label: workflowStatus,
      }
      transferQuoteToOrder(quote, orderStage)
      return
    }

    const activityText =
      workflowStatus === 'Teklif'
        ? 'Teklif aşamasına geri alındı.'
        : 'Sipariş üretimde aşamasına alındı.'

    patchQuote(quote.id, {
      workflowStatus,
      status: workflowStatus === 'Teklif' ? quote.status : 'Onaylandı',
      activities: [
        ...(quote.activities || []),
        { id: createId('act'), date: new Date().toLocaleString('tr-TR'), text: activityText },
      ],
    })
  }

  function transferQuoteToOrder(quote, stage) {
    const orderStage = stage ||
      orderStageOptions.find((item) => isOrderReceivedStage(item)) || {
        id: 'stage-8',
        label: 'Sipariş Alındı',
      }

    const order = createOrderFromQuote(quote, orderStage.id)
    if (!order) return null

    patchQuote(quote.id, {
      currentStageId: orderStage.id,
      orderId: quote.id,
      status: 'Onaylandı',
      activities: [
        ...(quote.activities || []),
        {
          id: createId('act'),
          date: new Date().toLocaleString('tr-TR'),
          text: `Teklif siparişe dönüştürüldü. Sipariş kodu: ${quote.id}`,
        },
      ],
    })
    setActiveMenu(null)
    return order
  }

  function isQuoteOrderCreated(quote) {
    const workflowStage = resolveListQuoteStage(quote)
    return (
      Boolean(quote.orderId) ||
      isOrderReceivedStage(workflowStage) ||
      linkedOrderQuoteIds.has(quote.id)
    )
  }

  function handleCreateOrderFromList(quote, event) {
    event?.stopPropagation?.()
    if (isQuoteOrderCreated(quote)) return
    transferQuoteToOrder(quote)
    setPendingQuoteOrderAction(null)
  }

  function handleUndoOrderFromList(quote, event) {
    event?.stopPropagation?.()
    const orders = loadOrders()
    const order =
      orders.find(
        (item) =>
          item.id === quote.id || item.quoteId === quote.id || item.id === quote.orderId,
      ) || { id: quote.orderId || quote.id, quoteId: quote.id }
    cancelOrderFromQuote(order)
    setQuotes(reloadQuotesStore())
    setPendingQuoteOrderAction(null)
  }

  function setQuoteStage(quote, stage) {
    if (isOrderReceivedStage(stage)) {
      const ok = window.confirm(
        `"${quote.customer || quote.id}" teklifi siparişe aktarılsın mı? Teklif kaydı teklifler listesinde kalacak.`,
      )
      if (!ok) return
      transferQuoteToOrder(quote, stage)
      return
    }

    patchQuote(quote.id, {
      currentStageId: stage.id,
      activities: [
        ...(quote.activities || []),
        {
          id: createId('act'),
          date: new Date().toLocaleString('tr-TR'),
          text: `Süreç "${stage.label}" olarak güncellendi.`,
        },
      ],
    })
    setActiveMenu(null)
  }

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function cycleListFilter(field, options, direction) {
    const labels = (options || []).map((option) => option.label).filter(Boolean)
    if (!labels.length) return
    const current = filters[field]
    const index = labels.indexOf(current)
    const from = index >= 0 ? index : 0
    const next = labels[(from + direction + labels.length) % labels.length]
    updateFilter(field, next)
  }

  function renderFilterCycleAccessory(field, options, label) {
    return (
      <span className="inline-flex flex-col items-center gap-0 leading-none">
        <button
          type="button"
          className="rounded p-0.5 text-[var(--muted)] transition-colors hover:bg-black/5 hover:text-[var(--ink)]"
          title={`${label}: önceki`}
          aria-label={`${label}: önceki`}
          onClick={(event) => {
            event.stopPropagation()
            cycleListFilter(field, options, -1)
          }}
        >
          <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="rounded p-0.5 text-[var(--muted)] transition-colors hover:bg-black/5 hover:text-[var(--ink)]"
          title={`${label}: sonraki`}
          aria-label={`${label}: sonraki`}
          onClick={(event) => {
            event.stopPropagation()
            cycleListFilter(field, options, 1)
          }}
        >
          <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
        </button>
      </span>
    )
  }

  function handleQuoteStatusChange(quote, statusLabel) {
    if (!statusLabel) {
      patchQuote(quote.id, {
        status: '',
        activities: [
          ...(quote.activities || []),
          {
            id: createId('act'),
            date: new Date().toLocaleString('tr-TR'),
            text: 'Durum seçimi kaldırıldı.',
          },
        ],
      })
      setActiveMenu(null)
      return
    }
    if (quote.status === statusLabel) return
    patchQuote(quote.id, {
      status: statusLabel,
      activities: [
        ...(quote.activities || []),
        {
          id: createId('act'),
          date: new Date().toLocaleString('tr-TR'),
          text: `Durum "${statusLabel}" olarak güncellendi.`,
        },
      ],
    })
    setActiveMenu(null)
  }

  function handleQuotePriorityChange(quote, priorityLabel) {
    if (!priorityLabel) {
      patchQuote(quote.id, {
        priority: '',
        activities: [
          ...(quote.activities || []),
          {
            id: createId('act'),
            date: new Date().toLocaleString('tr-TR'),
            text: 'Öncelik seçimi kaldırıldı.',
          },
        ],
      })
      setActiveMenu(null)
      return
    }
    if (quote.priority === priorityLabel) return
    patchQuote(quote.id, {
      priority: priorityLabel,
      activities: [
        ...(quote.activities || []),
        {
          id: createId('act'),
          date: new Date().toLocaleString('tr-TR'),
          text: `Öncelik "${priorityLabel}" olarak güncellendi.`,
        },
      ],
    })
    setActiveMenu(null)
  }

  function createQuoteDraft(baseQuotes = quotes) {
    const stages = loadWorkflowStages()
    const bankAccounts = readCompanySettings().bankAccounts || []
    const createdAt = todayIsoDate()
    return {
      ...initialQuotes[0],
      id: nextQuoteCode(baseQuotes.map((quote) => quote.id)),
      title: '',
      customer: '',
      contact: '',
      phone: '',
      email: '',
      status: 'Taslak',
      priority: 'Normal',
      source: 'Manuel',
      owner: '',
      tags: [],
      notes: '',
      termsDescription: '',
      terms: [],
      createdAt,
      validUntil: defaultValidUntilDate(createdAt),
      currentStageId: getQuoteStageOptions(stages)[0]?.id || '',
      stages,
      items: [createEmptyQuoteItem()],
      showDocumentDiscount: false,
      documentDiscountMode: 'percent',
      documentDiscountRate: 0,
      documentDiscountAmount: 0,
      selectedBankAccountIds: bankAccounts.map((account) => account.id),
      activities: [
        {
          id: createId('act'),
          date: new Date().toLocaleString('tr-TR'),
          text: 'Yeni teklif oluşturuldu.',
        },
      ],
    }
  }

  function addQuote(customerPatch = {}) {
    const next = { ...createQuoteDraft(), ...customerPatch }
    setDraftQuote(next)
    setSelectedId(next.id)
    setViewMode('prepare')
  }

  useEffect(() => {
    if (searchParams.get('yeni') !== '1') return
    const customerId = searchParams.get('customerId')
    const customer = customerId ? findCustomerProfile(customerId) : null
    const freshQuotes = loadQuotes()
    const next = {
      ...createQuoteDraft(freshQuotes),
      ...customerToDocumentPatch(customer),
    }
    setQuotes(freshQuotes)
    setDraftQuote(next)
    setSelectedId(next.id)
    setViewMode('prepare')
    navigate('/teklifler', { replace: true })
  }, [searchParams, navigate])

  function saveCurrentQuote({ startNew = false, returnToList = true } = {}) {
    if (!selectedQuote || isSaving) return false
    const validation = validateQuoteForSave(selectedQuote)
    if (!validation.ok) {
      window.alert(validation.message)
      return false
    }

    const existingQuote = quotes.find((quote) => quote.id === selectedQuote.id)
    const code =
      sanitizeQuoteCode(validation.quote.id) || nextQuoteCode(quotes.map((quote) => quote.id))
    if (quotes.some((quote) => quote.id === code && quote.id !== selectedQuote.id)) {
      window.alert('Bu teklif kodu zaten kullanılıyor.')
      return false
    }

    setIsSaving(true)
    setOpenSaveMenu(false)
    setPendingHeaderQuoteDelete(false)

    const activityText = existingQuote
      ? 'Teklif güncellenerek kaydedildi.'
      : 'Teklif güvenli kontrollerden geçirilerek kaydedildi.'

    const safeQuote = {
      ...(existingQuote || {}),
      ...validation.quote,
      id: code,
      priority: validation.quote.priority || selectedQuote.priority || 'Normal',
      source: validation.quote.source || selectedQuote.source || 'Manuel',
      owner: validation.quote.owner || selectedQuote.owner || '',
      notes: validation.quote.notes ?? selectedQuote.notes ?? '',
      currentStageId:
        validation.quote.currentStageId ||
        selectedQuote.currentStageId ||
        getQuoteStageOptions(workflowStages)[0]?.id ||
        '',
      stages:
        Array.isArray(validation.quote.stages) && validation.quote.stages.length
          ? validation.quote.stages
          : selectedQuote.stages || loadWorkflowStages(),
      activities: [
        ...(validation.quote.activities || []),
        {
          id: createId('act'),
          date: new Date().toLocaleString('tr-TR'),
          text: activityText,
        },
      ],
    }

    const nextQuotes = [
      safeQuote,
      ...quotes.filter((quote) => quote.id !== safeQuote.id && quote.id !== selectedQuote.id),
    ]

    if (!persistQuotesStore(nextQuotes)) {
      window.alert('Teklif kaydedilemedi. Tarayıcı depolama alanını veya izinleri kontrol edin.')
      setIsSaving(false)
      return false
    }

    // Keep page helper in sync for any local listeners / silent patches
    saveQuotes(nextQuotes, { silent: true })
    setQuotes(nextQuotes)
    flushWorkspaceNow()

    window.setTimeout(
      () => {
        if (startNew) {
          const nextDraft = createQuoteDraft(nextQuotes)
          setDraftQuote(nextDraft)
          setSelectedId(nextDraft.id)
          setViewMode('prepare')
          setIsSaving(false)
          return
        }

        setDraftQuote(null)
        setSelectedId(safeQuote.id)
        setQuotes(reloadQuotesStore())

        if (returnToList) {
          setSearchQuery('')
          setFilters({ priority: 'Tümü', status: 'Tümü', stage: 'Tümü' })
          setSortMode('latest')
          setViewMode('list')
        } else {
          setViewMode('prepare')
        }
        setIsSaving(false)
      },
      returnToList ? 180 : 450,
    )

    return true
  }

  function getSafeQuoteForOutput() {
    if (!selectedQuote) return null
    const validation = validateQuoteForSave(selectedQuote)
    if (!validation.ok) {
      window.alert(validation.message)
      return null
    }
    return validation.quote
  }

  async function downloadQuotePdf() {
    const safeQuote = getSafeQuoteForOutput()
    if (!safeQuote) return
    try {
      setIsGeneratingPdf(true)
      const { blob, filename } = await createQuotePdfFile(quotePreviewRef.current, safeQuote.id)
      downloadBlob(blob, filename)
    } catch (error) {
      window.alert(`PDF oluşturulamadı: ${error.message}`)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  async function sendQuoteByWhatsApp() {
    const safeQuote = getSafeQuoteForOutput()
    if (!safeQuote) return
    try {
      setIsGeneratingPdf(true)
      const { blob, filename, file } = await createQuotePdfFile(
        quotePreviewRef.current,
        safeQuote.id,
      )
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          title: `${safeQuote.id} Fiyat Teklifi`,
          text: 'PDF kalitesinde teklif sunumu ekte.',
          files: [file],
        })
        return
      }

      downloadBlob(blob, filename)
      window.alert(
        'Tarayıcınız WhatsApp’a dosyayı otomatik eklemeyi desteklemiyor. Aynı PDF indirildi; açılan WhatsApp sohbetine bu PDF dosyasını ek olarak seçip gönderebilirsiniz.',
      )
      const message = encodeURIComponent(
        `Merhaba, ${safeQuote.id} numaralı PDF teklif sunumunu iletiyorum. PDF dosyasını bu sohbete ek olarak gönderiyorum.`,
      )
      window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer')
    } catch (error) {
      window.alert(`WhatsApp paylaşımı hazırlanamadı: ${error.message}`)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  async function sendQuoteByMail() {
    const safeQuote = getSafeQuoteForOutput()
    if (!safeQuote) return
    try {
      setIsGeneratingPdf(true)
      const { blob, filename } = await createQuotePdfFile(quotePreviewRef.current, safeQuote.id)
      downloadBlob(blob, filename)
      const customer = getQuoteCustomerDetails(safeQuote)
      const subject = encodeURIComponent(`${safeQuote.id} Fiyat Teklifi`)
      const body = encodeURIComponent(
        `${buildQuoteShareText(safeQuote)}\n\nNot: Aynı premium PDF teklif dosyası indirildi. Lütfen e-postaya ek olarak "${filename}" dosyasını ekleyiniz.`,
      )
      window.location.href = `mailto:${customer.email || ''}?subject=${subject}&body=${body}`
    } catch (error) {
      window.alert(`Mail PDF'i hazırlanamadı: ${error.message}`)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  function addQuoteStage(chosenColor, inputLabel) {
    const label = String(inputLabel ?? stageInput ?? '').trim()
    if (!label || !selectedQuote || isReservedPlaceholderLabel(label)) return
    const currentStages = loadWorkflowStages()
    const quoteStages = getQuoteStageOptions(currentStages)
    const nextStage = {
      id: createId('stage'),
      label,
      color: chosenColor || stageColors[quoteStages.length % stageColors.length],
      note: 'Yeni süreç aşaması eklendi.',
    }
    const nextFullStages = mergeQuoteStagesIntoWorkflow(
      currentStages,
      appendQuoteStage(quoteStages, nextStage),
    )
    addSelectedActivity(`Yeni süreç eklendi ve aktif edildi: "${label}".`, {
      stages: nextFullStages,
      currentStageId: nextStage.id,
    })
    setStageInput('')
  }

  function updateQuoteStageColor(stage, color) {
    if (!selectedQuote) return
    const currentStages = loadWorkflowStages()
    const quoteStages = getQuoteStageOptions(currentStages).map((item) =>
      item.id === stage.id ? { ...item, color } : item,
    )
    patchSelected({ stages: mergeQuoteStagesIntoWorkflow(currentStages, quoteStages) })
  }

  function updateQuoteStageLabel(stage, label) {
    if (!selectedQuote || isReservedPlaceholderLabel(label)) return
    const cleanLabel = String(label || '').trim()
    if (!cleanLabel) return
    const currentStages = loadWorkflowStages()
    const quoteStages = getQuoteStageOptions(currentStages).map((item) =>
      item.id === stage.id ? { ...item, label: cleanLabel } : item,
    )
    patchSelected({ stages: mergeQuoteStagesIntoWorkflow(currentStages, quoteStages) })
  }

  function reorderQuoteStages(nextQuoteStages) {
    if (!selectedQuote) return
    const currentStages = loadWorkflowStages()
    patchSelected({ stages: mergeQuoteStagesIntoWorkflow(currentStages, nextQuoteStages) })
  }

  function toggleStageEditor() {
    setIsStageEditorOpen((current) => !current)
    setPendingStageDeleteId(null)
  }

  function selectQuoteStageInEditor(stage) {
    if (!selectedQuote || !stage) return
    if (selectedQuote.currentStageId === stage.id) return
    addSelectedActivity(`Süreç "${stage.label}" olarak güncellendi.`, { currentStageId: stage.id })
  }

  function removeQuoteStage(stage) {
    if (!selectedQuote) return
    const ok = window.confirm(
      `Son onay: "${stage.label}" süreci tekliften kaldırılacak. Devam edilsin mi?`,
    )
    if (!ok) return
    const currentStages = loadWorkflowStages()
    const nextQuoteStages = getQuoteStageOptions(currentStages).filter(
      (item) => item.id !== stage.id,
    )
    addSelectedActivity(`Süreç silindi: "${stage.label}".`, {
      stages: mergeQuoteStagesIntoWorkflow(currentStages, nextQuoteStages),
      currentStageId:
        selectedQuote.currentStageId === stage.id
          ? nextQuoteStages[0]?.id || ''
          : selectedQuote.currentStageId,
    })
    setPendingStageDeleteId(null)
  }

  function toggleOrderStagePanel() {
    setIsOrderStagePanelOpen((current) => !current)
    setPendingOrderStageDeleteId(null)
  }

  function findLinkedOrder(quote) {
    if (!quote) return null
    return loadOrders().find((item) => item.quoteId === quote.id || item.id === quote.id) || null
  }

  function addQuoteOrderStage(chosenColor, inputLabel) {
    const label = String(inputLabel ?? orderStageInput ?? '').trim()
    if (!label || !selectedQuote || isReservedPlaceholderLabel(label)) return
    const currentStages = loadWorkflowStages()
    const orderStages = getOrderStageOptions(currentStages)
    const nextStage = {
      id: createId('stage'),
      label,
      color: chosenColor || stageColors[orderStages.length % stageColors.length],
      note: 'Yeni sipariş süreci eklendi.',
    }
    const nextOrderStages = appendOrderStage(orderStages, nextStage)
    const nextFullStages = mergeOrderStagesIntoWorkflow(currentStages, nextOrderStages)
    addSelectedActivity(`Yeni sipariş süreci eklendi ve aktif edildi: "${label}".`, {
      stages: nextFullStages,
      currentStageId: nextStage.id,
    })
    setOrderStageInput('')
    const linkedOrder = findLinkedOrder(selectedQuote)
    if (linkedOrder) {
      updateOrder(linkedOrder.id, { currentStageId: nextStage.id })
    }
  }

  function updateQuoteOrderStageColor(stage, color) {
    if (!selectedQuote) return
    const currentStages = loadWorkflowStages()
    const orderStages = getOrderStageOptions(currentStages).map((item) =>
      item.id === stage.id ? { ...item, color } : item,
    )
    patchSelected({ stages: mergeOrderStagesIntoWorkflow(currentStages, orderStages) })
  }

  function updateQuoteOrderStageLabel(stage, label) {
    if (!selectedQuote || isReservedPlaceholderLabel(label)) return
    const cleanLabel = String(label || '').trim()
    if (!cleanLabel) return
    const currentStages = loadWorkflowStages()
    const orderStages = getOrderStageOptions(currentStages).map((item) =>
      item.id === stage.id ? { ...item, label: cleanLabel } : item,
    )
    patchSelected({ stages: mergeOrderStagesIntoWorkflow(currentStages, orderStages) })
  }

  function reorderQuoteOrderStages(nextOrderStages) {
    if (!selectedQuote) return
    const currentStages = loadWorkflowStages()
    patchSelected({ stages: mergeOrderStagesIntoWorkflow(currentStages, nextOrderStages) })
  }

  function selectQuoteOrderStageInEditor(stage) {
    if (!selectedQuote || !stage) return
    if (stage.label === 'Sipariş Alındı' || isOrderReceivedStage(stage)) {
      setQuoteStage(selectedQuote, stage)
      return
    }
    if (selectedQuote.currentStageId === stage.id) return
    addSelectedActivity(`Süreç "${stage.label}" olarak güncellendi.`, { currentStageId: stage.id })
    const linkedOrder = findLinkedOrder(selectedQuote)
    if (linkedOrder) {
      updateOrder(linkedOrder.id, { currentStageId: stage.id })
    }
  }

  function removeQuoteOrderStage(stage) {
    if (!selectedQuote) return
    const ok = window.confirm(
      `Son onay: "${stage.label}" sipariş sürecinden kaldırılacak. Devam edilsin mi?`,
    )
    if (!ok) return
    const currentStages = loadWorkflowStages()
    const nextOrderStages = getOrderStageOptions(currentStages).filter(
      (item) => item.id !== stage.id,
    )
    addSelectedActivity(`Sipariş süreci silindi: "${stage.label}".`, {
      stages: mergeOrderStagesIntoWorkflow(currentStages, nextOrderStages),
      currentStageId:
        selectedQuote.currentStageId === stage.id
          ? nextOrderStages[0]?.id || ''
          : selectedQuote.currentStageId,
    })
    setPendingOrderStageDeleteId(null)
    const linkedOrder = findLinkedOrder(selectedQuote)
    if (linkedOrder && linkedOrder.currentStageId === stage.id) {
      updateOrder(linkedOrder.id, { currentStageId: nextOrderStages[0]?.id || '' })
    }
  }

  const quoteStageRecord = useMemo(() => {
    if (!selectedQuote) return { stages: [], currentStageId: '' }
    const stageSource = workflowStages.length > 0 ? workflowStages : loadWorkflowStages()
    const { stages, currentStageId } = resolveQuoteProcessRecord(selectedQuote, stageSource)
    return { stages, currentStageId }
  }, [selectedQuote?.id, selectedQuote?.currentStageId, workflowStages])

  const linkedOrderForStages = selectedQuote ? findLinkedOrder(selectedQuote) : null
  const orderStageSource = linkedOrderForStages || selectedQuote
  const orderStageRecord = {
    stages: getOrderStageOptions(workflowStages),
    currentStageId: resolveOrderPanelCurrentStageId(orderStageSource, workflowStages),
  }

  function returnToQuoteList() {
    if (draftQuote) {
      setDraftQuote(null)
      setSelectedId(quotes[0]?.id || null)
    }
    setViewMode('list')
  }

  function addItem() {
    patchSelected({
      items: [...(selectedQuote.items || []), createEmptyQuoteItem()],
    })
  }

  function updateItem(id, field, value) {
    patchSelected({
      items: selectedQuote.items.map((item) => {
        if (item.id !== id) return item
        if (field === 'discountRate') {
          return {
            ...item,
            discountRate: value,
            showDiscount: value > 0 ? true : item.showDiscount,
          }
        }
        return { ...item, [field]: value }
      }),
    })
  }

  function selectProductForItem(id, productOrName) {
    const product =
      typeof productOrName === 'object' && productOrName
        ? productOrName
        : getCatalogProducts().find((entry) => entry.name === productOrName)
    const productName = product?.name || String(productOrName || '')
    const productImage = resolveProductImage(product) || ''
    patchSelected({
      items: selectedQuote.items.map((item) =>
        item.id === id
          ? {
              ...item,
              productId: product?.id || item.productId || '',
              product: productName,
              description: product?.notes || item.description || '',
              lineImage: productImage,
              unitPrice: Number(
                product?.salesPriceExcl || product?.purchasePriceExcl || item.unitPrice || 0,
              ),
              vatRate: Number(product?.vatRate ?? item.vatRate ?? 20),
            }
          : item,
      ),
    })
  }

  function enableItemOption(id, option) {
    updateItem(id, option, true)
    setOpenItemMenuId(null)
  }

  function disableItemOption(id, option, resetPatch = {}) {
    patchSelected({
      items: selectedQuote.items.map((item) =>
        item.id === id ? { ...item, [option]: false, ...resetPatch } : item,
      ),
    })
  }

  function removeItem(id) {
    if (!window.confirm('Son onay: Teklif kalemi kaldırılacak. Devam edilsin mi?')) return
    patchSelected({ items: selectedQuote.items.filter((item) => item.id !== id) })
    setPendingItemDeleteId(null)
  }

  function editQuote(quoteId) {
    setDraftQuote(null)
    setSelectedId(quoteId)
    setViewMode('prepare')
  }

  function deleteQuote(quote, { navigateToList = false, skipConfirm = false } = {}) {
    if (!quote) return
    if (!skipConfirm) {
      const quoteName = quote?.id || 'Bu teklif'
      const second = window.confirm(
        `Son onay: "${quoteName}" teklifi silinenlere taşınacak (geri alınabilir). Devam edilsin mi?`,
      )
      if (!second) return
    }

    const isDraft = draftQuote?.id === quote.id
    if (isDraft) {
      setDraftQuote(null)
      setSelectedId(quotes[0]?.id || null)
    } else {
      softDeleteQuote(quote)
      const nextQuotes = loadQuotes()
      setQuotes(nextQuotes)
      if (selectedId === quote.id) {
        setSelectedId(nextQuotes[0]?.id || null)
      }
    }

    setPendingDeleteId(null)
    setPendingHeaderQuoteDelete(false)
    setOpenSaveMenu(false)
    if (navigateToList) {
      setViewMode('list')
    }
  }

  function getQuoteSortDate(quote) {
    const lastActivityDate = (quote.activities || []).at(-1)?.date
    const rawDate = lastActivityDate || quote.createdAt || ''
    const normalized = String(rawDate).replace(' ', 'T')
    const time = new Date(normalized).getTime()
    return Number.isNaN(time) ? 0 : time
  }

  const filteredQuotes = quotes
    .filter((quote) => {
      const quoteProcess = resolveQuoteProcessRecord(quote, workflowStages)
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        !q ||
        (quote.id || '').toLowerCase().includes(q) ||
        (quote.title || '').toLowerCase().includes(q) ||
        (quote.customer || '').toLowerCase().includes(q) ||
        (quote.contact || '').toLowerCase().includes(q) ||
        (quote.tags || []).some((tag) => tag.toLowerCase().includes(q))
      const matchesPriority = filters.priority === 'Tümü' || quote.priority === filters.priority
      const matchesStatus = filters.status === 'Tümü' || quote.status === filters.status
      const matchesStage =
        filters.stage === 'Tümü' || quoteProcess.activeStage?.label === filters.stage
      return matchesSearch && matchesPriority && matchesStatus && matchesStage
    })
    .sort((a, b) => {
      if (sortMode === 'date') return getQuoteSortDate(b) - getQuoteSortDate(a)
      if (sortMode === 'name') return (a.customer || '').localeCompare(b.customer || '', 'tr')
      if (sortMode === 'price') return getQuoteListAmount(b) - getQuoteListAmount(a)
      return getQuoteSortDate(b) - getQuoteSortDate(a)
    })

  const openQuotes = filteredQuotes.filter((quote) => {
    const activeStage = resolveListQuoteStage(quote)
    return (
      !quote.orderId && !isOrderReceivedStage(activeStage) && !linkedOrderQuoteIds.has(quote.id)
    )
  })

  const summary = {
    total: filteredQuotes.length,
    sent: filteredQuotes.filter((quote) => quote.status === 'Müşteriye Gönderildi').length,
    approved: filteredQuotes.filter((quote) => quote.status === 'Onaylandı').length,
    totalAmount: openQuotes.reduce((sum, quote) => sum + getQuoteListAmount(quote), 0),
  }

  return (
    <AppPageShell className="customers-page-type w-full">
      {viewMode === 'list' ? (
        <AppPageHeader
          showBack={false}
          title={<AppPageBackLink />}
          centerTitle="TEKLİFLER"
          centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
          titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
          actions={
            <button
              type="button"
              onClick={() => addQuote()}
              className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.primary}`}
            >
              <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                <FileText className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
              </span>
              <span className={YF_TEXT_ON_COLOR_CLASS}>Yeni Teklif Oluştur</span>
            </button>
          }
        />
      ) : (
        <AppPageHeader
          showBack={false}
          title={
            <AppPageBackLink
              to={false}
              onClick={returnToQuoteList}
              label="Teklifler"
            />
          }
          centerTitle={isDraftQuote ? 'YENİ TEKLİF OLUŞTUR' : 'TEKLİF DÜZENLE'}
          centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
          titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
          actions={
            <div className="relative flex shrink-0 items-center gap-2" data-quote-dropdown>
              {selectedQuote ? (
                <Link
                  to={`/belge-merkezi/yazdir?type=quote&id=${encodeURIComponent(selectedQuote.id)}`}
                  className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.violet}`}
                >
                  <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                    <Printer className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
                  </span>
                  <span className={YF_TEXT_ON_COLOR_CLASS}>Şablonla Yazdır</span>
                </Link>
              ) : null}
              <div
                className={`relative inline-flex overflow-hidden ${HEADER_ACTION_CTA_SHELL_CLASS} ${HEADER_ACTION_GRADIENTS.success}`}
              >
                <button
                  type="button"
                  onClick={() => saveCurrentQuote({ returnToList: true })}
                  disabled={!selectedQuote || isSaving}
                  className="inline-flex h-full items-center gap-2.5 bg-transparent px-3 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                    <Save className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
                  </span>
                  <span className={YF_TEXT_ON_COLOR_CLASS}>
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </span>
                </button>
                <span className={HEADER_ACTION_CTA_DIVIDER_CLASS} aria-hidden="true" />
                <Dropdown
                  align="end"
                  className="h-full"
                  menuClassName={PAGE_FILTER_MENU_CLASS}
                  trigger={
                    <button
                      type="button"
                      disabled={!selectedQuote || isSaving}
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
                        icon={Plus}
                        label="Kaydet ve Yeni Ekle"
                        tone="primary"
                        close={close}
                        onClick={() => saveCurrentQuote({ startNew: true })}
                      />
                      <DropdownItem
                        icon={Save}
                        label="Kaydet ve Düzenlemeye Devam Et"
                        tone="primary"
                        close={close}
                        onClick={() => saveCurrentQuote({ returnToList: false })}
                      />
                      <DropdownSeparator />
                      <DropdownItem
                        icon={Trash2}
                        label="Teklifi Sil"
                        tone="danger"
                        close={close}
                        onClick={(event) => {
                          setDeleteConfirmAnchor(captureDeleteConfirmAnchor(event))
                          setPendingHeaderQuoteDelete(true)
                        }}
                      />
                    </>
                  )}
                </Dropdown>
              </div>
            </div>
          }
        />
      )}

      {viewMode === 'list' && (
        <SummaryMetrics
          columns={4}
          className="customer-summary-metrics w-full"
          items={[
            {
              title: 'Toplam Teklif',
              value: summary.total,
              icon: ClipboardList,
              valueTone: 'text-violet-800',
            },
            {
              title: 'Gönderilen',
              value: summary.sent,
              icon: Send,
              tone: 'orange',
              valueTone: 'text-blue-800',
            },
            {
              title: 'Onaylanan',
              value: summary.approved,
              icon: CheckCircle2,
              tone: 'emerald',
              valueTone: 'text-emerald-800',
            },
            {
              title: 'Toplam Tutar',
              value: `${formatTL(summary.totalAmount)}`,
              icon: TurkishLiraIcon,
              tone: 'orange',
              valueTone: 'text-emerald-800',
            },
          ]}
        />
      )}

      {viewMode === 'list' ? (
        <>
          <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
            <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
              <div className="flex shrink-0 items-center gap-2 px-1">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-50" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#ea580c]" />
                </span>
                <span className={YF_TEXT_CLASS}>Filtre :</span>
              </div>
              <div className="app-filter-bar grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                <div className={PAGE_FILTER_FIELD_CLASS}>
                  <p className={PAGE_FILTER_LABEL_CLASS}>Öncelik :</p>
                  <EditableDropdownPill
                    value={filters.priority}
                    options={quotePriorityFilterOptions}
                    includePlaceholderOption={false}
                    buttonClassName={PAGE_FILTER_PILL_CLASS}
                    menuClassName={PAGE_FILTER_MENU_CLASS}
                    openKey="filter-priority"
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    onChange={(value) => updateFilter('priority', value)}
                    onOptionsChange={(next) => updateOptionList('priority', next)}
                  />
                </div>
                <div className={PAGE_FILTER_FIELD_CLASS}>
                  <p className={PAGE_FILTER_LABEL_CLASS}>Durum :</p>
                  <EditableDropdownPill
                    value={filters.status}
                    options={quoteStatusFilterOptions}
                    includePlaceholderOption={false}
                    buttonClassName={PAGE_FILTER_PILL_CLASS}
                    menuClassName={PAGE_FILTER_MENU_CLASS}
                    openKey="filter-status"
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    onChange={(value) => updateFilter('status', value)}
                    onOptionsChange={(next) => updateOptionList('status', next)}
                  />
                </div>
                <div className={PAGE_FILTER_FIELD_CLASS}>
                  <p className={PAGE_FILTER_LABEL_CLASS}>Sıralama :</p>
                  <EditableDropdownPill
                    value={sortLabelByMode[sortMode] || 'Son işleme göre'}
                    options={sortFilterOptions}
                    includePlaceholderOption={false}
                    editable={false}
                    buttonClassName={PAGE_FILTER_PILL_CLASS}
                    menuClassName={PAGE_FILTER_MENU_CLASS}
                    openKey="filter-sort"
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    onChange={(value) => setSortMode(sortModeByLabel[value] || 'latest')}
                  />
                </div>
              </div>
            </div>
          </AppPagePanel>

          <AppPagePanel className="customer-list-panel w-full">
            <div className="mb-4 flex min-w-0 items-center gap-3">
              <div className="flex shrink-0 items-center gap-2">
                <AppPanelDot color="blue" />
                <h2 className={APP_PANEL_TITLE_CLASS}>Teklif Listesi :</h2>
              </div>
              <div className="min-w-0 flex-1">
                <SearchInput
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Teklif kodu, müşteri, yetkili veya etiket ara..."
                  className="customer-filter-search !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]"
                />
              </div>
              <span className={`shrink-0 ${YF_TEXT_CLASS}`}>{filteredQuotes.length} Kayıt</span>
            </div>

            <DataTable
              emptyTitle="Teklif bulunamadı."
              emptyDescription="Arama veya filtreleri değiştirin."
              headerClassName={PAGE_TABLE_HEADER_CLASS}
              mobileHeaderClassName={PAGE_TABLE_HEADER_CLASS}
              data={filteredQuotes}
              defaultSort={{ key: null, dir: 'asc' }}
              getRowId={(quote) => quote.id}
              onRowClick={(quote) => editQuote(quote.id)}
              columns={[
                {
                  id: 'date',
                  header: 'TARİH',
                  sortable: true,
                  align: 'center',
                  accessorKey: 'date',
                  className: 'w-[7.5rem] !max-w-none !h-auto',
                  getSortValue: (quote) => getQuoteSortDate(quote),
                  cell: (quote) => {
                    const stamp = formatListDateParts(getQuoteListDateSource(quote))
                    if (!stamp.date) {
                      return (
                        <span className="block text-center text-[14px] font-normal text-[var(--muted)]">
                          —
                        </span>
                      )
                    }
                    return (
                      <span className="flex flex-col items-center justify-center gap-0.5 tabular-nums">
                        <span className="text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]">
                          {stamp.date}
                        </span>
                        {stamp.time ? (
                          <span className="text-[12px] font-normal leading-tight text-[var(--muted)]/75">
                            {stamp.time}
                          </span>
                        ) : null}
                      </span>
                    )
                  },
                },
                {
                  id: 'code',
                  header: 'KOD',
                  sortable: true,
                  accessorKey: 'code',
                  className: 'w-[5.5rem] !max-w-none',
                  getSortValue: (quote) =>
                    resolveQuoteCode(
                      quote.id,
                      quotes.map((item) => item.id),
                    ),
                  cell: (quote) => (
                    <span className={`${YF_TEXT_CLASS} tabular-nums`}>
                      {resolveQuoteCode(
                        quote.id,
                        quotes.map((item) => item.id),
                      )}
                    </span>
                  ),
                },
                {
                  id: 'customer',
                  header: 'MÜŞTERİ ADI',
                  sortable: true,
                  accessorKey: 'customer',
                  className: 'min-w-[22rem] w-[52%] !max-w-none !h-auto',
                  getSortValue: (quote) => {
                    const display = getListCustomerDisplay(quote.customer)
                    return display.brandShortName || display.companyTitle || quote.customer || ''
                  },
                  cell: (quote) => {
                    const display = getListCustomerDisplay(quote.customer)
                    return (
                      <span className="flex min-w-0 flex-col gap-0.5 py-0.5">
                        <span className="customer-name-primary whitespace-normal break-words text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                          {display.brandShortName || 'Müşteri girilmedi'}
                        </span>
                        {display.companyTitle ? (
                          <span className="customer-name-secondary font-sans whitespace-normal break-words text-[14px] font-normal leading-tight text-[var(--muted)]">
                            {display.companyTitle}
                          </span>
                        ) : null}
                      </span>
                    )
                  },
                },
                {
                  id: 'priority',
                  header: 'ÖNCELİK',
                  align: 'center',
                  className: 'w-[8.5rem] !max-w-none text-center',
                  hideOnMobile: true,
                  headerAccessory: () =>
                    renderFilterCycleAccessory('priority', quotePriorityFilterOptions, 'Öncelik'),
                  cell: (quote) => (
                    <span
                      className="flex w-full items-center justify-center"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <EditableDropdownPill
                        value={resolveListColumnLabel(quote.priority, optionLists.priority)}
                        options={optionLists.priority}
                        buttonClassName={PAGE_LIST_PILL_CLASS}
                        wrapperClassName={PAGE_LIST_PILL_WRAPPER_CLASS}
                        menuClassName={PAGE_LIST_MENU_CLASS}
                        menuMatchWidth={false}
                        openKey={`${quote.id}-priority`}
                        activeMenu={activeMenu}
                        setActiveMenu={setActiveMenu}
                        onChange={(value) => handleQuotePriorityChange(quote, value)}
                        onOptionsChange={(next) => updateOptionList('priority', next)}
                      />
                    </span>
                  ),
                },
                {
                  id: 'status',
                  header: 'TEKLİF DURUMU',
                  align: 'center',
                  className: 'w-[9.5rem] !max-w-none text-center',
                  hideOnMobile: true,
                  headerAccessory: () =>
                    renderFilterCycleAccessory('status', quoteStatusFilterOptions, 'Teklif durumu'),
                  cell: (quote) => (
                    <span
                      className="flex w-full items-center justify-center"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <EditableDropdownPill
                        value={resolveListColumnLabel(quote.status, optionLists.status)}
                        options={optionLists.status}
                        buttonClassName={PAGE_LIST_PILL_CLASS}
                        wrapperClassName={PAGE_LIST_PILL_WRAPPER_CLASS}
                        menuClassName={PAGE_LIST_MENU_CLASS}
                        menuMatchWidth={false}
                        openKey={`${quote.id}-status`}
                        activeMenu={activeMenu}
                        setActiveMenu={setActiveMenu}
                        onChange={(value) => handleQuoteStatusChange(quote, value)}
                        onOptionsChange={(next) => updateOptionList('status', next)}
                      />
                    </span>
                  ),
                },
                {
                  id: 'amount',
                  header: 'TUTAR',
                  sortable: true,
                  align: 'right',
                  className: 'w-[1%] whitespace-nowrap !max-w-none',
                  getSortValue: (quote) => getQuoteListAmount(quote),
                  cell: (quote) => (
                    <span className={`${PAGE_BALANCE_AMOUNT_CLASS} customer-balance-positive`}>
                      {formatTL(getQuoteListAmount(quote))}
                    </span>
                  ),
                },
                {
                  id: 'order-module',
                  header: '',
                  align: 'right',
                  className: 'w-[1%] whitespace-nowrap !max-w-none',
                  cell: (quote) => {
                    const pending =
                      pendingQuoteOrderAction?.id === quote.id
                        ? pendingQuoteOrderAction.type
                        : null
                    return (
                      <span onClick={(event) => event.stopPropagation()}>
                        <QuoteListOrderModuleButton
                          quote={quote}
                          orderCreated={isQuoteOrderCreated(quote)}
                          pendingAction={pending}
                          onRequestCreate={() =>
                            setPendingQuoteOrderAction({ id: quote.id, type: 'create' })
                          }
                          onRequestUndo={() =>
                            setPendingQuoteOrderAction({ id: quote.id, type: 'undo' })
                          }
                          onConfirmCreate={() => handleCreateOrderFromList(quote)}
                          onConfirmUndo={() => handleUndoOrderFromList(quote)}
                          onCancelPending={() => setPendingQuoteOrderAction(null)}
                        />
                      </span>
                    )
                  },
                },
              ]}
              getRowActions={(quote) => [
                {
                  id: 'edit',
                  label: 'Düzenle',
                  icon: Pencil,
                  tone: 'primary',
                  onClick: () => editQuote(quote.id),
                },
                {
                  id: 'delete',
                  label: 'Sil',
                  icon: Trash2,
                  tone: 'danger',
                  onClick: (event) => {
                    setDeleteConfirmAnchor(captureDeleteConfirmAnchor(event))
                    setPendingDeleteId(quote.id)
                  },
                },
              ]}
            />
          </AppPagePanel>
        </>
      ) : (
        <div className="space-y-5">
          {selectedQuote && (
            <>
              <AppPagePanel className="w-full" title="Teklif Bilgileri :">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 flex gap-3">
                    <div className="relative min-w-0 flex-1">
                      <Field label="Teklif Başlığı">
                        <input
                          value={selectedQuote.title}
                          onChange={(e) => patchSelected({ title: e.target.value })}
                          className="form-input"
                        />
                      </Field>
                    </div>
                    <div className={DOCUMENT_SIDE_ACTION_WIDTH}>
                      <Field label="Teklif Kodu">
                        <input
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={resolvedQuoteCode}
                          onChange={(event) => patchQuoteCode(event.target.value)}
                          className="form-input"
                        />
                      </Field>
                    </div>
                  </div>
                  <CustomerPicker
                    quote={selectedQuote}
                    onPatch={patchSelected}
                    allowCreate={true}
                  />
                  <Field label="Oluşturma Tarihi">
                    <input
                      type="date"
                      value={selectedQuote.createdAt || todayIsoDate()}
                      onChange={(e) => patchSelected({ createdAt: e.target.value })}
                      className="form-input"
                    />
                  </Field>
                  <Field label="Geçerlilik Tarihi">
                    <input
                      type="date"
                      value={
                        selectedQuote.validUntil ||
                        defaultValidUntilDate(selectedQuote.createdAt || todayIsoDate())
                      }
                      onChange={(e) => patchSelected({ validUntil: e.target.value })}
                      className="form-input"
                    />
                  </Field>
                </div>
              </AppPagePanel>

              <AppPagePanel className="w-full" title="Ürün Seçimi :" dotColor="violet">
                <div className="space-y-2">
                  {(selectedQuote.items || []).map((item) => {
                    const totals = itemTotals(item)
                    const itemImage = resolveQuoteItemImage(item)
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-dark-500/40 bg-dark-700/25 p-2.5"
                      >
                        <div
                          className={`grid ${quoteItemGridClass} ${quoteItemFieldGapClass} items-start`}
                        >
                          <div className="flex flex-col self-start">
                            <label className={`${YF_TEXT_CLASS} mb-1 block`}>Görsel</label>
                            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-dashed border-dark-500/50 bg-dark-800/40">
                              {itemImage ? (
                                <img
                                  src={itemImage}
                                  alt=""
                                  className="h-full w-full object-cover object-center"
                                />
                              ) : (
                                <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 px-1 text-center">
                                  <span className="text-[10px] font-medium text-[var(--muted)]">
                                    Ürün seçin
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex min-h-0 flex-col gap-2 self-stretch">
                            <div
                              className={`grid ${quoteItemFieldsGridClass} ${quoteItemFieldGapClass} items-end`}
                            >
                              <Field label="Ürün">
                                <ProductSearchSelect
                                  item={item}
                                  onSelect={(product) => selectProductForItem(item.id, product)}
                                  onTextChange={(value) => {
                                    patchSelected({
                                      items: selectedQuote.items.map((entry) =>
                                        entry.id === item.id
                                          ? {
                                              ...entry,
                                              product: value,
                                              productId: '',
                                              lineImage: '',
                                            }
                                          : entry,
                                      ),
                                    })
                                  }}
                                  customerId={selectedCustomer?.id || ''}
                                  customerLabel={selectedQuote.customer || ''}
                                />
                              </Field>
                              <Field label="Adet">
                                <NumericInput
                                  value={item.quantity}
                                  onChange={(value) => updateItem(item.id, 'quantity', value)}
                                />
                              </Field>
                              <Field label="Birim Fiyat">
                                <NumericInput
                                  value={item.unitPrice}
                                  onChange={(value) => updateItem(item.id, 'unitPrice', value)}
                                  suffix="₺"
                                  formatMode="price"
                                />
                              </Field>
                              <Field label="KDV %">
                                <select
                                  value={item.vatRate ?? 20}
                                  onChange={(event) =>
                                    updateItem(item.id, 'vatRate', Number(event.target.value))
                                  }
                                  className="form-input"
                                >
                                  {vatRates.map((rate) => (
                                    <option key={rate} value={rate}>
                                      {rate}
                                    </option>
                                  ))}
                                </select>
                              </Field>
                              <Field label="Toplam">
                                <div className="flex h-8 items-center justify-end rounded-lg bg-emerald-500/10 px-2 text-[13px] font-bold tabular-nums text-[var(--muted)]">
                                  {formatTL(totals.total)}
                                </div>
                              </Field>
                              <div className="relative">
                                <FieldLabelSpacer label="İşlem" />
                                <div
                                  className={`flex h-8 items-center ${quoteItemFieldGapClass}`}
                                  data-quote-dropdown
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenItemMenuId(openItemMenuId === item.id ? null : item.id)
                                    }
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-500/50 text-[var(--muted)] transition-colors hover:bg-dark-700/60"
                                    title="Satıra alan ekle"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPendingItemDeleteId(item.id)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 text-red-300 transition-colors hover:bg-red-500/10"
                                    title="Satırı sil"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                  {openItemMenuId === item.id && (
                                    <div
                                      className={`absolute right-0 top-10 z-30 w-52 ${documentDropdownMenuClass}`}
                                    >
                                      {[
                                        ['showDescription', 'Açıklama ekle'],
                                        ['showDiscount', 'İndirim ekle'],
                                        ['showExciseTax', 'ÖTV ekle'],
                                        ['showAccommodationTax', 'Konaklama vergisi ekle'],
                                      ]
                                        .filter(
                                          ([field]) =>
                                            field !== 'showDescription' || !item.showDescription,
                                        )
                                        .map(([field, label]) => (
                                          <button
                                            key={field}
                                            type="button"
                                            onClick={() => enableItemOption(item.id, field)}
                                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-medium text-[var(--muted)] transition-colors hover:bg-blue-500/10 hover:text-[var(--ink)]"
                                          >
                                            <Plus className="h-3 w-3 text-blue-400" /> {label}
                                          </button>
                                        ))}
                                    </div>
                                  )}
                                  {pendingItemDeleteId === item.id && (
                                    <DeleteConfirmPopover
                                      onConfirm={() => removeItem(item.id)}
                                      onCancel={() => setPendingItemDeleteId(null)}
                                      className="absolute right-0 top-10 z-40"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                            {(item.showDiscount ||
                              item.showExciseTax ||
                              item.showAccommodationTax) && (
                              <div className={`grid grid-cols-2 ${quoteItemFieldGapClass} gap-y-3`}>
                                {item.showDiscount && (
                                  <div className="rounded-2xl border border-dark-500/45 bg-dark-800/70 p-3">
                                    <div className="grid grid-cols-[minmax(0,1fr)_92px] items-end gap-3">
                                      <Field label="İndirim %">
                                        <NumericInput
                                          value={item.discountRate || 0}
                                          onChange={(value) =>
                                            updateItem(item.id, 'discountRate', value)
                                          }
                                        />
                                      </Field>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          disableItemOption(item.id, 'showDiscount', {
                                            discountRate: 0,
                                          })
                                        }
                                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 text-[11px] font-bold text-red-300 transition-colors hover:bg-red-500/20"
                                      >
                                        <X className="h-3.5 w-3.5" /> Kaldır
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {item.showExciseTax && (
                                  <div className="rounded-2xl border border-dark-500/45 bg-dark-800/70 p-3">
                                    <div className="grid grid-cols-[minmax(0,1fr)_92px] items-end gap-3">
                                      <Field label="ÖTV %">
                                        <NumericInput
                                          value={item.exciseTaxRate || 0}
                                          onChange={(value) =>
                                            updateItem(item.id, 'exciseTaxRate', value)
                                          }
                                        />
                                      </Field>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          disableItemOption(item.id, 'showExciseTax', {
                                            exciseTaxRate: 0,
                                          })
                                        }
                                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 text-[11px] font-bold text-red-300 transition-colors hover:bg-red-500/20"
                                      >
                                        <X className="h-3.5 w-3.5" /> Kaldır
                                      </button>
                                    </div>
                                  </div>
                                )}
                                {item.showAccommodationTax && (
                                  <div className="rounded-2xl border border-dark-500/45 bg-dark-800/70 p-3">
                                    <div className="grid grid-cols-[minmax(0,1fr)_92px] items-end gap-3">
                                      <Field label="Konaklama Vergisi %">
                                        <NumericInput
                                          value={item.accommodationTaxRate || 0}
                                          onChange={(value) =>
                                            updateItem(item.id, 'accommodationTaxRate', value)
                                          }
                                        />
                                      </Field>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          disableItemOption(item.id, 'showAccommodationTax', {
                                            accommodationTaxRate: 0,
                                          })
                                        }
                                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 text-[11px] font-bold text-red-300 transition-colors hover:bg-red-500/20"
                                      >
                                        <X className="h-3.5 w-3.5" /> Kaldır
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {item.showDescription && (
                              <div
                                className={`mt-auto grid grid-cols-[minmax(0,1fr)_92px] items-end ${quoteItemFieldGapClass}`}
                              >
                                <Field label="Satır Açıklaması">
                                  <input
                                    value={item.extraDescription ?? item.description ?? ''}
                                    onChange={(event) =>
                                      updateItem(item.id, 'extraDescription', event.target.value)
                                    }
                                    placeholder="Bu ürün satırı için ekstra açıklama yazın..."
                                    className="form-input"
                                  />
                                </Field>
                                <button
                                  type="button"
                                  onClick={() =>
                                    disableItemOption(item.id, 'showDescription', {
                                      extraDescription: '',
                                    })
                                  }
                                  className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 text-[11px] font-bold text-red-300 transition-colors hover:bg-red-500/20"
                                >
                                  <X className="h-3.5 w-3.5" /> Kaldır
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {(selectedQuote.items || []).length === 0 && (
                    <div className="rounded-xl border border-dashed border-dark-500/50 bg-dark-700/15 px-4 py-6 text-center text-[13px] font-medium text-[var(--muted)]">
                      Henüz ürün eklenmedi. Ürün Ekle ile satır oluşturun.
                    </div>
                  )}

                  <div className="pt-1">
                    <MiniButton onClick={addItem}>Ürün Ekle</MiniButton>
                  </div>

                  {selectedQuote && (
                    <div className="grid grid-cols-1 gap-4 border-t border-dark-500/35 pt-4 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-start">
                      <div className="flex min-w-0 flex-col gap-4">
                        <QuoteNotesPanel quote={selectedQuote} onPatch={patchSelected} />
                        <DocumentBankAccountsPanel quote={selectedQuote} onPatch={patchSelected} />
                      </div>
                      {selectedTotals && (
                        <div className="w-full max-w-[480px] lg:justify-self-end">
                          <DocumentTotalsPanel totals={selectedTotals} onPatch={patchSelected} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AppPagePanel>

              <AppPagePanel className="w-full" title="Teklif Koşulları :" dotColor="orange">
                <DocumentTermsEditor
                  record={selectedQuote}
                  onPatch={patchSelected}
                  compact
                  hideTitle
                  savedTermsTitle="Hazır Teklif Koşulları"
                  descriptionPlaceholder="Teklifin ödeme, teslimat, üretim veya özel açıklamalarını buraya yazın..."
                />
                <div className="mt-4 grid gap-2 border-t border-dark-500/35 pt-4 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={downloadQuotePdf}
                    disabled={isGeneratingPdf}
                    className={`${HEADER_ACTION_CTA_CLASS} w-full justify-center ${HEADER_ACTION_GRADIENTS.danger}`}
                  >
                    <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                      <FileText className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
                    </span>
                    <span className={YF_TEXT_ON_COLOR_CLASS}>
                      {isGeneratingPdf ? 'Hazırlanıyor...' : 'PDF İndir'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={sendQuoteByWhatsApp}
                    disabled={isGeneratingPdf}
                    className={`${HEADER_ACTION_CTA_CLASS} w-full justify-center ${HEADER_ACTION_GRADIENTS.success}`}
                  >
                    <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                      <Send className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
                    </span>
                    <span className={YF_TEXT_ON_COLOR_CLASS}>WhatsApp PDF Gönder</span>
                  </button>
                  <button
                    type="button"
                    onClick={sendQuoteByMail}
                    className={`${HEADER_ACTION_CTA_CLASS} w-full justify-center ${HEADER_ACTION_GRADIENTS.primary}`}
                  >
                    <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                      <Mail className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
                    </span>
                    <span className={YF_TEXT_ON_COLOR_CLASS}>Mail Gönder</span>
                  </button>
                </div>
              </AppPagePanel>

              {selectedQuote && selectedTotals && (
                <section
                  ref={quotePreviewRef}
                  aria-hidden="true"
                  className="fixed left-[-10000px] top-0 w-[1440px] overflow-hidden bg-white"
                >
                  {(() => {
                    const previewQuote = sanitizeQuoteForSave(selectedQuote)
                    const customer = getQuoteCustomerDetails(previewQuote)
                    const previewBankAccounts = resolveQuoteBankAccounts(previewQuote)
                    const activeStage = (previewQuote.stages || []).find(
                      (stage) => stage.id === previewQuote.currentStageId,
                    )
                    const terms = (previewQuote.termsDescription || '')
                      .split('\n')
                      .map((line) => line.replace(/^- /, '').trim())
                      .filter(Boolean)
                    const representative = previewQuote.owner || 'Satış Ekibi'
                    return (
                      <div className="bg-white p-12 text-slate-900">
                        <div className="mb-10 flex items-end justify-between border-b border-slate-200 pb-6">
                          <div>
                            <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                              Erlenbox
                            </p>
                            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
                              Fiyat Teklifi
                            </h1>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                              Teklif No
                            </p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                              {previewQuote.id}
                            </p>
                          </div>
                        </div>

                        <div className="mb-8 grid grid-cols-3 gap-8">
                          <div>
                            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-slate-400">
                              Müşteri
                            </p>
                            <div className="space-y-2 text-sm">
                              {[
                                ['Marka', customer.company],
                                ['Ünvan', customer.contact],
                                ['Yetkili', customer.authorizedName || '—'],
                                ['Adres', customer.address || '—'],
                                ['Telefon', customer.phone || '—'],
                                ['E-posta', customer.email || '—'],
                              ].map(([label, value]) => (
                                <div key={label} className="grid grid-cols-[88px_1fr] gap-2">
                                  <span className="text-slate-400">{label}</span>
                                  <span className="font-medium text-slate-900">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-slate-400">
                              Teklif Bilgileri
                            </p>
                            <div className="space-y-2 text-sm">
                              {[
                                ['Başlık', previewQuote.title || '—'],
                                ['Tarih', formatListDate(previewQuote.createdAt)],
                                ['Geçerlilik', formatListDate(previewQuote.validUntil)],
                                ['Süreç', activeStage?.label || '—'],
                                ['Para Birimi', 'TRY'],
                              ].map(([label, value]) => (
                                <div key={label} className="grid grid-cols-[88px_1fr] gap-2">
                                  <span className="text-slate-400">{label}</span>
                                  <span className="font-medium text-slate-900">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-slate-400">
                              Temsilci
                            </p>
                            <p className="text-lg font-semibold text-slate-900">{representative}</p>
                            <p className="mt-1 text-sm text-slate-500">Müşteri Temsilcisi</p>
                          </div>
                        </div>

                        <div className="overflow-hidden rounded-lg border border-slate-200">
                          <div className="grid grid-cols-[120px_minmax(0,1.4fr)_72px_110px_120px] border-b border-slate-200 px-4 py-3 text-[13px] font-semibold uppercase tracking-wider text-slate-500">
                            <span>Görsel</span>
                            <span>Ürün</span>
                            <span className="text-right">Adet</span>
                            <span className="text-right">Birim</span>
                            <span className="text-right">Tutar</span>
                          </div>
                          {previewQuote.items.map((item, index) => {
                            const row = itemTotals(item)
                            const description = item.extraDescription || item.description
                            const previewImage = resolveQuoteItemImage(item)
                            return (
                              <div
                                key={item.id}
                                className={`grid grid-cols-[120px_minmax(0,1.4fr)_72px_110px_120px] items-center px-4 py-4 text-sm ${index < previewQuote.items.length - 1 ? 'border-b border-slate-100' : ''}`}
                              >
                                <div className="h-[88px] w-[88px] overflow-hidden rounded-md border border-slate-200">
                                  {previewImage ? (
                                    <img
                                      src={previewImage}
                                      alt=""
                                      className="h-full w-full object-cover object-center"
                                    />
                                  ) : null}
                                </div>
                                <div className="pr-4">
                                  <p className="font-semibold text-slate-900">
                                    {item.product || 'Ürün seçilmedi'}
                                  </p>
                                  {description ? (
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                      {description}
                                    </p>
                                  ) : null}
                                  <p className="mt-1 text-xs text-slate-400">
                                    KDV %{item.vatRate ?? 20}
                                  </p>
                                </div>
                                <span className="text-right font-medium text-slate-900">
                                  {item.quantity}
                                </span>
                                <span className="text-right text-slate-700">
                                  {formatTL(item.unitPrice)}
                                </span>
                                <span className="text-right font-semibold text-slate-900">
                                  {formatTL(row.total)}
                                </span>
                              </div>
                            )
                          })}
                        </div>

                        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_300px] gap-8">
                          <div>
                            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-slate-400">
                              Açıklama & Koşullar
                            </p>
                            <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                              {previewQuote.termsDescription || 'Teklif koşulları belirtilmedi.'}
                            </p>
                            {terms.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {terms.map((term) => (
                                  <p key={term} className="text-sm text-slate-600">
                                    • {term}
                                  </p>
                                ))}
                              </div>
                            )}
                            {previewBankAccounts.length > 0 && (
                              <div className="mt-6">
                                <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-slate-400">
                                  Banka Hesapları
                                </p>
                                <div className="space-y-3">
                                  {previewBankAccounts.map((account) => (
                                    <div key={account.id} className="text-sm text-slate-600">
                                      <p className="font-semibold text-slate-900">
                                        {account.bankName}
                                        {account.label ? ` · ${account.label}` : ''}
                                      </p>
                                      {account.branch ? (
                                        <p className="mt-0.5">Şube: {account.branch}</p>
                                      ) : null}
                                      {account.iban ? (
                                        <p className="mt-0.5">IBAN: {account.iban}</p>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-slate-200 pt-4">
                            {[
                              ['Ara Toplam', selectedTotals.subtotal],
                              selectedTotals.lineDiscount > 0
                                ? ['Satır İndirimi', selectedTotals.lineDiscount]
                                : null,
                              selectedTotals.showDocumentDiscount
                                ? ['Toplam İndirim', selectedTotals.documentDiscount]
                                : null,
                              ['ÖTV', selectedTotals.exciseTax],
                              ['Konaklama Vergisi', selectedTotals.accommodationTax],
                              ['KDV', selectedTotals.vat],
                            ]
                              .filter(Boolean)
                              .filter(
                                ([label, value]) =>
                                  label === 'Ara Toplam' || label === 'KDV' || Number(value) !== 0,
                              )
                              .map(([label, value]) => (
                                <div
                                  key={label}
                                  className="mb-2 flex items-center justify-between text-sm"
                                >
                                  <span className="text-slate-500">{label}</span>
                                  <span className="font-medium text-slate-900">
                                    {formatTL(value)}
                                  </span>
                                </div>
                              ))}
                            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                              <span className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                                Genel Toplam
                              </span>
                              <span className="text-xl font-semibold text-slate-900">
                                {formatTL(selectedTotals.grandTotal)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-400">
                          <p>
                            Bu teklif yalnızca bilgilendirme amaçlıdır. Geçerlilik tarihi:{' '}
                            {formatListDate(previewQuote.validUntil)}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                </section>
              )}

              <DocumentActivityPanel
                activities={selectedQuote.activities || []}
                isOpen={isActivityOpen}
                onToggle={() => setIsActivityOpen(!isActivityOpen)}
              />
            </>
          )}
        </div>
      )}

      <DeleteConfirmOverlay
        open={Boolean(pendingDeleteId) || pendingHeaderQuoteDelete}
        anchorRect={deleteConfirmAnchor}
        title="Teklif silinsin mi?"
        description="Teklif silinenlere taşınır; geri alınabilir."
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        onCancel={() => {
          setPendingDeleteId(null)
          setPendingHeaderQuoteDelete(false)
          setDeleteConfirmAnchor(null)
        }}
        onConfirm={() => {
          if (pendingHeaderQuoteDelete && selectedQuote) {
            deleteQuote(selectedQuote, { navigateToList: true, skipConfirm: true })
          } else {
            const quote = quotes.find((item) => item.id === pendingDeleteId)
            if (quote) deleteQuote(quote, { skipConfirm: true })
            else setPendingDeleteId(null)
          }
          setPendingDeleteId(null)
          setPendingHeaderQuoteDelete(false)
          setDeleteConfirmAnchor(null)
        }}
      />
    </AppPageShell>
  )
}
