import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarCheck,
  ClipboardList,
  Check,
  Factory,
  FileText,
  PackageCheck,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  ShoppingCart,
  Store,
  TrendingUp,
  UsersRound,
  Warehouse,
  X,
} from 'lucide-react'
import ModernDashboard from '../components/Dashboard/ModernDashboard'
import { buildFinanceMetricCards } from '../components/Dashboard/StatusAnalysisBoard'
import { formatCurrency } from '../utils/dashboardAlerts'
import { loadOrders } from '../utils/ordersStore'
import { documentTotals } from '../utils/documentTotals'
import { getCatalogProducts } from '../utils/productCatalog'
import { deleteAgendaNote, getCrmSummary, loadAgendaNotes, saveAgendaNotes, upsertAgendaNote } from '../utils/crmStore'
import { buildCrmNoteBoardEntries } from '../utils/crmProcessFilterUtils'
import { getCrmRecordCreatedSortValue } from '../utils/crmProcessHelpers'
import { loadRawNoteProcessTemplates, NOTE_PROCESS_TEMPLATES_EVENT } from '../utils/noteProcessTemplatesStore'
import { loadDepoItems } from '../utils/depoStore'
import { getTreasuryMovements } from '../utils/treasuryStore'
import { calcInclPrice } from '../utils/productPricing'

const processToneMap = {
  quote: {
    icon: FileText,
    badge: 'Teklif Süreçleri',
    border: 'border-dark-500/55',
    iconBox: 'border-blue-500/30 bg-dark-700/70 text-blue-300',
    text: 'text-blue-300',
    bar: 'bg-blue-400',
  },
  order: {
    icon: ShoppingCart,
    badge: 'Sipariş Süreçleri',
    border: 'border-dark-500/55',
    iconBox: 'border-emerald-500/30 bg-dark-700/70 text-emerald-300',
    text: 'text-emerald-300',
    bar: 'bg-emerald-400',
  },
  production: {
    icon: Factory,
    badge: 'Üretim Süreçleri',
    border: 'border-dark-500/55',
    iconBox: 'border-fuchsia-500/30 bg-dark-700/70 text-fuchsia-300',
    text: 'text-fuchsia-300',
    bar: 'bg-fuchsia-400',
  },
  depo: {
    icon: Warehouse,
    badge: 'Depo Süreçleri',
    border: 'border-dark-500/55',
    iconBox: 'border-orange-500/30 bg-dark-700/70 text-orange-300',
    text: 'text-orange-300',
    bar: 'bg-orange-400',
  },
  delivered: {
    icon: PackageCheck,
    badge: 'Teslim Süreçleri',
    border: 'border-dark-500/55',
    iconBox: 'border-emerald-500/30 bg-dark-700/70 text-emerald-300',
    text: 'text-emerald-300',
    bar: 'bg-emerald-400',
  },
}

function parseDateIso(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const parts = String(value).split('.')
  if (parts.length === 3) {
    const [day, month, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10)
}

function readShoppingSalesHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem('erlenbox-shopping-sales-history') || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function isCurrentMonth(value) {
  const iso = parseDateIso(value)
  if (!iso) return false
  return iso.slice(0, 7) === new Date().toISOString().slice(0, 7)
}

function summarizeRows(rows = []) {
  return rows.reduce((summary, row) => ({
    net: summary.net + (Number(row.net) || 0),
    vat: summary.vat + (Number(row.vat) || 0),
    total: summary.total + (Number(row.total) || 0),
  }), { net: 0, vat: 0, total: 0 })
}

function buildIssuedInvoiceAnalytics(orders, depoItems) {
  const treasuryInvoices = getTreasuryMovements()
    .filter((movement) => movement.type === 'Satış Faturası' && isCurrentMonth(movement.date))
    .map((movement) => {
      const total = Number(movement.amount) || 0
      const net = total / 1.2
      return {
        id: movement.id,
        docNo: movement.docNo || movement.id,
        party: movement.customerName || 'Müşteri',
        source: 'Satış Faturası',
        date: movement.date,
        net,
        vat: total - net,
        total,
        lines: [],
      }
    })

  const orderInvoices = orders
    .filter((order) => isCurrentMonth(order.createdAt || order.date))
    .map((order) => {
      const totals = documentTotals(order)
      return {
        id: order.id,
        docNo: order.invoiceNo || order.id,
        party: order.customer || 'Müşteri',
        source: 'Sipariş',
        date: order.createdAt || order.date,
        net: totals.net,
        vat: totals.vat,
        total: totals.grandTotal,
        lines: order.items || [],
      }
    })

  const shoppingInvoices = readShoppingSalesHistory()
    .filter((sale) => isCurrentMonth(sale.date))
    .map((sale) => ({
      id: sale.id,
      docNo: sale.id,
      party: sale.customerName || 'Perakende Müşteri',
      source: 'Shopping',
      date: sale.date,
      net: Number(sale.subtotal) || 0,
      vat: Number(sale.vat) || 0,
      total: Number(sale.grandTotal) || 0,
      lines: sale.items || [],
    }))

  const depoInvoices = depoItems
    .filter((item) => item.invoiceNo && isCurrentMonth(item.invoiceAt))
    .map((item) => {
      const quantity = Number(item.invoicedQuantity || item.quantity) || 0
      const net = quantity * (Number(item.unitPrice) || 0)
      const vat = net * ((Number(item.vatRate) || 20) / 100)
      return {
        id: item.invoiceNo,
        docNo: item.invoiceNo,
        party: item.customer || 'Depo müşterisi',
        source: 'Depo Faturası',
        date: item.invoiceAt,
        net,
        vat,
        total: net + vat,
        lines: [{ product: item.product, quantity, unitPrice: item.unitPrice, vatRate: item.vatRate }],
      }
    })

  const rows = [...treasuryInvoices, ...orderInvoices, ...shoppingInvoices, ...depoInvoices]
    .filter((row) => Number(row.vat) > 0)
  return { rows, ...summarizeRows(rows) }
}

function buildSupplierPurchaseAnalytics() {
  const products = getCatalogProducts()
  const rows = products
    .filter((product) => Number(product.initialStock) > 0 || Number(product.purchasePriceExcl) > 0)
    .map((product) => {
      const quantity = Number(product.initialStock) || 0
      const unitNet = Number(product.purchasePriceExcl) || 0
      const net = quantity * unitNet
      const total = quantity * calcInclPrice(unitNet, product.vatRate)
      const vat = total - net
      const suppliers = product.producerSuppliers?.length
        ? product.producerSuppliers.join(', ')
        : (product.manufacturer || product.supplierAccount || 'Tedarikçi belirtilmedi')
      return {
        id: product.id,
        docNo: product.stockCode || product.id,
        party: suppliers,
        source: 'Ürün Alış/Stok',
        date: product.updatedAt || product.createdAt || '',
        net,
        vat,
        total,
        lines: [{ product: product.name, quantity, unitPrice: unitNet, vatRate: product.vatRate }],
      }
    })
    .filter((row) => Number(row.vat) > 0)
  return { rows, ...summarizeRows(rows) }
}

function MiniTaxChart({ net, vat }) {
  const total = Math.max(1, net + vat)
  const netPct = Math.round((net / total) * 100)
  return (
    <div className="mt-2">
      <div className="flex h-2 overflow-hidden rounded-full bg-dark-700/55">
        <div className="bg-blue-500" style={{ width: `${netPct}%` }} />
        <div className="bg-orange-500" style={{ width: `${100 - netPct}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[9px] font-black text-gray-500">
        <span>KDV Hariç %{netPct}</span>
        <span>KDV %{100 - netPct}</span>
      </div>
    </div>
  )
}

function TaxAnalysisCard({ title, description, icon: Icon, data, tone, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-2xl border border-dark-500/50 bg-dark-800/65 p-3 text-left shadow-card transition-colors hover:border-blue-500/35"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wide text-blue-300">{title}</h3>
          <p className="mt-0.5 line-clamp-1 text-[10px] font-semibold text-gray-500">{description}</p>
        </div>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg border border-dark-500/50 bg-dark-700/60 ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-dark-500/45 bg-dark-700/35 p-2">
          <p className="text-[9px] font-black uppercase tracking-wide text-gray-500">KDV Hariç</p>
          <p className="mt-0.5 text-xs font-black text-white">{formatCurrency(data.net)}</p>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-2">
          <p className="text-[9px] font-black uppercase tracking-wide text-orange-300">KDV</p>
          <p className="mt-0.5 text-xs font-black text-orange-300">{formatCurrency(data.vat)}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2">
          <p className="text-[9px] font-black uppercase tracking-wide text-emerald-300">KDV Dahil</p>
          <p className="mt-0.5 text-xs font-black text-emerald-300">{formatCurrency(data.total)}</p>
        </div>
      </div>
      <MiniTaxChart net={data.net} vat={data.vat} />
      <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-gray-500">{data.rows.length} detay kaydı görüntüle</p>
    </button>
  )
}

function TaxDetailModal({ title, data, onClose }) {
  if (!data) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4">
      <div className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-dark-500/60 bg-dark-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-dark-500/50 p-5">
          <div>
            <h2 className="text-xl font-black uppercase tracking-wide text-blue-300">{title}</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">Fatura ve kalem detayları KDV hariç, KDV ve KDV dahil olarak listelenir.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-dark-500/50 p-2 text-gray-400 hover:bg-dark-700 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 border-b border-dark-500/50 p-5">
          <div className="rounded-2xl border border-dark-500/45 bg-dark-800/60 p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">KDV Hariç</p>
            <p className="mt-1 text-lg font-black text-white">{formatCurrency(data.net)}</p>
          </div>
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-orange-300">KDV</p>
            <p className="mt-1 text-lg font-black text-orange-300">{formatCurrency(data.vat)}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-wide text-emerald-300">KDV Dahil</p>
            <p className="mt-1 text-lg font-black text-emerald-300">{formatCurrency(data.total)}</p>
          </div>
        </div>
        <div className="max-h-[58vh] overflow-y-auto p-5">
          {data.rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-dark-500/55 bg-dark-800/40 p-8 text-center text-sm font-bold text-gray-400">
              Bu dönem için detay kaydı bulunamadı.
            </div>
          ) : (
            <div className="space-y-3">
              {data.rows.map((row) => (
                <article key={`${row.source}-${row.id}`} className="rounded-2xl border border-dark-500/45 bg-dark-800/55 p-4">
                  <div className="grid gap-3 lg:grid-cols-[150px_minmax(0,1fr)_120px_120px_120px] lg:items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Fatura / Belge</p>
                      <p className="mt-1 text-sm font-black text-blue-300">{row.docNo}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{row.party}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-500">{row.source} · {row.date || 'Tarihsiz'}</p>
                    </div>
                    <p className="text-sm font-black text-white">{formatCurrency(row.net)}</p>
                    <p className="text-sm font-black text-orange-300">{formatCurrency(row.vat)}</p>
                    <p className="text-sm font-black text-emerald-300">{formatCurrency(row.total)}</p>
                  </div>
                  {row.lines?.length > 0 && (
                    <div className="mt-3 space-y-1 border-t border-dark-500/35 pt-3">
                      {row.lines.slice(0, 5).map((line, index) => (
                        <div key={`${row.id}-line-${index}`} className="flex justify-between gap-3 text-[11px] font-semibold text-gray-500">
                          <span className="truncate">{line.product || line.name || line.description || 'Kalem'} · {Number(line.quantity) || 0} adet · KDV %{Number(line.vatRate ?? line.vat) || 0}</span>
                          <span className="shrink-0 text-gray-300">{formatCurrency((Number(line.quantity) || 0) * (Number(line.unitPrice || line.price) || 0))}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProcessMetricCard({
  tone = 'quote',
  title,
  value,
  amountLabel,
  amountTitle = 'Toplam Tutar',
  detailLabel,
  stages,
  rows,
}) {
  const config = processToneMap[tone] || processToneMap.quote
  const Icon = config.icon
  const activeCount = rows.reduce((sum, row) => sum + (Number(row.count) || 0), 0)
  const totalStages = Math.max(1, stages.length)
  const filledPct = Math.min(100, Math.max(0, Math.round((activeCount / totalStages) * 100)))

  return (
    <article className={`rounded-2xl border ${config.border} bg-dark-800/75 p-4 shadow-card`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">{config.badge}</p>
          <h2 className="mt-1 truncate text-sm font-black text-gray-100">{title}</h2>
        </div>
        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${config.iconBox}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">Kayıt</p>
          <p className="mt-1 text-2xl font-black text-gray-100">{value}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-500">{amountTitle}</p>
          <p className={`mt-1 text-sm font-black ${config.text}`}>{amountLabel}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-dark-700/55">
          <div className={config.bar} style={{ width: `${filledPct}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-black text-gray-500">
          <span>{detailLabel}</span>
          <span>{stages.length} başlık</span>
        </div>
      </div>
    </article>
  )
}

function DashboardSection({ title, subtitle, icon: Icon, children, className = '' }) {
  return (
    <section className={`overflow-hidden rounded-3xl border border-dark-500/50 bg-dark-800/75 shadow-card ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-dark-500/40 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-black uppercase tracking-wide text-blue-300">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs font-semibold text-gray-400">{subtitle}</p>}
        </div>
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-300">
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function CrmOverviewCard() {
  const summary = getCrmSummary()
  const tiles = [
    { label: 'Bekleyen Görev', value: summary.tasksPending, tone: 'text-blue-300', icon: ClipboardList },
    { label: 'Geciken Görev', value: summary.tasksOverdue, tone: 'text-red-300', icon: AlertTriangle },
    { label: 'Bugünkü Randevu', value: summary.appointmentsToday, tone: 'text-emerald-300', icon: CalendarCheck },
    { label: 'Haftalık Plan', value: summary.appointmentsWeek, tone: 'text-purple-300', icon: UsersRound },
  ]

  return (
    <DashboardSection title="CRM Bilgileri" subtitle="Görev, randevu ve takip özeti" icon={UsersRound}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon
          return (
            <article key={tile.label} className="rounded-2xl border border-dark-500/45 bg-dark-700/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">{tile.label}</p>
                <Icon className={`h-4 w-4 ${tile.tone}`} />
              </div>
              <p className={`mt-3 text-3xl font-black ${tile.tone}`}>{tile.value}</p>
            </article>
          )
        })}
      </div>
    </DashboardSection>
  )
}

function DashboardCrmMiniMetrics() {
  const summary = getCrmSummary()
  const tiles = [
    { label: 'Bekleyen', value: summary.tasksPending, tone: 'text-blue-300', icon: ClipboardList },
    { label: 'Geciken', value: summary.tasksOverdue, tone: 'text-red-300', icon: AlertTriangle },
    { label: 'Bugün', value: summary.appointmentsToday, tone: 'text-emerald-300', icon: CalendarCheck },
    { label: 'Hafta', value: summary.appointmentsWeek, tone: 'text-purple-300', icon: UsersRound },
  ]
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {tiles.map((tile) => {
        const Icon = tile.icon
        return (
          <span key={tile.label} className="inline-flex h-9 items-center gap-2 rounded-xl border border-dark-500/45 bg-dark-700/40 px-3 text-xs font-black text-gray-400">
            <Icon className={`h-3.5 w-3.5 ${tile.tone}`} />
            <span className="uppercase tracking-wide">{tile.label}</span>
            <strong className={`text-sm ${tile.tone}`}>{tile.value}</strong>
          </span>
        )
      })}
    </div>
  )
}

function getFirstNoteTemplate(templates) {
  return Object.values(templates || {})[0] || null
}

function getNoteStageOptions(templates, templateId) {
  const template = templates?.[templateId] || getFirstNoteTemplate(templates)
  return template?.stages || []
}

function getCurrentNoteTimestamp() {
  const now = new Date()
  return {
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
  }
}

function formatNoteTimestamp(note) {
  const date = note.date || note.createdAt?.slice?.(0, 10) || ''
  const time = note.time || note.createdAt?.slice?.(11, 16) || ''
  if (!date && !time) return ''
  const formattedDate = date
    ? date.split('-').reverse().join('.')
    : ''
  return [formattedDate, time].filter(Boolean).join(' ')
}

function createEmptyDashboardNote(templates = {}) {
  const timestamp = getCurrentNoteTimestamp()
  const template = getFirstNoteTemplate(templates)
  const stage = template?.stages?.[0]
  return {
    title: '',
    content: '',
    date: timestamp.date,
    time: timestamp.time,
    noteTemplateId: template?.id || '',
    status: stage?.label || '',
    statusId: stage?.id || '',
  }
}

function DashboardNotesPanel({ entries, onSubmit, onDelete, onReorder, onToggleComplete }) {
  const [noteTemplates, setNoteTemplates] = useState(() => loadRawNoteProcessTemplates())
  const [draft, setDraft] = useState(() => (entries.length === 0 ? createEmptyDashboardNote(loadRawNoteProcessTemplates()) : null))
  const [editingId, setEditingId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const isEditing = Boolean(draft)

  useEffect(() => {
    function refreshNoteTemplates() {
      setNoteTemplates(loadRawNoteProcessTemplates())
    }
    window.addEventListener(NOTE_PROCESS_TEMPLATES_EVENT, refreshNoteTemplates)
    return () => window.removeEventListener(NOTE_PROCESS_TEMPLATES_EVENT, refreshNoteTemplates)
  }, [])

  useEffect(() => {
    if (entries.length === 0 && !draft) {
      setEditingId(null)
      setDraft(createEmptyDashboardNote(noteTemplates))
    }
  }, [draft, entries.length, noteTemplates])

  function startCreate() {
    setEditingId(null)
    setDraft(createEmptyDashboardNote(noteTemplates))
  }

  function startEdit(entry) {
    const template = noteTemplates[entry.record.noteTemplateId] || getFirstNoteTemplate(noteTemplates)
    const stage = template?.stages?.find((item) => item.id === entry.record.statusId || item.label === entry.record.status)
      || template?.stages?.[0]
    setEditingId(entry.record.id)
    setDraft({
      ...createEmptyDashboardNote(noteTemplates),
      ...entry.record,
      noteTemplateId: template?.id || entry.record.noteTemplateId || '',
      status: stage?.label || entry.record.status || '',
      statusId: stage?.id || entry.record.statusId || '',
    })
  }

  function submitDraft(event) {
    event.preventDefault()
    const content = draft?.content?.trim() || ''
    if (!content) return
    const timestamp = editingId ? { date: draft.date, time: draft.time } : getCurrentNoteTimestamp()
    const title = content.split('\n').find((line) => line.trim())?.trim().slice(0, 80) || 'Not'
    onSubmit({
      ...draft,
      id: editingId || draft.id,
      title,
      content,
      date: timestamp.date || new Date().toISOString().slice(0, 10),
      time: timestamp.time || '',
      noteTemplateId: draft.noteTemplateId || '',
      status: draft.status || '',
      statusId: draft.statusId || '',
    })
    setDraft(null)
    setEditingId(null)
  }

  return (
    <section className="flex h-full min-h-[18rem] flex-col overflow-hidden rounded-3xl border border-dark-500/50 bg-dark-800/65 p-5 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-blue-300">Not Defteri</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">
            {entries.length} kayıt
          </span>
          <button
            type="button"
            onClick={startCreate}
            className="btn-primary inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Not ekle
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-2">
          {isEditing && (
            <form onSubmit={submitDraft} className="rounded-xl border border-dark-500/45 bg-dark-700/35 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[10px] font-black text-blue-300/80">{formatNoteTimestamp(draft)}</p>
                  <textarea
                    autoFocus
                    value={draft.content}
                    onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
                    placeholder="Notunuzu buraya yazın..."
                    className="block min-h-[1.75rem] w-full resize-none border-none bg-transparent p-0 text-sm font-black text-white outline-none placeholder:text-gray-500"
                  />
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="submit" className="inline-flex rounded-lg p-1 text-blue-300 transition-colors hover:bg-blue-500/10" title={editingId ? 'Güncelle' : 'Kaydet'}>
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(null)
                      setEditingId(null)
                    }}
                    className="inline-flex rounded-lg p-1 text-red-300 transition-colors hover:bg-red-500/10"
                    title="Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </form>
          )}
          {entries.map((entry, index) => {
            const isCompleted = Boolean(entry.record.completed)
            return (
              <article key={entry.id} className={`rounded-xl border p-3 ${isCompleted ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-dark-500/45 bg-dark-700/35'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {formatNoteTimestamp(entry.record) && (
                      <p className="mb-1 text-[10px] font-black text-blue-300/80">{formatNoteTimestamp(entry.record)}</p>
                    )}
                    <p className={`line-clamp-2 text-sm font-black text-white decoration-2 decoration-emerald-300/80 ${isCompleted ? 'text-gray-400 line-through' : ''}`}>
                      {entry.record.content || entry.record.title}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(entry)}
                      className={`rounded-lg p-1 transition-colors ${isCompleted ? 'bg-emerald-500/15 text-emerald-300' : 'text-emerald-300 hover:bg-emerald-500/10'}`}
                      title={isCompleted ? 'Tamamlandı' : 'Tamamlandı olarak işaretle'}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => onReorder(index, -1)} disabled={index === 0} className="rounded-lg p-1 text-gray-500 hover:bg-dark-600 hover:text-white disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => onReorder(index, 1)} disabled={index === entries.length - 1} className="rounded-lg p-1 text-gray-500 hover:bg-dark-600 hover:text-white disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => startEdit(entry)} className="rounded-lg p-1 text-blue-300 hover:bg-blue-500/10"><Pencil className="h-3.5 w-3.5" /></button>
                    <div className="relative">
                      <button type="button" onClick={() => setPendingDeleteId(entry.id)} className="rounded-lg p-1 text-red-300 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                      {pendingDeleteId === entry.id && (
                        <div className="absolute right-0 top-7 z-20 w-36 rounded-xl border border-red-500/25 bg-dark-800 p-2 shadow-card">
                          <p className="text-[10px] font-bold text-gray-300">Not silinsin mi?</p>
                          <div className="mt-2 flex gap-1">
                            <button type="button" onClick={() => setPendingDeleteId(null)} className="flex-1 rounded-lg border border-dark-500/50 px-2 py-1 text-[10px] font-black text-gray-400">Hayır</button>
                            <button
                              type="button"
                              onClick={() => {
                                onDelete(entry)
                                setPendingDeleteId(null)
                              }}
                              className="flex-1 rounded-lg bg-red-500 px-2 py-1 text-[10px] font-black text-white"
                            >
                              Evet
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default function DashboardPage() {
  const [taxDetail, setTaxDetail] = useState(null)
  const financeCards = buildFinanceMetricCards()
  const issuedInvoiceAnalytics = useMemo(() => buildIssuedInvoiceAnalytics(loadOrders(), loadDepoItems()), [])
  const supplierPurchaseAnalytics = useMemo(() => buildSupplierPurchaseAnalytics(), [])
  const estimatedVatDue = Math.max(0, issuedInvoiceAnalytics.vat - supplierPurchaseAnalytics.vat)

  return (
    <>
      <ModernDashboard
        financeCards={financeCards}
        issuedInvoiceAnalytics={issuedInvoiceAnalytics}
        supplierPurchaseAnalytics={supplierPurchaseAnalytics}
        estimatedVatDue={estimatedVatDue}
        onOpenIssuedTax={() => setTaxDetail({ title: 'Kesilen Faturalar Detayı', data: issuedInvoiceAnalytics })}
        onOpenSupplierTax={() => setTaxDetail({ title: 'Tedarikçi Alışları Detayı', data: supplierPurchaseAnalytics })}
      />
      <TaxDetailModal
        title={taxDetail?.title}
        data={taxDetail?.data}
        onClose={() => setTaxDetail(null)}
      />
    </>
  )
}
