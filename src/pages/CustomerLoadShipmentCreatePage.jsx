import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Package, Pencil, Plus, Save, Trash2, Truck, X } from 'lucide-react'
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
import { advanceDepoItemStatus, loadDepoItems } from '../utils/depoStore'
import { resolveStockScope } from '../utils/stockScope'
import { upsertLoadPlan } from '../utils/logisticsStore'
import { buildLoadSuggestions } from '../utils/loadAiSuggest'
import {
  computeLoadPlan,
  fmtKg,
  GRID_MODULES,
  isPlateComplete,
  isValidPlate,
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
import VehicleLoadViews from '../components/Logistics/VehicleLoadViews'
import '../components/Logistics/truck-load-calculator.css'

const INPUT_CLASS =
  'h-9 w-full rounded-xl border border-[var(--glass-border)] bg-transparent px-3 text-[14px] font-normal leading-tight text-[var(--ink)] outline-none focus:border-blue-400'

const MODULE_OPTIONS = Object.values(GRID_MODULES)
const CUSTOM_TRUCKS_KEY = 'bach-load-truck-presets'
const DEFAULT_TRUCK_DIMS = { L: 720, W: 240, H: 240, maxWeight: 4000 }
const TRUCK_OPTION_COLORS = [
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
]

const TRUCK_TO_VEHICLE_TYPE = {
  panelvan: { id: 'panelvan', label: 'Panelvan' },
  kamyon_kisa: { id: 'kamyon', label: 'Kamyon' },
  kamyon_kucuk: { id: 'kamyon', label: 'Kamyon' },
  kamyon_uzun: { id: 'kamyon', label: 'Kamyon' },
  kamyon_10t: { id: 'kamyon', label: 'Kamyon' },
  kamyon_buyuk: { id: 'kamyon', label: 'Kamyon' },
  tir: { id: 'tir', label: 'TIR' },
  mega: { id: 'tir', label: 'TIR' },
  frigo: { id: 'tir', label: 'TIR' },
  konteyner20: { id: 'tir', label: 'TIR' },
  konteyner40: { id: 'tir', label: 'TIR' },
  konteyner40hc: { id: 'tir', label: 'TIR' },
}

function defaultTruckCatalog() {
  return Object.values(TRUCK_PRESETS).map((item, index) => ({
    key: item.key,
    name: item.name,
    L: item.L,
    W: item.W,
    H: item.H,
    maxWeight: item.maxWeight,
    color: TRUCK_OPTION_COLORS[index % TRUCK_OPTION_COLORS.length],
  }))
}

function loadTruckCatalog() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_TRUCKS_KEY) || 'null')
    if (Array.isArray(parsed) && parsed.length) {
      return parsed
        .map((item, index) => ({
          key: String(item.key || item.id || `truck-${index}`),
          name: String(item.name || item.label || '').trim(),
          L: Math.max(1, Number(item.L) || DEFAULT_TRUCK_DIMS.L),
          W: Math.max(1, Number(item.W) || DEFAULT_TRUCK_DIMS.W),
          H: Math.max(1, Number(item.H) || DEFAULT_TRUCK_DIMS.H),
          maxWeight: Math.max(1, Number(item.maxWeight) || DEFAULT_TRUCK_DIMS.maxWeight),
          color: item.color || TRUCK_OPTION_COLORS[index % TRUCK_OPTION_COLORS.length],
        }))
        .filter((item) => item.name)
    }
  } catch {
    /* ignore */
  }
  return defaultTruckCatalog()
}

function saveTruckCatalog(rows) {
  const next = (Array.isArray(rows) ? rows : [])
    .map((item, index) => ({
      key: String(item.key || item.id || `truck-${Date.now()}-${index}`),
      name: String(item.name || item.label || '').trim(),
      L: Math.max(1, Number(item.L) || DEFAULT_TRUCK_DIMS.L),
      W: Math.max(1, Number(item.W) || DEFAULT_TRUCK_DIMS.W),
      H: Math.max(1, Number(item.H) || DEFAULT_TRUCK_DIMS.H),
      maxWeight: Math.max(1, Number(item.maxWeight) || DEFAULT_TRUCK_DIMS.maxWeight),
      color: item.color || TRUCK_OPTION_COLORS[index % TRUCK_OPTION_COLORS.length],
    }))
    .filter((item) => item.name)
  localStorage.setItem(CUSTOM_TRUCKS_KEY, JSON.stringify(next))
  return next
}

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
  const [truckCatalog, setTruckCatalog] = useState(() => loadTruckCatalog())
  const [truckKey, setTruckKey] = useState(() => loadTruckCatalog()[0]?.key || 'kamyon_kucuk')
  const [moduleKey, setModuleKey] = useState('euro')
  const [orientation, setOrientation] = useState('uzun')
  const [editingItemId, setEditingItemId] = useState(null)
  const [note, setNote] = useState('')
  const [vehicleTypes, setVehicleTypes] = useState(() => loadVehicleTypes())
  const [activeMenu, setActiveMenu] = useState(null)
  const [error, setError] = useState('')
  const [aiToast, setAiToast] = useState('')
  const [layoutToast, setLayoutToast] = useState('')
  const [plateTouched, setPlateTouched] = useState(false)
  const [driverTouched, setDriverTouched] = useState(false)

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

  const truck =
    truckCatalog.find((item) => item.key === truckKey) ||
    truckCatalog[0] ||
    TRUCK_PRESETS.kamyon_kucuk
  const module = GRID_MODULES[moduleKey] || GRID_MODULES.euro
  const plan = useMemo(
    () =>
      computeLoadPlan(truck, module, loadItems, {
        orientation,
      }),
    [truck, module, loadItems, orientation],
  )
  const cell = 56
  const ai = useMemo(
    () =>
      buildLoadSuggestions({
        items: loadItems,
        truckKey: truck.key || truckKey,
        moduleKey,
      }),
    [loadItems, truck, truckKey, moduleKey],
  )
  const editingItem = loadItems.find((item) => item.id === editingItemId) || null
  const truckTypeOptions = truckCatalog.map((item) => ({
    id: item.key,
    label: item.name,
    color: item.color || 'bg-blue-500',
  }))

  useEffect(() => {
    if (!truckCatalog.length) return
    if (truckCatalog.some((item) => item.key === truckKey)) return
    setTruckKey(truckCatalog[0].key)
  }, [truckCatalog, truckKey])

  useEffect(() => {
    const mapped = TRUCK_TO_VEHICLE_TYPE[truckKey] || {
      id: truckKey,
      label: truck.name?.split('(')[0]?.trim() || 'Kamyon',
    }
    setTrip((current) => {
      if (current.vehicleTypeId === mapped.id && current.vehicleTypeLabel === mapped.label) {
        return current
      }
      return {
        ...current,
        vehicleTypeId: mapped.id,
        vehicleTypeLabel: mapped.label,
      }
    })
  }, [truckKey, truck.name])

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

  function addManualItem(presetName, opts = {}) {
    const preset = LOAD_PRESETS.find((row) => row.name === presetName) || LOAD_PRESETS[3]
    const id = `manual-${Date.now()}-${manualItems.length}`
    const colorIdx = (selectedStock.length + manualItems.length) % SLOT_COLORS.length
    setManualItems((current) => [
      ...current,
      {
        id,
        name: preset.name,
        qty: Math.max(1, Number(opts.qty) || 1),
        L: preset.L,
        W: preset.W,
        H: preset.H,
        weight: preset.weight,
        stackable: preset.stackable,
        visualH: preset.visualH,
        unit: preset.name.toLowerCase().includes('koli') ? 'koli' : 'adet',
        source: 'manual',
        colorIdx,
        preferSlotIndex: Number.isFinite(opts.slotIndex) ? Number(opts.slotIndex) : undefined,
      },
    ])
    setEditingItemId(id)
  }

  function changeOrientation(next) {
    if (next === orientation) return
    const hadItems = loadItems.length > 0
    setOrientation(next)
    if (hadItems) {
      setLayoutToast('Yönlendirme değişti; yerleşim yeniden hesaplandı.')
      window.setTimeout(() => setLayoutToast(''), 2800)
    }
  }

  function changeModuleKey(next) {
    if (next === moduleKey) return
    const hadItems = loadItems.length > 0
    setModuleKey(next)
    if (hadItems) {
      setLayoutToast('Grid modülü değişti; yerleşim yeniden hesaplandı.')
      window.setTimeout(() => setLayoutToast(''), 2800)
    }
  }

  function changeTruckKey(next) {
    if (next === truckKey) return
    const hadItems = loadItems.length > 0
    setTruckKey(next)
    if (hadItems) {
      setLayoutToast('Araç tipi değişti; yerleşim yeniden hesaplandı.')
      window.setTimeout(() => setLayoutToast(''), 2800)
    }
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

  function handleEmptySlotClick(slotIndex) {
    const preset =
      editingItem?.name ||
      LOAD_PRESETS.find((row) => row.name.includes('Orta'))?.name ||
      'Koli — Orta'
    addManualItem(preset, { slotIndex, qty: 1 })
  }

  function handleFilledSlotClick(item) {
    setEditingItemId(item.id)
  }

  function clearSlotItem(item) {
    if (!item) return
    removeLoadItem(item.id)
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

  function applyAiTruck() {
    if (ai.recommendedTruckKey) {
      const exists = truckCatalog.some((item) => item.key === ai.recommendedTruckKey)
      if (exists) setTruckKey(ai.recommendedTruckKey)
    }
    setAiToast(ai.tips[0] || 'AI önerisi uygulandı')
    window.setTimeout(() => setAiToast(''), 2200)
  }

  function handleTruckOptionsChange(next) {
    const previousByKey = new Map(truckCatalog.map((item) => [item.key, item]))
    const previousByName = new Map(truckCatalog.map((item) => [item.name, item]))
    const saved = saveTruckCatalog(
      next.map((item, index) => {
        const prior =
          previousByKey.get(item.id) ||
          previousByName.get(item.label) ||
          defaultTruckCatalog().find((row) => row.name === item.label)
        return {
          key: item.id || prior?.key || `truck-${Date.now()}-${index}`,
          name: item.label,
          color:
            item.color || prior?.color || TRUCK_OPTION_COLORS[index % TRUCK_OPTION_COLORS.length],
          L: prior?.L || DEFAULT_TRUCK_DIMS.L,
          W: prior?.W || DEFAULT_TRUCK_DIMS.W,
          H: prior?.H || DEFAULT_TRUCK_DIMS.H,
          maxWeight: prior?.maxWeight || DEFAULT_TRUCK_DIMS.maxWeight,
        }
      }),
    )
    setTruckCatalog(saved)
    if (!saved.some((item) => item.key === truckKey) && saved[0]) {
      setTruckKey(saved[0].key)
    }
  }

  function handleSave() {
    setError('')
    setPlateTouched(true)
    setDriverTouched(true)
    if (!customer?.id) {
      setError('Müşteri bulunamadı.')
      return
    }
    if (!loadItems.length || plan.totalPieces <= 0) {
      setError('Sevkiyat için en az 1 yerleştirilmiş yük gerekli.')
      return
    }
    if (!isPlateComplete(trip.plate)) {
      setError('Geçerli bir plaka girilmeden sevkiyat onaylanamaz.')
      return
    }
    if (!String(trip.driverName || '').trim()) {
      setError('Şoför adı girilmeden sevkiyat onaylanamaz.')
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
      orientation,
      items: loadItems,
      placements: plan.slotMeta,
      metrics: {
        fillPct: plan.fillPct,
        weightPct: plan.weightPct,
        slotPct: plan.slotPct,
        totalWeight: plan.totalWeight,
        totalPieces: plan.totalPieces,
        totalSlots: plan.totalSlots,
        totalSlotsUsed: plan.totalSlotsUsed,
        leftoverL: plan.leftoverL,
        leftoverW: plan.leftoverW,
        orientation,
      },
      meta: {
        aiTips: ai.tips,
        trucksNeeded: ai.trucksNeeded,
        orientation,
      },
      warnings: plan.warnings,
      status: 'planned',
      source: 'customer-load-shipment',
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
      loadMetrics: {
        fillPct: plan.fillPct,
        weightPct: plan.weightPct,
        slotPct: plan.slotPct,
        totalWeight: plan.totalWeight,
        totalPieces: plan.totalPieces,
        totalSlots: plan.totalSlots,
        totalSlotsUsed: plan.totalSlotsUsed,
        leftoverL: plan.leftoverL,
        leftoverW: plan.leftoverW,
        orientation,
        truckName: truck.name,
        moduleName: module.name,
      },
      note: trip.note || note,
      stops: [stop],
    })

    selectedStock.forEach((item) => {
      if (!item.id) return
      try {
        advanceDepoItemStatus(item.id, 'Teslime Hazır', {
          loadPlanId: loadPlan.id,
          loadPlanCode: loadPlan.code,
          tripId: savedTrip.id,
          tripCode: savedTrip.code,
        })
      } catch {
        /* stage may not exist — ignore */
      }
    })

    navigate(`/sevkiyat/${savedTrip.id}`, {
      replace: true,
      state: {
        notice: `${loadPlan.code} yük planı ve ${savedTrip.code} sevkiyat oluşturuldu.`,
      },
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

  const brandTitle = String(
    display.brandShortName || display.companyTitle || customer.company || '',
  ).toLocaleUpperCase('tr-TR')

  return (
    <AppPageShell className="customers-page-type customer-load-shipment-page w-full space-y-4">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink to={backTo} label="Müşteri" />}
        centerTitle={brandTitle}
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

      {error ? (
        <p
          className={`${YF_TEXT_CLASS} rounded-2xl border border-rose-300/50 bg-rose-50/70 px-4 py-3 !font-bold !text-rose-700`}
        >
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
            <div className={PAGE_FILTER_FIELD_CLASS}>
              <p className={PAGE_FILTER_LABEL_CLASS}>Araç tipi :</p>
              <EditableDropdownPill
                value={truck.name || 'Seçiniz'}
                options={truckTypeOptions}
                buttonClassName={PAGE_FILTER_PILL_CLASS}
                menuClassName={PAGE_FILTER_MENU_CLASS}
                openKey="load-ship-truck-type"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onOptionsChange={handleTruckOptionsChange}
                onChange={(value) => {
                  const match = truckCatalog.find((item) => item.name === value)
                  if (match) changeTruckKey(match.key)
                }}
              />
            </div>
            <Field label="Yerleşim modülü (grid)">
              <select
                className={INPUT_CLASS}
                value={moduleKey}
                onChange={(event) => changeModuleKey(event.target.value)}
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

          <div className="flex flex-wrap items-center gap-2">
            <span className={`${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>Yönlendirme</span>
            <button
              type="button"
              onClick={() => changeOrientation('uzun')}
              className={`rounded-xl px-3 py-1.5 text-[13px] font-bold ${
                orientation === 'uzun'
                  ? 'bg-blue-600 text-white'
                  : 'border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--ink)]'
              }`}
            >
              Uzunlamasına
            </button>
            <button
              type="button"
              onClick={() => changeOrientation('en')}
              className={`rounded-xl px-3 py-1.5 text-[13px] font-bold ${
                orientation === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--ink)]'
              }`}
            >
              Enlemesine
            </button>
            <span className={`${YF_TEXT_CLASS} !text-[12px]`}>
              Hücre {plan.cellL}×{plan.cellW} cm · {plan.cols}×{plan.rows} slot
              {plan.leftoverL || plan.leftoverW
                ? ` · boşluk L${plan.leftoverL}/W${plan.leftoverW}`
                : ''}
            </span>
          </div>

          {layoutToast ? (
            <p
              className={`${YF_TEXT_CLASS} rounded-2xl border border-amber-300/50 bg-amber-50/70 px-3 py-2 !font-bold !text-amber-800`}
            >
              {layoutToast}
            </p>
          ) : null}

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
                <span className="tlc-kpi__label">Parça / Doluluk</span>
                <span className="tlc-badge tlc-badge--info">%{plan.fillPct}</span>
              </div>
              <div className="tlc-kpi__value">{plan.totalPieces || 0}</div>
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

          {loadItems.length ? (
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className={`${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>
                  AI Load Optimizer
                </p>
                <button
                  type="button"
                  onClick={applyAiTruck}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-[13px] font-bold text-white hover:bg-blue-500"
                >
                  Önerilen aracı uygula
                </button>
              </div>
              <ul className="space-y-1">
                {ai.tips.map((tip) => (
                  <li key={tip} className={`${YF_TEXT_CLASS} !text-[13px]`}>
                    · {tip}
                  </li>
                ))}
              </ul>
              {aiToast ? (
                <p className={`mt-2 ${YF_TEXT_CLASS} !font-bold !text-blue-600`}>{aiToast}</p>
              ) : null}
            </div>
          ) : null}

          <VehicleLoadViews plan={plan} />

          <div className="tlc-card tlc-panel">
            <div className="tlc-panel__head">
              <h3>Üstten Görünüm</h3>
              <span className={`${YF_TEXT_CLASS} !text-[12px]`}>
                Boş slota tıkla → ekle · Dolu slota tıkla → düzenle (çift tık: kaldır)
              </span>
            </div>
            <div className="tlc-stage">
              <div className="tlc-front-label" aria-hidden>
                ÖN
              </div>
              <div className="tlc-grid-wrap">
                <div
                  className="tlc-grid"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(1, plan.cols)}, ${cell}px)`,
                    gridTemplateRows: `repeat(${Math.max(1, plan.rows)}, ${cell}px)`,
                    gridAutoFlow: 'row',
                  }}
                >
                  {(plan.slotMeta || []).map((slot) => {
                    if (slot.itemIdx == null) {
                      return (
                        <button
                          key={`empty-${slot.index}`}
                          type="button"
                          className="tlc-slot tlc-slot--empty"
                          style={{ width: cell, height: cell }}
                          onClick={() => handleEmptySlotClick(slot.index)}
                          title={`Boş slot r${slot.row + 1}/c${slot.col + 1}`}
                        >
                          +
                        </button>
                      )
                    }
                    const item = plan.results[slot.itemIdx]
                    const tone = SLOT_COLORS[(item.colorIdx || 0) % SLOT_COLORS.length]
                    const selected = editingItemId === item.id
                    return (
                      <div
                        key={`filled-${slot.index}`}
                        className="tlc-slot tlc-slot--filled"
                        style={{
                          width: cell,
                          height: cell,
                          background: tone.bg,
                          color: tone.fg,
                          outline: selected ? `2px solid ${tone.fg}` : undefined,
                          outlineOffset: 1,
                          position: 'relative',
                        }}
                        title={`${item.name} ×${slot.qty}`}
                        onClick={() => handleFilledSlotClick(item)}
                        onDoubleClick={() => clearSlotItem(item)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') handleFilledSlotClick(item)
                          if (event.key === 'Backspace' || event.key === 'Delete') {
                            clearSlotItem(item)
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: '#059669',
                            border: '1px solid #fff',
                          }}
                        />
                        <span>{itemInitials(item.name)}</span>
                        <span style={{ fontWeight: 600 }}>×{slot.qty}</span>
                      </div>
                    )
                  })}
                </div>
                {(plan.leftoverL > 0 || plan.leftoverW > 0) && (
                  <p className="mt-2 text-[11px] font-bold text-rose-600">
                    Engel / boşluk şeridi: L {plan.leftoverL} cm · W {plan.leftoverW} cm
                  </p>
                )}
              </div>
            </div>

            <div className="tlc-legend">
              <span className="inline-flex items-center gap-1.5">
                <i style={{ background: 'transparent', border: '1.5px dashed #cbd5e1' }} />
                Boş slot
              </span>
              <span className="inline-flex items-center gap-1.5">
                <i style={{ background: '#DBEAFE' }} />
                Yerleştirilen
              </span>
              <span className="inline-flex items-center gap-1.5">
                <i style={{ background: '#059669' }} />
                Sabitlenmiş
              </span>
              <span className="inline-flex items-center gap-1.5">
                <i style={{ background: '#ffe4e6', border: '1px solid #e11d48' }} />
                Engel / boşluk
              </span>
              {plan.results.length ? (
                plan.results.map((item) => {
                  const tone = SLOT_COLORS[(item.colorIdx || 0) % SLOT_COLORS.length]
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-left hover:bg-black/5"
                      onClick={() => handleFilledSlotClick(item)}
                    >
                      <i style={{ background: tone.bg, border: `1px solid ${tone.fg}22` }} />
                      {item.name}{' '}
                      <span style={{ color: 'var(--tlc-faint)' }}>
                        ({item.placedQty}/{item.qty} · {item.slotsUsed} slot)
                      </span>
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
              Bu müşteriye bağlı depo stoğu yok. Görseldeki boş slotlardan veya hazır kalemlerden
              ekleyebilirsiniz.
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
              className={`${INPUT_CLASS} ${
                plateTouched && trip.plate?.trim() && !isValidPlate(trip.plate)
                  ? '!border-rose-500'
                  : ''
              }`}
              value={trip.plate || ''}
              onChange={(event) => patchTrip({ plate: event.target.value.toUpperCase() })}
              onBlur={() => setPlateTouched(true)}
              placeholder="34 ABC 123"
            />
            {plateTouched && trip.plate?.trim() && !isValidPlate(trip.plate) ? (
              <span
                className={`${YF_TEXT_CLASS} mt-1 block !text-[12px] !font-bold !text-rose-600`}
              >
                Geçersiz plaka formatı
              </span>
            ) : null}
          </Field>
          <Field label="Şoför">
            <input
              className={`${INPUT_CLASS} ${
                driverTouched && !String(trip.driverName || '').trim() ? '!border-rose-500' : ''
              }`}
              value={trip.driverName || ''}
              onChange={(event) => patchTrip({ driverName: event.target.value })}
              onBlur={() => setDriverTouched(true)}
            />
            {driverTouched && !String(trip.driverName || '').trim() ? (
              <span
                className={`${YF_TEXT_CLASS} mt-1 block !text-[12px] !font-bold !text-rose-600`}
              >
                Şoför adı zorunludur
              </span>
            ) : null}
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
            <p className={`${YF_TEXT_CLASS} !text-[12px]`}>
              Yük kalemleri sevkiyata otomatik aktarılır
            </p>
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
