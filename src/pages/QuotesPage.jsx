import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import SearchInput from '../components/Common/SearchInput'
import { jsPDF } from 'jspdf'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Save,
  Send,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { Dropdown, DropdownItem, DropdownSeparator, EmptyState, MoreMenu } from '@bachmain/ui'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import QuoteDeletedArchivedPanel from '../components/Common/QuoteDeletedArchivedPanel'
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
import {
  currencySymbol,
  formatMoney,
  formatTL,
  normalizeCurrency,
  QUOTE_CURRENCIES,
} from '../utils/productPricing'
import { getExchangeRatesSnapshot, useExchangeRates } from '../hooks/useExchangeRates'
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
  toStageDropdownOptions,
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
  isQuoteCustomStatusSegment,
  isQuoteStatusSegment,
  quoteCustomListOptions,
  quoteSegmentFieldValue,
  quoteSegmentSource,
  QUOTE_CUSTOM_LISTS_EVENT,
  QUOTE_SEGMENT_TABS_EVENT,
  readQuoteCustomLists,
  readQuoteSegmentTabs,
  saveQuoteCustomList,
} from '../utils/quoteSegmentTabs'
import {
  stageColors as processStageColors,
} from '../components/DocumentEditor/stageColors'
import CustomerPicker, {
  DOCUMENT_SIDE_ACTION_WIDTH,
  findDocumentCustomer as findQuoteCustomer,
} from '../components/DocumentEditor/CustomerPicker'
import ProductSearchSelect from '../components/DocumentEditor/ProductSearchSelect'
import ModernDatePicker from '../components/Common/ModernDatePicker'
import { readCompanySettings } from '../utils/companySettings'
import { buildQuoteDocumentHtml, buildQuoteDocumentInnerHtml } from '../utils/quoteDocumentHtml'
import { readQuotePrintSettings } from '../utils/docPrintSettingsStore'
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
  YF_TEXT_CLASS,
  YFB_TEXT_CLASS,
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

const quoteItemFieldGapClass = 'gap-x-2'

function quoteItemGridTemplate(item) {
  const cols = ['minmax(0,1.4fr)', '64px', '100px', '56px']
  if (item?.showDiscount) cols.push('64px')
  if (item?.showExciseTax) cols.push('56px')
  if (item?.showAccommodationTax) cols.push('88px')
  cols.push('96px', 'auto')
  return cols.join(' ')
}
const quoteLineActionBtnClass =
  'glass-sidebar-toggle flex h-7 w-7 items-center justify-center rounded-xl text-[var(--muted)] transition-colors'
const quoteLineDeleteBtnClass =
  'glass-sidebar-toggle flex h-7 w-7 items-center justify-center rounded-xl text-[var(--muted)] transition-colors'
const quoteMsCtaClass =
  'quote-ms-cta-plain group inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--search-border)] bg-transparent text-[14px] font-normal text-[var(--muted)] transition-colors hover:text-[#2563eb] focus:text-[#2563eb] active:text-[#2563eb] [&_svg]:text-[#2563eb]'

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
const orderStatusFilterOptions = [
  { label: 'Tümü', color: 'bg-gray-500', locked: true },
  { label: 'Oluşturuldu', color: 'bg-emerald-500' },
  { label: 'Oluşturulmadı', color: 'bg-orange-500' },
]
const savedQuoteTerms = [
  'Fiyatlara KDV dahil değildir.',
  'Teklif geçerlilik süresi belirtilen tarih ile sınırlıdır.',
  'Teslimat süresi sipariş onayı ve avans ödemesi sonrası başlar.',
  'Baskı onayı alındıktan sonra üretim revizyonu ayrıca fiyatlandırılır.',
  'Nakliye ve sevkiyat bedeli ayrıca hesaplanır.',
  'Ödeme koşulları sipariş onayı öncesinde karşılıklı mutabakat ile netleştirilir.',
]

function QuoteOrderInlineConfirm({
  label,
  labelClass,
  ariaLabel,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="quote-order-undo-confirm quote-order-action inline-flex h-9 items-center justify-center"
      onClick={(event) => event.stopPropagation()}
      role="alertdialog"
      aria-label={ariaLabel}
    >
      <div className="quote-order-undo-box flex h-9 w-[5.75rem] items-center justify-between rounded-xl border border-ds-border bg-transparent px-1">
        <button
          type="button"
          onClick={onConfirm}
          className={`${labelClass} px-1.5 text-[11px] font-semibold leading-none`}
        >
          {label}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="quote-order-undo-close inline-flex h-7 w-7 items-center justify-center rounded-lg"
          aria-label="Vazgeç"
          title="Vazgeç"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>
    </div>
  )
}

function formatQuoteListColumnLabel(label) {
  const text = String(label || '').trim()
  if (!text) return ''
  const upper = text.replace(/\s*:\s*$/, '').toLocaleUpperCase('tr-TR')
  return `${upper} :`
}

function QuoteListColumnHeader({
  label,
  sortable = false,
  sortKey,
  sort,
  onToggleSort,
  align = 'center',
}) {
  const title = formatQuoteListColumnLabel(label)
  if (!label) {
    return <span className="inline-flex h-5 w-5" aria-hidden />
  }

  const sortIcon =
    sortable && sort?.key === sortKey ? (
      sort.dir === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden="true" />
      ) : (
        <ArrowDown className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden="true" />
      )
    ) : (
      <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden="true" />
    )

  const justify =
    align === 'start' ? 'justify-start' : align === 'end' ? 'justify-end' : 'justify-center'

  return (
    <button
      type="button"
      className={`quote-list-header-btn flex min-h-[2.75rem] w-full min-w-0 items-center ${justify} gap-1`}
      title={`${label} sırala`}
      aria-label={`${label} sırala`}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (sortable) onToggleSort?.(sortKey)
      }}
    >
      <span className={`${YFB_TEXT_CLASS} quote-list-column-title`}>{title}</span>
      {sortIcon}
    </button>
  )
}

const QUOTE_LIST_ROW_PANEL_CLASS =
  'customer-filter-panel customer-list-panel quote-list-row-panel flex w-full items-center'

function QuoteListRowPanel({ header = false, gridTemplate, className = '', children }) {
  return (
    <AppPagePanel
      className={`${QUOTE_LIST_ROW_PANEL_CLASS} ${
        header ? 'quote-list-header-panel min-h-[4.75rem]' : 'min-h-[3rem] !py-1.5'
      } ${className}`.trim()}
    >
      <div className="quote-list-row w-full min-w-0" style={{ gridTemplateColumns: gridTemplate }}>
        {children}
      </div>
    </AppPagePanel>
  )
}

function QuoteListCell({ className = '', align = 'center', children }) {
  const alignClass = align === 'start' ? 'is-start' : align === 'end' ? 'is-end' : ''
  return (
    <div className={`quote-list-cell min-w-0 ${alignClass} ${className}`.trim()}>
      {children}
    </div>
  )
}

function sortQuoteListByColumn(
  rows,
  sort,
  quoteSegmentTabs,
  quotes,
  processValueForQuote,
  isQuoteOrderCreated,
) {
  if (!sort?.key) return rows
  const dir = sort.dir === 'desc' ? -1 : 1
  const quoteIds = quotes.map((item) => item.id)
  return [...rows].sort((a, b) => {
    const valueOf = (quote) => {
      if (sort.key === 'date') return getQuoteSortDateValue(quote)
      if (sort.key === 'code') return resolveQuoteCode(quote.id, quoteIds)
      if (sort.key === 'customer') {
        const display = getListCustomerDisplay(quote.customer)
        return display.brandShortName || display.companyTitle || quote.customer || ''
      }
      if (sort.key === 'amount') return getQuoteListAmount(quote)
      if (sort.key === 'order') return isQuoteOrderCreated?.(quote) ? 1 : 0
      const tab = quoteSegmentTabs.find((item) => `process-${item.id}` === sort.key)
      if (tab) return processValueForQuote(tab, quote)
      return ''
    }
    const av = valueOf(a)
    const bv = valueOf(b)
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv), 'tr', { sensitivity: 'base' }) * dir
  })
}

function getQuoteSortDateValue(quote) {
  const lastActivityDate = (quote.activities || []).at(-1)?.date
  const rawDate = lastActivityDate || quote.createdAt || ''
  const normalized = String(rawDate).replace(' ', 'T')
  const time = new Date(normalized).getTime()
  return Number.isNaN(time) ? 0 : time
}

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
      <QuoteOrderInlineConfirm
        label="Evet"
        labelClass="quote-order-undo-evet"
        ariaLabel="Sipariş oluştur"
        onConfirm={onConfirmCreate}
        onCancel={onCancelPending}
      />
    )
  }

  if (pendingAction === 'undo') {
    return (
      <QuoteOrderInlineConfirm
        label="Sil"
        labelClass="quote-order-undo-sil"
        ariaLabel="Siparişi geri al"
        onConfirm={onConfirmUndo}
        onCancel={onCancelPending}
      />
    )
  }

  if (orderCreated) {
    return (
      <span className="quote-order-action inline-flex h-9 items-center justify-between">
        <span
          className="quote-order-chip inline-flex h-9 w-[3.75rem] flex-col items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-1 text-center text-[10px] font-bold leading-tight text-emerald-700"
          title="Sipariş oluşturuldu"
        >
          <span>Sipariş</span>
          <span>Oluştu</span>
        </span>
        <button
          type="button"
          onClick={onRequestUndo}
          className="glass-sidebar-toggle glass-sidebar-collapse flex h-9 w-9 items-center justify-center rounded-xl"
          title="Siparişi geri al"
          aria-label="Siparişi geri al"
        >
          <Undo2 className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onRequestCreate}
      className="quote-order-chip quote-order-action inline-flex h-9 flex-col items-center justify-center rounded-xl border border-ds-border bg-transparent px-1 text-center text-[10px] font-semibold leading-tight text-[var(--muted)] transition-colors hover:border-emerald-500/40 hover:text-emerald-700"
      title={`${quote.customer || quote.id} teklifinden sipariş oluştur`}
      aria-label="Sipariş oluştur"
    >
      <span>Sipariş</span>
      <span>Oluştur</span>
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
    showDescription: false,
    showDiscount: false,
    showExciseTax: false,
    showAccommodationTax: false,
    quantity: 1,
    unitPrice: 0,
    currency: 'TRY',
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
    currency: normalizeCurrency(item.currency),
    discountRate: safeNumber(item.discountRate, 0, 100),
    exciseTaxRate: safeNumber(item.exciseTaxRate, 0, 100),
    accommodationTaxRate: safeNumber(item.accommodationTaxRate, 0, 100),
    vatRate: safeNumber(item.vatRate, 0, 100),
    showDescription:
      item.showDescription === true || Boolean(safeText(item.extraDescription)),
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
      : getOptionLabels('status')[0] || '',
    createdAt: quote.createdAt || todayIsoDate(),
    validUntil: quote.validUntil || defaultValidUntilDate(quote.createdAt || todayIsoDate()),
    dueDate: quote.dueDate || quote.validUntil || defaultValidUntilDate(quote.createdAt || todayIsoDate()),
    tags: Array.isArray(quote.tags) ? quote.tags.map(safeText).filter(Boolean) : [],
    termsDescription: String(quote.termsDescription || '').trim(),
    terms: Array.isArray(quote.terms) ? quote.terms.map(safeText).filter(Boolean) : [],
    segmentFieldValues:
      quote.segmentFieldValues && typeof quote.segmentFieldValues === 'object'
        ? quote.segmentFieldValues
        : {},
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

function buildQuoteShareText(quote, rates = getExchangeRatesSnapshot()) {
  const safeQuote = sanitizeQuoteForSave(quote)
  const totals = documentTotals(safeQuote, rates)
  const customer = getQuoteCustomerDetails(safeQuote)
  const itemLines = safeQuote.items.map((item, index) => {
    const itemTotal = itemTotals(item, rates)
    const currency = normalizeCurrency(item.currency)
    return `${index + 1}. ${item.product} | Adet: ${item.quantity} | Birim: ${formatMoney(item.unitPrice, currency)} | KDV Hariç: ${formatTL(itemTotal.net)} | Toplam: ${formatTL(itemTotal.total)}`
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

function buildQuotePrintHtml(quote, rates = getExchangeRatesSnapshot()) {
  const safeQuote = sanitizeQuoteForSave(quote)
  return buildQuoteDocumentHtml({
    quote: safeQuote,
    customer: getQuoteCustomerDetails(safeQuote),
    company: readCompanySettings(),
    settings: readQuotePrintSettings(),
    rates,
  })
}

async function createQuotePdfBlob(element) {
  if (!element) throw new Error('Teklif görsel alanı bulunamadı.')

  await document.fonts?.ready
  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#ffffff',
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
  const parts = documentMoneyParts(quote, getExchangeRatesSnapshot())
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

function Field({ label, children, align = 'start' }) {
  const center = align === 'center'
  return (
    <div className={`min-w-0 ${center ? 'text-center' : ''}`.trim()}>
      <label
        className={`${YF_TEXT_CLASS} mb-1 block ${center ? 'w-full text-center' : ''}`.trim()}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

function CurrencySuffixSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const currency = normalizeCurrency(value)

  useEffect(() => {
    if (!open) return undefined
    function onDoc(event) {
      if (ref.current?.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className="absolute right-1 top-1/2 z-10 -translate-y-1/2" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg px-1 text-[13px] font-semibold text-[var(--muted)] transition-colors hover:text-[#2563eb]"
        title="Para birimi"
        aria-expanded={open}
      >
        {currencySymbol(currency)}
      </button>
      {open ? (
        <div className={`absolute right-0 top-full z-30 mt-1 w-28 p-1 ${PAGE_FILTER_MENU_CLASS}`}>
          {QUOTE_CURRENCIES.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => {
                onChange(option.code)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                currency === option.code ? 'text-[#2563eb]' : 'text-[var(--muted)]'
              }`}
            >
              <span>{option.label}</span>
              <span className="font-semibold">{option.symbol}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function VatRateInput({ value, onChange, options = vatRates }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(String(value ?? 20))
  const ref = useRef(null)

  useEffect(() => {
    setText(String(value ?? 20))
  }, [value])

  useEffect(() => {
    if (!open) return undefined
    function onDoc(event) {
      if (ref.current?.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function commit(raw) {
    const cleaned = String(raw ?? '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.]/g, '')
    const next = safeNumber(cleaned === '' ? 0 : cleaned, 0, 100)
    setText(String(next))
    onChange(next)
  }

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(event) => {
          const raw = event.target.value
          if (raw !== '' && !/^\d*[.,]?\d*$/.test(raw)) return
          setText(raw)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => commit(text)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit(text)
            setOpen(false)
          }
        }}
        className="form-input text-center"
        aria-expanded={open}
      />
      {open ? (
        <div className={`absolute left-1/2 top-full z-30 mt-1 w-20 -translate-x-1/2 p-1 ${PAGE_FILTER_MENU_CLASS}`}>
          {options.map((rate) => (
            <button
              key={rate}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                commit(rate)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-center rounded-lg px-2 py-1.5 text-[13px] ${
                Number(value) === Number(rate) ? 'text-[#2563eb]' : 'text-[var(--muted)]'
              }`}
            >
              {rate}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function DateInlineField({ label, value, onChange, dotColor = 'blue' }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex shrink-0 items-center gap-2">
        <AppPanelDot color={dotColor} />
        <h2 className={APP_PANEL_TITLE_CLASS}>{label}</h2>
      </div>
      <div className="min-w-0 flex-1">
        <ModernDatePicker value={value} onChange={onChange} />
      </div>
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
  const [filters, setFilters] = useState({})
  const [quoteSegmentTabs, setQuoteSegmentTabs] = useState(() => readQuoteSegmentTabs())
  const [quoteCustomLists, setQuoteCustomLists] = useState(() => readQuoteCustomLists())
  const [sortMode, setSortMode] = useState('latest')
  const [listColumnSort, setListColumnSort] = useState({ key: null, dir: 'asc' })
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
  const { rates } = useExchangeRates()

  const selectedQuote =
    draftQuote || quotes.find((quote) => quote.id === selectedId) || quotes[0] || null
  const selectedCustomer =
    selectedQuote?.customerId || selectedQuote?.customer
      ? findQuoteCustomer(selectedQuote.customerId || selectedQuote.customer)
      : null
  const selectedTotals = selectedQuote ? documentTotals(selectedQuote, rates) : null
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

  function processOptionsForTab(tab) {
    if (isQuoteStatusSegment(tab)) return optionLists.status || []
    if (isQuoteCustomStatusSegment(tab)) return quoteCustomListOptions(quoteCustomLists, tab)
    return toStageDropdownOptions(quoteStageOptions)
  }

  function processFilterOptionsForTab(tab) {
    return [filterAllOption, ...processOptionsForTab(tab)]
  }

  function processValueForQuote(tab, quote) {
    if (isQuoteStatusSegment(tab)) {
      return resolveListColumnLabel(quote.status, optionLists.status)
    }
    if (isQuoteCustomStatusSegment(tab)) {
      return resolveListColumnLabel(
        quoteSegmentFieldValue(quote, tab),
        quoteCustomListOptions(quoteCustomLists, tab),
      )
    }
    return resolveListQuoteStage(quote)?.label || ''
  }

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

  function updateQuoteStageOptions(nextOptions) {
    const fullStages = loadWorkflowStages()
    const current = getQuoteStageOptions(fullStages)
    const nextStages = (nextOptions || [])
      .map((option, index) => {
        const label = String(option?.label || '').trim()
        if (!label) return null
        const existing =
          current.find((stage) => stage.id === option.id) ||
          current.find((stage) => stage.label === label)
        return {
          id: existing?.id || option.id || `stage-${Date.now()}-${index}`,
          label,
          color: option.color || existing?.color || stageColors[index % stageColors.length],
          note: existing?.note || 'Teklif süreci aşaması.',
        }
      })
      .filter(Boolean)
    const saved = publishWorkflowStages(mergeQuoteStagesIntoWorkflow(fullStages, nextStages))
    setWorkflowStages([...(saved || loadWorkflowStages())])
  }

  function handleProcessValueChange(tab, quote, value) {
    if (isQuoteStatusSegment(tab)) {
      handleQuoteStatusChange(quote, value)
      return
    }
    if (isQuoteCustomStatusSegment(tab)) {
      const sourceId = quoteSegmentSource(tab)
      patchQuote(quote.id, {
        segmentFieldValues: {
          ...(quote.segmentFieldValues || {}),
          [sourceId]: value,
        },
      })
      setActiveMenu(null)
      return
    }
    handleQuoteStageLabelChange(quote, value)
  }

  function handleProcessOptionsChange(tab, next) {
    if (isQuoteStatusSegment(tab)) {
      updateOptionList('status', next)
      return
    }
    if (isQuoteCustomStatusSegment(tab)) {
      setQuoteCustomLists(saveQuoteCustomList(quoteSegmentSource(tab), next))
      return
    }
    updateQuoteStageOptions(next)
  }

  useEffect(() => {
    function refreshQuoteSegmentTabs() {
      setQuoteSegmentTabs(readQuoteSegmentTabs())
    }
    function refreshQuoteCustomLists() {
      setQuoteCustomLists(readQuoteCustomLists())
    }
    window.addEventListener(QUOTE_SEGMENT_TABS_EVENT, refreshQuoteSegmentTabs)
    window.addEventListener(QUOTE_CUSTOM_LISTS_EVENT, refreshQuoteCustomLists)
    return () => {
      window.removeEventListener(QUOTE_SEGMENT_TABS_EVENT, refreshQuoteSegmentTabs)
      window.removeEventListener(QUOTE_CUSTOM_LISTS_EVENT, refreshQuoteCustomLists)
    }
  }, [])

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
      <button
        type="button"
        className="inline-flex min-w-0 items-center gap-1 hover:text-d-ink"
        title={`${label} filtresini değiştir`}
        aria-label={`${label} filtresini değiştir`}
        onClick={(event) => {
          event.stopPropagation()
          cycleListFilter(field, options, 1)
        }}
      >
        <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden="true" />
      </button>
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
    const createdAt = todayIsoDate()
    return {
      ...initialQuotes[0],
      id: nextQuoteCode(baseQuotes.map((quote) => quote.id)),
      title: '',
      customer: '',
      contact: '',
      phone: '',
      email: '',
      status: (readOptionLists().status || [])[0]?.label || '',
      priority: 'Normal',
      source: 'Manuel',
      owner: '',
      tags: [],
      notes: '',
      termsDescription: '',
      terms: [],
      createdAt,
      validUntil: defaultValidUntilDate(createdAt),
      dueDate: defaultValidUntilDate(createdAt),
      currentStageId: getQuoteStageOptions(stages)[0]?.id || '',
      segmentFieldValues: {},
      stages,
      items: [createEmptyQuoteItem()],
      showDocumentDiscount: false,
      documentDiscountMode: 'percent',
      documentDiscountRate: 0,
      documentDiscountAmount: 0,
      selectedBankAccountIds: [],
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

  function getSafeQuoteForOutput(quote = selectedQuote) {
    if (!quote) return null
    const validation = validateQuoteForSave(quote)
    if (!validation.ok) {
      window.alert(validation.message)
      return null
    }
    return validation.quote
  }

  async function createQuotePdfFileFromQuote(quote) {
    if (quotePreviewRef.current && selectedQuote?.id === quote.id) {
      return createQuotePdfFile(quotePreviewRef.current, quote.id)
    }
    const host = document.createElement('section')
    host.setAttribute('aria-hidden', 'true')
    host.className = 'fixed left-[-10000px] top-0 w-[794px] overflow-hidden bg-white'
    host.innerHTML = buildQuoteDocumentInnerHtml({
      quote: sanitizeQuoteForSave(quote),
      customer: getQuoteCustomerDetails(quote),
      company: readCompanySettings(),
      settings: readQuotePrintSettings(),
      rates,
    })
    document.body.appendChild(host)
    try {
      return await createQuotePdfFile(host, quote.id)
    } finally {
      host.remove()
    }
  }

  function printQuoteDocument(quote) {
    if (!quote?.id) return
    navigate(`/belge-merkezi/yazdir?type=quote&id=${encodeURIComponent(quote.id)}`)
  }

  async function downloadQuotePdf(quote = selectedQuote) {
    const safeQuote = getSafeQuoteForOutput(quote)
    if (!safeQuote) return
    try {
      setIsGeneratingPdf(true)
      const { blob, filename } = await createQuotePdfFileFromQuote(safeQuote)
      downloadBlob(blob, filename)
    } catch (error) {
      window.alert(`PDF oluşturulamadı: ${error.message}`)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  async function sendQuoteByWhatsApp(quote = selectedQuote) {
    const safeQuote = getSafeQuoteForOutput(quote)
    if (!safeQuote) return
    try {
      setIsGeneratingPdf(true)
      const { blob, filename, file } = await createQuotePdfFileFromQuote(safeQuote)
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

  async function sendQuoteByMail(quote = selectedQuote) {
    const safeQuote = getSafeQuoteForOutput(quote)
    if (!safeQuote) return
    try {
      setIsGeneratingPdf(true)
      const { blob, filename } = await createQuotePdfFileFromQuote(safeQuote)
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
    return getQuoteSortDateValue(quote)
  }

  function toggleListColumnSort(key) {
    setListColumnSort((current) => {
      if (current.key !== key) return { key, dir: 'asc' }
      return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
    })
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
      const matchesProcessTabs = quoteSegmentTabs.every((tab) => {
        const selected = filters[tab.id] || 'Tümü'
        if (selected === 'Tümü') return true
        if (isQuoteStatusSegment(tab)) return quote.status === selected
        if (isQuoteCustomStatusSegment(tab)) {
          return processValueForQuote(tab, quote) === selected
        }
        return quoteProcess.activeStage?.label === selected
      })
      const orderStatus = filters.orderStatus || 'Tümü'
      const orderCreated = isQuoteOrderCreated(quote)
      const matchesOrderStatus =
        orderStatus === 'Tümü' ||
        (orderStatus === 'Oluşturuldu' && orderCreated) ||
        (orderStatus === 'Oluşturulmadı' && !orderCreated)
      return matchesSearch && matchesProcessTabs && matchesOrderStatus
    })
    .sort((a, b) => {
      if (sortMode === 'date') return getQuoteSortDate(b) - getQuoteSortDate(a)
      if (sortMode === 'name') return (a.customer || '').localeCompare(b.customer || '', 'tr')
      if (sortMode === 'price') return getQuoteListAmount(b) - getQuoteListAmount(a)
      return getQuoteSortDate(b) - getQuoteSortDate(a)
    })

  const listQuotes = sortQuoteListByColumn(
    filteredQuotes,
    listColumnSort,
    quoteSegmentTabs,
    quotes,
    processValueForQuote,
    isQuoteOrderCreated,
  )

  const quoteListColumnGrid = [
    '6.5rem',
    '4.75rem',
    'minmax(16rem, 2.4fr)',
    ...quoteSegmentTabs.map(() => 'minmax(9.25rem, 0.7fr)'),
    '6.75rem',
    '6.5rem',
    '3rem',
  ].join(' ')

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
              {selectedQuote && !isDraftQuote ? (
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
                      <DropdownSeparator />
                      <DropdownItem
                        icon={FileText}
                        label={isGeneratingPdf ? 'Hazırlanıyor...' : 'PDF İndir'}
                        tone="danger"
                        close={close}
                        onClick={() => downloadQuotePdf()}
                      />
                      <DropdownItem
                        icon={Send}
                        label="WhatsApp PDF Gönder"
                        tone="success"
                        close={close}
                        onClick={() => sendQuoteByWhatsApp()}
                      />
                      <DropdownItem
                        icon={Mail}
                        label="Mail Gönder"
                        tone="primary"
                        close={close}
                        onClick={() => sendQuoteByMail()}
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
                <AppPanelDot color="blue" />
                <span className={YF_TEXT_CLASS}>Filtre :</span>
              </div>
              <div className="app-filter-bar grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {quoteSegmentTabs.map((tab) => (
                  <div key={tab.id} className={PAGE_FILTER_FIELD_CLASS}>
                    <p className={PAGE_FILTER_LABEL_CLASS}>{tab.label} :</p>
                    <EditableDropdownPill
                      value={filters[tab.id] || 'Tümü'}
                      options={processFilterOptionsForTab(tab)}
                      includePlaceholderOption={false}
                      buttonClassName={PAGE_FILTER_PILL_CLASS}
                      menuClassName={PAGE_FILTER_MENU_CLASS}
                      openKey={`filter-${tab.id}`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onChange={(value) => updateFilter(tab.id, value)}
                      onOptionsChange={(next) => handleProcessOptionsChange(tab, next)}
                    />
                  </div>
                ))}
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
                <div className={PAGE_FILTER_FIELD_CLASS}>
                  <p className={PAGE_FILTER_LABEL_CLASS}>Sipariş Durumu :</p>
                  <EditableDropdownPill
                    value={filters.orderStatus || 'Tümü'}
                    options={orderStatusFilterOptions}
                    includePlaceholderOption={false}
                    editable={false}
                    buttonClassName={PAGE_FILTER_PILL_CLASS}
                    menuClassName={PAGE_FILTER_MENU_CLASS}
                    openKey="filter-order-status"
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    onChange={(value) => updateFilter('orderStatus', value)}
                  />
                </div>
              </div>
            </div>
          </AppPagePanel>

          <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
            <div className="flex w-full min-w-0 items-center gap-3 px-1">
              <div className="flex shrink-0 items-center gap-2">
                <AppPanelDot color="blue" />
                <span className={YF_TEXT_CLASS}>Teklif Listesi :</span>
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
          </AppPagePanel>

          {listQuotes.length === 0 ? (
            <AppPagePanel className="customer-filter-panel w-full">
              <EmptyState
                title="Teklif bulunamadı."
                description="Arama veya filtreleri değiştirin."
              />
            </AppPagePanel>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto overflow-y-visible">
              <div className="quote-list-board">
                <QuoteListRowPanel header gridTemplate={quoteListColumnGrid}>
                  <QuoteListCell>
                    <QuoteListColumnHeader
                      label="Tarih"
                      sortable
                      sortKey="date"
                      sort={listColumnSort}
                      onToggleSort={toggleListColumnSort}
                    />
                  </QuoteListCell>
                  <QuoteListCell>
                    <QuoteListColumnHeader
                      label="Kod"
                      sortable
                      sortKey="code"
                      sort={listColumnSort}
                      onToggleSort={toggleListColumnSort}
                    />
                  </QuoteListCell>
                  <QuoteListCell>
                    <QuoteListColumnHeader
                      label="Müşteri Adı"
                      sortable
                      sortKey="customer"
                      sort={listColumnSort}
                      onToggleSort={toggleListColumnSort}
                    />
                  </QuoteListCell>
                  {quoteSegmentTabs.map((tab) => (
                    <QuoteListCell key={tab.id}>
                      <QuoteListColumnHeader
                        label={tab.label}
                        sortable
                        sortKey={`process-${tab.id}`}
                        sort={listColumnSort}
                        onToggleSort={toggleListColumnSort}
                      />
                    </QuoteListCell>
                  ))}
                  <QuoteListCell>
                    <QuoteListColumnHeader
                      label="Tutar"
                      sortable
                      sortKey="amount"
                      sort={listColumnSort}
                      onToggleSort={toggleListColumnSort}
                    />
                  </QuoteListCell>
                  <QuoteListCell align="end">
                    <QuoteListColumnHeader
                      label="Sipariş"
                      sortable
                      sortKey="order"
                      sort={listColumnSort}
                      onToggleSort={toggleListColumnSort}
                      align="end"
                    />
                  </QuoteListCell>
                  <QuoteListCell>
                    <span
                      className="pointer-events-none inline-flex h-control w-control min-h-control min-w-[var(--ds-control-h)] items-center justify-center rounded-ds-md text-ds-ink"
                      aria-hidden
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </span>
                  </QuoteListCell>
                </QuoteListRowPanel>

                {listQuotes.map((quote) => {
                  const stamp = formatListDateParts(getQuoteListDateSource(quote))
                  const display = getListCustomerDisplay(quote.customer)
                  const pending =
                    pendingQuoteOrderAction?.id === quote.id
                      ? pendingQuoteOrderAction.type
                      : null
                  return (
                    <div
                      key={quote.id}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer"
                      onClick={() => editQuote(quote.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          editQuote(quote.id)
                        }
                      }}
                    >
                      <QuoteListRowPanel gridTemplate={quoteListColumnGrid}>
                        <QuoteListCell>
                          {stamp.date ? (
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
                          ) : (
                            <span className="block text-center text-[14px] font-normal text-[var(--muted)]">
                              —
                            </span>
                          )}
                        </QuoteListCell>
                        <QuoteListCell>
                          <span className={`${YF_TEXT_CLASS} tabular-nums`}>
                            {resolveQuoteCode(
                              quote.id,
                              quotes.map((item) => item.id),
                            )}
                          </span>
                        </QuoteListCell>
                        <QuoteListCell>
                          <span className="flex min-w-0 w-full flex-col items-center gap-0.5 py-0.5 text-center">
                            <span className="customer-name-primary whitespace-normal break-words text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                              {display.brandShortName || 'Müşteri girilmedi'}
                            </span>
                            {display.companyTitle ? (
                              <span className="customer-name-secondary font-sans whitespace-normal break-words text-[14px] font-normal leading-tight text-[var(--muted)]">
                                {display.companyTitle}
                              </span>
                            ) : null}
                          </span>
                        </QuoteListCell>
                        {quoteSegmentTabs.map((tab) => (
                          <QuoteListCell key={tab.id}>
                            <span
                              className="flex w-full items-center justify-center"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <EditableDropdownPill
                                value={processValueForQuote(tab, quote)}
                                options={processOptionsForTab(tab)}
                                includePlaceholderOption={false}
                                buttonClassName={PAGE_LIST_PILL_CLASS}
                                wrapperClassName={PAGE_LIST_PILL_WRAPPER_CLASS}
                                menuClassName={PAGE_LIST_MENU_CLASS}
                                menuMatchWidth={false}
                                openKey={`${quote.id}-${tab.id}`}
                                activeMenu={activeMenu}
                                setActiveMenu={setActiveMenu}
                                onChange={(value) => handleProcessValueChange(tab, quote, value)}
                                onOptionsChange={(next) => handleProcessOptionsChange(tab, next)}
                              />
                            </span>
                          </QuoteListCell>
                        ))}
                        <QuoteListCell>
                          <span className={`${PAGE_BALANCE_AMOUNT_CLASS} customer-balance-positive`}>
                            {formatTL(getQuoteListAmount(quote))}
                          </span>
                        </QuoteListCell>
                        <QuoteListCell align="end">
                          <span
                            className="inline-flex w-full items-center justify-end"
                            onClick={(event) => event.stopPropagation()}
                          >
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
                        </QuoteListCell>
                        <QuoteListCell>
                          <span onClick={(event) => event.stopPropagation()}>
                            <MoreMenu
                              items={[
                                {
                                  id: 'print',
                                  label: 'Yazdır',
                                  icon: Printer,
                                  tone: 'primary',
                                  onClick: () => printQuoteDocument(quote),
                                },
                                {
                                  id: 'whatsapp',
                                  label: isGeneratingPdf ? 'Hazırlanıyor...' : 'WhatsApp Gönder',
                                  icon: Send,
                                  tone: 'success',
                                  onClick: () => sendQuoteByWhatsApp(quote),
                                },
                                {
                                  id: 'mail',
                                  label: isGeneratingPdf ? 'Hazırlanıyor...' : 'Mail Gönder',
                                  icon: Mail,
                                  tone: 'primary',
                                  onClick: () => sendQuoteByMail(quote),
                                },
                                {
                                  id: 'pdf',
                                  label: isGeneratingPdf ? 'Hazırlanıyor...' : 'PDF İndir',
                                  icon: FileText,
                                  tone: 'danger',
                                  onClick: () => downloadQuotePdf(quote),
                                },
                                { type: 'separator', id: 'quote-row-sep' },
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
                          </span>
                        </QuoteListCell>
                      </QuoteListRowPanel>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-5 document-compact-controls">
          {selectedQuote && (
            <>
              <AppPagePanel className="customer-list-panel w-full">
                <div className="mb-4 flex min-w-0 items-center gap-3">
                  <div className="flex shrink-0 items-center gap-2">
                    <AppPanelDot color="blue" />
                    <h2 className={APP_PANEL_TITLE_CLASS}>Teklif Başlığı :</h2>
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      value={selectedQuote.title}
                      onChange={(e) => patchSelected({ title: e.target.value })}
                      className="form-input !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]"
                    />
                  </div>
                  <div className="flex min-w-0 shrink-0 items-center gap-3">
                    <div className="flex shrink-0 items-center gap-2">
                      <AppPanelDot color="blue" />
                      <h2 className={APP_PANEL_TITLE_CLASS}>Teklif Kodu :</h2>
                    </div>
                    <div className={DOCUMENT_SIDE_ACTION_WIDTH}>
                      <input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={resolvedQuoteCode}
                        onChange={(event) => patchQuoteCode(event.target.value)}
                        className="form-input !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]"
                        placeholder="Kod"
                        title="Teklif kodu"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <CustomerPicker
                    quote={selectedQuote}
                    onPatch={patchSelected}
                    allowCreate={true}
                  />
                  <div className="col-span-2 grid grid-cols-3 gap-3">
                    <DateInlineField
                      label="Oluşturma Tarihi :"
                      value={selectedQuote.createdAt || todayIsoDate()}
                      onChange={(value) => patchSelected({ createdAt: value })}
                    />
                    <DateInlineField
                      label="Geçerlilik Tarihi :"
                      value={
                        selectedQuote.validUntil ||
                        defaultValidUntilDate(selectedQuote.createdAt || todayIsoDate())
                      }
                      onChange={(value) => patchSelected({ validUntil: value })}
                    />
                    <DateInlineField
                      label="Vaade Tarihi :"
                      value={
                        selectedQuote.dueDate ||
                        selectedQuote.validUntil ||
                        defaultValidUntilDate(selectedQuote.createdAt || todayIsoDate())
                      }
                      onChange={(value) => patchSelected({ dueDate: value })}
                    />
                  </div>
                </div>
              </AppPagePanel>

              <AppPagePanel className="customer-list-panel w-full" title="Ürün Seçimi :" dotColor="blue">
                <div className="space-y-2">
                  {(selectedQuote.items || []).map((item) => {
                    const totals = itemTotals(item, rates)
                    const itemCurrency = normalizeCurrency(item.currency)
                    const display = totals.display || totals
                    const itemImage = resolveQuoteItemImage(item)
                    return (
                      <div key={item.id} className="py-1">
                        <div
                          className={`grid ${quoteItemFieldGapClass} items-end`}
                          style={{ gridTemplateColumns: quoteItemGridTemplate(item) }}
                        >
                          <Field label="Ürün" align="start">
                            <ProductSearchSelect
                              item={item}
                              selectedImage={itemImage}
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
                          <Field label="Adet" align="center">
                            <NumericInput
                              value={item.quantity}
                              onChange={(value) => updateItem(item.id, 'quantity', value)}
                              className="!text-center"
                            />
                          </Field>
                          <Field label="Birim Fiyat" align="center">
                            <div className="space-y-1">
                              <NumericInput
                                value={item.unitPrice}
                                onChange={(value) => updateItem(item.id, 'unitPrice', value)}
                                currency={itemCurrency}
                                formatMode="price"
                                className="!text-center"
                                suffixNode={
                                  <CurrencySuffixSelect
                                    value={itemCurrency}
                                    onChange={(nextCurrency) =>
                                      updateItem(item.id, 'currency', nextCurrency)
                                    }
                                  />
                                }
                              />
                              {itemCurrency !== 'TRY' && Number(item.unitPrice) > 0 ? (
                                <p className="text-center text-[11px] font-normal tabular-nums text-[var(--muted)]">
                                  {formatTL(totals.subtotal / Math.max(1, Number(item.quantity) || 1))}
                                </p>
                              ) : null}
                            </div>
                          </Field>
                          <Field label="KDV %" align="center">
                            <VatRateInput
                              value={item.vatRate ?? 20}
                              onChange={(value) => updateItem(item.id, 'vatRate', value)}
                            />
                          </Field>
                          {item.showDiscount ? (
                            <Field label="İndirim %" align="center">
                              <NumericInput
                                value={item.discountRate || 0}
                                onChange={(value) =>
                                  updateItem(item.id, 'discountRate', value)
                                }
                                className="!text-center"
                              />
                            </Field>
                          ) : null}
                          {item.showExciseTax ? (
                            <Field label="ÖTV %" align="center">
                              <NumericInput
                                value={item.exciseTaxRate || 0}
                                onChange={(value) =>
                                  updateItem(item.id, 'exciseTaxRate', value)
                                }
                                className="!text-center"
                              />
                            </Field>
                          ) : null}
                          {item.showAccommodationTax ? (
                            <Field label="Konaklama Vergisi %" align="center">
                              <NumericInput
                                value={item.accommodationTaxRate || 0}
                                onChange={(value) =>
                                  updateItem(item.id, 'accommodationTaxRate', value)
                                }
                                className="!text-center"
                              />
                            </Field>
                          ) : null}
                          <Field label="Toplam" align="center">
                            <div className="space-y-1">
                              <div className="document-frame-only flex h-10 items-center justify-center rounded-lg border border-[var(--search-border)] px-1.5 text-center text-[14px] font-bold tabular-nums text-[var(--muted)]">
                                {formatMoney(display.total, itemCurrency)}
                              </div>
                              {itemCurrency !== 'TRY' ? (
                                <p className="text-center text-[11px] font-normal tabular-nums text-[var(--muted)]">
                                  {formatTL(totals.total)}
                                </p>
                              ) : null}
                            </div>
                          </Field>
                          <div className="relative">
                            <FieldLabelSpacer label="İşlem" />
                            <div
                              className={`flex h-10 items-center ${quoteItemFieldGapClass}`}
                              data-quote-dropdown
                            >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenItemMenuId(openItemMenuId === item.id ? null : item.id)
                                    }
                                    className={quoteLineActionBtnClass}
                                    data-tone="primary"
                                    title="Satıra alan ekle"
                                  >
                                    <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPendingItemDeleteId(item.id)}
                                    className={quoteLineDeleteBtnClass}
                                    data-tone="danger"
                                    title="Satırı sil"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                                  </button>
                                  {openItemMenuId === item.id && (
                                    <div
                                      className={`absolute right-0 top-10 z-30 w-52 p-1.5 ${PAGE_FILTER_MENU_CLASS}`}
                                    >
                                      {[
                                        ['showDescription', 'Açıklama ekle'],
                                        ['showDiscount', 'İndirim ekle'],
                                        ['showExciseTax', 'ÖTV ekle'],
                                        ['showAccommodationTax', 'Konaklama vergisi ekle'],
                                      ]
                                        .filter(([field]) => !item[field])
                                        .map(([field, label]) => (
                                          <button
                                            key={field}
                                            type="button"
                                            data-tone="primary"
                                            onClick={() => enableItemOption(item.id, field)}
                                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-transform"
                                          >
                                            <Plus className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{label}</span>
                                          </button>
                                        ))}
                                      {item.showDiscount ? (
                                        <button
                                          type="button"
                                          data-tone="danger"
                                          onClick={() => {
                                            disableItemOption(item.id, 'showDiscount', {
                                              discountRate: 0,
                                            })
                                            setOpenItemMenuId(null)
                                          }}
                                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-red-400 transition-colors hover:bg-red-500/10"
                                        >
                                          <X className="h-3.5 w-3.5 shrink-0" />
                                          <span className="truncate">İndirimi kaldır</span>
                                        </button>
                                      ) : null}
                                      {item.showExciseTax ? (
                                        <button
                                          type="button"
                                          data-tone="danger"
                                          onClick={() => {
                                            disableItemOption(item.id, 'showExciseTax', {
                                              exciseTaxRate: 0,
                                            })
                                            setOpenItemMenuId(null)
                                          }}
                                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-red-400 transition-colors hover:bg-red-500/10"
                                        >
                                          <X className="h-3.5 w-3.5 shrink-0" />
                                          <span className="truncate">ÖTV kaldır</span>
                                        </button>
                                      ) : null}
                                      {item.showAccommodationTax ? (
                                        <button
                                          type="button"
                                          data-tone="danger"
                                          onClick={() => {
                                            disableItemOption(item.id, 'showAccommodationTax', {
                                              accommodationTaxRate: 0,
                                            })
                                            setOpenItemMenuId(null)
                                          }}
                                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-red-400 transition-colors hover:bg-red-500/10"
                                        >
                                          <X className="h-3.5 w-3.5 shrink-0" />
                                          <span className="truncate">Konaklama vergisini kaldır</span>
                                        </button>
                                      ) : null}
                                    </div>
                                  )}
                                  {pendingItemDeleteId === item.id && (
                                    <DeleteConfirmPopover
                                      title="Satır silinsin mi?"
                                      description="Bu satır kaldırılacak."
                                      confirmLabel="Evet"
                                      cancelLabel="Hayır"
                                      compact
                                      inline
                                      onConfirm={() => removeItem(item.id)}
                                      onCancel={() => setPendingItemDeleteId(null)}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                            {item.showDescription && (
                              <div
                                className={`mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-center ${quoteItemFieldGapClass}`}
                              >
                                <input
                                  value={item.extraDescription ?? ''}
                                  onChange={(event) =>
                                    updateItem(item.id, 'extraDescription', event.target.value)
                                  }
                                  placeholder="Satır açıklaması..."
                                  className="form-input"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    disableItemOption(item.id, 'showDescription', {
                                      extraDescription: '',
                                    })
                                  }
                                  className="inline-flex h-10 items-center justify-center gap-1 rounded-lg px-2 text-[12px] font-medium text-red-400 transition-colors hover:bg-red-500/10"
                                  title="Açıklamayı kaldır"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                      </div>
                    )
                  })}
                  {(selectedQuote.items || []).length === 0 && (
                    <div className="rounded-xl border border-dashed border-[var(--search-border)] px-4 py-6 text-center text-[14px] font-normal text-[var(--muted)]">
                      Henüz ürün eklenmedi. Ürün Ekle ile satır oluşturun.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addItem}
                    className={`${quoteMsCtaClass} w-full`}
                  >
                    <Plus className="h-4 w-4 text-[#2563eb]" strokeWidth={2.25} />
                    Ürün Ekle
                  </button>

                  {selectedTotals ? (
                    <div className="w-full pt-2">
                      <div className="ml-auto w-full max-w-[480px]">
                        <DocumentTotalsPanel totals={selectedTotals} onPatch={patchSelected} />
                      </div>
                    </div>
                  ) : null}
                </div>
              </AppPagePanel>

              <AppPagePanel className="customer-list-panel w-full">
                <DocumentTermsEditor
                  record={selectedQuote}
                  onPatch={patchSelected}
                  compact
                  hideTitle
                  alignDescriptionHeader
                  panelTitle="Teklif Koşulları :"
                  savedTermsTitle="Hazır Teklif Koşulları"
                  descriptionPlaceholder="Teklifin ödeme, teslimat, üretim veya özel açıklamalarını buraya yazın..."
                />
              </AppPagePanel>

              {selectedQuote && (
                <AppPagePanel className="customer-list-panel w-full">
                  <DocumentBankAccountsPanel quote={selectedQuote} onPatch={patchSelected} />
                </AppPagePanel>
              )}

              {selectedQuote && selectedTotals && (
                <section
                  ref={quotePreviewRef}
                  aria-hidden="true"
                  className="fixed left-[-10000px] top-0 w-[794px] overflow-hidden bg-white"
                  dangerouslySetInnerHTML={{
                    __html: buildQuoteDocumentInnerHtml({
                      quote: sanitizeQuoteForSave(selectedQuote),
                      customer: getQuoteCustomerDetails(selectedQuote),
                      company: readCompanySettings(),
                      settings: readQuotePrintSettings(),
                      rates,
                    }),
                  }}
                />
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

      {viewMode === 'list' ? (
        <QuoteDeletedArchivedPanel
          onRestored={() => setQuotes(loadQuotes())}
          emptyMessage="Silinen teklif yok."
        />
      ) : null}

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
