import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MapPinned,
  Package,
  Plus,
  Radio,
  Truck,
  Users,
} from 'lucide-react'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import CourierMap from '../components/Courier/CourierMap'
import CourierVehicleTypeFilter from '../components/Courier/CourierVehicleTypeFilter'
import CourierFleetPanel from '../components/Courier/CourierFleetPanel'
import CourierDispatchList, { CourierTrackingLinkBar } from '../components/Courier/CourierDispatchList'
import CourierDispatchForm from '../components/Courier/CourierDispatchForm'
import {
  COURIER_UPDATED_EVENT,
  createDispatch,
  formatEta,
  formatTimelineTime,
  getActiveDispatches,
  getCourierMetrics,
  getCustomerTrackingUrl,
  getDispatchStatusMeta,
  getVehicleTypeMeta,
  loadCourierState,
  shareDispatchWithCustomer,
  tickLivePositions,
  updateDispatchStatus,
  VEHICLE_TYPES,
} from '../utils/courierStore'

function DetailTimeline({ timeline = [] }) {
  return (
    <div className="space-y-3">
      {timeline.slice().reverse().map((item, index) => {
        const meta = getDispatchStatusMeta(item.status)
        return (
          <div key={`${item.at}-${index}`} className="flex gap-3">
            <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${meta.bg.replace('/10', '')}`} style={{ background: 'currentColor' }} />
            <div>
              <p className={`text-xs font-bold ${meta.tone}`}>{item.label}</p>
              <p className="text-[13px] text-gray-500">{formatTimelineTime(item.at)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function CourierTrackingPage() {
  const [state, setState] = useState(() => loadCourierState())
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all')
  const [activeDispatchId, setActiveDispatchId] = useState(() => getActiveDispatches()[0]?.id || null)
  const [sidebarTab, setSidebarTab] = useState('dispatches')
  const [shareToast, setShareToast] = useState('')
  const [creating, setCreating] = useState(false)

  const refresh = useCallback(() => {
    setState(loadCourierState())
  }, [])

  useEffect(() => {
    function handleUpdate() {
      refresh()
    }
    window.addEventListener(COURIER_UPDATED_EVENT, handleUpdate)
    return () => window.removeEventListener(COURIER_UPDATED_EVENT, handleUpdate)
  }, [refresh])

  useEffect(() => {
    const timer = window.setInterval(() => {
      tickLivePositions()
    }, 4000)
    return () => window.clearInterval(timer)
  }, [])

  const metrics = useMemo(() => getCourierMetrics(), [state])
  const activeDispatches = useMemo(
    () => state.dispatches.filter((item) => !['delivered', 'cancelled'].includes(item.status)),
    [state.dispatches],
  )

  const filteredDispatches = useMemo(() => {
    if (vehicleTypeFilter === 'all') return activeDispatches
    return activeDispatches.filter((item) => item.vehicleType === vehicleTypeFilter)
  }, [activeDispatches, vehicleTypeFilter])

  const activeDispatch = state.dispatches.find((item) => item.id === activeDispatchId) || filteredDispatches[0] || null

  const vehicleCounts = useMemo(() => {
    const counts = { all: state.fleet.length }
    VEHICLE_TYPES.forEach((type) => {
      counts[type.id] = state.fleet.filter((item) => item.vehicleType === type.id).length
    })
    return counts
  }, [state.fleet])

  const metricItems = [
    { title: 'Aktif Gönderi', value: metrics.activeCount, icon: Package, tone: 'orange', valueTone: 'orange' },
    { title: 'Yoldaki Araç', value: metrics.onRoadVehicles, icon: Truck, tone: 'blue', valueTone: 'blue' },
    { title: 'Bugün Teslim', value: metrics.deliveredToday, icon: MapPinned, tone: 'emerald', valueTone: 'emerald' },
    { title: 'Müsait Filo', value: `${metrics.availableFleet}/${metrics.totalFleet}`, icon: Users, tone: 'cyan', valueTone: 'white' },
    { title: 'Canlı İzleme', value: 'Açık', icon: Radio, tone: 'purple', valueTone: 'purple', subtitle: '4 sn güncelleme' },
  ]

  function handleCreateDispatch(payload) {
    setCreating(true)
    try {
      const dispatch = createDispatch(payload)
      if (payload.sharedWithCustomer) shareDispatchWithCustomer(dispatch.id, true)
      setActiveDispatchId(dispatch.id)
      setSidebarTab('dispatches')
      refresh()
    } finally {
      setCreating(false)
    }
  }

  function handleStatusChange(dispatchId, status) {
    updateDispatchStatus(dispatchId, status)
    refresh()
  }

  function handleShare(dispatch) {
    shareDispatchWithCustomer(dispatch.id, true)
    const url = getCustomerTrackingUrl(dispatch.trackingToken)
    navigator.clipboard?.writeText(url).catch(() => {})
    setShareToast(`Takip linki kopyalandı: ${dispatch.customerName}`)
    window.setTimeout(() => setShareToast(''), 3500)
    refresh()
  }

  function copyTrackingUrl(url) {
    navigator.clipboard?.writeText(url).catch(() => {})
    setShareToast('Takip linki panoya kopyalandı')
    window.setTimeout(() => setShareToast(''), 2500)
  }

  const typeMeta = activeDispatch ? getVehicleTypeMeta(activeDispatch.vehicleType) : null

  return (
    <AppPageShell>
      <AppPageHeader
        title="Kurye Takip"
        actions={(
          <button
            type="button"
            onClick={() => setSidebarTab('create')}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Yeni Gönderi
          </button>
        )}
      />

      <SummaryMetrics items={metricItems} columns={5} />

      <CourierVehicleTypeFilter
        value={vehicleTypeFilter}
        onChange={setVehicleTypeFilter}
        counts={vehicleCounts}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,420px)]">
        <div className="space-y-5">
          <CourierMap
            hq={state.hq}
            dispatches={filteredDispatches.length ? filteredDispatches : activeDispatches}
            activeDispatchId={activeDispatch?.id}
            showAllVehicles
            onDispatchClick={(dispatch) => setActiveDispatchId(dispatch.id)}
            className="min-h-[560px]"
          />

          {activeDispatch && (
            <AppPagePanel title="Seçili Gönderi Detayı" description={`${activeDispatch.referenceNo || activeDispatch.trackingToken} · ${typeMeta?.label}`}>
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-dark-500/45 bg-dark-900/50 p-3">
                      <p className="text-[12px] font-black uppercase tracking-wide text-gray-500">Müşteri</p>
                      <p className="mt-1 text-sm font-bold text-white">{activeDispatch.customerName}</p>
                      <p className="text-xs text-gray-500">{activeDispatch.customerPhone}</p>
                    </div>
                    <div className="rounded-xl border border-dark-500/45 bg-dark-900/50 p-3">
                      <p className="text-[12px] font-black uppercase tracking-wide text-gray-500">Kurye</p>
                      <p className="mt-1 text-sm font-bold text-white">{activeDispatch.courierName}</p>
                      <p className="text-xs text-gray-500">{activeDispatch.courierPhone}</p>
                    </div>
                    <div className="rounded-xl border border-dark-500/45 bg-dark-900/50 p-3">
                      <p className="text-[12px] font-black uppercase tracking-wide text-gray-500">Tahmini Varış</p>
                      <p className="mt-1 text-sm font-bold text-emerald-300">{formatEta(activeDispatch.estimatedArrival)}</p>
                    </div>
                    <div className="rounded-xl border border-dark-500/45 bg-dark-900/50 p-3">
                      <p className="text-[12px] font-black uppercase tracking-wide text-gray-500">Durum</p>
                      <p className={`mt-1 text-sm font-bold ${getDispatchStatusMeta(activeDispatch.status).tone}`}>
                        {getDispatchStatusMeta(activeDispatch.status).label}
                      </p>
                    </div>
                  </div>
                  {activeDispatch.packageNote && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200">
                      {activeDispatch.packageNote}
                    </div>
                  )}
                  {activeDispatch.sharedWithCustomer && (
                    <CourierTrackingLinkBar
                      trackingToken={activeDispatch.trackingToken}
                      onCopy={copyTrackingUrl}
                    />
                  )}
                </div>
                <div>
                  <p className="mb-3 text-[12px] font-black uppercase tracking-[0.16em] text-gray-500">Zaman Çizelgesi</p>
                  <DetailTimeline timeline={activeDispatch.timeline} />
                </div>
              </div>
            </AppPagePanel>
          )}
        </div>

        <div className="space-y-5">
          <AppPagePanel
            title="Operasyon Paneli"
            description="Gönderi oluştur, filo ve aktif teslimatları yönet"
            action={(
              <div className="flex rounded-xl border border-dark-500/50 bg-dark-900/60 p-1">
                {[
                  { id: 'dispatches', label: 'Gönderiler' },
                  { id: 'fleet', label: 'Filo' },
                  { id: 'create', label: 'Yeni' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSidebarTab(tab.id)}
                    className={`rounded-lg px-3 py-1.5 text-[13px] font-bold ${
                      sidebarTab === tab.id ? 'bg-dark-700 text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            fill
          >
            {sidebarTab === 'dispatches' && (
              <CourierDispatchList
                dispatches={filteredDispatches}
                activeDispatchId={activeDispatch?.id}
                onSelectDispatch={(dispatch) => setActiveDispatchId(dispatch.id)}
                onStatusChange={handleStatusChange}
                onShare={handleShare}
                shareToast={shareToast}
              />
            )}
            {sidebarTab === 'fleet' && (
              <CourierFleetPanel
                fleet={state.fleet}
                vehicleTypeFilter={vehicleTypeFilter}
                selectedVehicleId={activeDispatch?.vehicleId}
                onSelectVehicle={(vehicle) => {
                  const linked = activeDispatches.find((item) => item.vehicleId === vehicle.id)
                  if (linked) setActiveDispatchId(linked.id)
                }}
              />
            )}
            {sidebarTab === 'create' && (
              <CourierDispatchForm
                fleet={state.fleet}
                onSubmit={handleCreateDispatch}
                submitting={creating}
              />
            )}
          </AppPagePanel>
        </div>
      </div>
    </AppPageShell>
  )
}
