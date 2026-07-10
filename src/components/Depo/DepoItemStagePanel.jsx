import { useEffect, useMemo, useState } from 'react'
import ProductionListJobStageRail from '../Production/ProductionListJobStageRail'
import { depoDrivers, depoVehicles, TRANSPORT_TYPES } from '../../data/depoSeed'
import {
  advanceDepoItemToStage,
  updateDepoItem,
} from '../../utils/depoStore'
import {
  canAdvanceDepoItemToStage,
  getDepoItemActiveStage,
  getDepoItemMinimalSteps,
} from '../../utils/depoStageHelpers'
import { loadDepoWorkflowStages } from '../../utils/depoWorkflowStages'
import { formatDepoDateTime, formatQty, computeDepoLineTotals } from '../../utils/depoHelpers'
import { formatTL } from '../../utils/productPricing'

const transportSelectClass =
  'form-input h-8 w-full min-w-0 rounded-lg border border-dark-500/50 bg-dark-800/70 px-2 text-[12px] font-bold text-gray-200'

function DetailLine({ label, value, valueClassName = 'text-gray-200' }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="shrink-0 text-[12px] font-bold uppercase tracking-wide text-gray-500">{label}</span>
      <span className={`min-w-0 truncate text-right text-xs font-black tabular-nums ${valueClassName}`}>{value}</span>
    </div>
  )
}

export default function DepoItemStagePanel({
  item,
  warehouses,
  onRefresh,
  onIssueInvoice,
  onCreateWaybill,
  readOnly = false,
  compact = false,
  expanded = false,
}) {
  const [stages, setStages] = useState(() => loadDepoWorkflowStages())
  const [transportForm, setTransportForm] = useState({
    transportType: item.transportType || '',
    vehicleId: item.vehicleId || '',
    driverId: item.driverId || '',
  })

  useEffect(() => {
    function refreshStages() {
      setStages(loadDepoWorkflowStages())
    }
    window.addEventListener('bach:depo-workflow-stages-updated', refreshStages)
    return () => window.removeEventListener('bach:depo-workflow-stages-updated', refreshStages)
  }, [])

  useEffect(() => {
    setTransportForm({
      transportType: item.transportType || '',
      vehicleId: item.vehicleId || '',
      driverId: item.driverId || '',
    })
  }, [item.id, item.transportType, item.vehicleId, item.driverId])

  const steps = useMemo(() => getDepoItemMinimalSteps(item, stages), [item, stages])
  const activeStage = useMemo(() => getDepoItemActiveStage(item, stages), [item, stages])
  const warehouseName = warehouses.find((warehouse) => warehouse.id === item.warehouseId)?.name || '—'
  const totals = computeDepoLineTotals(item)
  const docsReady = activeStage?.label !== 'Beklemede'

  function handlePhotosChange(photos) {
    updateDepoItem(item.id, { stagePhotos: photos })
    onRefresh()
  }

  function handleStageClick(stageId) {
    if (readOnly) return
    const workingItem = {
      ...item,
      ...transportForm,
    }
    const check = canAdvanceDepoItemToStage(workingItem, stageId, stages)
    if (!check.ok) {
      window.alert(check.reason)
      return
    }
    advanceDepoItemToStage(item.id, stageId, transportForm)
    onRefresh()
  }

  function saveTransport() {
    updateDepoItem(item.id, transportForm)
    onRefresh()
  }

  const activeStepIndex = steps.findIndex((step) => step.isActive)
  const showTransport = steps.some((step, index) => {
    if (!step.requiresTransport) return false
    if (activeStepIndex < 0) return false
    return index === activeStepIndex || index === activeStepIndex + 1
  })

  if (compact) {
    return (
      <div className="min-w-0">
        <ProductionListJobStageRail
          steps={steps}
          className="min-w-0 flex-1"
          stagePhotos={item.stagePhotos || []}
          readOnly={readOnly}
          onPhotosChange={readOnly ? undefined : handlePhotosChange}
          onStageClick={readOnly ? undefined : handleStageClick}
        />
      </div>
    )
  }

  return (
    <div className={expanded ? 'space-y-3' : 'space-y-4'}>
      {expanded && (
        <div className="max-w-xs rounded-xl border border-dark-500/40 bg-dark-800/45 px-3 py-2.5">
          <p className="text-sm font-black leading-snug text-white">{item.product}</p>
          {item.productCode && (
            <p className="mt-0.5 text-[12px] font-bold text-gray-500">{item.productCode}</p>
          )}
          <div className="mt-2 divide-y divide-dark-500/30">
            <DetailLine label="KDV Hariç" value={formatTL(totals.net)} valueClassName="text-red-300" />
            <DetailLine label="KDV Dahil" value={formatTL(totals.gross)} valueClassName="text-emerald-300" />
            <DetailLine label="Adet" value={formatQty(item.producedQuantity)} />
            <DetailLine label="Sipariş" value={item.orderId || item.productionJobId || '—'} valueClassName="text-blue-300" />
            <DetailLine label="Depo" value={warehouseName} />
            <DetailLine label="Süreç" value={activeStage?.label || item.status} valueClassName="text-orange-300" />
            <DetailLine label="Güncelleme" value={formatDepoDateTime(item.updatedAt)} valueClassName="text-gray-400" />
          </div>
        </div>
      )}

      {!expanded && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] font-black uppercase tracking-wider text-gray-500">
            Depo süreci · {warehouseName}
          </p>
          <span className="rounded-lg border border-dark-500/45 bg-dark-800/60 px-2 py-1 text-[12px] font-black text-orange-300">
            {activeStage?.label || item.status}
          </span>
        </div>
      )}

      <ProductionListJobStageRail
        steps={steps}
        className="min-w-0 w-full"
        stagePhotos={item.stagePhotos || []}
        readOnly={readOnly}
        onPhotosChange={readOnly ? undefined : handlePhotosChange}
        onStageClick={readOnly ? undefined : handleStageClick}
      />

      {showTransport && !readOnly && (
        <div className={`grid gap-2 rounded-xl border border-dark-500/40 bg-dark-800/45 p-3 ${expanded ? '' : 'lg:grid-cols-[1fr_1fr_1fr_auto]'}`}>
          <select
            value={transportForm.transportType}
            onChange={(event) => setTransportForm({ ...transportForm, transportType: event.target.value })}
            className={transportSelectClass}
          >
            <option value="">Nakliye türü</option>
            {TRANSPORT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select
            value={transportForm.vehicleId}
            onChange={(event) => setTransportForm({ ...transportForm, vehicleId: event.target.value })}
            className={transportSelectClass}
          >
            <option value="">Araç</option>
            {depoVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.label}</option>)}
          </select>
          <select
            value={transportForm.driverId}
            onChange={(event) => setTransportForm({ ...transportForm, driverId: event.target.value })}
            className={transportSelectClass}
          >
            <option value="">Şoför</option>
            {depoDrivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
          </select>
          <button
            type="button"
            onClick={saveTransport}
            className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-[12px] font-black text-blue-200 hover:bg-blue-500/15"
          >
            Nakliyeyi kaydet
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {item.invoiceNo && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[12px] font-bold text-emerald-300">
            Fatura <span className="font-black">{item.invoiceNo}</span>
          </span>
        )}
        {item.waybillNo && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[12px] font-bold text-blue-300">
            İrsaliye <span className="font-black">{item.waybillNo}</span>
          </span>
        )}
        {docsReady && !item.invoiceNo && (
          <button
            type="button"
            onClick={() => onIssueInvoice?.(item)}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-black text-emerald-300 hover:bg-emerald-500/15"
          >
            Fatura kes
          </button>
        )}
        {docsReady && !item.waybillNo && (
          <button
            type="button"
            onClick={() => onCreateWaybill?.(item)}
            className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-[12px] font-black text-blue-300 hover:bg-blue-500/15"
          >
            İrsaliye oluştur
          </button>
        )}
      </div>

      {!expanded && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-dark-500/40 bg-dark-800/50 px-3 py-2">
            <p className="text-[11px] font-black uppercase text-gray-600">Adet</p>
            <p className="text-sm font-bold text-white">{formatQty(item.producedQuantity)}</p>
          </div>
          <div className="rounded-lg border border-dark-500/40 bg-dark-800/50 px-3 py-2">
            <p className="text-[11px] font-black uppercase text-gray-600">KDV Hariç</p>
            <p className="text-sm font-black text-red-300">{formatTL(totals.net)}</p>
          </div>
          <div className="rounded-lg border border-dark-500/40 bg-dark-800/50 px-3 py-2">
            <p className="text-[11px] font-black uppercase text-gray-600">KDV Dahil</p>
            <p className="text-sm font-black text-emerald-300">{formatTL(totals.gross)}</p>
          </div>
          <div className="rounded-lg border border-dark-500/40 bg-dark-800/50 px-3 py-2">
            <p className="text-[11px] font-black uppercase text-gray-600">Güncelleme</p>
            <p className="text-xs font-bold text-gray-300">{formatDepoDateTime(item.updatedAt)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
