import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator, Package, Truck } from 'lucide-react'
import { loadDepoItems } from '../../utils/depoStore'
import { resolveStockScope } from '../../utils/stockScope'
import {
  computeDepoLineTotals,
  customerLabel,
  formatMoney,
} from '../../utils/depoHelpers'
import { getCustomerDisplay } from '../../utils/customerDisplay'
import { formatCustomerAddress, getCustomerCoordinates } from '../../utils/customerGeo'
import {
  createEmptyGood,
  createEmptyStop,
  createTripDraft,
  upsertTrip,
} from '../../utils/sevkiyatStore'
import { YF_TEXT_CLASS, YF_TEXT_ON_COLOR_CLASS } from '../../utils/dashboardDesign'
import {
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../Layout/HeaderCashActionsPanel'

function matchCustomer(itemCustomer, customer) {
  const a = String(customerLabel(itemCustomer) || '').toLowerCase()
  const b = String(
    customer?.companyTitle || customer?.shortBrandName || customer?.company || customer?.name || '',
  ).toLowerCase()
  if (!a || !b) return false
  return a.includes(b.slice(0, 8)) || b.includes(a.slice(0, 8))
}

function hashSeed(value) {
  const text = String(value || '')
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 9973
  }
  return hash
}

function resolvePackaging(item) {
  const raw = String(
    item.packagingType || item.packType || item.loadMode || item.unitType || '',
  ).toLowerCase()
  if (raw.includes('koli') || raw.includes('carton') || raw === 'box') return 'koli'
  if (raw.includes('paket') || raw.includes('pack') || raw.includes('barkod')) return 'paketli'
  if (item.barcodes?.length || item.barcode || item.barkod) return 'paketli'
  if (Number(item.boxCount) > 0 || Number(item.koliCount) > 0) return 'koli'
  return 'adet'
}

function resolveLocation(item, packaging) {
  const shelfRow =
    item.shelfRow || item.rafSira || item.aisle || item.row || `R${(hashSeed(item.id) % 12) + 1}`
  const shelfNo =
    item.shelfNo || item.rafNo || item.bin || item.slot || String((hashSeed(`${item.id}-s`) % 24) + 1)
  const sectionRow =
    item.sectionRow ||
    item.bolumSira ||
    item.zone ||
    item.section ||
    `B${(hashSeed(`${item.id}-z`) % 8) + 1}`
  const sectionNo =
    item.sectionNo ||
    item.bolumNo ||
    item.sectionSlot ||
    String((hashSeed(`${item.id}-n`) % 18) + 1)

  if (packaging === 'koli') {
    return {
      kind: 'koli',
      label: 'Bölüm',
      row: sectionRow,
      no: sectionNo,
      detail: `Bölüm ${sectionRow} · No ${sectionNo}`,
    }
  }

  return {
    kind: packaging === 'paketli' ? 'paketli' : 'raf',
    label: 'Raf',
    row: shelfRow,
    no: shelfNo,
    detail: `Raf sırası ${shelfRow} · No ${shelfNo}`,
  }
}

function resolveBarcodes(item, packaging, quantity) {
  const fromArray = Array.isArray(item.barcodes)
    ? item.barcodes.map(String).filter(Boolean)
    : []
  const single = item.barcode || item.barkod || item.productBarcode
  if (fromArray.length) return fromArray
  if (single) return [String(single)]
  if (packaging !== 'paketli') return []
  const count = Math.min(Math.max(Number(quantity) || 1, 1), 6)
  return Array.from({ length: count }, (_, index) => {
    const suffix = String((hashSeed(`${item.id}-${index}`) % 900000) + 100000)
    return `PK-${suffix}-${String(index + 1).padStart(2, '0')}`
  })
}

function resolveQuantity(item) {
  return (
    Number(item.quantity) ||
    Number(item.producedQuantity) ||
    Number(item.deliveredQuantity) ||
    Number(item.soldQuantity) ||
    0
  )
}

function enrichStockRow(item) {
  const quantity = resolveQuantity(item)
  const packaging = resolvePackaging(item)
  const location = resolveLocation(item, packaging)
  const barcodes = resolveBarcodes(item, packaging, quantity)
  const totals = computeDepoLineTotals({
    ...item,
    producedQuantity: quantity || Number(item.producedQuantity) || 0,
  })
  const stockValue =
    totals.gross ||
    quantity * (Number(item.unitPrice) || Number(item.price) || 0) ||
    0

  return {
    ...item,
    quantity,
    packaging,
    location,
    barcodes,
    stockValue,
  }
}

const PACK_LABEL = {
  paketli: 'Paketli',
  koli: 'Koli',
  adet: 'Adet',
}

export default function CustomerStockPanel({ customer, embedded = false }) {
  const navigate = useNavigate()
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [notice, setNotice] = useState('')

  const items = useMemo(() => {
    return loadDepoItems()
      .filter(
        (row) => resolveStockScope(row) === 'customer' && matchCustomer(row.customer, customer),
      )
      .map(enrichStockRow)
  }, [customer])

  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = items.reduce((sum, item) => sum + (Number(item.stockValue) || 0), 0)
  const selectedItems = items.filter((item) => selectedIds.has(item.id))

  function toggleItem(id) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds((current) => {
      if (current.size === items.length) return new Set()
      return new Set(items.map((item) => item.id))
    })
  }

  function handleLoadCalc() {
    const ids = (selectedItems.length ? selectedItems : items).map((item) => item.id).join(',')
    navigate(
      `/lojistik/yukleme-plani?customerId=${encodeURIComponent(customer.id || '')}${ids ? `&stockIds=${encodeURIComponent(ids)}` : ''}`,
    )
  }

  function handleShipOut() {
    const payload = selectedItems.length ? selectedItems : items
    if (!payload.length) {
      setNotice('Sevkiyata çıkarılacak stok kalemi yok.')
      return
    }

    const display = getCustomerDisplay(customer)
    const coords = getCustomerCoordinates(customer)
    const stop = {
      ...createEmptyStop(1),
      customerId: customer.id,
      customerLabel: display.brandShortName || customer.company || customer.name || '',
      address: formatCustomerAddress(customer),
      city: customer.city || '',
      lat: coords.lat,
      lng: coords.lng,
      goods: payload.map((item) => ({
        ...createEmptyGood(),
        label: item.product || item.productCode || 'Stok',
        qty: item.quantity || 1,
        unit: item.packaging === 'koli' ? 'koli' : item.packaging === 'paketli' ? 'paket' : 'adet',
        note: item.location.detail,
        depoItemId: item.id,
        barcodes: item.barcodes,
      })),
    }

    const trip = upsertTrip(
      createTripDraft({
        stops: [stop],
        note: `${display.brandShortName || 'Müşteri'} stok sevkiyatı`,
      }),
    )

    setNotice(`${trip.code} taslak sevkiyat oluşturuldu.`)
    navigate(`/sevkiyat/${trip.id}`)
  }

  return (
    <section className={embedded ? 'space-y-4' : 'card customer-stock-panel space-y-4'}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        {embedded ? (
          <p className={`min-w-0 ${YF_TEXT_CLASS} !text-[12px]`}>
            Depodaki müşteri stoğu · raf / bölüm · barkod
          </p>
        ) : (
          <div className="min-w-0">
            <h2 className={`${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>Müşteri Stoğu</h2>
            <p className={`mt-1 ${YF_TEXT_CLASS} !text-[12px]`}>
              Depodaki müşteri stoğu · raf / bölüm · barkod
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLoadCalc}
            className={`${HEADER_ACTION_CTA_CLASS} !h-10 !min-h-10 ${HEADER_ACTION_GRADIENTS.violet}`}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span className={YF_TEXT_ON_COLOR_CLASS}>Yük Hesapla</span>
          </button>
          <button
            type="button"
            onClick={handleShipOut}
            className={`${HEADER_ACTION_CTA_CLASS} !h-10 !min-h-10 ${HEADER_ACTION_GRADIENTS.success}`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span className={YF_TEXT_ON_COLOR_CLASS}>Sevkiyata Çıkar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['Toplam stok', `${totalQty}`],
          ['Kalem', `${items.length}`],
          ['Depo stok değeri', formatMoney(totalValue)],
          ['Seçili', `${selectedItems.length || 0}`],
        ].map(([label, value]) => (
          <div key={label} className="glass-inset rounded-xl px-3 py-2.5">
            <p className={YF_TEXT_CLASS}>{label}</p>
            <p className="mt-1 tabular-nums text-[14px] font-bold leading-tight tracking-normal text-[var(--ink)]">
              {value}
            </p>
          </div>
        ))}
      </div>

      {notice ? (
        <p className={`${YF_TEXT_CLASS} !text-emerald-700`}>{notice}</p>
      ) : null}

      {!items.length ? (
        <p className={`flex items-center gap-2 ${YF_TEXT_CLASS}`}>
          <Package className="h-4 w-4 shrink-0" />
          Bu müşteriye bağlı depo stoğu yok.
        </p>
      ) : (
        <div className="space-y-2">
          <label className={`flex items-center gap-2 ${YF_TEXT_CLASS}`}>
            <input
              type="checkbox"
              checked={selectedIds.size === items.length && items.length > 0}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-ds-border accent-blue-500"
            />
            Tümünü seç
          </label>

          {items.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 rounded-xl border border-[var(--glass-border)] bg-[rgba(255,255,255,0.08)] px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.id)}
                  onChange={() => toggleItem(row.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-ds-border accent-blue-500"
                />
                <span className="min-w-0">
                  <span className={`block ${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>
                    {row.product || row.productCode || 'Stok kalemi'}
                  </span>
                  <span className={`mt-1 block ${YF_TEXT_CLASS} !text-[12px]`}>
                    {row.productCode || '—'} · {PACK_LABEL[row.packaging] || 'Adet'} ·{' '}
                    {row.location.detail}
                  </span>
                  {row.barcodes.length ? (
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {row.barcodes.map((code) => (
                        <span
                          key={code}
                          className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--ink)]"
                        >
                          {code}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </span>
              </label>

              <div className="flex shrink-0 flex-col items-end gap-1 sm:pl-3">
                <p className="tabular-nums text-[14px] font-bold leading-tight text-[var(--ink)]">
                  {row.quantity} adet
                </p>
                <p className={`${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>
                  {formatMoney(row.stockValue)}
                </p>
                <p className={`${YF_TEXT_CLASS} !text-[12px]`}>
                  {row.location.label} {row.location.row}/{row.location.no}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
