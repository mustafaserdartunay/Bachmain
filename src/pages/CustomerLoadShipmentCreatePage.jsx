import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Minus,
  Package,
  Pencil,
  Plus,
  Save,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
  AppPanelDot,
} from '../components/Layout/AppPageLayout'
import {
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../components/Layout/HeaderCashActionsPanel'
import EditableDropdownPill from '../components/EditableDropdownPill'
import { findCustomerProfile } from '../data/customerProfiles'
import { getCustomerDisplay } from '../utils/customerDisplay'
import { formatCustomerAddress, getCustomerCoordinates } from '../utils/customerGeo'
import {
  APP_PANEL_TITLE_CLASS,
  PAGE_CENTER_TITLE_CLASS,
  PAGE_FILTER_FIELD_CLASS,
  PAGE_FILTER_LABEL_CLASS,
  PAGE_FILTER_MENU_CLASS,
  PAGE_FILTER_PILL_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  YF_TEXT_CLASS,
  YF_TEXT_ON_COLOR_CLASS,
} from '../utils/dashboardDesign'
import { loadDepoItems } from '../utils/depoStore'
import { resolveStockScope } from '../utils/stockScope'
import { upsertLoadPlan } from '../utils/logisticsStore'
import {
  computeLoadPlan,
  fmtKg,
  GRID_MODULES,
  itemInitials,
  LOAD_PRESETS,
  SLOT_COLORS,
  TRUCK_PRESETS,
} from '../utils/truckLoadCalc'
import {
  createEmptyGood,
  createEmptyStop,
  createTripDraft,
  loadVehicleTypes,
  saveVehicleTypes,
  upsertTrip,
} from '../utils/sevkiyatStore'
import { COP_KUTUSU_BUTTON_CLASS, COP_KUTUSU_ICON_CLASS } from '../utils/buttonStyles'
import '../components/Logistics/truck-load-calculator.css'

const INPUT_CLASS =
  'h-9 w-full rounded-xl border border-[var(--glass-border)] bg-transparent px-3 text-[14px] font-normal leading-tight text-[var(--ink)] outline-none focus:border-blue-400'

const TRUCK_OPTIONS = Object.values(TRUCK_PRESETS)
const MODULE_OPTIONS = Object.values(GRID_MODULES)

function HeaderCta({ icon: Icon, label, gradient, onClick, to }) {
  const className = `${HEADER_ACTION_CTA_CLASS} ${gradient}`
  const body = (
    <>
      <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
        <Icon className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} aria-hidden />
      </span>
      <span className={YF_TEXT_ON_COLOR_CLASS}>{label}</span>
    </>
  )
  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  )
}

function Field({ label, children }) {
  return (
    <label className="grid gap-1">
      <span className={YF_TEXT_CLASS}>{label}</span>
      {children}
    </label>
  )
}

function matchCustomer(itemCustomer, customer) {
  const a = String(itemCustomer || '').toLowerCase()
  const b = String(
    customer?.companyTitle || customer?.shortBrandName || customer?.company || customer?.name || '',
  ).toLowerCase()
  if (!a || !b) return false
  return a.includes(b.slice(0, 8)) || b.includes(a.slice(0, 8))
}

function stockUnit(item) {
  const raw = String(item.packagingType || item.packType || item.unitType || '').toLowerCase()
  if (raw.includes('koli') || raw.includes('carton')) return 'koli'
  if (raw.includes('paket') || raw.includes('pack')) return 'paket'
  return 'adet'
}

function stockToLoadItem(item) {
  const qty =
    Number(item.quantity) ||
    Number(item.producedQuantity) ||
    Number(item.deliveredQuantity) ||
    Number(item.soldQuantity) ||
    1
  const unit = stockUnit(item)
  const preset =
    unit === 'koli'
      ? LOAD_PRESETS.find((row) => row.name.includes('Orta'))
      : unit === 'paket'
        ? LOAD_PRESETS.find((row) => row.name.includes('Küçük'))
        : LOAD_PRESETS.find((row) => row.name.includes('Europalet'))
  return {
    id: item.id,
    name: item.product || item.productCode || 'Stok',
    qty,
    L: Number(item.lengthCm || preset?.L || 60),
    W: Number(item.widthCm || preset?.W || 40),
    H: Number(item.heightCm || preset?.H || 40),
    weight: Number(item.weightKg || item.unitWeight || preset?.weight || 10),
    stackable: unit !== 'adet' ? Boolean(preset?.stackable) : false,
    unit,
    source: 'stock',
    productCode: item.productCode || '',
    note: item.shelfNo || item.rafNo || item.bin || '',
  }
}

function CabSvg() {
  return (
    <svg width="90" height="150" viewBox="0 0 90 150" aria-hidden className="tlc-cab">
      <rect x="18" y="30" width="55" height="70" rx="8" fill="#0f172a" />
      <rect x="26" y="38" width="38" height="26" rx="4" fill="#bfdbfe" />
      <rect x="10" y="95" width="70" height="10" rx="4" fill="#0f172a" />
      <circle cx="30" cy="112" r="11" fill="#1e293b" />
      <circle cx="30" cy="112" r="4.5" fill="#bfdbfe" />
      <circle cx="62" cy="112" r="11" fill="#1e293b" />
      <circle cx="62" cy="112" r="4.5" fill="#bfdbfe" />
    </svg>
  )
}

function badgeTone(pct) {
  if (pct > 100) return 'tlc-badge--bad'
  if (pct > 85) return 'tlc-badge--warn'
  return 'tlc-badge--ok'
}

export default function CustomerLoadShipmentCreatePage() {
  const navigate = useNavigate()
  const { customerId: routeCustomerId } = useParams()
  const [searchParams] = useSearchParams()
  const customerId = routeCustomerId || searchParams.get('customer') || ''
  const stockIdsParam = searchParams.get('stockIds') || ''
  const customer = useMemo(() => findCustomerProfile(customerId), [customerId])
  const display = getCustomerDisplay(customer)
  const backTo = customer?.id ? `/musteriler/${customer.id}` : '/musteriler'

  const stockItems = useMemo(() => {
    if (!customer) return []
    return loadDepoItems()
      .filter(
        (row) => resolveStockScope(row) === 'customer' && matchCustomer(row.customer, customer),
      )
      .map(stockToLoadItem)
  }, [customer])

  const initialSelected = useMemo(() => {
    const fromQuery = stockIdsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
    if (fromQuery.length) {
      return new Set(fromQuery.filter((id) => stockItems.some((item) => item.id === id)))
    }
    return new Set(stockItems.map((item) => item.id))
  }, [stockIdsParam, stockItems])

  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [stockQtyOverrides, setStockQtyOverrides] = useState({})
  const [manualItems, setManualItems] = useState([])
  const [truckKey, setTruckKey] = useState('kamyon_kucuk')
  const [moduleKey, setModuleKey] = useState('euro')
  const [zoom, setZoom] = useState(1)
  const [editingItemId, setEditingItemId] = useState(null)
  const [note, setNote] = useState('')
  const [vehicleTypes, setVehicleTypes] = useState(() => loadVehicleTypes())
  const [activeMenu, setActiveMenu] = useState(null)
  const [error, setError] = useState('')

  const [trip, setTrip] = useState(() => createTripDraft())

  useEffect(() => {
    setSelectedIds(new Set(initialSelected))
    setStockQtyOverrides({})
    setEditingItemId(null)
  }, [initialSelected])

  useEffect(() => {
    if (!customer) return
    const coords = getCustomerCoordinates(customer)
    const label = display.brandShortName || display.companyTitle || customer.company || ''
    setTrip((current) => {
      const stop = {
        ...(current.stops?.[0] || createEmptyStop(1)),
        customerId: customer.id,
        customerLabel: label,
        address: formatCustomerAddress(customer),
        city: customer.city || '',
        lat: coords.lat,
        lng: coords.lng,
      }
      return {
        ...current,
        note: current.note || `${label} yük ve sevkiyat`,
        stops: [stop],
      }
    })
    setNote(`${label} yük planı`)
  }, [customer?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeMenu) return undefined
    function close() {
      setActiveMenu(null)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [activeMenu])

  const selectedStock = useMemo(
    () =>
      stockItems
        .filter((item) => selectedIds.has(item.id))
        .map((item) => ({
          ...item,
          qty: Math.max(1, Number(stockQtyOverrides[item.id] ?? item.qty) || 1),
        })),
    [stockItems, selectedIds, stockQtyOverrides],
  )
  const loadItems = useMemo(() => {
    const rows = [...selectedStock, ...manualItems]
    return rows.map((item, index) => ({
      ...item,
      colorIdx: Number.isFinite(item.colorIdx) ? item.colorIdx : index % SLOT_COLORS.length,
    }))
  }, [selectedStock, manualItems])

  const truck = TRUCK_PRESETS[truckKey] || TRUCK_PRESETS.kamyon_kucuk
  const module = GRID_MODULES[moduleKey] || GRID_MODULES.euro
  const plan = useMemo(() => computeLoadPlan(truck, module, loadItems), [truck, module, loadItems])
  const cell = Math.round(56 * zoom)
  const editingItem = loadItems.find((item) => item.id === editingItemId) || null

  useEffect(() => {
    setTrip((current) => {
      const stop = current.stops?.[0] || createEmptyStop(1)
      const goods = loadItems.map((item) => ({
        ...createEmptyGood(),
        id: `good-${item.id}`,
        label: item.name,
        qty: item.qty,
        unit: item.unit || 'adet',
        note: item.note || item.productCode || '',
        depoItemId: item.source === 'stock' ? item.id : undefined,
      }))
      return {
        ...current,
        stops: [{ ...stop, goods }],
      }
    })
  }, [loadItems])

  const vehicleTypeOptions = vehicleTypes.map((item) => ({
    label: item.label,
    color: item.color || 'bg-blue-500',
    id: item.id,
  }))

  function toggleStock(id) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllStock() {
    setSelectedIds((current) => {
      if (current.size === stockItems.length) return new Set()
      return new Set(stockItems.map((item) => item.id))
    })
  }

  function addManualItem(presetName) {
    const preset = LOAD_PRESETS.find((row) => row.name === presetName) || LOAD_PRESETS[2]
    const id = `manual-${Date.now()}-${manualItems.length}`
    const colorIdx = (selectedStock.length + manualItems.length) % SLOT_COLORS.length
    setManualItems((current) => [
      ...current,
      {
        id,
        name: preset.name,
        qty: 1,
        L: preset.L,
        W: preset.W,
        H: preset.H,
        weight: preset.weight,
        stackable: preset.stackable,
        unit: preset.name.toLowerCase().includes('koli') ? 'koli' : 'adet',
        source: 'manual',
        colorIdx,
      },
    ])
    setEditingItemId(id)
  }

  function updateManualItem(id, patch) {
    setManualItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  function updateLoadItem(id, patch) {
    if (manualItems.some((item) => item.id === id)) {
      updateManualItem(id, patch)
      return
    }
    if (patch.qty != null) {
      setStockQtyOverrides((current) => ({ ...current, [id]: Math.max(1, Number(patch.qty) || 1) }))
    }
  }

  function removeLoadItem(id) {
    if (manualItems.some((item) => item.id === id)) {
      removeManualItem(id)
      return
    }
    setSelectedIds((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
    setStockQtyOverrides((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
    if (editingItemId === id) setEditingItemId(null)
  }

  function removeManualItem(id) {
    setManualItems((current) => current.filter((item) => item.id !== id))
    if (editingItemId === id) setEditingItemId(null)
  }

  function handleEmptySlotClick() {
    addManualItem(LOAD_PRESETS[2]?.name || 'Koli — Orta')
  }

  function handleFilledSlotClick(item) {
    setEditingItemId(item.id)
  }

  function patchTrip(patch) {
    setTrip((current) => ({ ...current, ...patch }))
  }

  function updateGood(goodId, patch) {
    setTrip((current) => {
      const stop = current.stops?.[0]
      if (!stop) return current
      return {
        ...current,
        stops: [
          {
            ...stop,
            goods: (stop.goods || []).map((good) =>
              good.id === goodId ? { ...good, ...patch } : good,
            ),
          },
        ],
      }
    })
  }

  function handleSave() {
    setError('')
    if (!customer?.id) {
      setError('Müşteri bulunamadı.')
      return
    }
    if (!loadItems.length) {
      setError('En az bir yük kalemi seçin veya ekleyin.')
      return
    }
    if (!trip.plate?.trim()) {
      setError('Sevkiyat için plaka girin.')
      return
    }

    const loadPlan = upsertLoadPlan({
      customerId: customer.id,
      customerLabel: display.brandShortName || display.companyTitle || customer.company || '',
      note,
      truckKey,
      truckName: truck.name,
      moduleKey,
      moduleName: module.name,
      items: loadItems,
      metrics: {
        fillPct: plan.fillPct,
        weightPct: plan.weightPct,
        slotPct: plan.slotPct,
        totalWeight: plan.totalWeight,
        totalSlots: plan.totalSlots,
        totalSlotsUsed: plan.totalSlotsUsed,
      },
      warnings: plan.warnings,
      status: 'planned',
    })

    const stop = {
      ...(trip.stops?.[0] || createEmptyStop(1)),
      customerId: customer.id,
      customerLabel: display.brandShortName || display.companyTitle || customer.company || '',
      address: formatCustomerAddress(customer) || trip.stops?.[0]?.address || '',
      city: customer.city || '',
    }

    const savedTrip = upsertTrip({
      ...trip,
      status: 'planned',
      loadPlanId: loadPlan.id,
      loadPlanCode: loadPlan.code,
      note: trip.note || note,
      stops: [stop],
    })

    navigate(`/sevkiyat/${savedTrip.id}`, {
      replace: true,
      state: { notice: `${loadPlan.code} yük planı ve ${savedTrip.code} sevkiyat oluşturuldu.` },
    })
  }

  if (!customer) {
    return (
      <AppPageShell className="customers-page-type w-full">
        <AppPageHeader
          showBack={false}
          title={<AppPageBackLink to="/musteriler" label="Müşteriler" />}
          centerTitle={'YÜK VE SEVKİYAT'.toLocaleUpperCase('tr-TR')}
          centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
          titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
        />
        <AppPagePanel className="w-full">
          <p className={YF_TEXT_CLASS}>Müşteri bulunamadı. Müşteri kartından tekrar deneyin.</p>
        </AppPagePanel>
      </AppPageShell>
    )
  }

  return (
    <AppPageShell className="customers-page-type customer-load-shipment-page w-full space-y-4">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink to={backTo} label="Müşteri" />}
        centerTitle={'Yük ve Sevkiyat'.toLocaleUpperCase('tr-TR')}
        centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <HeaderCta
              icon={X}
              label="Vazgeç"
              gradient={HEADER_ACTION_GRADIENTS.danger}
              to={backTo}
            />
            <HeaderCta
              icon={Save}
              label="Kaydet"
              gradient={HEADER_ACTION_GRADIENTS.success}
              onClick={handleSave}
            />
          </div>
        }
      />

      <AppPagePanel className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>
              {display.brandShortName || display.companyTitle || customer.company}
            </p>
            <p className={`mt-1 ${YF_TEXT_CLASS} !text-[12px]`}>
              {formatCustomerAddress(customer) || 'Adres tanımlı değil'}
            </p>
          </div>
          <span className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-[var(--muted)]">
            Tek sayfa · yük + sevkiyat
          </span>
        </div>
      </AppPagePanel>

      {error ? (
        <p className={`${YF_TEXT_CLASS} rounded-2xl border border-rose-300/50 bg-rose-50/70 px-4 py-3 !font-bold !text-rose-700`}>
          {error}
        </p>
      ) : null}

      <AppPagePanel className="w-full space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AppPanelDot color="violet" />
            <h2 className={APP_PANEL_TITLE_CLASS}>Yük Oluşturma :</h2>
          </div>
          <span className={`${YF_TEXT_CLASS} inline-flex items-center gap-1.5`}>
            <Package className="h-3.5 w-3.5" />
            {loadItems.length} kalem
          </span>
        </div>

        <div className="tlc customer-load-truck-visual space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Araç tipi">
              <select
                className={INPUT_CLASS}
                value={truckKey}
                onChange={(event) => setTruckKey(event.target.value)}
              >
                {TRUCK_OPTIONS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Yerleşim modülü (grid)">
              <select
                className={INPUT_CLASS}
                value={moduleKey}
                onChange={(event) => setModuleKey(event.target.value)}
              >
                {MODULE_OPTIONS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Yük notu">
              <input
                className={INPUT_CLASS}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Örn. sabah sevkiyatı"
              />
            </Field>
          </div>

          <div className="tlc-kpis">
            <div className="tlc-card tlc-kpi">
              <div className="tlc-kpi__top">
                <span className="tlc-kpi__label">Ağırlık</span>
                <span className={`tlc-badge ${badgeTone(plan.weightPct)}`}>%{plan.weightPct}</span>
              </div>
              <div className="tlc-kpi__value">
                {fmtKg(plan.totalWeight)} / {fmtKg(truck.maxWeight)} kg
              </div>
            </div>
            <div className="tlc-card tlc-kpi">
              <div className="tlc-kpi__top">
                <span className="tlc-kpi__label">Slot / Pozisyon</span>
                <span className={`tlc-badge ${badgeTone(plan.slotPct)}`}>%{plan.slotPct}</span>
              </div>
              <div className="tlc-kpi__value">
                {plan.totalSlotsUsed} / {plan.totalSlots}
              </div>
            </div>
            <div className="tlc-card tlc-kpi">
              <div className="tlc-kpi__top">
                <span className="tlc-kpi__label">Doluluk</span>
                <span className="tlc-badge tlc-badge--info">Taban</span>
              </div>
              <div className="tlc-kpi__value">%{plan.fillPct}</div>
            </div>
            <div className="tlc-card tlc-kpi">
              <div className="tlc-kpi__top">
                <span className="tlc-kpi__label">Araç ölçü</span>
                <span className="tlc-badge tlc-badge--info">cm</span>
              </div>
              <div className="tlc-kpi__value">
                {truck.L}×{truck.W}×{truck.H}
              </div>
            </div>
          </div>

          {plan.warnings?.length ? (
            <div className="space-y-1 rounded-2xl border border-amber-300/50 bg-amber-50/60 px-3 py-2">
              {plan.warnings.map((warning) => (
                <p key={warning} className={`${YF_TEXT_CLASS} !text-amber-800`}>
                  {warning}
                </p>
              ))}
            </div>
          ) : null}

          <div className="tlc-card tlc-panel">
            <div className="tlc-panel__head">
              <h3>Araç Yerleşim Görünümü</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="tlc-icon-btn"
                  onClick={() => setZoom((value) => Math.max(0.6, +(value - 0.2).toFixed(1)))}
                  aria-label="Uzaklaştır"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="tlc-icon-btn"
                  onClick={() => setZoom((value) => Math.min(2, +(value + 0.2).toFixed(1)))}
                  aria-label="Yakınlaştır"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className={`mb-3 ${YF_TEXT_CLASS} !text-[12px]`}>
              Boş slota tıklayarak kalem ekleyin · dolu slota tıklayarak yük ayarını düzenleyin. Araç
              ve grid seçimi yerleşimi anında günceller.
            </p>

            <div className="tlc-stage">
              <CabSvg />
              <div className="tlc-grid-wrap">
                <div
                  className="tlc-grid"
                  style={{
                    gridTemplateColumns: `repeat(${plan.rowsAlongLength}, ${cell}px)`,
                    gridTemplateRows: `repeat(${plan.colsAcrossWidth}, ${cell}px)`,
                  }}
                >
                  {plan.slotOwner.map((ownerIdx, slotIndex) => {
                    if (ownerIdx == null) {
                      return (
                        <button
                          key={`empty-${slotIndex}`}
                          type="button"
                          className="tlc-slot tlc-slot--empty"
                          style={{ width: cell, height: cell }}
                          onClick={handleEmptySlotClick}
                        >
                          +
                        </button>
                      )
                    }
                    const item = plan.results[ownerIdx]
                    const tone = SLOT_COLORS[item.colorIdx % SLOT_COLORS.length]
                    const selected = editingItemId === item.id
                    return (
                      <div
                        key={`filled-${slotIndex}`}
                        className="tlc-slot tlc-slot--filled"
                        style={{
                          width: cell,
                          height: cell,
                          background: tone.bg,
                          color: tone.fg,
                          outline: selected ? `2px solid ${tone.fg}` : undefined,
                          outlineOffset: 1,
                        }}
                        title={item.name}
                        onClick={() => handleFilledSlotClick(item)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') handleFilledSlotClick(item)
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <span>{itemInitials(item.name)}</span>
                        <span style={{ fontWeight: 600 }}>
                          {fmtKg(item.weight / Math.max(1, item.qty))}kg
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="tlc-legend">
              {plan.results.length ? (
                plan.results.map((item) => {
                  const tone = SLOT_COLORS[item.colorIdx % SLOT_COLORS.length]
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-left hover:bg-black/5"
                      onClick={() => handleFilledSlotClick(item)}
                    >
                      <i style={{ background: tone.bg, border: `1px solid ${tone.fg}22` }} />
                      {item.name}{' '}
                      <span style={{ color: 'var(--tlc-faint)' }}>({item.slotsUsed} slot)</span>
                    </button>
                  )
                })
              ) : (
                <span style={{ color: 'var(--tlc-faint)' }}>Henüz yük eklenmedi.</span>
              )}
            </div>

            {editingItem ? (
              <div className="mt-4 grid gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 sm:grid-cols-[minmax(0,1.4fr)_5.5rem_5rem_5rem_5rem_auto_auto]">
                <input
                  className={INPUT_CLASS}
                  value={editingItem.name}
                  disabled={editingItem.source === 'stock'}
                  onChange={(event) => updateLoadItem(editingItem.id, { name: event.target.value })}
                />
                <input
                  className={INPUT_CLASS}
                  type="number"
                  min="1"
                  value={editingItem.qty}
                  onChange={(event) =>
                    updateLoadItem(editingItem.id, {
                      qty: Math.max(1, Number(event.target.value) || 1),
                    })
                  }
                  title="Adet"
                />
                <input
                  className={INPUT_CLASS}
                  type="number"
                  min="1"
                  value={editingItem.L}
                  disabled={editingItem.source === 'stock'}
                  onChange={(event) =>
                    updateLoadItem(editingItem.id, {
                      L: Math.max(1, Number(event.target.value) || 1),
                    })
                  }
                  title="Uzunluk cm"
                />
                <input
                  className={INPUT_CLASS}
                  type="number"
                  min="1"
                  value={editingItem.W}
                  disabled={editingItem.source === 'stock'}
                  onChange={(event) =>
                    updateLoadItem(editingItem.id, {
                      W: Math.max(1, Number(event.target.value) || 1),
                    })
                  }
                  title="Genişlik cm"
                />
                <input
                  className={INPUT_CLASS}
                  type="number"
                  min="0"
                  value={editingItem.weight}
                  disabled={editingItem.source === 'stock'}
                  onChange={(event) =>
                    updateLoadItem(editingItem.id, {
                      weight: Math.max(0, Number(event.target.value) || 0),
                    })
                  }
                  title="Kg / birim"
                />
                <button
                  type="button"
                  className="tlc-icon-btn tlc-icon-btn--sm"
                  onClick={() => setEditingItemId(null)}
                  aria-label="Düzenlemeyi kapat"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className={COP_KUTUSU_BUTTON_CLASS}
                  title="Kaldır"
                  onClick={() => removeLoadItem(editingItem.id)}
                >
                  <Trash2 className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} />
                </button>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-1.5">
              {LOAD_PRESETS.slice(0, 4).map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => addManualItem(preset.name)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-normal text-blue-600 hover:bg-[rgba(37,99,235,0.12)]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>Müşteri stoğu</p>
            <button
              type="button"
              onClick={toggleAllStock}
              className="text-[14px] font-normal text-blue-600"
            >
              {selectedIds.size === stockItems.length && stockItems.length
                ? 'Seçimi kaldır'
                : 'Tümünü seç'}
            </button>
          </div>

          {!stockItems.length ? (
            <p className={YF_TEXT_CLASS}>
              Bu müşteriye bağlı depo stoğu yok. Görseldeki boş slotlardan veya hazır
              kalemlerden ekleyebilirsiniz.
            </p>
          ) : (
            <div className="space-y-2">
              {stockItems.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-3"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleStock(item.id)}
                    className="mt-0.5 h-4 w-4 rounded border-ds-border accent-blue-500"
                  />
                  <span className="min-w-0 flex-1">
                    <span className={`block ${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>
                      {item.name}
                    </span>
                    <span className={`mt-1 block ${YF_TEXT_CLASS} !text-[12px]`}>
                      {item.productCode || '—'} · {stockQtyOverrides[item.id] ?? item.qty}{' '}
                      {item.unit} · {item.L}×{item.W}×{item.H} cm · {fmtKg(item.weight)} kg/birim
                    </span>
                  </span>
                  {selectedIds.has(item.id) ? (
                    <button
                      type="button"
                      className="text-[13px] font-normal text-blue-600"
                      onClick={(event) => {
                        event.preventDefault()
                        setEditingItemId(item.id)
                      }}
                    >
                      Görselde ayarla
                    </button>
                  ) : null}
                </label>
              ))}
            </div>
          )}
        </div>
      </AppPagePanel>

      <AppPagePanel className="w-full space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AppPanelDot color="blue" />
            <h2 className={APP_PANEL_TITLE_CLASS}>Sevkiyat Oluştur :</h2>
          </div>
          <span className={`${YF_TEXT_CLASS} inline-flex items-center gap-1.5`}>
            <Truck className="h-3.5 w-3.5" />
            {trip.code}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Plaka">
            <input
              className={INPUT_CLASS}
              value={trip.plate || ''}
              onChange={(event) => patchTrip({ plate: event.target.value })}
              placeholder="34 BM 0101"
            />
          </Field>
          <Field label="Şoför">
            <input
              className={INPUT_CLASS}
              value={trip.driverName || ''}
              onChange={(event) => patchTrip({ driverName: event.target.value })}
            />
          </Field>
          <Field label="Telefon">
            <input
              className={INPUT_CLASS}
              value={trip.driverPhone || ''}
              onChange={(event) => patchTrip({ driverPhone: event.target.value })}
            />
          </Field>
          <div className={PAGE_FILTER_FIELD_CLASS}>
            <p className={PAGE_FILTER_LABEL_CLASS}>Araç Türü :</p>
            <EditableDropdownPill
              value={trip.vehicleTypeLabel || 'Seçiniz'}
              options={vehicleTypeOptions}
              buttonClassName={PAGE_FILTER_PILL_CLASS}
              menuClassName={PAGE_FILTER_MENU_CLASS}
              openKey="load-ship-vehicle-type"
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              onOptionsChange={(next) => {
                const saved = saveVehicleTypes(
                  next.map((item) => ({
                    id: item.id || item.label,
                    label: item.label,
                    color: item.color,
                  })),
                )
                setVehicleTypes(saved)
              }}
              onChange={(value) => {
                const match = vehicleTypes.find((item) => item.label === value)
                patchTrip({
                  vehicleTypeLabel: value,
                  vehicleTypeId: match?.id || value,
                })
              }}
            />
          </div>
          <Field label="Sevkiyat notu">
            <input
              className={INPUT_CLASS}
              value={trip.note || ''}
              onChange={(event) => patchTrip({ note: event.target.value })}
            />
          </Field>
          <Field label="Teslim adresi">
            <input
              className={INPUT_CLASS}
              value={trip.stops?.[0]?.address || ''}
              onChange={(event) =>
                setTrip((current) => ({
                  ...current,
                  stops: [
                    {
                      ...(current.stops?.[0] || createEmptyStop(1)),
                      address: event.target.value,
                    },
                  ],
                }))
              }
            />
          </Field>
        </div>

        <div className="rounded-[20px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className={`${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>
              Durak · {trip.stops?.[0]?.customerLabel || display.brandShortName}
            </p>
            <p className={`${YF_TEXT_CLASS} !text-[12px]`}>Yük kalemleri sevkiyata otomatik aktarılır</p>
          </div>
          <div className="space-y-2">
            {(trip.stops?.[0]?.goods || []).length === 0 ? (
              <p className={YF_TEXT_CLASS}>Henüz mal yok. Üstten yük kalemi seçin.</p>
            ) : (
              (trip.stops?.[0]?.goods || []).map((good) => (
                <div
                  key={good.id}
                  className="grid gap-2 sm:grid-cols-[minmax(0,1.5fr)_5.5rem_6rem_minmax(0,1fr)]"
                >
                  <input
                    className={INPUT_CLASS}
                    value={good.label || ''}
                    onChange={(event) => updateGood(good.id, { label: event.target.value })}
                  />
                  <input
                    className={INPUT_CLASS}
                    type="number"
                    min="1"
                    value={good.qty || 1}
                    onChange={(event) =>
                      updateGood(good.id, { qty: Math.max(1, Number(event.target.value) || 1) })
                    }
                  />
                  <input
                    className={INPUT_CLASS}
                    value={good.unit || 'adet'}
                    onChange={(event) => updateGood(good.id, { unit: event.target.value })}
                  />
                  <input
                    className={INPUT_CLASS}
                    value={good.note || ''}
                    onChange={(event) => updateGood(good.id, { note: event.target.value })}
                    placeholder="Not"
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
