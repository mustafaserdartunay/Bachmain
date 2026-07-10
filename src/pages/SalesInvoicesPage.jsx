import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  Printer,
  Receipt,
  Users,
} from 'lucide-react'
import DateRangePicker from '../components/Common/DateRangePicker'
import SearchInput from '../components/Common/SearchInput'
import ListHeaderRow from '../components/Common/ListHeaderRow'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import { getCustomerProfiles } from '../data/customerProfiles'
import { formatTL } from '../utils/productPricing'
import { downloadExcelCsv, sanitizeExportFilename } from '../utils/spreadsheetExport'
import {
  createSalesInvoice,
  deleteSalesInvoice,
  formatInvoiceDate,
  getSalesInvoiceStats,
  INVOICE_KIND_LABELS,
  INVOICE_STATUS_LABELS,
  readSalesInvoices,
  recordInvoiceCollection,
} from '../utils/salesInvoicesStore'
import { BTN_PRIMARY } from '../utils/buttonStyles'

const PAGE_SIZE = 10
const LIST_GRID = '40px minmax(220px,1.4fr) 140px minmax(150px,1fr) minmax(150px,1fr) minmax(160px,1fr)'

const statusFilterOptions = [
  { id: 'all', label: 'Tüm Kayıtlar' },
  { id: 'open', label: 'Tahsil Bekleyen' },
  { id: 'collected', label: 'Tahsil Edilen' },
  { id: 'overdue', label: 'Vadesi Geçen' },
  { id: 'draft', label: 'Taslak' },
]

function statusTone(status) {
  if (status === 'collected') return 'text-gray-400'
  if (status === 'draft') return 'text-gray-400'
  if (status === 'approved') return 'text-emerald-300'
  return 'text-blue-300'
}

function statusDotClass(status) {
  if (status === 'collected') return 'bg-gray-500'
  if (status === 'draft') return 'bg-gray-500'
  if (status === 'approved') return 'bg-emerald-400'
  return 'bg-blue-400'
}

function kindBadgeClass(kind) {
  return kind === 'a-fatura'
    ? 'border-red-500/30 bg-red-500/10 text-red-300'
    : 'border-blue-500/30 bg-blue-500/10 text-blue-300'
}

function defaultDateRange() {
  const end = new Date()
  const start = new Date(end)
  start.setFullYear(start.getFullYear() - 1)
  const toIso = (date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 10)
  }
  return { dateFrom: toIso(start), dateTo: toIso(end) }
}

function NewInvoiceMenu({ onSelectCustomer, onQuickDraft }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(event) {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative inline-flex">
      <button type="button" onClick={onQuickDraft} className={`${BTN_PRIMARY} inline-flex items-center gap-2 rounded-l-xl px-4 py-2.5 text-sm font-black uppercase tracking-wide`}>
        <Plus className="h-4 w-4" />
        Yeni Fatura Oluştur
      </button>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`${BTN_PRIMARY} rounded-l-none border-l border-white/15 px-2.5 py-2.5`}
        aria-label="Fatura seçenekleri"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 min-w-[220px] overflow-hidden rounded-xl border border-dark-500/50 bg-dark-800 shadow-xl">
          <button
            type="button"
            onClick={() => { setOpen(false); onSelectCustomer() }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-gray-200 transition-colors hover:bg-dark-700"
          >
            <Users className="h-4 w-4 text-blue-300" />
            Müşteri Seçerek Oluştur
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onQuickDraft() }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-gray-200 transition-colors hover:bg-dark-700"
          >
            <Receipt className="h-4 w-4 text-emerald-300" />
            Hızlı Taslak Fatura
          </button>
        </div>
      )}
    </div>
  )
}

function CustomerPickerModal({ open, onClose, onSelect }) {
  const customers = useMemo(() => getCustomerProfiles(), [open])
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return customers
    return customers.filter((item) => [item.company, item.companyTitle, item.contact, item.phone, item.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query)))
  }, [customers, search])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-dark-500/50 bg-dark-800 shadow-2xl">
        <div className="border-b border-dark-500/45 px-5 py-4">
          <h3 className="text-base font-black text-white">Müşteri Seçin</h3>
          <p className="mt-1 text-xs text-gray-500">Satış faturası oluşturmak için müşteri seçin.</p>
          <SearchInput
            wrapperClassName="mt-3"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Müşteri ara..."
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-gray-500">Müşteri bulunamadı.</p>
          ) : filtered.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => onSelect(customer)}
              className="flex w-full flex-col rounded-xl px-3 py-3 text-left transition-colors hover:bg-dark-700"
            >
              <span className="text-sm font-bold text-white">{customer.company || customer.companyTitle}</span>
              <span className="text-xs text-gray-500">{customer.contact || customer.phone || customer.email || '—'}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-dark-500/45 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-bold text-gray-400 hover:text-white">
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SalesInvoicesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [invoices, setInvoices] = useState(() => readSalesInvoices())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState(defaultDateRange)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const statusMenuRef = useRef(null)

  const refresh = useCallback(() => {
    setInvoices(readSalesInvoices())
  }, [])

  useEffect(() => {
    window.addEventListener('erlenbox:sales-invoices-updated', refresh)
    window.addEventListener('erlenbox:treasury-updated', refresh)
    return () => {
      window.removeEventListener('erlenbox:sales-invoices-updated', refresh)
      window.removeEventListener('erlenbox:treasury-updated', refresh)
    }
  }, [refresh])

  useEffect(() => {
    function handleClick(event) {
      if (!statusMenuRef.current?.contains(event.target)) setStatusMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (searchParams.get('yeni') !== '1') return
    setCustomerModalOpen(true)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return invoices
      .filter((item) => {
        if (statusFilter === 'open') return item.remainingAmount > 0
        if (statusFilter === 'collected') return item.remainingAmount <= 0
        if (statusFilter === 'overdue') return item.remainingAmount > 0 && item.overdueDays > 0
        if (statusFilter === 'draft') return item.status === 'draft'
        return true
      })
      .filter((item) => {
        if (!dateRange.dateFrom && !dateRange.dateTo) return true
        const issue = item.issueDate || ''
        if (dateRange.dateFrom && issue < dateRange.dateFrom) return false
        if (dateRange.dateTo && issue > dateRange.dateTo) return false
        return true
      })
      .filter((item) => {
        if (!query) return true
        return [item.title, item.invoiceNo, item.customerName, item.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      })
      .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
  }, [invoices, search, statusFilter, dateRange])

  const stats = useMemo(() => getSalesInvoiceStats(filtered), [filtered])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, dateRange.dateFrom, dateRange.dateTo])

  function toggleSelect(id) {
    setSelectedIds((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ))
  }

  function toggleSelectAll() {
    if (selectedIds.length === pageItems.length) {
      setSelectedIds([])
      return
    }
    setSelectedIds(pageItems.map((item) => item.id))
  }

  function handleExport() {
    const rows = filtered.map((item) => [
      item.title,
      item.invoiceNo,
      item.customerName,
      item.issueDate,
      item.dueDate,
      item.totalAmount,
      item.remainingAmount,
      INVOICE_KIND_LABELS[item.invoiceKind],
      INVOICE_STATUS_LABELS[item.status] || item.status,
    ])
    downloadExcelCsv(
      sanitizeExportFilename('satis-faturalari'),
      ['Fatura İsmi', 'Fatura No', 'Müşteri', 'Düzenleme', 'Vade', 'Toplam', 'Kalan', 'Tür', 'Durum'],
      rows,
    )
  }

  function handleQuickDraft() {
    const customers = getCustomerProfiles()
    const customer = customers[0]
    createSalesInvoice({
      title: 'Satış Faturaları',
      customerId: customer?.id || '',
      customerName: customer?.company || customer?.companyTitle || 'Genel Müşteri',
      totalAmount: 0,
      status: 'draft',
      invoiceKind: 'e-fatura',
      syncTreasury: false,
    })
    refresh()
  }

  function handleCustomerSelect(customer) {
    setCustomerModalOpen(false)
    navigate(`/musteriler/${customer.id}/belge/satis-faturasi`)
  }

  function handleCollect(invoice) {
    const amount = invoice.remainingAmount
    if (amount <= 0) return
    recordInvoiceCollection(invoice.id, amount)
    refresh()
  }

  function handleDeleteSelected() {
    selectedIds.forEach((id) => deleteSalesInvoice(id))
    setSelectedIds([])
    refresh()
  }

  const statusFilterLabel = statusFilterOptions.find((item) => item.id === statusFilter)?.label || 'Tüm Kayıtlar'

  return (
    <AppPageShell>
      <AppPageHeader
        title="Satış Faturaları"
        actions={(
          <NewInvoiceMenu
            onSelectCustomer={() => setCustomerModalOpen(true)}
            onQuickDraft={handleQuickDraft}
          />
        )}
      />

      <SummaryMetrics
        columns={4}
        items={[
          { title: 'Toplam Kayıt', value: stats.totalRecords, icon: FileText, tone: 'blue', valueTone: 'blue' },
          { title: 'Genel Toplam', value: formatTL(stats.grandTotal), icon: Receipt, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Tahsil Edilecek', value: formatTL(stats.remainingTotal), icon: Receipt, tone: 'red', valueTone: 'red' },
          { title: 'Vadesi Geçen', value: stats.overdueCount, icon: Filter, tone: 'orange', valueTone: 'orange' },
        ]}
      />

      <AppPagePanel fill>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-bold text-gray-300"
            title="Filtreler aktif"
          >
            <Filter className="h-4 w-4" />
          </button>

          <div className="min-w-[240px] flex-1 sm:max-w-xs">
            <DateRangePicker
              dateFrom={dateRange.dateFrom}
              dateTo={dateRange.dateTo}
              onChange={(value) => setDateRange((current) => ({ ...current, ...value }))}
              dateLabelFormat="numeric"
            />
          </div>

          <SearchInput
            wrapperClassName="min-w-[220px] flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İçerisinde ara..."
          />
        </div>

        <ListHeaderRow
          gridTemplate={LIST_GRID}
          columns={[
            {
              content: (
                <input
                  type="checkbox"
                  checked={pageItems.length > 0 && selectedIds.length === pageItems.length}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              ),
            },
            'Fatura İsmi',
            'Fatura No',
            'Düzenleme Tarihi',
            'Vade Tarihi',
            { label: 'Kalan Meblağ', align: 'right' },
          ]}
        />

        <div className="mt-2 space-y-2">
          {pageItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-dark-500/45 bg-dark-900/40 px-4 py-12 text-center">
              <Receipt className="mx-auto mb-3 h-8 w-8 text-gray-600" />
              <p className="text-sm font-bold text-gray-400">Fatura bulunamadı</p>
              <p className="mt-1 text-xs text-gray-600">Yeni fatura oluşturun veya filtreleri temizleyin.</p>
            </div>
          ) : pageItems.map((invoice) => (
            <div
              key={invoice.id}
              className="grid items-center gap-2 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3 transition-colors hover:border-dark-500/70 hover:bg-dark-800/80"
              style={{ gridTemplateColumns: LIST_GRID }}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(invoice.id)}
                onChange={() => toggleSelect(invoice.id)}
                className="rounded"
              />

              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <div className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/80 text-gray-400">
                    <FileText className="h-5 w-5" />
                    {invoice.invoiceKind === 'e-fatura' && (
                      <span className="absolute -bottom-1 -right-1 rounded bg-blue-500 px-1 text-[10px] font-black text-white">e</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-black text-white">{invoice.title}</p>
                      <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-black tracking-wide ${kindBadgeClass(invoice.invoiceKind)}`}>
                        {INVOICE_KIND_LABELS[invoice.invoiceKind]}
                      </span>
                    </div>
                    {invoice.customerId ? (
                      <Link
                        to={`/musteriler/${invoice.customerId}`}
                        className="mt-1 block truncate text-xs text-gray-500 transition-colors hover:text-blue-300"
                      >
                        {invoice.customerName}
                      </Link>
                    ) : (
                      <p className="mt-1 truncate text-xs text-gray-500">{invoice.customerName || '—'}</p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs font-semibold text-gray-300">{invoice.invoiceNo || '—'}</p>

              <div>
                <p className="text-xs font-semibold text-gray-200">{formatInvoiceDate(invoice.issueDate)}</p>
                <p className={`mt-1 flex items-center gap-1.5 text-[12px] font-bold ${statusTone(invoice.status)}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(invoice.status)}`} />
                  {invoice.invoiceKind === 'e-fatura' ? 'Ticari e-Fatura' : 'Satış Faturaları'}
                  {' · '}
                  {(INVOICE_STATUS_LABELS[invoice.status] || invoice.status).toUpperCase()}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-200">{formatInvoiceDate(invoice.dueDate)}</p>
                {invoice.remainingAmount > 0 && invoice.overdueDays > 0 && (
                  <p className="mt-1 text-[12px] font-bold text-red-300">
                    ({invoice.overdueDays} gün gecikti)
                  </p>
                )}
              </div>

              <div className="text-right">
                {invoice.remainingAmount > 0 ? (
                  <>
                    <p className="text-sm font-black text-red-300">{formatTL(invoice.remainingAmount)}</p>
                    <p className="mt-1 text-[12px] text-gray-500">Genel Toplam {formatTL(invoice.totalAmount)}</p>
                    <button
                      type="button"
                      onClick={() => handleCollect(invoice)}
                      className="mt-2 rounded-lg border border-emerald-500/30 px-2 py-1 text-[12px] font-bold text-emerald-300 transition-colors hover:bg-emerald-500/10"
                    >
                      Tahsil Et
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-gray-500">Tahsil edildi</p>
                    <p className="mt-1 text-[12px] text-gray-600">Genel Toplam {formatTL(invoice.totalAmount)}</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dark-500/40 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div ref={statusMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setStatusMenuOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-black uppercase tracking-wide text-gray-300"
              >
                {statusFilterLabel}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {statusMenuOpen && (
                <div className="absolute bottom-full left-0 z-20 mb-2 min-w-[180px] overflow-hidden rounded-xl border border-dark-500/50 bg-dark-800 shadow-xl">
                  {statusFilterOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setStatusFilter(option.id)
                        setStatusMenuOpen(false)
                      }}
                      className={`block w-full px-4 py-2.5 text-left text-xs font-bold transition-colors hover:bg-dark-700 ${
                        statusFilter === option.id ? 'text-blue-300' : 'text-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="rounded-xl border border-dark-500/50 p-2 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
              title="Excel'e aktar"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl border border-dark-500/50 p-2 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white"
              title="Yazdır"
            >
              <Printer className="h-4 w-4" />
            </button>

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="rounded-xl border border-red-500/30 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10"
              >
                Seçilenleri Sil ({selectedIds.length})
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-lg border border-dark-500/50 p-1.5 text-gray-400 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                const pageNumber = index + 1
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`min-w-[32px] rounded-lg px-2 py-1 text-xs font-bold ${
                      currentPage === pageNumber
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'text-gray-400 hover:bg-dark-700'
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              })}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="rounded-lg border border-dark-500/50 p-1.5 text-gray-400 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="text-right">
              <p className="text-xs font-black text-white">{stats.totalRecords} Kayıt</p>
              <p className="text-sm font-black text-white">{formatTL(stats.grandTotal)}</p>
              <p className="text-[12px] font-bold text-red-300">Tahsil Edilecek {formatTL(stats.remainingTotal)}</p>
            </div>
          </div>
        </div>
      </AppPagePanel>

      <CustomerPickerModal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSelect={handleCustomerSelect}
      />
    </AppPageShell>
  )
}
