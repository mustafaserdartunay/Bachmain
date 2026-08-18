import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FileText, Handshake, Receipt, Wifi } from 'lucide-react'
import { DataTable } from '@bachmain/ui'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import SearchInput from '../../components/Common/SearchInput'
import SplitCreateButton from '../../components/Common/SplitCreateButton'
import CreateCustomerPickModal from '../../components/Common/CreateCustomerPickModal'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { EFaturaBadge } from '../../components/Common/EFaturaMark'
import { formatTL } from '../../utils/productPricing'
import { APP_SURFACE_PANEL_CLASS } from '../../utils/dashboardDesign'
import { getCustomerProfiles } from '../../data/customerProfiles'
import {
  getCustomerMetaSelection,
  matchesPartyListFilter,
  readCustomerMeta,
} from '../../utils/customerMeta'
import { formatEInvoiceSyncLabel, getEInvoiceConnection } from '../../utils/eInvoiceConnectionStore'
import {
  INCOMING_E_INVOICES_EVENT,
  readIncomingEInvoices,
} from '../../utils/incomingEInvoicesStore'

function statusTone(status) {
  if (/içeri|onay|kabul/i.test(String(status || ''))) return 'text-emerald-300'
  if (/bekliyor/i.test(String(status || ''))) return 'text-orange-300'
  return 'text-gray-400'
}

function findFirstSupplier() {
  const settings = readCustomerMeta()
  return getCustomerProfiles().find((profile) => {
    const selected = getCustomerMetaSelection(profile, settings[profile.id] || {})
    return matchesPartyListFilter(selected.type, 'supplier')
  })
}

const LIST_CELL = 'text-xs font-extrabold tracking-wide text-gray-300'

export default function IncomingEInvoicesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState(() => readIncomingEInvoices())
  const [search, setSearch] = useState('')
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const connection = useMemo(() => getEInvoiceConnection(), [])

  useEffect(() => {
    function refresh() {
      setItems(readIncomingEInvoices())
    }
    window.addEventListener(INCOMING_E_INVOICES_EVENT, refresh)
    return () => window.removeEventListener(INCOMING_E_INVOICES_EVENT, refresh)
  }, [])

  useEffect(() => {
    if (searchParams.get('yeni') !== '1') return
    setSupplierModalOpen(true)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      if (!query) return true
      return [item.supplier, item.invoiceNo, item.status].some((value) =>
        String(value).toLowerCase().includes(query),
      )
    })
  }, [items, search])

  const stats = useMemo(() => {
    const pending = items.filter(
      (item) => !item.imported && /bekliyor/i.test(String(item.status || '')),
    )
    const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const pendingTotal = pending.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    return {
      totalRecords: items.length,
      grandTotal: total,
      pendingCount: pending.length,
      pendingTotal,
    }
  }, [items])

  function openPurchaseInvoice(supplier) {
    setSupplierModalOpen(false)
    if (supplier?.id) {
      navigate(`/musteriler/${supplier.id}/belge/alis-faturasi`)
      return
    }
    navigate('/giderler/tedarikciler')
  }

  function handleQuickCreate() {
    openPurchaseInvoice(findFirstSupplier())
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Gelen E-Faturalar"
        actions={
          <SplitCreateButton
            label="Yeni Alış Faturası Oluştur"
            onPrimaryClick={handleQuickCreate}
            menuAriaLabel="Alış faturası seçenekleri"
            menuItems={[
              {
                id: 'supplier',
                label: 'Tedarikçi Seçerek Oluştur',
                icon: Handshake,
                iconClassName: 'text-orange-300',
                onClick: () => setSupplierModalOpen(true),
              },
              {
                id: 'draft',
                label: 'Hızlı Alış Faturası',
                icon: Receipt,
                iconClassName: 'text-rose-300',
                onClick: handleQuickCreate,
              },
            ]}
          />
        }
      />

      <div
        className={`${APP_SURFACE_PANEL_CLASS} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
            <Wifi className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold tracking-wide text-emerald-300">
              {connection.statusLabel} · {connection.provider}
            </p>
            <p className="truncate text-[11px] font-semibold text-gray-500">
              Alias: {connection.gibAlias} · Son senkron:{' '}
              {formatEInvoiceSyncLabel(connection.lastSyncAt)}
              {connection.demoMode ? ' · Demo bağlantı' : ''}
            </p>
          </div>
        </div>
        <Link
          to="/e-belgeler/gelen"
          className="rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-extrabold tracking-wide text-emerald-300 hover:bg-emerald-500/20"
        >
          Canlı Nilvera gelen kutusu
        </Link>
      </div>

      <SummaryMetrics
        columns={4}
        items={[
          {
            title: 'Toplam Kayıt',
            value: stats.totalRecords,
            icon: FileText,
            tone: 'blue',
            valueTone: 'blue',
          },
          {
            title: 'Genel Toplam',
            value: formatTL(stats.grandTotal),
            icon: Receipt,
            tone: 'emerald',
            valueTone: 'emerald',
          },
          {
            title: 'Bekleyen',
            value: stats.pendingCount,
            icon: FileText,
            tone: 'orange',
            valueTone: 'orange',
          },
          {
            title: 'Bekleyen Tutar',
            value: formatTL(stats.pendingTotal),
            icon: Receipt,
            tone: 'red',
            valueTone: 'red',
          },
        ]}
      />

      <AppPagePanel
        title="Gelen E-Fatura Kutusu"
        action={
          <span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-extrabold tracking-wide text-blue-300">
            {filtered.length} fatura
          </span>
        }
      >
        <SearchInput
          wrapperClassName="mb-4 w-full max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tedarikçi veya fatura no ara..."
        />

        <DataTable
          emptyTitle="Gelen fatura bulunamadı"
          emptyDescription="Yeni alış faturası oluşturun veya aramayı temizleyin."
          data={filtered}
          getRowId={(item) => item.id}
          onRowClick={(item) => navigate(`/giderler/gelen-e-faturalar/${item.id}`)}
          columns={[
            {
              id: 'supplier',
              header: 'Tedarikçi',
              sortable: true,
              accessorKey: 'supplier',
              cell: (item) => (
                <span className="flex min-w-0 items-center gap-2.5">
                  <EFaturaBadge />
                  <span className="min-w-0">
                    <span className={`block truncate ${LIST_CELL}`}>{item.supplier}</span>
                    <span className={`block text-[11px] font-semibold ${statusTone(item.status)}`}>
                      {item.status}
                    </span>
                  </span>
                </span>
              ),
            },
            {
              id: 'invoiceNo',
              header: 'Fatura No',
              sortable: true,
              accessorKey: 'invoiceNo',
              cell: (item) => (
                <span className={`block truncate ${LIST_CELL}`}>{item.invoiceNo}</span>
              ),
            },
            {
              id: 'date',
              header: 'Tarih',
              sortable: true,
              accessorKey: 'date',
              hideOnMobile: true,
              cell: (item) => <span className={LIST_CELL}>{item.date}</span>,
            },
            {
              id: 'amount',
              header: 'Tutar',
              sortable: true,
              accessorKey: 'amount',
              className: 'text-right',
              cell: (item) => (
                <span className={`${LIST_CELL} tabular-nums text-[#e11d48]`}>
                  {formatTL(item.amount)}
                </span>
              ),
            },
          ]}
        />
      </AppPagePanel>

      <CreateCustomerPickModal
        open={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSelect={openPurchaseInvoice}
        listKind="supplier"
        title="Tedarikçi Seçin"
        description="Alış faturası oluşturmak için tedarikçi seçin."
        searchPlaceholder="Tedarikçi ara..."
        emptyLabel="Tedarikçi bulunamadı."
      />
    </AppPageShell>
  )
}
