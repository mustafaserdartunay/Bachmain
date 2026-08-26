import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Ban,
  CheckCircle2,
  Copy,
  ExternalLink,
  MapPin,
  Navigation,
  Plus,
  Save,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { EmptyState } from '@bachmain/ui'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import SearchInput from '../../components/Common/SearchInput'
import QuoteDeletedArchivedPanel from '../../components/Common/QuoteDeletedArchivedPanel'
import QuoteOrderInlineConfirm from '../../components/Common/QuoteOrderInlineConfirm'
import ProcessListRowMoreMenu from '../../components/Common/ProcessListRowMoreMenu'
import {
  QuoteListCell,
  QuoteListColumnHeader,
  QuoteListRowPanel,
  QuoteListSelectionCheckbox,
} from '../../components/Common/QuoteStyleListChrome'
import EditableDropdownPill from '../../components/EditableDropdownPill'
import SevkiyatMap from '../../components/Sevkiyat/SevkiyatMap'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
  AppPanelDot,
} from '../../components/Layout/AppPageLayout'
import {
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../../components/Layout/HeaderCashActionsPanel'
import {
  APP_PANEL_TITLE_CLASS,
  PAGE_CENTER_TITLE_CLASS,
  PAGE_FILTER_FIELD_CLASS,
  PAGE_FILTER_LABEL_CLASS,
  PAGE_FILTER_MENU_CLASS,
  PAGE_FILTER_PILL_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  PAGE_LIST_PILL_CLASS,
  PAGE_LIST_PILL_WRAPPER_CLASS,
  YF_TEXT_CLASS,
  YF_TEXT_ON_COLOR_CLASS,
} from '../../utils/dashboardDesign'
import { getCustomerProfiles } from '../../data/customerProfiles'
import { getCustomerDisplay } from '../../utils/customerDisplay'
import { formatCustomerAddress, getCompanyStartPoint } from '../../utils/customerGeo'
import { readCompanySettings } from '../../utils/companySettings'
import {
  calculateRouteForTrip,
  createEmptyGood,
  createEmptyStop,
  createTripDraft,
  deleteTrip,
  getSevkiyatSummary,
  getSevkiyatTrackingUrl,
  getTrip,
  loadTrips,
  loadVehicleTypes,
  markTripStatus,
  permanentlyDeleteTrip,
  restoreDeletedTrip,
  saveVehicleTypes,
  SEVKIYAT_EVENT,
  SEVKIYAT_STATUS,
  shareTrackingLink,
  upsertTrip,
} from '../../utils/sevkiyatStore'
import { COP_KUTUSU_BUTTON_CLASS, COP_KUTUSU_ICON_CLASS } from '../../utils/buttonStyles'
import { loadLoadPlans } from '../../utils/logisticsStore'
import { fmtKg } from '../../utils/truckLoadCalc'
import { resolveQuoteCode } from '../../utils/documentCodes'
import { formatListDateParts } from '../../utils/quoteListDateFormat'
import { flushWorkspaceNow } from '../../utils/workspaceStorage'

const filterAllOption = { label: 'Tümü', color: 'bg-gray-500' }
const STATUS_FILTER_OPTIONS = [
  filterAllOption,
  ...Object.values(SEVKIYAT_STATUS).map((s) => ({
    label: s.label,
    color: 'bg-gray-500',
  })),
]

function statusLabel(status) {
  return SEVKIYAT_STATUS[status]?.label || status || '—'
}

function HeaderCta({ icon: Icon, label, gradient, onClick, to, type = 'button' }) {
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
    <button type={type} onClick={onClick} className={className}>
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

const INPUT_CLASS =
  'h-9 w-full rounded-xl border border-[var(--glass-border)] bg-transparent px-3 text-[14px] font-normal leading-tight text-[var(--ink)] outline-none focus:border-blue-400'

export default function SevkiyatPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: routeId } = useParams()
  const isNew = routeId === 'yeni'
  const isDetail = Boolean(routeId)

  const [trips, setTrips] = useState(() => loadTrips())
  const [vehicleTypes, setVehicleTypes] = useState(() => loadVehicleTypes())
  const [filters, setFilters] = useState({ status: 'Tümü', vehicleType: 'Tümü' })
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMenu, setActiveMenu] = useState(null)
  const [listColumnSort, setListColumnSort] = useState({ key: null, dir: 'asc' })
  const listColumnSortRef = useRef(listColumnSort)
  listColumnSortRef.current = listColumnSort
  const listColumnSortLockRef = useRef(false)
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedTripIds, setSelectedTripIds] = useState([])
  const [animatingDeleteIds, setAnimatingDeleteIds] = useState([])
  const [archiveReceiveKey, setArchiveReceiveKey] = useState(0)
  const [mapsUrl, setMapsUrl] = useState(null)
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState(() => location.state?.notice || '')
  const [draft, setDraft] = useState(() => {
    if (!routeId || routeId === 'yeni') return createTripDraft()
    return getTrip(routeId) || createTripDraft({ id: routeId })
  })

  const loadPlan = useMemo(() => {
    if (!draft?.loadPlanId && !draft?.loadPlanCode) return null
    const plans = loadLoadPlans()
    return (
      plans.find((plan) => plan.id === draft.loadPlanId) ||
      plans.find((plan) => plan.code === draft.loadPlanCode) ||
      null
    )
  }, [draft?.loadPlanId, draft?.loadPlanCode, trips])

  useEffect(() => {
    if (!location.state?.notice) return undefined
    setNotice(location.state.notice)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state, location.pathname, navigate])

  const customers = useMemo(() => getCustomerProfiles(), [trips])
  const hq = useMemo(() => getCompanyStartPoint(readCompanySettings()), [])

  useEffect(() => {
    function refresh() {
      setTrips(loadTrips())
      setVehicleTypes(loadVehicleTypes())
      if (routeId && routeId !== 'yeni') {
        const fresh = getTrip(routeId)
        if (fresh) setDraft(fresh)
      }
    }
    window.addEventListener(SEVKIYAT_EVENT, refresh)
    return () => window.removeEventListener(SEVKIYAT_EVENT, refresh)
  }, [routeId])

  useEffect(() => {
    if (!routeId) return
    if (routeId === 'yeni') {
      setDraft(createTripDraft())
      setMapsUrl(null)
      return
    }
    const trip = getTrip(routeId)
    setDraft(trip || createTripDraft({ id: routeId }))
    setMapsUrl(null)
  }, [routeId])

  useEffect(() => {
    if (!activeMenu) return undefined
    function close() {
      setActiveMenu(null)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [activeMenu])

  const filteredTrips = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return trips.filter((trip) => {
      const matchStatus = filters.status === 'Tümü' || statusLabel(trip.status) === filters.status
      const matchType =
        filters.vehicleType === 'Tümü' ||
        trip.vehicleTypeLabel === filters.vehicleType ||
        trip.vehicleTypeId === filters.vehicleType
      const firstStop = (trip.stops || [])[0]
      const haystack =
        `${trip.code || ''} ${trip.plate || ''} ${trip.driverName || ''} ${firstStop?.customerLabel || ''}`.toLowerCase()
      const matchSearch = !q || haystack.includes(q)
      return matchStatus && matchType && matchSearch
    })
  }, [trips, filters, searchQuery])

  const summary = useMemo(() => getSevkiyatSummary(trips), [trips])

  function patchDraft(patch) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  function updateStop(stopId, patch) {
    setDraft((current) => ({
      ...current,
      stops: (current.stops || []).map((stop) =>
        stop.id === stopId ? { ...stop, ...patch } : stop,
      ),
    }))
  }

  function assignCustomerToStop(stopId, customerId) {
    const customer = customers.find((item) => item.id === customerId)
    if (!customer) {
      updateStop(stopId, {
        customerId: '',
        customerLabel: '',
        address: '',
        city: '',
        lat: null,
        lng: null,
      })
      return
    }
    const display = getCustomerDisplay(customer)
    updateStop(stopId, {
      customerId: customer.id,
      customerLabel: display.brandShortName || display.companyTitle || customer.company || '',
      address: formatCustomerAddress(customer),
      city: customer.city || '',
      lat: null,
      lng: null,
    })
  }

  function addStop() {
    setDraft((current) => ({
      ...current,
      stops: [...(current.stops || []), createEmptyStop((current.stops || []).length + 1)],
    }))
  }

  function removeStop(stopId) {
    setDraft((current) => ({
      ...current,
      stops: (current.stops || [])
        .filter((stop) => stop.id !== stopId)
        .map((stop, index) => ({ ...stop, seq: index + 1 })),
    }))
  }

  function moveStop(stopId, direction) {
    setDraft((current) => {
      const stops = [...(current.stops || [])]
      const index = stops.findIndex((stop) => stop.id === stopId)
      if (index < 0) return current
      const target = index + direction
      if (target < 0 || target >= stops.length) return current
      const tmp = stops[index]
      stops[index] = stops[target]
      stops[target] = tmp
      return {
        ...current,
        stops: stops.map((stop, i) => ({ ...stop, seq: i + 1 })),
      }
    })
  }

  function addGood(stopId) {
    setDraft((current) => ({
      ...current,
      stops: (current.stops || []).map((stop) =>
        stop.id === stopId ? { ...stop, goods: [...(stop.goods || []), createEmptyGood()] } : stop,
      ),
    }))
  }

  function updateGood(stopId, goodId, patch) {
    const stop = (draft.stops || []).find((s) => s.id === stopId)
    if (!stop) return
    updateStop(stopId, {
      goods: (stop.goods || []).map((good) => (good.id === goodId ? { ...good, ...patch } : good)),
    })
  }

  function removeGood(stopId, goodId) {
    const stop = (draft.stops || []).find((s) => s.id === stopId)
    if (!stop) return
    updateStop(stopId, {
      goods: (stop.goods || []).filter((good) => good.id !== goodId),
    })
  }

  function handleSave(nextStatus) {
    const saved = upsertTrip({
      ...draft,
      status: nextStatus || draft.status || 'draft',
    })
    setDraft(saved)
    setTrips(loadTrips())
    if (isNew) navigate(`/sevkiyat/${saved.id}`, { replace: true })
  }

  function handleCalculateRoute() {
    const { trip, mapsUrl: url } = calculateRouteForTrip(draft)
    const saved = upsertTrip(trip)
    setDraft(saved)
    setMapsUrl(url)
    setTrips(loadTrips())
  }

  async function copyTrackingLink() {
    const url = getSevkiyatTrackingUrl(draft.trackingToken)
    shareTrackingLink(draft.id, true)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      window.prompt('Takip linkini kopyalayın:', url)
    }
    setDraft(getTrip(draft.id) || draft)
  }

  function compareSortValue(a, b, dir) {
    const sign = dir === 'desc' ? -1 : 1
    if (typeof a === 'number' && typeof b === 'number') return (a - b) * sign
    return String(a || '').localeCompare(String(b || ''), 'tr', { numeric: true }) * sign
  }

  const listTrips = useMemo(() => {
    if (!listColumnSort.key) return filteredTrips
    const dir = listColumnSort.dir
    const ids = trips.map((item) => item.id)
    return [...filteredTrips].sort((a, b) => {
      const valueOf = (trip) => {
        if (listColumnSort.key === 'date') return trip.createdAt || ''
        if (listColumnSort.key === 'code') return trip.code || resolveQuoteCode(trip.id, ids)
        if (listColumnSort.key === 'customer')
          return (trip.stops || [])[0]?.customerLabel || trip.plate || ''
        if (listColumnSort.key === 'status') return statusLabel(trip.status)
        if (listColumnSort.key === 'stops') return (trip.stops || []).length
        return ''
      }
      return compareSortValue(valueOf(a), valueOf(b), dir)
    })
  }, [filteredTrips, listColumnSort, trips])

  function toggleListColumnSort(key) {
    if (listColumnSortLockRef.current) return
    listColumnSortLockRef.current = true
    window.setTimeout(() => {
      listColumnSortLockRef.current = false
    }, 0)
    const current = listColumnSortRef.current
    const next =
      current.key !== key
        ? { key, dir: 'asc' }
        : { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
    listColumnSortRef.current = next
    setListColumnSort(next)
  }

  function exitBulkSelectMode() {
    setBulkSelectMode(false)
    setSelectedTripIds([])
  }

  function toggleBulkSelect(id) {
    const key = String(id)
    setSelectedTripIds((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )
  }

  function toggleBulkSelectAll(ids) {
    const allSelected = ids.length > 0 && ids.every((id) => selectedTripIds.includes(id))
    setSelectedTripIds(allSelected ? [] : ids)
  }

  function softDeleteTripWithAnimation(trip) {
    if (!trip?.id) return
    const key = String(trip.id)
    setAnimatingDeleteIds((current) => [...current, key])
    window.setTimeout(() => {
      deleteTrip(trip.id)
      setTrips(loadTrips())
      setAnimatingDeleteIds((current) => current.filter((item) => item !== key))
      setArchiveReceiveKey((current) => current + 1)
      flushWorkspaceNow()
    }, 880)
  }

  function handleBulkDeleteTrips() {
    listTrips
      .filter((trip) => selectedTripIds.includes(String(trip.id)))
      .forEach((trip) => softDeleteTripWithAnimation(trip))
    exitBulkSelectMode()
  }

  const vehicleTypeOptions = vehicleTypes.map((item) => ({
    label: item.label,
    color: item.color || 'bg-gray-500',
    id: item.id,
  }))

  const customerOptions = [
    { label: 'Seçiniz', color: 'bg-gray-500' },
    ...customers.map((customer) => {
      const display = getCustomerDisplay(customer)
      return {
        label: display.brandShortName || display.companyTitle || customer.company || customer.id,
        color: 'bg-blue-500',
        id: customer.id,
      }
    }),
  ]

  if (isDetail) {
    const trackingUrl = getSevkiyatTrackingUrl(draft.trackingToken)
    return (
      <AppPageShell className="customers-page-type w-full">
        <AppPageHeader
          showBack={false}
          title={<AppPageBackLink to="/sevkiyat" label="Sevkiyat" />}
          centerTitle={String(isNew ? 'Yeni Sevkiyat' : draft.code || 'Sevkiyat').toLocaleUpperCase(
            'tr-TR',
          )}
          centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
          titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
          actions={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <HeaderCta
                icon={X}
                label="Vazgeç"
                gradient={HEADER_ACTION_GRADIENTS.danger}
                onClick={() => navigate('/sevkiyat')}
              />
              <HeaderCta
                icon={Save}
                label="Kaydet"
                gradient={HEADER_ACTION_GRADIENTS.success}
                onClick={() => handleSave(draft.status === 'draft' ? 'planned' : draft.status)}
              />
            </div>
          }
        />

        {notice ? (
          <p
            className={`${YF_TEXT_CLASS} rounded-2xl border border-emerald-300/50 bg-emerald-50/70 px-4 py-3 !font-bold !text-emerald-700`}
          >
            {notice}
          </p>
        ) : null}

        {draft.loadPlanCode || draft.loadPlanId || draft.loadMetrics ? (
          <AppPagePanel className="w-full space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AppPanelDot color="violet" />
                <h2 className={APP_PANEL_TITLE_CLASS}>Bağlı Yük Planı :</h2>
              </div>
              <span
                className={`${YF_TEXT_CLASS} rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1 !font-bold`}
              >
                {draft.loadPlanCode || loadPlan?.code || '—'}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2">
                <p className={`${YF_TEXT_CLASS} !text-[12px]`}>Araç</p>
                <p className={`${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>
                  {draft.loadMetrics?.truckName || loadPlan?.truckName || '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2">
                <p className={`${YF_TEXT_CLASS} !text-[12px]`}>Yönlendirme</p>
                <p className={`${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>
                  {(draft.loadMetrics?.orientation ||
                    loadPlan?.orientation ||
                    loadPlan?.metrics?.orientation) === 'en'
                    ? 'Enlemesine'
                    : 'Uzunlamasına'}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2">
                <p className={`${YF_TEXT_CLASS} !text-[12px]`}>Doluluk</p>
                <p className={`${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>
                  %{draft.loadMetrics?.fillPct ?? loadPlan?.metrics?.fillPct ?? '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2">
                <p className={`${YF_TEXT_CLASS} !text-[12px]`}>Ağırlık</p>
                <p className={`${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>
                  {fmtKg(draft.loadMetrics?.totalWeight ?? loadPlan?.metrics?.totalWeight ?? 0)} kg
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2">
                <p className={`${YF_TEXT_CLASS} !text-[12px]`}>Parça</p>
                <p className={`${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>
                  {draft.loadMetrics?.totalPieces ?? loadPlan?.metrics?.totalPieces ?? '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2">
                <p className={`${YF_TEXT_CLASS} !text-[12px]`}>Slot</p>
                <p className={`${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>
                  {draft.loadMetrics?.totalSlotsUsed ?? loadPlan?.metrics?.totalSlotsUsed ?? '—'}
                  {' / '}
                  {draft.loadMetrics?.totalSlots ?? loadPlan?.metrics?.totalSlots ?? '—'}
                </p>
              </div>
            </div>
            {(loadPlan?.items || []).length ? (
              <div className="overflow-hidden rounded-2xl border border-[var(--glass-border)]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--glass-bg)] text-[11px] uppercase tracking-wide text-[var(--ink)]/60">
                    <tr>
                      <th className="px-3 py-2">Ürün</th>
                      <th className="px-3 py-2">Ölçü</th>
                      <th className="px-3 py-2">Adet</th>
                      <th className="px-3 py-2">Ağırlık</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadPlan.items.map((item) => (
                      <tr key={item.id} className="border-t border-[var(--glass-border)]">
                        <td className={`px-3 py-2 ${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>
                          {item.name}
                        </td>
                        <td className={`px-3 py-2 ${YF_TEXT_CLASS}`}>
                          {item.L}×{item.W}×{item.H} cm
                        </td>
                        <td className={`px-3 py-2 ${YF_TEXT_CLASS}`}>{item.qty}</td>
                        <td className={`px-3 py-2 ${YF_TEXT_CLASS}`}>
                          {fmtKg((Number(item.weight) || 0) * (Number(item.qty) || 0))} kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {draft.stops?.[0]?.customerId ? (
              <Link
                to={`/musteriler/${draft.stops[0].customerId}/yuk-sevkiyat`}
                className="inline-flex text-[14px] font-normal text-blue-600 hover:underline"
              >
                Yük planını düzenle
              </Link>
            ) : null}
          </AppPagePanel>
        ) : null}

        <AppPagePanel className="w-full space-y-4">
          <div className="flex items-center gap-2">
            <AppPanelDot color="blue" />
            <h2 className={APP_PANEL_TITLE_CLASS}>Araç Bilgileri :</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Plaka">
              <input
                className={INPUT_CLASS}
                value={draft.plate || ''}
                onChange={(e) => patchDraft({ plate: e.target.value })}
                placeholder="34 BM 0101"
              />
            </Field>
            <Field label="Şoför">
              <input
                className={INPUT_CLASS}
                value={draft.driverName || ''}
                onChange={(e) => patchDraft({ driverName: e.target.value })}
              />
            </Field>
            <Field label="Telefon">
              <input
                className={INPUT_CLASS}
                value={draft.driverPhone || ''}
                onChange={(e) => patchDraft({ driverPhone: e.target.value })}
              />
            </Field>
            <div className={PAGE_FILTER_FIELD_CLASS}>
              <p className={PAGE_FILTER_LABEL_CLASS}>Araç Türü :</p>
              <EditableDropdownPill
                value={draft.vehicleTypeLabel || 'Seçiniz'}
                options={vehicleTypeOptions}
                buttonClassName={PAGE_FILTER_PILL_CLASS}
                menuClassName={PAGE_FILTER_MENU_CLASS}
                openKey="sevkiyat-vehicle-type"
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
                  patchDraft({
                    vehicleTypeLabel: value,
                    vehicleTypeId: match?.id || value,
                  })
                }}
              />
            </div>
            <Field label="Durum">
              <select
                className={INPUT_CLASS}
                value={draft.status || 'draft'}
                onChange={(e) => {
                  const status = e.target.value
                  patchDraft({ status })
                  if (draft.id && getTrip(draft.id)) markTripStatus(draft.id, status)
                }}
              >
                {Object.values(SEVKIYAT_STATUS).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </AppPagePanel>

        <AppPagePanel className="w-full space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AppPanelDot color="orange" />
              <h2 className={APP_PANEL_TITLE_CLASS}>Duraklar ve Mallar :</h2>
            </div>
            <button
              type="button"
              onClick={addStop}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[14px] font-normal text-blue-600 hover:bg-[rgba(37,99,235,0.12)]"
            >
              <Plus className="h-3.5 w-3.5" /> Durak Ekle
            </button>
          </div>

          <div className="space-y-3">
            {(draft.stops || []).map((stop, index) => (
              <div
                key={stop.id}
                className="rounded-[20px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className={`${YF_TEXT_CLASS} font-bold`}>Durak {index + 1}</p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className={`${YF_TEXT_CLASS} rounded-lg px-2 py-1 hover:bg-black/5`}
                      onClick={() => moveStop(stop.id, -1)}
                    >
                      Yukarı
                    </button>
                    <button
                      type="button"
                      className={`${YF_TEXT_CLASS} rounded-lg px-2 py-1 hover:bg-black/5`}
                      onClick={() => moveStop(stop.id, 1)}
                    >
                      Aşağı
                    </button>
                    <button
                      type="button"
                      className={COP_KUTUSU_BUTTON_CLASS}
                      title="Sil"
                      onClick={() => removeStop(stop.id)}
                    >
                      <Trash2 className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} />
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={PAGE_FILTER_FIELD_CLASS}>
                    <p className={PAGE_FILTER_LABEL_CLASS}>Müşteri :</p>
                    <EditableDropdownPill
                      value={stop.customerLabel || 'Seçiniz'}
                      options={customerOptions}
                      editable={false}
                      includePlaceholderOption={false}
                      buttonClassName={PAGE_FILTER_PILL_CLASS}
                      menuClassName={PAGE_FILTER_MENU_CLASS}
                      openKey={`stop-customer-${stop.id}`}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      onChange={(value) => {
                        const match = customerOptions.find((item) => item.label === value)
                        assignCustomerToStop(stop.id, match?.id || '')
                      }}
                    />
                  </div>
                  <Field label="Adres">
                    <input
                      className={INPUT_CLASS}
                      value={stop.address || ''}
                      onChange={(e) => updateStop(stop.id, { address: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className={YF_TEXT_CLASS}>Mallar</p>
                    <button
                      type="button"
                      onClick={() => addGood(stop.id)}
                      className="text-[14px] font-normal text-blue-600"
                    >
                      + Mal Ekle
                    </button>
                  </div>
                  {(stop.goods || []).map((good) => (
                    <div key={good.id} className="grid gap-2 sm:grid-cols-[1fr_5rem_5rem_auto]">
                      <input
                        className={INPUT_CLASS}
                        placeholder="Mal / ürün"
                        value={good.label || ''}
                        onChange={(e) => updateGood(stop.id, good.id, { label: e.target.value })}
                      />
                      <input
                        className={INPUT_CLASS}
                        type="number"
                        min="0"
                        value={good.qty ?? 1}
                        onChange={(e) =>
                          updateGood(stop.id, good.id, { qty: Number(e.target.value) || 0 })
                        }
                      />
                      <input
                        className={INPUT_CLASS}
                        placeholder="birim"
                        value={good.unit || ''}
                        onChange={(e) => updateGood(stop.id, good.id, { unit: e.target.value })}
                      />
                      <button
                        type="button"
                        className={COP_KUTUSU_BUTTON_CLASS}
                        title="Sil"
                        onClick={() => removeGood(stop.id, good.id)}
                      >
                        <Trash2 className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AppPagePanel>

        <AppPagePanel className="w-full space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AppPanelDot color="emerald" />
              <h2 className={APP_PANEL_TITLE_CLASS}>Rota ve Canlı Takip :</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <HeaderCta
                icon={Navigation}
                label="Adrese göre rota hesapla"
                gradient={HEADER_ACTION_GRADIENTS.primary}
                onClick={handleCalculateRoute}
              />
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.violet}`}
                >
                  <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                    <ExternalLink className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} />
                  </span>
                  <span className={YF_TEXT_ON_COLOR_CLASS}>Maps’te aç</span>
                </a>
              ) : null}
            </div>
          </div>

          {draft.route?.distanceKm != null ? (
            <p className={YF_TEXT_CLASS}>
              Tahmini mesafe: {draft.route.distanceKm} km · Süre: ~{draft.route.durationMin} dk
            </p>
          ) : (
            <p className={YF_TEXT_CLASS}>Durakları ekleyip rota hesaplayın.</p>
          )}

          <SevkiyatMap
            hq={hq}
            stops={draft.stops || []}
            livePosition={draft.livePosition}
            routeGeometry={draft.routeGeometry}
          />

          <div className="flex flex-wrap items-center gap-2">
            <HeaderCta
              icon={Copy}
              label={copied ? 'Kopyalandı' : 'Takip linki kopyala'}
              gradient={HEADER_ACTION_GRADIENTS.success}
              onClick={copyTrackingLink}
            />
            <a
              href={trackingUrl}
              target="_blank"
              rel="noreferrer"
              className={`${YF_TEXT_CLASS} inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-black/5`}
            >
              <MapPin className="h-3.5 w-3.5" /> Linki aç
            </a>
            <p className={`${YF_TEXT_CLASS} min-w-0 truncate`}>{trackingUrl}</p>
          </div>
          <p className={YF_TEXT_CLASS}>
            Link özel olarak gönderilebilir. Gönderilmese bile müşteri B2B Sevkiyat sekmesinden
            canlı izleyebilir.
          </p>

          <div className="flex flex-wrap gap-2">
            <HeaderCta
              icon={Truck}
              label="Yola çık"
              gradient={HEADER_ACTION_GRADIENTS.amber}
              onClick={() => {
                handleSave('in_transit')
                markTripStatus(draft.id, 'in_transit')
                setDraft(getTrip(draft.id) || draft)
              }}
            />
            <HeaderCta
              icon={CheckCircle2}
              label="Teslim edildi"
              gradient={HEADER_ACTION_GRADIENTS.success}
              onClick={() => {
                markTripStatus(draft.id, 'delivered')
                setDraft(getTrip(draft.id) || draft)
                setTrips(loadTrips())
              }}
            />
          </div>
        </AppPagePanel>
      </AppPageShell>
    )
  }

  const listTripIds = listTrips.map((trip) => String(trip.id))
  const allVisibleTripsSelected =
    listTripIds.length > 0 && listTripIds.every((id) => selectedTripIds.includes(id))
  const someVisibleTripsSelected =
    listTripIds.some((id) => selectedTripIds.includes(id)) && !allVisibleTripsSelected
  const sevkiyatListBaseColumnGrid = [
    '6.5rem',
    '4.75rem',
    'minmax(16rem, 2.4fr)',
    'minmax(9.25rem, 0.7fr)',
    '6.5rem',
    '3rem',
  ]
  const sevkiyatListColumnGrid = [
    ...(bulkSelectMode ? ['2.75rem'] : []),
    ...sevkiyatListBaseColumnGrid.slice(0, -1),
    bulkSelectMode && selectedTripIds.length > 0 ? '6.5rem' : '3rem',
  ].join(' ')

  return (
    <AppPageShell className="customers-page-type w-full">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink />}
        centerTitle={String('Sevkiyat').toLocaleUpperCase('tr-TR')}
        centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
        actions={
          <HeaderCta
            icon={Plus}
            label="Yeni Sevkiyat"
            gradient={HEADER_ACTION_GRADIENTS.primary}
            to="/sevkiyat/yeni"
          />
        }
      />

      <SummaryMetrics
        columns={5}
        className="customer-summary-metrics w-full"
        items={[
          {
            title: 'Toplam Sevkiyat',
            value: summary.total,
            icon: Truck,
            valueTone: 'text-violet-800',
          },
          {
            title: 'Planlanan',
            value: summary.planned,
            icon: MapPin,
            tone: 'emerald',
            valueTone: 'text-blue-800',
          },
          {
            title: 'Yolda',
            value: summary.inTransit,
            icon: Navigation,
            tone: 'orange',
            valueTone: 'text-orange-700',
          },
          {
            title: 'Teslim',
            value: summary.delivered,
            icon: CheckCircle2,
            tone: 'purple',
            valueTone: 'text-emerald-800',
          },
          {
            title: 'İptal',
            value: summary.cancelled,
            icon: Ban,
            tone: 'red',
            valueTone: 'text-red-700',
          },
        ]}
      />

      <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
        <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
          <div className="flex shrink-0 items-center gap-2 px-1">
            <AppPanelDot color="blue" />
            <span className={YF_TEXT_CLASS}>Filtre :</span>
          </div>
          <div className="app-filter-bar grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <div className={PAGE_FILTER_FIELD_CLASS}>
              <p className={PAGE_FILTER_LABEL_CLASS}>Durum :</p>
              <EditableDropdownPill
                value={filters.status}
                options={STATUS_FILTER_OPTIONS}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={PAGE_FILTER_PILL_CLASS}
                menuClassName={PAGE_FILTER_MENU_CLASS}
                openKey="sevkiyat-filter-status"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => setFilters((c) => ({ ...c, status: value }))}
              />
            </div>
            <div className={PAGE_FILTER_FIELD_CLASS}>
              <p className={PAGE_FILTER_LABEL_CLASS}>Araç Türü :</p>
              <EditableDropdownPill
                value={filters.vehicleType}
                options={[filterAllOption, ...vehicleTypeOptions]}
                includePlaceholderOption={false}
                editable={false}
                buttonClassName={PAGE_FILTER_PILL_CLASS}
                menuClassName={PAGE_FILTER_MENU_CLASS}
                openKey="sevkiyat-filter-type"
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                onChange={(value) => setFilters((c) => ({ ...c, vehicleType: value }))}
              />
            </div>
          </div>
        </div>
      </AppPagePanel>

      <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
        <div className="flex w-full min-w-0 items-center gap-3 px-1">
          <div className="flex shrink-0 items-center gap-2">
            <AppPanelDot color="blue" />
            <span className={YF_TEXT_CLASS}>Sevkiyat Listesi :</span>
          </div>
          <div className="min-w-0 flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Kod, plaka, şoför veya müşteri ara..."
              className="customer-filter-search !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]"
            />
          </div>
          <span className={`shrink-0 ${YF_TEXT_CLASS}`}>{filteredTrips.length} Kayıt</span>
        </div>
      </AppPagePanel>

      {listTrips.length === 0 ? (
        <AppPagePanel className="customer-filter-panel w-full">
          <EmptyState
            title="Sevkiyat bulunamadı."
            description="Yeni sevkiyat oluşturun veya filtreleri değiştirin."
          />
        </AppPagePanel>
      ) : null}

      <div className="w-full min-w-0 overflow-x-auto overflow-y-visible">
        <div className="quote-teklifler-list-stack flex min-w-[56rem] w-full flex-col gap-5">
          {listTrips.length > 0 ? (
            <div className="quote-list-board">
              <QuoteListRowPanel header gridTemplate={sevkiyatListColumnGrid}>
                {bulkSelectMode ? (
                  <QuoteListCell>
                    <QuoteListSelectionCheckbox
                      checked={allVisibleTripsSelected}
                      indeterminate={someVisibleTripsSelected}
                      aria-label="Tümünü seç"
                      onChange={() => toggleBulkSelectAll(listTripIds)}
                    />
                  </QuoteListCell>
                ) : null}
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
                <QuoteListCell>
                  <QuoteListColumnHeader
                    label="Durum"
                    sortable
                    sortKey="status"
                    sort={listColumnSort}
                    onToggleSort={toggleListColumnSort}
                  />
                </QuoteListCell>
                <QuoteListCell>
                  <QuoteListColumnHeader
                    label="Durak"
                    sortable
                    sortKey="stops"
                    sort={listColumnSort}
                    onToggleSort={toggleListColumnSort}
                  />
                </QuoteListCell>
                <QuoteListCell>
                  {bulkSelectMode && selectedTripIds.length > 0 ? (
                    <QuoteOrderInlineConfirm
                      label="Sil"
                      labelClass="quote-order-undo-sil"
                      ariaLabel={`${selectedTripIds.length} sevkiyat silinsin mi?`}
                      onConfirm={handleBulkDeleteTrips}
                      onCancel={exitBulkSelectMode}
                    />
                  ) : (
                    <button
                      type="button"
                      className={`quote-list-bulk-trash-btn${bulkSelectMode ? ' is-active' : ''}`}
                      title={bulkSelectMode ? 'Seçim modundan çık' : 'Toplu sil'}
                      aria-label={bulkSelectMode ? 'Seçim modundan çık' : 'Toplu sil modu'}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (!bulkSelectMode) {
                          setBulkSelectMode(true)
                          setSelectedTripIds([])
                          return
                        }
                        exitBulkSelectMode()
                      }}
                    >
                      <Trash2 className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} aria-hidden />
                    </button>
                  )}
                </QuoteListCell>
              </QuoteListRowPanel>

              {listTrips.map((trip, rowIndex) => {
                const stamp = formatListDateParts(trip.createdAt)
                const firstStop = (trip.stops || [])[0]
                const tripKey = String(trip.id)
                const isBulkSelected = selectedTripIds.includes(tripKey)
                const isAnimatingOut = animatingDeleteIds.includes(tripKey)
                const tripStatus = statusLabel(trip.status)
                return (
                  <div
                    key={trip.id}
                    className={
                      isAnimatingOut
                        ? 'quote-list-row-into-trash-wrap'
                        : bulkSelectMode
                          ? undefined
                          : 'cursor-pointer'
                    }
                    style={
                      isAnimatingOut
                        ? { animationDelay: `${Math.min(rowIndex, 6) * 70}ms` }
                        : undefined
                    }
                    role={bulkSelectMode && !isAnimatingOut ? undefined : 'button'}
                    tabIndex={bulkSelectMode && !isAnimatingOut ? undefined : 0}
                    onClick={() => {
                      if (isAnimatingOut) return
                      if (bulkSelectMode) toggleBulkSelect(trip.id)
                      else navigate(`/sevkiyat/${trip.id}`)
                    }}
                    onKeyDown={(event) => {
                      if (bulkSelectMode || isAnimatingOut) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigate(`/sevkiyat/${trip.id}`)
                      }
                    }}
                  >
                    <QuoteListRowPanel
                      gridTemplate={sevkiyatListColumnGrid}
                      className={isBulkSelected ? 'ring-1 ring-blue-400/35' : ''}
                    >
                      {bulkSelectMode ? (
                        <QuoteListCell>
                          <QuoteListSelectionCheckbox
                            checked={isBulkSelected}
                            aria-label={`${trip.code || trip.id} sevkiyatını seç`}
                            onChange={() => toggleBulkSelect(trip.id)}
                          />
                        </QuoteListCell>
                      ) : null}
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
                          {trip.code ||
                            resolveQuoteCode(
                              trip.id,
                              trips.map((item) => item.id),
                            )}
                        </span>
                      </QuoteListCell>
                      <QuoteListCell>
                        <span className="flex min-w-0 w-full flex-col items-center gap-0.5 py-0.5 text-center">
                          <span className="customer-name-primary whitespace-normal break-words text-[14px] font-bold leading-tight tracking-normal text-[var(--muted)]">
                            {firstStop?.customerLabel || trip.plate || 'Müşteri girilmedi'}
                          </span>
                          {trip.plate && firstStop?.customerLabel ? (
                            <span className="customer-name-secondary font-sans whitespace-normal break-words text-[14px] font-normal leading-tight text-[var(--muted)]">
                              {trip.plate}
                              {trip.driverName ? ` · ${trip.driverName}` : ''}
                            </span>
                          ) : trip.driverName ? (
                            <span className="customer-name-secondary font-sans whitespace-normal break-words text-[14px] font-normal leading-tight text-[var(--muted)]">
                              {trip.driverName}
                            </span>
                          ) : null}
                        </span>
                      </QuoteListCell>
                      <QuoteListCell>
                        <span
                          className="flex w-full items-center justify-center"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <EditableDropdownPill
                            value={tripStatus}
                            options={STATUS_FILTER_OPTIONS.filter(
                              (option) => option.label !== 'Tümü',
                            )}
                            includePlaceholderOption={false}
                            editable={false}
                            buttonClassName={PAGE_LIST_PILL_CLASS}
                            wrapperClassName={PAGE_LIST_PILL_WRAPPER_CLASS}
                            menuClassName={PAGE_FILTER_MENU_CLASS}
                            menuMatchWidth={false}
                            openKey={`${trip.id}-status`}
                            activeMenu={activeMenu}
                            setActiveMenu={setActiveMenu}
                            onChange={(value) => {
                              const next = Object.values(SEVKIYAT_STATUS).find(
                                (item) => item.label === value,
                              )
                              if (next) {
                                markTripStatus(trip.id, next.id)
                                setTrips(loadTrips())
                              }
                            }}
                          />
                        </span>
                      </QuoteListCell>
                      <QuoteListCell>
                        <span className={YF_TEXT_CLASS}>{(trip.stops || []).length}</span>
                      </QuoteListCell>
                      <QuoteListCell>
                        <span
                          className="inline-flex w-full items-center justify-center"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <ProcessListRowMoreMenu
                            record={trip}
                            deleteAriaLabel="Sevkiyat sil"
                            onEdit={() => navigate(`/sevkiyat/${trip.id}`)}
                            onDelete={() => softDeleteTripWithAnimation(trip)}
                            extraItems={[
                              {
                                id: 'control',
                                icon: ExternalLink,
                                label: 'Detayları Gör',
                                tone: 'primary',
                                onClick: () => navigate(`/lojistik/tir-sevkiyat/${trip.id}`),
                              },
                              {
                                id: 'track',
                                icon: Copy,
                                label: 'Takip linki',
                                tone: 'primary',
                                onClick: async () => {
                                  shareTrackingLink(trip.id, true)
                                  const url = getSevkiyatTrackingUrl(trip.trackingToken)
                                  try {
                                    await navigator.clipboard.writeText(url)
                                  } catch {
                                    window.prompt('Takip linki:', url)
                                  }
                                },
                              },
                              {
                                id: 'deliver',
                                icon: CheckCircle2,
                                label: 'Teslim et',
                                tone: 'success',
                                onClick: () => {
                                  markTripStatus(trip.id, 'delivered')
                                  setTrips(loadTrips())
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
          ) : null}

          <QuoteDeletedArchivedPanel
            layoutMode="inline"
            title="Silinenler"
            collection="sevkiyat"
            storeEvent={SEVKIYAT_EVENT}
            restoreRecord={restoreDeletedTrip}
            permanentlyDelete={permanentlyDeleteTrip}
            resolveCode={(id, extraIds) => {
              const trip = trips.find((item) => item.id === id)
              return trip?.code || resolveQuoteCode(id, extraIds)
            }}
            onRestored={() => {
              setTrips(loadTrips())
              flushWorkspaceNow()
            }}
            emptyMessage="Silinen sevkiyat yok."
            receivePulseKey={archiveReceiveKey}
            className="customer-deleted-archived-panel w-full"
            segmentTabs={[{ id: 'status', label: 'Durum' }]}
            getProcessValue={(trip) => statusLabel(trip.status)}
            getProcessOptions={() =>
              STATUS_FILTER_OPTIONS.filter((option) => option.label !== 'Tümü')
            }
            getListAmount={() => 0}
            columnGrid={sevkiyatListBaseColumnGrid.join(' ')}
          />
        </div>
      </div>
    </AppPageShell>
  )
}
