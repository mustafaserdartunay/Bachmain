import { useEffect, useMemo, useState } from 'react'
import ProcessPanelModule from '../DocumentEditor/ProcessPanelModule'
import OptionListPanel from './OptionListPanel'
import { isReservedPlaceholderLabel } from '../DocumentEditor/processPanelUtils'
import { stageColors } from '../DocumentEditor/stageColors'
import { publishWorkflowStages } from '../../utils/workflowStagePublish'
import {
  loadPartDeliverySituations,
  publishPartDeliverySituations,
} from '../../utils/productionFulfillmentOptions'
import { publishDepoWorkflowStages } from '../../utils/depoWorkflowStagePublish'
import { loadDepoWorkflowStages } from '../../utils/depoWorkflowStages'
import {
  appendOrderStage,
  appendProductionStage,
  appendQuoteStage,
  getOrderStageOptions,
  getProductionStageOptions,
  getQuoteStageOptions,
  loadWorkflowStages,
  mergeOrderStagesIntoWorkflow,
  mergeProductionStagesIntoWorkflow,
  mergeQuoteStagesIntoWorkflow,
} from '../../utils/workflowStages'

const SEGMENTS = [
  { id: 'quote', label: 'Teklif Süreci' },
  { id: 'order', label: 'Sipariş Süreci' },
  { id: 'production', label: 'Üretim Süreci' },
  { id: 'depo', label: 'Depo Süreçleri' },
  { id: 'partDelivery', label: 'Parça Teslim Durumları' },
]

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export default function WorkflowStagesSettingsPanel() {
  const [workflowStages, setWorkflowStages] = useState(() => loadWorkflowStages())
  const [depoStages, setDepoStages] = useState(() => loadDepoWorkflowStages())
  const [partDeliverySituations, setPartDeliverySituations] = useState(() => loadPartDeliverySituations())
  const [activeSegment, setActiveSegment] = useState('quote')
  const [stageInput, setStageInput] = useState('')
  const [pendingStageDeleteId, setPendingStageDeleteId] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [previewStageId, setPreviewStageId] = useState(null)

  useEffect(() => {
    function refresh() {
      setWorkflowStages(loadWorkflowStages())
    }
    function refreshPartDelivery() {
      setPartDeliverySituations(loadPartDeliverySituations())
    }
    function refreshDepoStages() {
      setDepoStages(loadDepoWorkflowStages())
    }
    window.addEventListener('bach:workflow-stages-updated', refresh)
    window.addEventListener('bach:depo-workflow-stages-updated', refreshDepoStages)
    window.addEventListener('bach:production-fulfillment-updated', refreshPartDelivery)
    return () => {
      window.removeEventListener('bach:workflow-stages-updated', refresh)
      window.removeEventListener('bach:depo-workflow-stages-updated', refreshDepoStages)
      window.removeEventListener('bach:production-fulfillment-updated', refreshPartDelivery)
    }
  }, [])

  function persist(nextFullStages) {
    publishWorkflowStages(nextFullStages)
    setWorkflowStages(loadWorkflowStages())
  }

  function getSegmentStagesFrom(fullStages, segment = activeSegment) {
    if (segment === 'quote') return getQuoteStageOptions(fullStages)
    if (segment === 'order') return getOrderStageOptions(fullStages)
    return getProductionStageOptions(fullStages)
  }

  function getSegmentStages(segment = activeSegment) {
    if (segment === 'partDelivery') return partDeliverySituations
    if (segment === 'depo') return depoStages
    return getSegmentStagesFrom(workflowStages, segment)
  }

  function mergeSegmentStages(segmentStages, fullStages = loadWorkflowStages()) {
    if (activeSegment === 'quote') return mergeQuoteStagesIntoWorkflow(fullStages, segmentStages)
    if (activeSegment === 'order') return mergeOrderStagesIntoWorkflow(fullStages, segmentStages)
    return mergeProductionStagesIntoWorkflow(fullStages, segmentStages)
  }

  const segmentRecord = useMemo(() => {
    const stages = getSegmentStages()
    const currentStageId = previewStageId && stages.some((stage) => stage.id === previewStageId)
      ? previewStageId
      : ''
    return { stages, currentStageId }
  }, [workflowStages, depoStages, activeSegment, previewStageId, partDeliverySituations])

  function persistDepo(nextDepoStages) {
    publishDepoWorkflowStages(nextDepoStages)
    setDepoStages(loadDepoWorkflowStages())
  }

  function addStage(chosenColor, inputLabel) {
    const label = String(inputLabel ?? stageInput ?? '').trim()
    if (!label || isReservedPlaceholderLabel(label)) return

    if (activeSegment === 'depo') {
      if (depoStages.some((item) => item.label === label)) return
      const nextStage = {
        id: createId('depo-stage'),
        label,
        color: chosenColor || stageColors[depoStages.length % stageColors.length],
        note: 'Yeni depo süreci aşaması.',
        requiresPhoto: label.toLocaleLowerCase('tr-TR').includes('teslim'),
        requiresTransport: label.toLocaleLowerCase('tr-TR').includes('hazır'),
        isTerminal: label === 'Teslim Edildi',
      }
      persistDepo([...depoStages, nextStage])
      setPreviewStageId(nextStage.id)
      setStageInput('')
      return
    }

    const fullStages = loadWorkflowStages()
    const segmentStages = activeSegment === 'quote'
      ? getQuoteStageOptions(fullStages)
      : activeSegment === 'order'
        ? getOrderStageOptions(fullStages)
        : getProductionStageOptions(fullStages)
    if (segmentStages.some((item) => item.label === label)) return
    const nextStage = {
      id: createId('stage'),
      label,
      color: chosenColor || stageColors[segmentStages.length % stageColors.length],
      note: 'Yeni süreç aşaması eklendi.',
    }
    const nextSegmentStages = activeSegment === 'order'
      ? appendOrderStage(segmentStages, nextStage)
      : activeSegment === 'quote'
        ? appendQuoteStage(segmentStages, nextStage)
        : appendProductionStage(segmentStages, nextStage)
    persist(mergeSegmentStages(nextSegmentStages, fullStages))
    setPreviewStageId(nextStage.id)
    setStageInput('')
  }

  function selectStage(stage) {
    if (!stage) {
      setPreviewStageId(null)
      return
    }
    if (previewStageId === stage.id) {
      setPreviewStageId(null)
      return
    }
    setPreviewStageId(stage.id)
  }

  function updateStageColor(stage, color) {
    if (activeSegment === 'depo') {
      persistDepo(depoStages.map((item) => (item.id === stage.id ? { ...item, color } : item)))
      return
    }
    const fullStages = loadWorkflowStages()
    const segmentStages = getSegmentStagesFrom(fullStages).map((item) => (
      item.id === stage.id ? { ...item, color } : item
    ))
    persist(mergeSegmentStages(segmentStages, fullStages))
  }

  function updateStageLabel(stage, label) {
    const clean = String(label || '').trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return
    if (activeSegment === 'depo') {
      if (depoStages.some((item) => item.id !== stage.id && item.label === clean)) return
      persistDepo(depoStages.map((item) => (item.id === stage.id ? { ...item, label: clean } : item)))
      return
    }
    const fullStages = loadWorkflowStages()
    const segmentStages = getSegmentStagesFrom(fullStages)
    if (segmentStages.some((item) => item.id !== stage.id && item.label === clean)) return
    const nextSegmentStages = segmentStages.map((item) => (
      item.id === stage.id ? { ...item, label: clean } : item
    ))
    persist(mergeSegmentStages(nextSegmentStages, fullStages))
  }

  function reorderStages(nextSegmentStages) {
    if (activeSegment === 'depo') {
      persistDepo(nextSegmentStages)
      return
    }
    const fullStages = loadWorkflowStages()
    persist(mergeSegmentStages(nextSegmentStages, fullStages))
  }

  function removeStage(stage) {
    if (activeSegment === 'depo') {
      persistDepo(depoStages.filter((item) => item.id !== stage.id))
      if (previewStageId === stage.id) setPreviewStageId(null)
      setPendingStageDeleteId(null)
      return
    }
    const fullStages = loadWorkflowStages()
    const nextSegmentStages = getSegmentStagesFrom(fullStages).filter((item) => item.id !== stage.id)
    persist(mergeSegmentStages(nextSegmentStages, fullStages))
    if (previewStageId === stage.id) setPreviewStageId(null)
    setPendingStageDeleteId(null)
  }

  function toggleEditor() {
    setIsOpen((current) => !current)
    setPendingStageDeleteId(null)
  }

  const activeSegmentMeta = SEGMENTS.find((segment) => segment.id === activeSegment)

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-base font-black text-white">Süreç Aşamaları</h2>
        <p className="mt-1 text-xs font-semibold text-gray-500">
          Teklif, sipariş, üretim ve depo süreçlerini buradan yönetin. Değişiklikler kayıtlara yansır.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SEGMENTS.map((segment) => (
          <button
            key={segment.id}
            type="button"
            onClick={() => {
              setActiveSegment(segment.id)
              setStageInput('')
              setPendingStageDeleteId(null)
              setPreviewStageId(null)
            }}
            className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-wide transition-colors ${
              activeSegment === segment.id
                ? 'border-blue-500/50 bg-blue-500/15 text-blue-300'
                : 'border-dark-500/50 bg-dark-700/50 text-gray-400 hover:text-white'
            }`}
          >
            {segment.label}
            <span className="ml-1.5 text-[10px] font-bold text-gray-500">({getSegmentStages(segment.id).length})</span>
          </button>
        ))}
      </div>

      <div>
        {activeSegment !== 'partDelivery' && (
          <h3 className="mb-1.5 text-xs font-black uppercase tracking-wider text-gray-500">
            {activeSegmentMeta?.label || 'Süreç'}
          </h3>
        )}
        {activeSegment === 'depo' && (
          <p className="mb-2 text-[11px] font-semibold text-gray-500">
            Depo listesinde üretimdeki gibi süreç butonları görünür. &quot;Araç Teslim&quot; ve &quot;Teslim Edildi&quot; aşamalarında fotoğraf yüklenir.
          </p>
        )}
        {activeSegment === 'partDelivery' ? (
          <OptionListPanel
            title="Parça teslim durumları"
            description="Üretim takibindeki kısmi teslimat ve adet satırı durumları buradan yönetilir. Değişiklikler üretim kayıtlarına yansır."
            options={partDeliverySituations}
            onChange={(next) => {
              setPartDeliverySituations(publishPartDeliverySituations(next))
            }}
            placeholder="Yeni durum adı..."
            activeLabel="Aktif Durum"
            countSuffix="durum tanımlı"
            emptyMessage="Henüz parça teslim durumu eklenmedi."
          />
        ) : (
          <ProcessPanelModule
            key={activeSegment}
            activeLabel="Aktif Süreç"
            countSuffix="süreç tanımlı"
            emptyMessage="Henüz süreç eklenmedi."
            addPlaceholder="Yeni süreç adı..."
            record={segmentRecord}
            isOpen={isOpen}
            onToggle={toggleEditor}
            stageInput={stageInput}
            setStageInput={setStageInput}
            onAddStage={addStage}
            onSelectStage={selectStage}
            onUpdateStageColor={updateStageColor}
            onUpdateStageLabel={updateStageLabel}
            onReorderStages={reorderStages}
            pendingStageDeleteId={pendingStageDeleteId}
            setPendingStageDeleteId={setPendingStageDeleteId}
            onRemoveStage={removeStage}
          />
        )}
      </div>
    </section>
  )
}
