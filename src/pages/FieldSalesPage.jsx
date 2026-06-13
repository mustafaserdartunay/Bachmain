import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  Crosshair,
  MapPin,
  Navigation,
  Plus,
  Route,
  Store,
  Trash2,
  Users,
} from 'lucide-react'
import FieldSalesMap from '../components/FieldSales/FieldSalesMap'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import { getCustomerProfiles } from '../data/customerProfiles'
import { readCompanySettings } from '../utils/companySettings'
import { getCustomerBranchDisplay, getCustomerDisplay } from '../utils/customerDisplay'
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsNavigationUrl,
  getCompanyStartPoint,
  getCustomerCoordinates,
} from '../utils/customerGeo'
import {
  addFieldSalesTask,
  FIELD_SALES_DAYS,
  getFieldSalesReps,
  getRepSchedule,
  loadFieldSalesTasks,
  removeFieldSalesTask,
  saveLastRoute,
  toggleRepDayCustomer,
  updateFieldSalesTask,
} from '../utils/fieldSalesStore'
import { getCustomerMetaSelection, readCustomerMeta, readOptionLists } from '../utils/customerMeta'
import {
  fetchOsrmRouteGeometry,
  optimizeStopOrder,
} from '../utils/routePlanning'

function getRepCustomers(allCustomers, meta, repLabel) {
  return allCustomers.filter((customer) => {
    const selection = getCustomerMetaSelection(customer, meta[customer.id])
    return selection.representative === repLabel
  })
}

function getDealerCustomers(allCustomers, meta) {
  return allCustomers.filter((customer) => {
    const selection = getCustomerMetaSelection(customer, meta[customer.id])
    return selection.type === 'Bayi'
  })
}

function getRegularCustomers(allCustomers, meta) {
  return allCustomers.filter((customer) => {
    const selection = getCustomerMetaSelection(customer, meta[customer.id])
    return selection.type === 'Müşteri'
  })
}

function filterCustomersByCategory(customerList, meta, categoryFilter) {
  if (!categoryFilter || categoryFilter === 'all') return customerList
  return customerList.filter((customer) => {
    const selection = getCustomerMetaSelection(customer, meta[customer.id])
    return selection.category === categoryFilter
  })
}

export default function FieldSalesPage() {
  const [customers, setCustomers] = useState(() => getCustomerProfiles())
  const [meta, setMeta] = useState(() => readCustomerMeta())
  const [reps] = useState(() => getFieldSalesReps())
  const [selectedRep, setSelectedRep] = useState(() => getFieldSalesReps()[0]?.label || '')
  const [selectedDay, setSelectedDay] = useState('monday')
  const [planKind, setPlanKind] = useState('representative')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categoryOptions, setCategoryOptions] = useState(() => readOptionLists().category)
  const [viewMode, setViewMode] = useState('day')
  const [tasks, setTasks] = useState(() => loadFieldSalesTasks())
  const [schedule, setSchedule] = useState(() => getRepSchedule(selectedRep))
  const [companySettings, setCompanySettings] = useState(() => readCompanySettings())
  const [startPoint, setStartPoint] = useState(() => getCompanyStartPoint(readCompanySettings()))
  const [locationMode, setLocationMode] = useState('company')
  const [locationMenuOpen, setLocationMenuOpen] = useState(false)
  const locationMenuRef = useRef(null)
  const tasksSectionRef = useRef(null)
  const [routeGeometry, setRouteGeometry] = useState([])
  const [routeStats, setRouteStats] = useState({ distanceKm: 0, durationMin: 0 })
  const [orderedStops, setOrderedStops] = useState([])
  const [activeStopIndex, setActiveStopIndex] = useState(-1)
  const [activeCustomerId, setActiveCustomerId] = useState(null)
  const [taskForm, setTaskForm] = useState({ title: '', customerId: '', dueDate: '' })
  const [locating, setLocating] = useState(false)
  const [planning, setPlanning] = useState(false)

  useEffect(() => {
    function refresh() {
      setCustomers(getCustomerProfiles())
      setMeta(readCustomerMeta())
      setTasks(loadFieldSalesTasks(selectedRep))
      setSchedule(getRepSchedule(selectedRep))
    }
    function refreshOptions() {
      setCategoryOptions(readOptionLists().category)
    }
    function refreshCompany() {
      const next = readCompanySettings()
      setCompanySettings(next)
      if (locationMode === 'company') {
        setStartPoint(getCompanyStartPoint(next))
      }
    }
    window.addEventListener('bach:field-sales-updated', refresh)
    window.addEventListener('bach:option-lists-updated', refreshOptions)
    window.addEventListener('bach:option-lists-updated', refresh)
    window.addEventListener('erlenbox:company-settings-updated', refreshCompany)
    return () => {
      window.removeEventListener('bach:field-sales-updated', refresh)
      window.removeEventListener('bach:option-lists-updated', refreshOptions)
      window.removeEventListener('bach:option-lists-updated', refresh)
      window.removeEventListener('erlenbox:company-settings-updated', refreshCompany)
    }
  }, [selectedRep, locationMode])

  useEffect(() => {
    if (!locationMenuOpen) return undefined
    function closeMenu(event) {
      if (locationMenuRef.current && !locationMenuRef.current.contains(event.target)) {
        setLocationMenuOpen(false)
      }
    }
    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [locationMenuOpen])

  useEffect(() => {
    if (locationMode !== 'live' || !navigator.geolocation) return undefined

    setLocating(true)
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setStartPoint({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: 'live',
          label: 'Canlı konum',
        })
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [locationMode])

  useEffect(() => {
    setSchedule(getRepSchedule(selectedRep))
    setTasks(loadFieldSalesTasks(selectedRep))
    setOrderedStops([])
    setRouteGeometry([])
    setActiveStopIndex(-1)
  }, [selectedRep])

  const repCustomers = useMemo(
    () => getRepCustomers(customers, meta, selectedRep),
    [customers, meta, selectedRep],
  )

  const dealerCustomers = useMemo(
    () => getDealerCustomers(customers, meta),
    [customers, meta],
  )

  const regularCustomers = useMemo(
    () => getRegularCustomers(customers, meta),
    [customers, meta],
  )

  const dayCustomerIds = schedule[selectedDay] || []
  const dayCustomers = useMemo(
    () => dayCustomerIds
      .map((id) => customers.find((customer) => customer.id === id))
      .filter(Boolean),
    [dayCustomerIds, customers],
  )

  const baseMapCustomers = useMemo(() => {
    if (planKind === 'dealer') return dealerCustomers
    if (planKind === 'customer') return regularCustomers
    return viewMode === 'day' ? dayCustomers : repCustomers
  }, [planKind, dealerCustomers, regularCustomers, viewMode, dayCustomers, repCustomers])

  const mapCustomers = useMemo(
    () => filterCustomersByCategory(baseMapCustomers, meta, selectedCategory),
    [baseMapCustomers, meta, selectedCategory],
  )

  const listCustomers = useMemo(() => {
    const base = planKind === 'dealer'
      ? dealerCustomers
      : planKind === 'customer'
        ? regularCustomers
        : repCustomers
    return filterCustomersByCategory(base, meta, selectedCategory)
  }, [planKind, dealerCustomers, regularCustomers, repCustomers, meta, selectedCategory])

  const isRepPlan = planKind === 'representative'

  const openTasksCount = useMemo(
    () => tasks.filter((task) => task.status !== 'done').length,
    [tasks],
  )

  const weeklyVisitCount = useMemo(
    () => Object.values(schedule).reduce((total, ids) => total + (ids?.length || 0), 0),
    [schedule],
  )

  const handleCustomerClick = useCallback((customer) => {
    setActiveCustomerId(customer.id)
  }, [])

  function handleToggleDayCustomer(customerId) {
    toggleRepDayCustomer(selectedRep, selectedDay, customerId)
    setSchedule(getRepSchedule(selectedRep))
  }

  function handleCategoryChange(category) {
    setSelectedCategory(category)
    setOrderedStops([])
    setRouteGeometry([])
    setActiveStopIndex(-1)
  }

  function applyCompanyLocation() {
    const point = getCompanyStartPoint(companySettings)
    setLocationMode('company')
    setStartPoint(point)
    setLocationMenuOpen(true)
  }

  function applyLiveLocation() {
    if (!navigator.geolocation) return
    setLocationMode('live')
    setLocationMenuOpen(false)
    setLocating(true)
  }

  function handleKonumumClick() {
    applyCompanyLocation()
  }

  async function handlePlanRoute() {
    const stops = mapCustomers
    if (!stops.length) return

    setPlanning(true)
    const origin = startPoint || getCustomerCoordinates(stops[0])
    const ordered = optimizeStopOrder(origin, stops)
    const osrm = await fetchOsrmRouteGeometry(origin, ordered)
    setOrderedStops(ordered)
    setRouteGeometry(osrm.geometry)
    setRouteStats({ distanceKm: osrm.distanceKm, durationMin: osrm.durationMin })
    saveLastRoute({
      repLabel: selectedRep,
      dayId: selectedDay,
      stopIds: ordered.map((customer) => customer.id),
      distanceKm: osrm.distanceKm,
      createdAt: new Date().toISOString(),
    })
    setPlanning(false)
  }

  function handleOpenCustomerInMaps(customer) {
    window.open(buildGoogleMapsNavigationUrl(customer), '_blank', 'noopener,noreferrer')
  }

  function handleOpenFullRoute() {
    if (!orderedStops.length) return
    const origin = startPoint
      ? `${startPoint.lat},${startPoint.lng}`
      : (() => {
        const first = getCustomerCoordinates(orderedStops[0])
        return `${first.lat},${first.lng}`
      })()
    const last = orderedStops[orderedStops.length - 1]
    const lastCoords = getCustomerCoordinates(last)
    const destination = `${lastCoords.lat},${lastCoords.lng}`
    const waypoints = orderedStops.slice(0, -1).map((customer) => {
      const coords = getCustomerCoordinates(customer)
      return `${coords.lat},${coords.lng}`
    })
    window.open(
      buildGoogleMapsDirectionsUrl({ origin, destination, waypoints: waypoints.slice(startPoint ? 0 : 1) }),
      '_blank',
      'noopener,noreferrer',
    )
  }

  function handleStartRoute() {
    if (!orderedStops.length) return
    setActiveStopIndex(0)
    handleOpenCustomerInMaps(orderedStops[0])
  }

  function handleNextStop() {
    const nextIndex = activeStopIndex + 1
    if (nextIndex >= orderedStops.length) return
    setActiveStopIndex(nextIndex)
    handleOpenCustomerInMaps(orderedStops[nextIndex])
  }

  function handleAddTask(event) {
    event.preventDefault()
    addFieldSalesTask({
      repLabel: selectedRep,
      customerId: taskForm.customerId,
      title: taskForm.title,
      dueDate: taskForm.dueDate,
    })
    setTaskForm({ title: '', customerId: '', dueDate: '' })
    setTasks(loadFieldSalesTasks(selectedRep))
  }

  function scrollToTasks() {
    tasksSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Saha Satış Sistemi"
        actions={(
          <>
            <Link
              to="/musteriler"
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm"
            >
              <Users className="h-4 w-4" />
              Müşteriler
            </Link>
            <button
              type="button"
              onClick={handlePlanRoute}
              disabled={planning || !mapCustomers.length}
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm disabled:opacity-60"
            >
              <Route className="h-4 w-4" />
              {planning ? 'Planlanıyor...' : 'Rota Planla'}
            </button>
            <button
              type="button"
              onClick={handleStartRoute}
              disabled={!orderedStops.length}
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm disabled:opacity-60"
            >
              <Navigation className="h-4 w-4" />
              Rotayı Başlat
            </button>
            <button
              type="button"
              onClick={scrollToTasks}
              className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              Görev ekle
            </button>
          </>
        )}
      />

      <SummaryMetrics
        columns={4}
        items={[
          {
            title: planKind === 'dealer'
              ? 'Bayi cari'
              : planKind === 'customer'
                ? 'Müşteri cari'
                : 'Atanan müşteri',
            value: planKind === 'dealer'
              ? dealerCustomers.length
              : planKind === 'customer'
                ? regularCustomers.length
                : repCustomers.length,
            icon: planKind === 'dealer' ? Store : Users,
            tone: planKind === 'dealer' ? 'emerald' : 'blue',
            valueTone: planKind === 'dealer' ? 'emerald' : 'blue',
          },
          {
            title: 'Bugün ziyaret',
            value: dayCustomers.length,
            icon: CalendarDays,
            tone: 'purple',
            valueTone: 'purple',
          },
          {
            title: 'Açık görev',
            value: openTasksCount,
            icon: CheckSquare,
            tone: 'orange',
            valueTone: 'orange',
          },
          {
            title: 'Haftalık plan',
            value: weeklyVisitCount,
            icon: MapPin,
            tone: 'cyan',
            valueTone: 'cyan',
            subtitle: routeStats.distanceKm > 0 ? `${routeStats.distanceKm} km rota` : undefined,
          },
        ]}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-5">
      <AppPagePanel
        title="Saha Planı"
        description={
          planKind === 'dealer'
            ? 'Kayıtlı bayi carilerinin konumları haritada gösterilir.'
            : planKind === 'customer'
              ? 'Müşteri tipindeki carilerin konumları haritada gösterilir.'
              : 'Temsilci seçin, haftalık ziyaret günlerini planlayın.'
        }
        action={(
          <span className={`rounded-xl px-3 py-1.5 text-xs font-black ${
            planKind === 'dealer'
              ? 'bg-emerald-500/10 text-emerald-300'
              : planKind === 'customer'
                ? 'bg-blue-500/10 text-blue-300'
                : 'bg-blue-500/10 text-blue-300'
          }`}
          >
            {mapCustomers.length} konum
          </span>
        )}
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Plan Türü</p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setPlanKind('representative')
                  setOrderedStops([])
                  setRouteGeometry([])
                }}
                className={`rounded-lg border px-1.5 py-1.5 text-[9px] font-black uppercase leading-tight transition-colors ${
                  planKind === 'representative'
                    ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                    : 'border-dark-500/50 text-gray-500 hover:text-white'
                }`}
              >
                Temsilci
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlanKind('customer')
                  setViewMode('all')
                  setOrderedStops([])
                  setRouteGeometry([])
                }}
                className={`rounded-lg border px-1.5 py-1.5 text-[9px] font-black uppercase leading-tight transition-colors ${
                  planKind === 'customer'
                    ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                    : 'border-dark-500/50 text-gray-500 hover:text-white'
                }`}
              >
                Müşteri Türü
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlanKind('dealer')
                  setViewMode('all')
                  setOrderedStops([])
                  setRouteGeometry([])
                }}
                className={`rounded-lg border px-1.5 py-1.5 text-[9px] font-black uppercase leading-tight transition-colors ${
                  planKind === 'dealer'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-dark-500/50 text-gray-500 hover:text-white'
                }`}
              >
                <span className="inline-flex items-center justify-center gap-0.5">
                  <Store className="h-3 w-3" />
                  Bayi
                </span>
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Müşteri Kategorisi</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleCategoryChange('all')}
                className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase transition-colors ${
                  selectedCategory === 'all'
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                    : 'border-dark-500/50 bg-dark-700/50 text-gray-500 hover:text-white'
                }`}
              >
                Tümü
              </button>
              {categoryOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleCategoryChange(option.label)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase transition-colors ${
                    selectedCategory === option.label
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                      : 'border-dark-500/50 bg-dark-700/50 text-gray-500 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {isRepPlan && (
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Satış Temsilcisi</p>
            <div className="flex flex-wrap gap-2">
              {reps.map((rep) => (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => setSelectedRep(rep.label)}
                  className={`rounded-xl border px-3 py-1.5 text-[11px] font-black uppercase tracking-wide transition-colors ${
                    selectedRep === rep.label
                      ? 'border-blue-500/50 bg-blue-500/15 text-blue-300'
                      : 'border-dark-500/50 bg-dark-700/50 text-gray-400 hover:text-white'
                  }`}
                >
                  {rep.label}
                </button>
              ))}
            </div>
          </div>
          )}

          {isRepPlan && (
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Haftalık Ziyaret</p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {FIELD_SALES_DAYS.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => {
                    setSelectedDay(day.id)
                    setViewMode('day')
                  }}
                  className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase transition-colors ${
                    selectedDay === day.id
                      ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                      : 'border-dark-500/50 bg-dark-700/50 text-gray-500 hover:text-white'
                  }`}
                >
                  {day.short}
                  <span className="ml-1 text-[9px] text-gray-500">
                    ({(schedule[day.id] || []).length})
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-[10px] font-black uppercase ${
                  viewMode === 'day'
                    ? 'border-violet-500/40 bg-violet-500/10 text-violet-300'
                    : 'border-dark-500/50 text-gray-500'
                }`}
              >
                Gün planı
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-[10px] font-black uppercase ${
                  viewMode === 'all'
                    ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                    : 'border-dark-500/50 text-gray-500'
                }`}
              >
                Tüm müşteriler
              </button>
            </div>
          </div>
          )}

          {planKind === 'dealer' && (
            <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-200">
              {mapCustomers.length} bayi cari haritada gösteriliyor
              {selectedCategory !== 'all' ? ` (${selectedCategory})` : ''}.
            </p>
          )}

          {planKind === 'customer' && (
            <p className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-[11px] font-semibold text-blue-200">
              {mapCustomers.length} müşteri cari haritada gösteriliyor
              {selectedCategory !== 'all' ? ` (${selectedCategory})` : ''}.
            </p>
          )}

          <div className="max-h-72 space-y-1 overflow-y-auto">
            {listCustomers.map((customer) => {
              const checked = isRepPlan && dayCustomerIds.includes(customer.id)
              const { branchName, companyName } = getCustomerBranchDisplay(customer)
              const category = getCustomerMetaSelection(customer, meta[customer.id]).category
              return (
                <label
                  key={customer.id}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors ${
                    planKind === 'dealer'
                      ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
                      : planKind === 'customer'
                        ? 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10'
                        : checked
                          ? 'border-violet-500/40 bg-violet-500/10'
                          : 'border-dark-500/40 bg-dark-700/40 hover:bg-dark-700/70'
                  } ${isRepPlan ? 'cursor-pointer' : ''}`}
                >
                  {isRepPlan && (
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleDayCustomer(customer.id)}
                      className="rounded border-dark-500"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-white">{branchName}</p>
                    <p className="truncate text-[10px] text-gray-400">{companyName}</p>
                    {category && (
                      <p className="truncate text-[9px] font-bold uppercase text-amber-400/90">{category}</p>
                    )}
                    <p className="truncate text-[10px] text-gray-500">{customer.city}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      handleOpenCustomerInMaps(customer)
                    }}
                    className="rounded-md p-1 text-gray-500 hover:bg-dark-600 hover:text-blue-300"
                    title="Google Haritalar"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                  </button>
                </label>
              )
            })}
            {!listCustomers.length && (
              <p className="rounded-xl border border-dashed border-dark-500/50 px-3 py-4 text-center text-xs text-gray-500">
                {planKind === 'dealer'
                  ? selectedCategory !== 'all'
                    ? `Bu kategoride bayi cari yok (${selectedCategory}).`
                    : 'Henüz bayi tipinde kayıtlı cari yok. Müşteriler sayfasından tipi Bayi yapın.'
                  : planKind === 'customer'
                    ? selectedCategory !== 'all'
                      ? `Bu kategoride müşteri cari yok (${selectedCategory}).`
                      : 'Henüz müşteri tipinde kayıtlı cari yok. Müşteriler sayfasından tipi Müşteri yapın.'
                  : selectedCategory !== 'all'
                    ? `Bu temsilci ve kategoride müşteri yok (${selectedCategory}).`
                    : 'Bu temsilciye atanmış müşteri yok. Müşteriler sayfasından temsilci seçin.'}
              </p>
            )}
          </div>
        </div>
      </AppPagePanel>

      <div ref={tasksSectionRef}>
        <AppPagePanel
          title="Görevler"
          description="Saha temsilcisine atanmış görevler."
          action={(
            <span className="rounded-xl bg-orange-500/10 px-3 py-1.5 text-xs font-black text-orange-300">
              {openTasksCount} açık
            </span>
          )}
        >
          <form className="mb-4 space-y-2" onSubmit={handleAddTask}>
            <input
              value={taskForm.title}
              onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Yeni görev..."
              className="form-input w-full text-xs"
            />
            <select
              value={taskForm.customerId}
              onChange={(event) => setTaskForm((current) => ({ ...current, customerId: event.target.value }))}
              className="form-input w-full text-xs"
            >
              <option value="">Müşteri (opsiyonel)</option>
              {repCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {getCustomerDisplay(customer).brandShortName}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(event) => setTaskForm((current) => ({ ...current, dueDate: event.target.value }))}
              className="form-input w-full text-xs"
            />
            <button type="submit" className="btn-primary inline-flex w-full items-center justify-center gap-1.5 py-2 text-xs font-black uppercase">
              <Plus className="h-3.5 w-3.5" />
              Görev Ekle
            </button>
          </form>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-2 rounded-xl border border-dark-500/40 bg-dark-700/40 px-2.5 py-2">
                <button
                  type="button"
                  onClick={() => {
                    updateFieldSalesTask(task.id, { status: task.status === 'done' ? 'open' : 'done' })
                    setTasks(loadFieldSalesTasks(selectedRep))
                  }}
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${
                    task.status === 'done' ? 'border-emerald-500 bg-emerald-500' : 'border-dark-500'
                  }`}
                  aria-label="Tamamla"
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-white'}`}>
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <p className="text-[10px] text-gray-500">{task.dueDate}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    removeFieldSalesTask(task.id)
                    setTasks(loadFieldSalesTasks(selectedRep))
                  }}
                  className="rounded-md p-1 text-gray-500 hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {!tasks.length && (
              <p className="text-center text-[11px] text-gray-500">Henüz görev yok.</p>
            )}
          </div>
        </AppPagePanel>
      </div>
        </div>

      <AppPagePanel
        className="xl:sticky xl:top-[4.5rem]"
        title="Harita & Rota"
        description="Müşteri konumları, rota planlama ve navigasyon."
        action={(
          <div className="relative" ref={locationMenuRef}>
            <div className="inline-flex overflow-hidden rounded-lg border border-dark-500/50">
              <button
                type="button"
                onClick={handleKonumumClick}
                className={`inline-flex h-9 items-center gap-1.5 px-3 text-[11px] font-black uppercase transition-colors ${
                  locationMode === 'company'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-dark-700/50 text-gray-300 hover:bg-dark-600'
                }`}
              >
                {locationMode === 'live' ? (
                  <Crosshair className="h-3.5 w-3.5" />
                ) : (
                  <Building2 className="h-3.5 w-3.5" />
                )}
                {locating && locationMode === 'live' ? 'Canlı...' : 'Konumum'}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setLocationMenuOpen((open) => !open)
                }}
                className="inline-flex h-9 items-center border-l border-dark-500/50 bg-dark-700/50 px-2 text-gray-400 hover:bg-dark-600 hover:text-white"
                aria-label="Konum seçenekleri"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${locationMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {locationMenuOpen && (
              <div className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl border border-dark-500/50 bg-dark-800 shadow-2xl shadow-black/35">
                <button
                  type="button"
                  onClick={() => {
                    applyCompanyLocation()
                    setLocationMenuOpen(false)
                  }}
                  className={`flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-dark-700/70 ${
                    locationMode === 'company' ? 'bg-emerald-500/10' : ''
                  }`}
                >
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white">Firma adresi</p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] font-semibold text-gray-500">
                      {companySettings.address || 'Yönetici ayarlarından adres girin'}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={applyLiveLocation}
                  className={`flex w-full items-start gap-2 border-t border-dark-500/40 px-3 py-2.5 text-left transition-colors hover:bg-dark-700/70 ${
                    locationMode === 'live' ? 'bg-blue-500/10' : ''
                  }`}
                >
                  <Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
                  <div>
                    <p className="text-xs font-black text-white">Canlı konum</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-gray-500">
                      Anlık GPS konumunuz takip edilir
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      >
        {startPoint && (
          <div className="mb-3 rounded-xl border border-dark-500/40 bg-dark-700/40 px-3 py-2 text-[11px] font-semibold text-gray-400">
            <span className="font-black uppercase text-gray-300">
              {locationMode === 'live' ? 'Canlı konum aktif' : 'Başlangıç: Firma adresi'}
            </span>
            {locationMode === 'company' && startPoint.label && (
              <span className="ml-2 text-gray-500">{startPoint.label}</span>
            )}
          </div>
        )}

        {routeStats.distanceKm > 0 && (
          <div className="mb-3 flex flex-wrap gap-3 rounded-xl border border-dark-500/40 bg-dark-700/40 px-3 py-2 text-[11px] font-bold text-gray-300">
            <span>Toplam: {routeStats.distanceKm} km</span>
            {routeStats.durationMin > 0 && <span>Süre: ~{routeStats.durationMin} dk</span>}
            <span>{orderedStops.length} durak</span>
            {orderedStops.length > 0 && (
              <button
                type="button"
                onClick={handleOpenFullRoute}
                className="text-blue-300 hover:text-blue-200"
              >
                Tüm rotayı Google&apos;da aç
              </button>
            )}
          </div>
        )}

        <FieldSalesMap
          customers={mapCustomers}
          routeGeometry={routeGeometry}
          startPoint={startPoint}
          activeCustomerId={activeCustomerId}
          onCustomerClick={(customer) => {
            handleCustomerClick(customer)
            handleOpenCustomerInMaps(customer)
          }}
          className="min-h-[480px]"
          markerColor={planKind === 'dealer' ? '#10b981' : '#2563eb'}
          emptyMessage={
            planKind === 'dealer'
              ? 'Haritada göstermek için bayi tipinde cari kaydedin'
              : planKind === 'customer'
                ? 'Haritada göstermek için müşteri tipinde cari kaydedin'
                : 'Haritada göstermek için temsilci ve müşteri seçin'
          }
        />

        {orderedStops.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wide text-gray-500">Rota Sırası</p>
              {activeStopIndex >= 0 && activeStopIndex < orderedStops.length - 1 && (
                <button
                  type="button"
                  onClick={handleNextStop}
                  className="rounded-lg bg-blue-500 px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-blue-400"
                >
                  Sonraki Durak ({activeStopIndex + 2}/{orderedStops.length})
                </button>
              )}
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {orderedStops.map((customer, index) => {
                const { branchName, companyName } = getCustomerBranchDisplay(customer)
                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleOpenCustomerInMaps(customer)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
                      index === activeStopIndex
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-dark-500/40 bg-dark-700/40 hover:bg-dark-700/70'
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-black text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-white">{branchName}</p>
                      <p className="truncate text-[10px] text-gray-400">{companyName}</p>
                      <p className="truncate text-[10px] text-gray-500">{customer.city}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </AppPagePanel>
      </div>
    </AppPageShell>
  )
}
