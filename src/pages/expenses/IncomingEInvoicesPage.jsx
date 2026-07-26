import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FileText, Handshake, Receipt } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import SearchInput from '../../components/Common/SearchInput'
import ListHeaderRow from '../../components/Common/ListHeaderRow'
import SplitCreateButton from '../../components/Common/SplitCreateButton'
import CreateCustomerPickModal from '../../components/Common/CreateCustomerPickModal'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { EFaturaBadge } from '../../components/Common/EFaturaMark'
import { formatTL } from '../../utils/productPricing'
import { getCustomerProfiles } from '../../data/customerProfiles'
import {
  getCustomerMetaSelection,
  matchesPartyListFilter,
  readCustomerMeta,
} from '../../utils/customerMeta'
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

const LIST_GRID = 'minmax(200px,1.2fr) 150px 120px minmax(120px,1fr)'

export default function IncomingEInvoicesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState(() => readIncomingEInvoices())
  const [search, setSearch] = useState('')
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)

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
          <span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">
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

        <ListHeaderRow
          gridTemplate={LIST_GRID}
          columns={['Tedarikçi', 'Fatura No', 'Tarih', { label: 'Tutar', align: 'right' }]}
        />

        <div className="mt-2 space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-dark-500/45 bg-dark-900/40 px-4 py-12 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-gray-600" />
              <p className="text-sm font-bold text-gray-400">Gelen fatura bulunamadı</p>
              <p className="mt-1 text-xs text-gray-600">
                Yeni alış faturası oluşturun veya aramayı temizleyin.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <Link
                key={item.id}
                to={`/giderler/gelen-e-faturalar/${item.id}`}
                className="grid w-full cursor-pointer items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3 text-left transition-colors hover:border-rose-500/35 hover:bg-dark-800/80"
                style={{ gridTemplateColumns: LIST_GRID }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <EFaturaBadge />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{item.supplier}</p>
                    <p className={`text-[12px] font-semibold ${statusTone(item.status)}`}>
                      {item.status}
                    </p>
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-300">{item.invoiceNo}</p>
                <p className="text-xs text-gray-400">{item.date}</p>
                <p className="text-right text-sm font-black text-rose-300">
                  {formatTL(item.amount)}
                </p>
              </Link>
            ))
          )}
        </div>
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
