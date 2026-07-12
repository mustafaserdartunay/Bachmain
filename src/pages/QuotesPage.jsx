import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import SearchInput from '../components/Common/SearchInput'
import { jsPDF } from 'jspdf'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  Mail,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import ListHeaderRow from '../components/Common/ListHeaderRow'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import ListDeleteConfirmPanel, { DeleteConfirmPopover, DeleteTrashButton, LIST_PILL_CLASS, ListInlineDeleteConfirmPopover } from '../components/Common/ListDeleteConfirmPanel'
import NumericInput from '../components/Products/NumericInput'
import { formatTL } from '../utils/productPricing'
import { getCustomerDisplay } from '../utils/customerDisplay'
import { resolveCustomerContactInfo } from '../utils/customerContacts'
import { readOptionLists, saveOptionList, readCustomerMeta, getCustomerMetaSelection, getOptionLabels } from '../utils/customerMeta'
import EditableDropdownPill from '../components/EditableDropdownPill'
import { defaultQuoteStages, initialQuotes } from '../data/quotesData'
import { customers as customerData } from '../data/mockData'
import { getListCustomerDisplay } from '../data/customerProfiles'
import { sampleProducts, vatRates } from '../data/productsData'
import { createOrderFromQuote, loadOrders, updateOrder } from '../utils/ordersStore'
import { nextQuoteCode, resolveQuoteCode, sanitizeQuoteCode } from '../utils/documentCodes'
import { readVoiceQuoteOpenId, clearVoiceQuoteOpenId, softDeleteQuote } from '../utils/quotesStore'
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
import { documentTotals, itemTotals, safeNumber, sanitizeDocumentDiscountFields } from '../utils/documentTotals'
import { BTN_PRIMARY, BTN_SUCCESS } from '../utils/buttonStyles'
import DocumentActivityPanel from '../components/DocumentEditor/DocumentActivityPanel'
import DocumentTermsEditor from '../components/DocumentEditor/DocumentTermsEditor'
import DocumentTotalsPanel from '../components/DocumentEditor/DocumentTotalsPanel'
import DocumentBankAccountsPanel from '../components/DocumentEditor/DocumentBankAccountsPanel'
import WorkflowStagePanel from '../components/DocumentEditor/WorkflowStagePanel'
import ProcessPanelModule from '../components/DocumentEditor/ProcessPanelModule'
import { isReservedPlaceholderLabel, mapProcessOptions, matchProcessOption, optionsToProcessRecord, processRecordToOptions, resolveListColumnLabel } from '../components/DocumentEditor/processPanelUtils'
import { stageColors as processStageColors, getStageColumnSurfaceClasses } from '../components/DocumentEditor/stageColors'
import CustomerPicker, {
  DOCUMENT_SIDE_ACTION_WIDTH,
  findDocumentCustomer as findQuoteCustomer,
} from '../components/DocumentEditor/CustomerPicker'
import { documentDropdownMenuClass } from '../components/DocumentEditor/documentItemLayout'
import { readCompanySettings } from '../utils/companySettings'

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

function StageColorSwatches({ value, onChange, size = 'md', direction = 'horizontal', fill = false }) {
  const dotClass = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'
  const layoutClass = direction === 'vertical'
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

const quoteItemGridClass = 'grid-cols-[150px_minmax(0,1fr)]'
const quoteItemFieldsGridClass = 'grid-cols-[minmax(0,1.4fr)_110px_150px_110px_150px_92px]'
const quoteItemFieldGapClass = 'gap-x-4'

const statusClasses = {
  Taslak: 'badge-gray',
  Hazırlanıyor: 'badge-blue',
  'Müşteriye Gönderildi': 'badge-orange',
  'Revize İstendi': 'badge-purple',
  Onaylandı: 'badge-green',
  Reddedildi: 'badge-red',
}

const quoteListGrid = '118px 72px minmax(130px,1fr) 128px 128px 148px 118px 118px minmax(240px,auto)'
const quoteListProcessPillClass =
  'flex h-8 w-full min-w-0 items-center justify-between gap-1 rounded-lg border border-dark-500/50 bg-dark-700/70 px-2 py-1 text-[12px] font-bold transition-colors hover:bg-dark-700/80'
const filterAllOption = { label: 'Tümü', color: 'bg-gray-500' }
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
    return Array.isArray(parsed) ? parsed.map(normalizeQuoteStages) : initialQuotes.map(normalizeQuoteStages)
  } catch {
    return initialQuotes.map(normalizeQuoteStages)
  }
}

function saveQuotes(quotes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes))
    window.dispatchEvent(new CustomEvent('bach:quotes-updated'))
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
  const selectedIds = Array.isArray(quote.selectedBankAccountIds) ? quote.selectedBankAccountIds : []
  return selectedIds
    .map((accountId) => accounts.find((account) => account.id === accountId))
    .filter(Boolean)
}

function sanitizeQuoteForSave(quote) {
  const items = (quote.items || [])
    .map(sanitizeQuoteItem)
    .filter((item) => item.product || item.description || item.extraDescription || item.unitPrice > 0)

  return {
    ...quote,
    id: sanitizeQuoteCode(quote.id),
    title: safeText(quote.title),
    customer: safeText(quote.customer),
    contact: safeText(quote.contact),
    phone: safeText(quote.phone),
    email: safeText(quote.email),
    status: getOptionLabels('status').includes(quote.status) ? quote.status : (getOptionLabels('status')[0] || 'Taslak'),
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
  if (!safeQuote.customer) return { ok: false, message: 'Kaydetmeden önce müşteri seçin veya müşteri adı girin.' }
  if (!safeQuote.createdAt) return { ok: false, message: 'Oluşturma tarihi boş olamaz.' }
  if (!safeQuote.validUntil) return { ok: false, message: 'Geçerlilik tarihi boş olamaz.' }
  if (new Date(safeQuote.validUntil) < new Date(safeQuote.createdAt)) {
    return { ok: false, message: 'Geçerlilik tarihi oluşturma tarihinden önce olamaz.' }
  }
  if (safeQuote.items.length === 0) return { ok: false, message: 'Kaydetmeden önce en az bir ürün satırı seçin.' }
  const invalidItem = safeQuote.items.find((item) => !item.product || item.quantity <= 0)
  if (invalidItem) return { ok: false, message: 'Ürün satırlarında ürün adı ve adet bilgisi zorunludur.' }
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

function readImageFileAsDataUrl(file) {
  if (!file?.type?.startsWith('image/')) {
    return Promise.reject(new Error('Lütfen geçerli bir görsel dosyası seçin.'))
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Görsel okunamadı.'))
    reader.readAsDataURL(file)
  })
}

function getQuoteCustomerRepresentative(customer) {
  if (!customer) return ''
  return getCustomerMetaSelection(customer, readCustomerMeta()[customer.id] || {}).representative
    || customer.owner
    || ''
}

function getQuoteCustomerDetails(quote) {
  const matchedCustomer = findQuoteCustomer(quote.customer)
  const customer = matchedCustomer || customerData.list.find((item) => item.company === quote.customer)
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
  const terms = safeQuote.termsDescription ? `\n\nTeklif Koşulları:\n${safeQuote.termsDescription}` : ''

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
    ...(totals.showDocumentDiscount ? [`Toplam İndirim: ${formatTL(totals.documentDiscount)}`] : []),
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
  const rows = safeQuote.items.map((item, index) => {
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
  }).join('')

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
            ${bankAccounts.length > 0 ? `
              <div class="terms">
                <div class="label">Banka Hesapları</div>
                ${bankAccounts.map((account) => `
                  <p style="margin:8px 0 0; font-size:13px; font-weight:700;">
                    ${escapeHtml(account.bankName)}${account.label ? ` · ${escapeHtml(account.label)}` : ''}
                  </p>
                  ${account.branch ? `<p style="margin:4px 0 0; font-size:12px; color:#64748b;">Şube: ${escapeHtml(account.branch)}</p>` : ''}
                  ${account.iban ? `<p style="margin:4px 0 0; font-size:12px; color:#64748b;">IBAN: ${escapeHtml(account.iban)}</p>` : ''}
                `).join('')}
              </div>
            ` : ''}
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

function formatListDateTime(value) {
  if (!value) return ''
  const raw = String(value).trim()
  const trMatch = raw.match(/^(\d{2}\.\d{2}\.\d{4})(?:[, ]+\s*(\d{1,2}:\d{2}))/)
  if (trMatch) return trMatch[2] ? `${trMatch[1]} ${trMatch[2]}` : trMatch[1]

  const formattedDate = formatListDate(raw.split(/[T ]/)[0] || raw)
  const timePart = raw.includes('T') ? raw.split('T')[1] : raw.split(' ')[1]
  if (!timePart || !timePart.includes(':')) return formattedDate
  const [hours, minutes] = timePart.split(':')
  if (!hours || !minutes) return formattedDate
  return `${formattedDate} ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

function TurkishLiraIcon({ className = '' }) {
  return <span className={`${className} flex items-center justify-center text-base font-black leading-none`}>₺</span>
}

function Panel({ title, description, children, action }) {
  return (
    <section className="card">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-base font-bold text-white">{label}</label>
      {children}
    </div>
  )
}

function FieldLabelSpacer({ label = 'Alan' }) {
  return <label className="mb-2 block text-base font-bold text-white opacity-0" aria-hidden>{label}</label>
}

function ProductSearchSelect({ item, onSelect, onTextChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef(null)
  const query = item.product || ''
  const normalizedQuery = query.trim().toLowerCase()
  const filteredProducts = normalizedQuery
    ? sampleProducts.filter((product) => (
      [product.name, product.stockCode, product.barcode, product.productCode]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    ))
    : sampleProducts

  useEffect(() => {
    if (!isOpen) return undefined

    function handleOutsideClick(event) {
      if (!pickerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  function selectProduct(product) {
    onSelect(product.name)
    setIsOpen(false)
  }

  return (
    <div ref={pickerRef} className="relative">
      <SearchInput
        value={query}
        onChange={(event) => {
          onTextChange(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Ürün adı, ürün kodu veya barkod ara..."
      />
      {isOpen && (
        <div className={`absolute left-0 right-0 top-11 z-40 ${documentDropdownMenuClass}`}>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => selectProduct(product)}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-blue-500/15"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{product.name}</p>
                  <p className="truncate text-[13px] font-semibold text-gray-500">
                    {product.stockCode || product.productCode || 'Kod yok'} · Barkod: {product.barcode || 'Yok'}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-emerald-500/10 px-2 py-1 text-[12px] font-black text-emerald-300">
                  KDV hariç {formatTL(product.salesPriceExcl || product.purchasePriceExcl || 0)}
                </span>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="rounded-xl border border-dashed border-dark-500/70 px-3 py-4 text-center text-xs font-semibold text-gray-500">
                Ürün adı, ürün kodu veya barkod ile eşleşen ürün bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function QuotePriorityEditor({
  quote,
  onPatch,
  optionLists,
  updateOptionList,
  compact = false,
}) {
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
        color: chosenColor || processStageColors[optionLists.priority.length % processStageColors.length],
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
    updateOptionList('priority', mapProcessOptions(optionLists.priority, stage, (option) => ({ ...option, color })))
  }

  function updateLabel(stage, label) {
    const clean = label.trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return
    updateOptionList('priority', mapProcessOptions(optionLists.priority, stage, (option) => ({ ...option, label: clean })))
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
    const nextText = currentText.trim()
      ? `${currentText.trimEnd()}\n- ${term}`
      : `- ${term}`
    onPatch({ termsDescription: nextText })
  }

  function deleteSavedTerm(term) {
    const nextTerms = savedTerms.filter((item) => item !== term)
    setSavedTerms(nextTerms)
    saveSavedQuoteTerms(nextTerms)
    setPendingDeleteTerm(null)
  }

  return (
    <div className={compact ? '' : 'col-span-2 rounded-3xl border border-dark-500/45 bg-dark-900/35 p-4'}>
      {!compact && (
        <div className="mb-4 text-center">
          <h3 className="text-base font-bold text-white">Teklif Koşulları</h3>
        </div>
      )}
      {compact && (
        <p className="mb-4 text-base font-bold text-white">Teklif Koşulları</p>
      )}
      <div className={compact
        ? 'space-y-3'
        : 'grid grid-cols-[minmax(0,1fr)_390px] items-stretch gap-4'}>
        <div className={`flex flex-col rounded-2xl border border-dark-500/45 bg-dark-800/70 p-3 ${compact ? 'min-h-[180px]' : 'h-[332px]'}`}>
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

        <div className={`flex flex-col rounded-2xl border border-dark-500/45 bg-dark-800/70 p-3 ${compact ? 'min-h-[220px]' : 'h-[332px]'}`}>
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
            )
          }
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
          ? 'h-[38px] rounded-lg border border-red-500/30 px-3 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10'
          : `${BTN_PRIMARY} h-[38px] gap-1.5 px-3 text-xs`
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
    const second = window.confirm(`Son onay: "${stage.label}" süreci tekliften kaldırılacak. Devam edilsin mi?`)
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
          const activeIndex = (quote.stages || []).findIndex((item) => item.id === quote.currentStageId)
          const isDone = index < activeIndex
          const isActive = stage.id === quote.currentStageId
          return (
            <div
              key={stage.id}
              className={`relative rounded-2xl border p-3 transition-all ${
                isActive ? 'border-accent-blue bg-blue-500/10 shadow-lg' : 'border-dark-500/50 bg-dark-700/35'
              }`}
            >
              <button
                type="button"
                onClick={() => onUpdateStages(quote.stages, stage.id)}
                className="w-full text-left"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full ${stage.color} text-xs font-bold text-white`}>
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className={`text-xs font-semibold ${isActive ? 'text-accent-blue' : 'text-white'}`}>{stage.label}</span>
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
  const [openItemMenuId, setOpenItemMenuId] = useState(null)
  const [pendingItemDeleteId, setPendingItemDeleteId] = useState(null)
  const [openSaveMenu, setOpenSaveMenu] = useState(false)
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
  const quotePreviewRef = useRef(null)
  const syncedCustomerKeyRef = useRef('')

  const selectedQuote = draftQuote || quotes.find((quote) => quote.id === selectedId) || quotes[0] || null
  const selectedTotals = selectedQuote ? documentTotals(selectedQuote) : null
  const isDraftQuote = Boolean(draftQuote)
  const resolvedQuoteCode = useMemo(() => (
    resolveQuoteCode(selectedQuote?.id, quotes.map((quote) => quote.id))
  ), [selectedQuote?.id, quotes])
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
  const quoteStageDropdownOptions = toStageDropdownOptions(quoteStageOptions)
  const quoteStageFilterOptions = [filterAllOption, ...quoteStageDropdownOptions]
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
    if (contactInfo.contactName && selectedQuote.contact !== contactInfo.contactName) patch.contact = contactInfo.contactName
    if (contactInfo.email && selectedQuote.email !== contactInfo.email) patch.email = contactInfo.email
    if (contactInfo.phone && selectedQuote.phone !== contactInfo.phone) patch.phone = contactInfo.phone
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

    const reloaded = loadQuotes().map((quote) => (
      quote.id === selectedQuote.id ? { ...quote, ...patch } : quote
    ))
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
      const next = current.map((quote) => (
        quote.id === selectedQuote.id ? { ...quote, ...patch } : quote
      ))
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
    if (workflowStatus === 'Sipariş Alındı' || String(workflowStatus || '').startsWith('Sipariş Alındı')) {
      const ok = window.confirm(`"${quote.customer || quote.id}" teklifi siparişe aktarılsın mı? Teklif kaydı teklifler listesinde kalacak.`)
      if (!ok) return
      const orderStage = orderStageOptions.find((item) => isOrderReceivedStage(item))
        || { id: 'stage-8', label: workflowStatus }
      transferQuoteToOrder(quote, orderStage)
      return
    }

    const activityText = workflowStatus === 'Teklif'
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
    const orderStage = stage
      || orderStageOptions.find((item) => isOrderReceivedStage(item))
      || { id: 'stage-8', label: 'Sipariş Alındı' }

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

  function handleCreateOrderFromList(quote, event) {
    event?.stopPropagation?.()
    if (Boolean(quote.orderId) || linkedOrderQuoteIds.has(quote.id)) return
    transferQuoteToOrder(quote)
  }

  function setQuoteStage(quote, stage) {
    if (isOrderReceivedStage(stage)) {
      const ok = window.confirm(`"${quote.customer || quote.id}" teklifi siparişe aktarılsın mı? Teklif kaydı teklifler listesinde kalacak.`)
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
      activities: [{ id: createId('act'), date: new Date().toLocaleString('tr-TR'), text: 'Yeni teklif oluşturuldu.' }],
    }
  }

  function addQuote() {
    const next = createQuoteDraft()
    setDraftQuote(next)
    setSelectedId(next.id)
    setViewMode('prepare')
  }

  useEffect(() => {
    if (searchParams.get('yeni') !== '1') return
    const freshQuotes = loadQuotes()
    const next = createQuoteDraft(freshQuotes)
    setQuotes(freshQuotes)
    setDraftQuote(next)
    setSelectedId(next.id)
    setViewMode('prepare')
    navigate('/teklifler', { replace: true })
  }, [searchParams, navigate])

  function saveCurrentQuote({ startNew = false, returnToList = false } = {}) {
    if (!selectedQuote) return
    const validation = validateQuoteForSave(selectedQuote)
    if (!validation.ok) {
      window.alert(validation.message)
      return
    }

    const existingQuote = quotes.find((quote) => quote.id === selectedQuote.id)
    const code = sanitizeQuoteCode(validation.quote.id) || nextQuoteCode(quotes.map((quote) => quote.id))
    if (quotes.some((quote) => quote.id === code && quote.id !== selectedQuote.id)) {
      window.alert('Bu teklif kodu zaten kullanılıyor.')
      return
    }

    let safeQuote = {
      ...(existingQuote || {}),
      ...validation.quote,
      id: code,
      activities: [
        ...(validation.quote.activities || []),
        {
          id: createId('act'),
          date: new Date().toLocaleString('tr-TR'),
          text: existingQuote ? 'Teklif güncellenerek kaydedildi.' : 'Teklif güvenli kontrollerden geçirilerek kaydedildi.',
        },
      ],
    }

    const nextQuotes = [safeQuote, ...quotes.filter((quote) => quote.id !== safeQuote.id && quote.id !== selectedQuote.id)]
    const saved = updateQuotes(nextQuotes)
    if (!saved) return

    setOpenSaveMenu(false)

    if (startNew) {
      const nextDraft = createQuoteDraft(nextQuotes)
      setDraftQuote(nextDraft)
      setSelectedId(nextDraft.id)
      setViewMode('prepare')
      window.alert('Teklif kaydedildi. Yeni teklif ekranı açıldı.')
      return
    }

    setDraftQuote(null)
    setSelectedId(safeQuote.id)

    if (returnToList) {
      setViewMode('list')
      window.alert('Değişiklikleriniz kaydedildi.')
      return
    }

    window.alert(existingQuote ? 'Değişiklikleriniz kaydedildi.' : 'Teklif başarıyla kaydedildi.')
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
      const { blob, filename, file } = await createQuotePdfFile(quotePreviewRef.current, safeQuote.id)
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          title: `${safeQuote.id} Fiyat Teklifi`,
          text: 'PDF kalitesinde teklif sunumu ekte.',
          files: [file],
        })
        return
      }

      downloadBlob(blob, filename)
      window.alert('Tarayıcınız WhatsApp’a dosyayı otomatik eklemeyi desteklemiyor. Aynı PDF indirildi; açılan WhatsApp sohbetine bu PDF dosyasını ek olarak seçip gönderebilirsiniz.')
      const message = encodeURIComponent(`Merhaba, ${safeQuote.id} numaralı PDF teklif sunumunu iletiyorum. PDF dosyasını bu sohbete ek olarak gönderiyorum.`)
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
      const body = encodeURIComponent(`${buildQuoteShareText(safeQuote)}\n\nNot: Aynı premium PDF teklif dosyası indirildi. Lütfen e-postaya ek olarak "${filename}" dosyasını ekleyiniz.`)
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
    const nextFullStages = mergeQuoteStagesIntoWorkflow(currentStages, appendQuoteStage(quoteStages, nextStage))
    addSelectedActivity(`Yeni süreç eklendi ve aktif edildi: "${label}".`, {
      stages: nextFullStages,
      currentStageId: nextStage.id,
    })
    setStageInput('')
  }

  function updateQuoteStageColor(stage, color) {
    if (!selectedQuote) return
    const currentStages = loadWorkflowStages()
    const quoteStages = getQuoteStageOptions(currentStages).map((item) => (
      item.id === stage.id ? { ...item, color } : item
    ))
    patchSelected({ stages: mergeQuoteStagesIntoWorkflow(currentStages, quoteStages) })
  }

  function updateQuoteStageLabel(stage, label) {
    if (!selectedQuote || isReservedPlaceholderLabel(label)) return
    const cleanLabel = String(label || '').trim()
    if (!cleanLabel) return
    const currentStages = loadWorkflowStages()
    const quoteStages = getQuoteStageOptions(currentStages).map((item) => (
      item.id === stage.id ? { ...item, label: cleanLabel } : item
    ))
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
    const ok = window.confirm(`Son onay: "${stage.label}" süreci tekliften kaldırılacak. Devam edilsin mi?`)
    if (!ok) return
    const currentStages = loadWorkflowStages()
    const nextQuoteStages = getQuoteStageOptions(currentStages).filter((item) => item.id !== stage.id)
    addSelectedActivity(`Süreç silindi: "${stage.label}".`, {
      stages: mergeQuoteStagesIntoWorkflow(currentStages, nextQuoteStages),
      currentStageId: selectedQuote.currentStageId === stage.id
        ? (nextQuoteStages[0]?.id || '')
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
    const orderStages = getOrderStageOptions(currentStages).map((item) => (
      item.id === stage.id ? { ...item, color } : item
    ))
    patchSelected({ stages: mergeOrderStagesIntoWorkflow(currentStages, orderStages) })
  }

  function updateQuoteOrderStageLabel(stage, label) {
    if (!selectedQuote || isReservedPlaceholderLabel(label)) return
    const cleanLabel = String(label || '').trim()
    if (!cleanLabel) return
    const currentStages = loadWorkflowStages()
    const orderStages = getOrderStageOptions(currentStages).map((item) => (
      item.id === stage.id ? { ...item, label: cleanLabel } : item
    ))
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
    const ok = window.confirm(`Son onay: "${stage.label}" sipariş sürecinden kaldırılacak. Devam edilsin mi?`)
    if (!ok) return
    const currentStages = loadWorkflowStages()
    const nextOrderStages = getOrderStageOptions(currentStages).filter((item) => item.id !== stage.id)
    addSelectedActivity(`Sipariş süreci silindi: "${stage.label}".`, {
      stages: mergeOrderStagesIntoWorkflow(currentStages, nextOrderStages),
      currentStageId: selectedQuote.currentStageId === stage.id
        ? (nextOrderStages[0]?.id || '')
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
          return { ...item, discountRate: value, showDiscount: value > 0 ? true : item.showDiscount }
        }
        return { ...item, [field]: value }
      }),
    })
  }

  function selectProductForItem(id, productName) {
    const product = sampleProducts.find((item) => item.name === productName)
    patchSelected({
      items: selectedQuote.items.map((item) => item.id === id
        ? {
          ...item,
          product: productName,
          description: product?.notes || item.description || '',
          unitPrice: Number(product?.salesPriceExcl || product?.purchasePriceExcl || item.unitPrice || 0),
          vatRate: Number(product?.vatRate ?? item.vatRate ?? 20),
        }
        : item),
    })
  }

  function enableItemOption(id, option) {
    updateItem(id, option, true)
    setOpenItemMenuId(null)
  }

  function disableItemOption(id, option, resetPatch = {}) {
    patchSelected({
      items: selectedQuote.items.map((item) => item.id === id ? { ...item, [option]: false, ...resetPatch } : item),
    })
  }

  async function uploadItemLineImage(id, file) {
    if (!file) return
    try {
      const dataUrl = await readImageFileAsDataUrl(file)
      updateItem(id, 'lineImage', dataUrl)
    } catch (error) {
      window.alert(error.message)
    }
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
      const second = window.confirm(`Son onay: "${quoteName}" teklifi silinenlere taşınacak (geri alınabilir). Devam edilsin mi?`)
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

  const filteredQuotes = quotes.filter((quote) => {
    const quoteProcess = resolveQuoteProcessRecord(quote, workflowStages)
    const q = searchQuery.toLowerCase()
    const matchesSearch = !q
      || (quote.id || '').toLowerCase().includes(q)
      || (quote.title || '').toLowerCase().includes(q)
      || (quote.customer || '').toLowerCase().includes(q)
      || (quote.contact || '').toLowerCase().includes(q)
      || (quote.tags || []).some((tag) => tag.toLowerCase().includes(q))
    const matchesPriority = filters.priority === 'Tümü' || quote.priority === filters.priority
    const matchesStatus = filters.status === 'Tümü' || quote.status === filters.status
    const matchesStage = filters.stage === 'Tümü' || quoteProcess.activeStage?.label === filters.stage
    return matchesSearch && matchesPriority && matchesStatus && matchesStage
  }).sort((a, b) => {
    if (sortMode === 'date') return getQuoteSortDate(b) - getQuoteSortDate(a)
    if (sortMode === 'name') return (a.customer || '').localeCompare(b.customer || '', 'tr')
    if (sortMode === 'price') return documentTotals(b).grandTotal - documentTotals(a).grandTotal
    return getQuoteSortDate(b) - getQuoteSortDate(a)
  })

  const orderReceivedQuotes = filteredQuotes.filter((quote) => {
    const activeStage = resolveListQuoteStage(quote)
    return Boolean(quote.orderId) || isOrderReceivedStage(activeStage)
  })

  const summary = {
    total: filteredQuotes.length,
    sent: filteredQuotes.filter((quote) => quote.status === 'Müşteriye Gönderildi').length,
    approved: filteredQuotes.filter((quote) => quote.status === 'Onaylandı').length,
    totalNet: orderReceivedQuotes.reduce((sum, quote) => sum + documentTotals(quote).net, 0),
    totalAmount: orderReceivedQuotes.reduce((sum, quote) => sum + documentTotals(quote).grandTotal, 0),
  }

  return (
    <div className="space-y-5">
      <div className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
        <div className="flex justify-center">
          <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">
            {viewMode === 'prepare'
              ? (isDraftQuote ? 'Yeni Teklif Oluştur' : 'Teklif Düzenle')
              : 'Teklif Yönetimi'}
          </h1>
        </div>
        {viewMode === 'list' ? (
          <button onClick={addQuote} className="btn-primary absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 px-4 py-2.5 text-sm">
            <Plus className="h-4 w-4" /> Yeni Teklif
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={returnToQuoteList}
              className="absolute left-5 top-1/2 inline-flex -translate-y-1/2 items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-bold text-gray-300 transition-colors hover:bg-dark-700 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Teklif listesine dön
            </button>
            <div className="absolute right-5 top-1/2 -translate-y-1/2" data-quote-dropdown>
              <div className="inline-flex items-stretch overflow-hidden rounded-xl shadow-lg shadow-emerald-900/25">
                <button
                  type="button"
                  onClick={() => saveCurrentQuote({ returnToList: true })}
                  disabled={!selectedQuote}
                  className="btn-success inline-flex h-10 items-center justify-center rounded-none px-4 text-sm font-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    setOpenSaveMenu((open) => {
                      if (open) setPendingHeaderQuoteDelete(false)
                      return !open
                    })
                  }}
                  disabled={!selectedQuote}
                  className="btn-success inline-flex h-10 w-10 items-center justify-center rounded-none border-l border-white/25 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  title="Kaydet seçenekleri"
                  aria-expanded={openSaveMenu}
                  aria-haspopup="menu"
                >
                  <ChevronRight className={`h-4 w-4 transition-transform ${openSaveMenu ? '-rotate-90' : 'rotate-90'}`} />
                </button>
              </div>
              {openSaveMenu && (
                <div className="absolute right-0 top-12 z-40 w-56 rounded-2xl border border-dark-500 bg-dark-900 p-2 text-left shadow-card" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => saveCurrentQuote({ startNew: true })}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-xs font-bold text-gray-200 transition-colors hover:bg-blue-500/15 hover:text-white"
                  >
                    Kaydet ve Yeni Ekle
                  </button>
                  <div className="my-1 border-t border-dark-500/40" />
                  {pendingHeaderQuoteDelete ? (
                    <ListDeleteConfirmPanel
                      title="Teklif silinsin mi?"
                      description="Bu işlem geri alınamaz. Teklif kalıcı olarak silinir."
                      onConfirm={() => deleteQuote(selectedQuote, { navigateToList: true, skipConfirm: true })}
                      onCancel={() => setPendingHeaderQuoteDelete(false)}
                    />
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setPendingHeaderQuoteDelete(true)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/15 hover:text-red-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Teklifi Sil
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {viewMode === 'list' && (
        <SummaryMetrics
          items={[
            { title: 'Toplam Teklif', value: summary.total, icon: ClipboardList },
            { title: 'Gönderilen', value: summary.sent, icon: Send, tone: 'orange', valueTone: 'orange' },
            { title: 'Onaylanan', value: summary.approved, icon: CheckCircle2, tone: 'emerald', valueTone: 'emerald' },
            { title: 'Toplam KDV Hariç', value: `${formatTL(summary.totalNet)}`, icon: TurkishLiraIcon, tone: 'purple', valueTone: 'red' },
            { title: 'Toplam KDV Dahil', value: `${formatTL(summary.totalAmount)}`, icon: TurkishLiraIcon, tone: 'orange', valueTone: 'emerald' },
          ]}
        />
      )}

      {viewMode === 'list' ? (
        <Panel
          title="Teklif Listesi"
          action={<span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">{filteredQuotes.length} kayıt</span>}
        >
          <div className="mb-4 space-y-3">
            <SearchInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Teklif kodu, müşteri, yetkili veya etiket ara..."
            />
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/70 p-3 lg:grid-cols-4">
              <div>
                <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-gray-500">Öncelik</p>
                <EditableDropdownPill
                  value={filters.priority}
                  options={quotePriorityFilterOptions}
                  includePlaceholderOption={false}
                  editable={false}
                  buttonClassName={LIST_PILL_CLASS}
                  openKey="filter-priority"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateFilter('priority', value)}
                />
              </div>
              <div>
                <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-gray-500">Teklif Durumu</p>
                <EditableDropdownPill
                  value={filters.status}
                  options={quoteStatusFilterOptions}
                  includePlaceholderOption={false}
                  editable={false}
                  buttonClassName={LIST_PILL_CLASS}
                  openKey="filter-status"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateFilter('status', value)}
                />
              </div>
              <div>
                <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-gray-500">Teklif Süreci</p>
                <EditableDropdownPill
                  value={filters.stage}
                  options={quoteStageFilterOptions}
                  includePlaceholderOption={false}
                  editable={false}
                  buttonClassName={LIST_PILL_CLASS}
                  openKey="filter-stage"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => updateFilter('stage', value)}
                />
              </div>
              <div>
                <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-gray-500">Sıralama</p>
                <EditableDropdownPill
                  value={sortLabelByMode[sortMode] || 'Son işleme göre'}
                  options={sortFilterOptions}
                  includePlaceholderOption={false}
                  editable={false}
                  buttonClassName={LIST_PILL_CLASS}
                  openKey="filter-sort"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  onChange={(value) => setSortMode(sortModeByLabel[value] || 'latest')}
                />
              </div>
            </div>
          </div>

          <ListHeaderRow
            gridTemplate={quoteListGrid}
            columns={[
              'Tarih',
              'Kod',
              'Müşteri Adı',
              'Öncelik',
              'Teklif Durumu',
              'Teklif Süreci',
              { label: 'KDV Hariç', align: 'right', className: 'pr-2' },
              { label: 'KDV Dahil', align: 'right', className: 'pr-2' },
            ]}
          />

          <div className="mt-3 space-y-2 overflow-visible">
            {filteredQuotes.map((quote) => {
              const totals = documentTotals(quote)
              const workflowStage = resolveListQuoteStage(quote)
              const quoteProcess = resolveQuoteProcessRecord(quote, workflowStages)
              const isOrderTransferred = Boolean(quote.orderId) || isOrderReceivedStage(workflowStage)
              const orderCreated = isOrderTransferred || linkedOrderQuoteIds.has(quote.id)
              const stageColumnSurface = isOrderTransferred && workflowStage
                ? getStageColumnSurfaceClasses(workflowStage)
                : ''
              const customerDisplay = getListCustomerDisplay(quote.customer)
              return (
                <div
                  key={quote.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => editQuote(quote.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') editQuote(quote.id)
                  }}
                  className="relative grid cursor-pointer items-center gap-2 rounded-2xl border border-dark-500/45 bg-dark-800/55 px-3 py-3 transition-all hover:border-blue-500/35 hover:bg-dark-700/60"
                  style={{ gridTemplateColumns: quoteListGrid }}
                >
                  <div className="min-w-0 text-left">
                    <p className="text-left text-xs font-semibold text-gray-500">{formatListDateTime(getQuoteListDateSource(quote))}</p>
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-left text-xs font-black tabular-nums text-blue-300">
                      {resolveQuoteCode(quote.id, quotes.map((item) => item.id))}
                    </p>
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="flex min-w-0 items-center justify-start gap-2 text-left text-sm font-black text-white">
                      <span className="shrink-0 truncate">{customerDisplay.brandShortName || 'Müşteri girilmedi'}</span>
                      {customerDisplay.companyTitle && (
                        <span className="inline-flex min-w-0 items-center rounded-lg border border-dark-500/45 bg-dark-700/60 px-2 py-0.5 text-[12px] font-black text-gray-400">
                          <span className="truncate">{customerDisplay.companyTitle}</span>
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="min-w-0 text-left" onClick={(event) => event.stopPropagation()}>
                    <EditableDropdownPill
                      value={resolveListColumnLabel(quote.priority, optionLists.priority)}
                      options={optionLists.priority}
                      editable={false}
                      buttonClassName={quoteListProcessPillClass}
                      openKey={`${quote.id}-priority`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onChange={(value) => handleQuotePriorityChange(quote, value)}
                    />
                  </div>
                  <div className="min-w-0 text-left" onClick={(event) => event.stopPropagation()}>
                    <EditableDropdownPill
                      value={resolveListColumnLabel(quote.status, optionLists.status)}
                      options={optionLists.status}
                      editable={false}
                      buttonClassName={quoteListProcessPillClass}
                      openKey={`${quote.id}-status`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onChange={(value) => handleQuoteStatusChange(quote, value)}
                    />
                  </div>
                  <div
                    className={`min-w-0 text-left rounded-xl transition-colors ${stageColumnSurface ? `${stageColumnSurface} px-1` : ''}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <EditableDropdownPill
                      value={quoteProcess.activeStage?.label || quoteStageDropdownOptions[0]?.label || ''}
                      options={quoteStageDropdownOptions}
                      editable={false}
                      buttonClassName={
                        stageColumnSurface
                          ? `${quoteListProcessPillClass} border-transparent bg-transparent hover:bg-black/10`
                          : quoteListProcessPillClass
                      }
                      openKey={`${quote.id}-stage`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onChange={(value) => handleQuoteStageLabelChange(quote, value)}
                    />
                  </div>
                  <p className="min-w-0 pr-2 text-right text-sm font-bold text-gray-200">{formatTL(totals.net)}</p>
                  <p className="min-w-0 pr-2 text-right text-sm font-black text-white">{formatTL(totals.grandTotal)}</p>
                  <div className="relative z-10 flex h-9 w-full items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      disabled={orderCreated}
                      onClick={(event) => handleCreateOrderFromList(quote, event)}
                      className={`whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[12px] font-bold transition-colors disabled:cursor-default ${
                        orderCreated
                          ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400/90'
                          : 'border-blue-500/25 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
                      }`}
                    >
                      {orderCreated ? 'Sipariş Oluşturuldu' : 'Sipariş Oluştur'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(quote.id)}
                      className={`rounded-lg border border-red-500/25 bg-red-500/10 p-2 text-red-300 transition-colors hover:bg-red-500/20 ${pendingDeleteId === quote.id ? 'pointer-events-none invisible' : ''}`}
                      title="Sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {pendingDeleteId === quote.id && (
                      <ListInlineDeleteConfirmPopover
                        onConfirm={() => {
                          deleteQuote(quote, { skipConfirm: true })
                          setPendingDeleteId(null)
                        }}
                        onCancel={() => setPendingDeleteId(null)}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {filteredQuotes.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-dark-500/60 bg-dark-800/40 p-8 text-center">
              <ClipboardList className="mx-auto mb-3 h-8 w-8 text-gray-600" />
              <p className="text-sm font-bold text-white">Teklif bulunamadı.</p>
              <p className="mt-1 text-xs text-gray-500">Arama veya filtreleri değiştirin.</p>
            </div>
          )}
        </Panel>
      ) : (
        <div className="space-y-5">
          {selectedQuote && (
            <>
              <div className="grid grid-cols-12 gap-4">
                <section className="col-span-12 rounded-3xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 flex gap-3">
                      <div className="relative min-w-0 flex-1">
                        <Field label="Teklif Başlığı">
                          <input value={selectedQuote.title} onChange={(e) => patchSelected({ title: e.target.value })} className="form-input" />
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
                    <CustomerPicker quote={selectedQuote} onPatch={patchSelected} />
                    <Field label="Oluşturma Tarihi"><input type="date" value={selectedQuote.createdAt || todayIsoDate()} onChange={(e) => patchSelected({ createdAt: e.target.value })} className="form-input" /></Field>
                    <Field label="Geçerlilik Tarihi"><input type="date" value={selectedQuote.validUntil || defaultValidUntilDate(selectedQuote.createdAt || todayIsoDate())} onChange={(e) => patchSelected({ validUntil: e.target.value })} className="form-input" /></Field>
                  </div>
                </section>
              </div>

              <section className="rounded-3xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
                <QuoteProcessManagement
                  quote={selectedQuote}
                  onPatch={patchSelected}
                  optionLists={optionLists}
                  updateOptionList={updateOptionList}
                  quoteStageRecord={quoteStageRecord}
                  isStageEditorOpen={isStageEditorOpen}
                  toggleStageEditor={toggleStageEditor}
                  stageInput={stageInput}
                  setStageInput={setStageInput}
                  onAddQuoteStage={addQuoteStage}
                  onSelectQuoteStage={selectQuoteStageInEditor}
                  onUpdateQuoteStageColor={updateQuoteStageColor}
                  onUpdateQuoteStageLabel={updateQuoteStageLabel}
                  onReorderQuoteStages={reorderQuoteStages}
                  pendingStageDeleteId={pendingStageDeleteId}
                  setPendingStageDeleteId={setPendingStageDeleteId}
                  onRemoveQuoteStage={removeQuoteStage}
                />
              </section>

              <section className="rounded-3xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white">Ürün Seçimi</h2>
                  </div>
                  <MiniButton onClick={addItem}>Ürün Ekle</MiniButton>
                </div>
                <div className="space-y-3">
                  {(selectedQuote.items || []).map((item) => {
                    const totals = itemTotals(item)
                    const hasTaxExtras = item.showDiscount || item.showExciseTax || item.showAccommodationTax
                    return (
                      <div key={item.id} className="rounded-3xl border border-dark-500/45 bg-dark-700/30 p-4">
                        <div className={`grid ${quoteItemGridClass} ${quoteItemFieldGapClass} items-start`}>
                          <div className="flex flex-col self-start">
                            <label className="mb-2 block shrink-0 text-base font-bold text-white">Görsel</label>
                            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-dashed border-blue-500/25 bg-dark-800/40">
                              {item.lineImage ? (
                                <>
                                  <img src={item.lineImage} alt="" className="h-full w-full object-cover object-center" />
                                  <button
                                    type="button"
                                    onClick={() => updateItem(item.id, 'lineImage', '')}
                                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/90 text-white shadow-lg transition-colors hover:bg-red-400"
                                    title="Görseli kaldır"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : (
                                <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 px-3 py-4 text-center transition-colors hover:bg-blue-500/5">
                                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10 text-blue-300">
                                    <Upload className="h-5 w-5" />
                                  </span>
                                  <span className="text-xs font-bold text-gray-400">Görsel Yükle</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) => {
                                      uploadItemLineImage(item.id, event.target.files?.[0])
                                      event.target.value = ''
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                          <div className="flex min-h-0 flex-col gap-3 self-stretch">
                          <div className={`grid ${quoteItemFieldsGridClass} ${quoteItemFieldGapClass} items-end`}>
                          <Field label="Ürün">
                            <ProductSearchSelect
                              item={item}
                              onSelect={(productName) => selectProductForItem(item.id, productName)}
                              onTextChange={(value) => updateItem(item.id, 'product', value)}
                            />
                          </Field>
                          <Field label="Adet">
                            <NumericInput value={item.quantity} onChange={(value) => updateItem(item.id, 'quantity', value)} />
                          </Field>
                          <Field label="Birim Fiyat">
                            <NumericInput value={item.unitPrice} onChange={(value) => updateItem(item.id, 'unitPrice', value)} suffix="₺" formatMode="price" />
                          </Field>
                          <Field label="KDV %">
                            <select value={item.vatRate ?? 20} onChange={(event) => updateItem(item.id, 'vatRate', Number(event.target.value))} className="form-input">
                              {vatRates.map((rate) => <option key={rate} value={rate}>{rate}</option>)}
                            </select>
                          </Field>
                          <Field label="Toplam">
                            <div className="flex h-[38px] items-center justify-end rounded-xl bg-emerald-500/10 px-3 text-sm font-black tabular-nums text-white">
                              {formatTL(totals.total)}
                            </div>
                          </Field>
                          <div className="relative">
                            <FieldLabelSpacer label="İşlem" />
                            <div className={`flex h-[38px] items-center ${quoteItemFieldGapClass}`} data-quote-dropdown>
                            <button
                              type="button"
                              onClick={() => setOpenItemMenuId(openItemMenuId === item.id ? null : item.id)}
                              className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10 text-blue-300 transition-colors hover:bg-blue-500/20"
                              title="Satıra alan ekle"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingItemDeleteId(item.id)}
                              className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 transition-colors hover:bg-red-500/20"
                              title="Satırı sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            {openItemMenuId === item.id && (
                              <div className={`absolute right-0 top-12 z-30 w-56 ${documentDropdownMenuClass}`}>
                                {[
                                  ['showDescription', 'Açıklama ekle'],
                                  ['showDiscount', 'İndirim ekle'],
                                  ['showExciseTax', 'ÖTV ekle'],
                                  ['showAccommodationTax', 'Konaklama vergisi ekle'],
                                ].filter(([field]) => field !== 'showDescription' || !item.showDescription).map(([field, label]) => (
                                  <button
                                    key={field}
                                    type="button"
                                    onClick={() => enableItemOption(item.id, field)}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-gray-300 transition-colors hover:bg-blue-500/15 hover:text-white"
                                  >
                                    <Plus className="h-3.5 w-3.5 text-blue-300" /> {label}
                                  </button>
                                ))}
                              </div>
                            )}
                            {pendingItemDeleteId === item.id && (
                              <DeleteConfirmPopover
                                onConfirm={() => removeItem(item.id)}
                                onCancel={() => setPendingItemDeleteId(null)}
                                className="absolute right-0 top-12 z-40"
                              />
                            )}
                            </div>
                          </div>
                          </div>
                          {(item.showDiscount || item.showExciseTax || item.showAccommodationTax) && (
                            <div className={`grid grid-cols-2 ${quoteItemFieldGapClass} gap-y-3`}>
                            {item.showDiscount && (
                              <div className="rounded-2xl border border-dark-500/45 bg-dark-800/70 p-3">
                                <div className="grid grid-cols-[minmax(0,1fr)_92px] items-end gap-3">
                                  <Field label="İndirim %">
                                    <NumericInput value={item.discountRate || 0} onChange={(value) => updateItem(item.id, 'discountRate', value)} />
                                  </Field>
                                  <button
                                    type="button"
                                    onClick={() => disableItemOption(item.id, 'showDiscount', { discountRate: 0 })}
                                    className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-black text-red-300 transition-colors hover:bg-red-500/20"
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
                                    <NumericInput value={item.exciseTaxRate || 0} onChange={(value) => updateItem(item.id, 'exciseTaxRate', value)} />
                                  </Field>
                                  <button
                                    type="button"
                                    onClick={() => disableItemOption(item.id, 'showExciseTax', { exciseTaxRate: 0 })}
                                    className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-black text-red-300 transition-colors hover:bg-red-500/20"
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
                                    <NumericInput value={item.accommodationTaxRate || 0} onChange={(value) => updateItem(item.id, 'accommodationTaxRate', value)} />
                                  </Field>
                                  <button
                                    type="button"
                                    onClick={() => disableItemOption(item.id, 'showAccommodationTax', { accommodationTaxRate: 0 })}
                                    className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-black text-red-300 transition-colors hover:bg-red-500/20"
                                  >
                                    <X className="h-3.5 w-3.5" /> Kaldır
                                  </button>
                                </div>
                              </div>
                            )}
                            </div>
                          )}
                          {item.showDescription && (
                            <div className={`mt-auto grid grid-cols-[minmax(0,1fr)_92px] items-end ${quoteItemFieldGapClass}`}>
                              <Field label="Satır Açıklaması">
                                <input
                                  value={item.extraDescription ?? item.description ?? ''}
                                  onChange={(event) => updateItem(item.id, 'extraDescription', event.target.value)}
                                  placeholder="Bu ürün satırı için ekstra açıklama yazın..."
                                  className="form-input"
                                />
                              </Field>
                              <button
                                type="button"
                                onClick={() => disableItemOption(item.id, 'showDescription', { extraDescription: '' })}
                                className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-black text-red-300 transition-colors hover:bg-red-500/20"
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
                    <div className="rounded-2xl border border-dashed border-dark-500/60 bg-dark-700/20 p-8 text-center text-sm font-semibold text-gray-500">
                      Henüz ürün eklenmedi. Ürün Ekle butonu ile teklif satırı oluşturun.
                    </div>
                  )}

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
              </section>

              <section className="rounded-3xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
                <DocumentTermsEditor
                  record={selectedQuote}
                  onPatch={patchSelected}
                  compact
                  title="Teklif Koşulları"
                  savedTermsTitle="Hazır Teklif Koşulları"
                  descriptionPlaceholder="Teklifin ödeme, teslimat, üretim veya özel açıklamalarını buraya yazın..."
                />
                <div className="mt-4 grid gap-2 border-t border-dark-500/35 pt-4 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={downloadQuotePdf}
                    disabled={isGeneratingPdf}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-red-500 transition-colors hover:bg-red-50"
                  >
                    <FileText className="h-4 w-4" /> {isGeneratingPdf ? 'Hazırlanıyor...' : 'PDF İndir'}
                  </button>
                  <button
                    type="button"
                    onClick={sendQuoteByWhatsApp}
                    disabled={isGeneratingPdf}
                    className={`${BTN_SUCCESS} h-10 gap-2 px-3 text-xs`}
                  >
                    <Send className="h-4 w-4" /> WhatsApp PDF Gönder
                  </button>
                  <button
                    type="button"
                    onClick={sendQuoteByMail}
                    className={`${BTN_PRIMARY} h-10 gap-2 px-3 text-xs`}
                  >
                    <Mail className="h-4 w-4" /> Mail Gönder
                  </button>
                </div>
              </section>

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
                    const activeStage = (previewQuote.stages || []).find((stage) => stage.id === previewQuote.currentStageId)
                    const terms = (previewQuote.termsDescription || '')
                      .split('\n')
                      .map((line) => line.replace(/^- /, '').trim())
                      .filter(Boolean)
                    const representative = previewQuote.owner || 'Satış Ekibi'
                    return (
                      <div className="bg-white p-12 text-slate-900">
                        <div className="mb-10 flex items-end justify-between border-b border-slate-200 pb-6">
                          <div>
                            <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-slate-400">Erlenbox</p>
                            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Fiyat Teklifi</h1>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Teklif No</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">{previewQuote.id}</p>
                          </div>
                        </div>

                        <div className="mb-8 grid grid-cols-3 gap-8">
                          <div>
                            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-slate-400">Müşteri</p>
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
                            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-slate-400">Teklif Bilgileri</p>
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
                            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-slate-400">Temsilci</p>
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
                            return (
                              <div
                                key={item.id}
                                className={`grid grid-cols-[120px_minmax(0,1.4fr)_72px_110px_120px] items-center px-4 py-4 text-sm ${index < previewQuote.items.length - 1 ? 'border-b border-slate-100' : ''}`}
                              >
                                <div className="h-[88px] w-[88px] overflow-hidden rounded-md border border-slate-200">
                                  {item.lineImage ? (
                                    <img src={item.lineImage} alt="" className="h-full w-full object-cover object-center" />
                                  ) : null}
                                </div>
                                <div className="pr-4">
                                  <p className="font-semibold text-slate-900">{item.product || 'Ürün seçilmedi'}</p>
                                  {description ? (
                                    <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                                  ) : null}
                                  <p className="mt-1 text-xs text-slate-400">KDV %{item.vatRate ?? 20}</p>
                                </div>
                                <span className="text-right font-medium text-slate-900">{item.quantity}</span>
                                <span className="text-right text-slate-700">{formatTL(item.unitPrice)}</span>
                                <span className="text-right font-semibold text-slate-900">{formatTL(row.total)}</span>
                              </div>
                            )
                          })}
                        </div>

                        <div className="mt-8 grid grid-cols-[minmax(0,1fr)_300px] gap-8">
                          <div>
                            <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-slate-400">Açıklama & Koşullar</p>
                            <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                              {previewQuote.termsDescription || 'Teklif koşulları belirtilmedi.'}
                            </p>
                            {terms.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {terms.map((term) => (
                                  <p key={term} className="text-sm text-slate-600">• {term}</p>
                                ))}
                              </div>
                            )}
                            {previewBankAccounts.length > 0 && (
                              <div className="mt-6">
                                <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-slate-400">Banka Hesapları</p>
                                <div className="space-y-3">
                                  {previewBankAccounts.map((account) => (
                                    <div key={account.id} className="text-sm text-slate-600">
                                      <p className="font-semibold text-slate-900">
                                        {account.bankName}{account.label ? ` · ${account.label}` : ''}
                                      </p>
                                      {account.branch ? <p className="mt-0.5">Şube: {account.branch}</p> : null}
                                      {account.iban ? <p className="mt-0.5">IBAN: {account.iban}</p> : null}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-slate-200 pt-4">
                            {[
                              ['Ara Toplam', selectedTotals.subtotal],
                              selectedTotals.lineDiscount > 0 ? ['Satır İndirimi', selectedTotals.lineDiscount] : null,
                              selectedTotals.showDocumentDiscount ? ['Toplam İndirim', selectedTotals.documentDiscount] : null,
                              ['ÖTV', selectedTotals.exciseTax],
                              ['Konaklama Vergisi', selectedTotals.accommodationTax],
                              ['KDV', selectedTotals.vat],
                            ].filter(Boolean).filter(([label, value]) => label === 'Ara Toplam' || label === 'KDV' || Number(value) !== 0).map(([label, value]) => (
                              <div key={label} className="mb-2 flex items-center justify-between text-sm">
                                <span className="text-slate-500">{label}</span>
                                <span className="font-medium text-slate-900">{formatTL(value)}</span>
                              </div>
                            ))}
                            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                              <span className="text-sm font-semibold uppercase tracking-wider text-slate-900">Genel Toplam</span>
                              <span className="text-xl font-semibold text-slate-900">{formatTL(selectedTotals.grandTotal)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-400">
                          <p>Bu teklif yalnızca bilgilendirme amaçlıdır. Geçerlilik tarihi: {formatListDate(previewQuote.validUntil)}</p>
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
    </div>
  )
}
