import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, Plus } from 'lucide-react'
import ProcessPanelModule from '../DocumentEditor/ProcessPanelModule'
import OptionListPanel from './OptionListPanel'
import ProcessSettingsSectionShell, {
  PROCESS_PANEL_INNER_CLASS,
} from './ProcessSettingsSectionShell'
import SegmentTabs from './SegmentTabs'
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
import {
  DASHBOARD_FINANCE_CARDS_EVENT,
  loadDashboardFinanceCards,
  publishDashboardFinanceCards,
} from '../../utils/dashboardFinanceCards'
import { buildFinanceMetricCards } from '../Dashboard/StatusAnalysisBoard'
import { readOptionLists, saveOptionList } from '../../utils/customerMeta'
import {
  QUOTE_CUSTOM_LISTS_EVENT,
  QUOTE_SEGMENT_TABS_EVENT,
  deleteQuoteCustomList,
  isQuoteCustomStatusSegment,
  isQuoteStatusSegment,
  isQuoteWorkflowSegment,
  quoteSegmentSource,
  readQuoteCustomLists,
  readQuoteSegmentTabs,
  saveQuoteCustomList,
  saveQuoteSegmentTabs,
} from '../../utils/quoteSegmentTabs'
import { matchesProcessSearch } from '../../utils/processSettingsSearch'

const WORKFLOW_SEGMENTS = [{ id: 'depo', label: 'Depo Süreçleri' }]

const ORDER_SEGMENTS = [{ id: 'order', label: 'Sipariş Süreci' }]

const PRODUCTION_SEGMENTS = [
  { id: 'production', label: 'Üretim Süreci' },
  { id: 'partDelivery', label: 'Parça Teslim Durumları' },
]

const WORKFLOW_SEGMENT_TABS_KEY = 'bach-label-workflow-segment-tabs'
const ORDER_SEGMENT_TABS_KEY = 'bach-label-order-segment-tabs'
const PRODUCTION_SEGMENT_TABS_KEY = 'bach-label-production-segment-tabs'

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function normalizeLabel(label) {
  return String(label || '')
    .trim()
    .toLocaleLowerCase('tr-TR')
}

function buildCopyLabel(label, stages) {
  const base = `${String(label || 'Süreç').trim()} Kopya`
  const used = new Set((stages || []).map((stage) => normalizeLabel(stage.label)))
  if (!used.has(normalizeLabel(base))) return base
  let index = 2
  while (used.has(normalizeLabel(`${base} ${index}`))) index += 1
  return `${base} ${index}`
}

function buildSegmentTabs(segments) {
  return segments.map((segment) => ({
    ...segment,
    sourceId: segment.sourceId || segment.id,
    builtIn: segment.builtIn ?? true,
  }))
}

function readSegmentTabs(storageKey, fallbackSegments) {
  const fallback = buildSegmentTabs(fallbackSegments)
  const allowedSourceIds = new Set(fallback.map((segment) => segment.sourceId || segment.id))
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null')
    if (Array.isArray(saved) && saved.length) {
      const normalized = saved
        .filter((segment) => segment?.id && segment?.label)
        .filter((segment) => allowedSourceIds.has(segment.sourceId || segment.id))
        .map((segment) => ({
          ...segment,
          sourceId: segment.sourceId || segment.id,
          builtIn: Boolean(segment.builtIn),
        }))
      if (normalized.length) {
        const have = new Set(normalized.map((segment) => segment.sourceId || segment.id))
        fallback.forEach((segment) => {
          const key = segment.sourceId || segment.id
          if (!have.has(key)) normalized.push(segment)
        })
        return normalized
      }
    }
  } catch {
    // localStorage kapalıysa varsayılan sekmeleri kullan.
  }
  return fallback
}

function saveSegmentTabs(storageKey, tabs) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(tabs))
  } catch {
    // localStorage kapalıysa sadece ekrandaki state güncellenir.
  }
}

function getSegmentSourceId(tabs, segmentId) {
  return tabs.find((segment) => segment.id === segmentId)?.sourceId || segmentId
}

function buildSegmentCopyLabel(label, tabs) {
  const base = `${String(label || 'Sekme').trim()} Kopya`
  const used = new Set((tabs || []).map((segment) => normalizeLabel(segment.label)))
  if (!used.has(normalizeLabel(base))) return base
  let index = 2
  while (used.has(normalizeLabel(`${base} ${index}`))) index += 1
  return `${base} ${index}`
}

function uniqueSegmentLabel(label, tabs) {
  const base = String(label || 'Yeni Durum').trim()
  const used = new Set((tabs || []).map((segment) => normalizeLabel(segment.label)))
  if (!used.has(normalizeLabel(base))) return base
  let index = 2
  while (used.has(normalizeLabel(`${base} ${index}`))) index += 1
  return `${base} ${index}`
}

export default function WorkflowStagesSettingsPanel({ searchQuery = '' }) {
  const [workflowStages, setWorkflowStages] = useState(() => loadWorkflowStages())
  const [depoStages, setDepoStages] = useState(() => loadDepoWorkflowStages())
  const [partDeliverySituations, setPartDeliverySituations] = useState(() =>
    loadPartDeliverySituations(),
  )
  const [workflowSegmentTabs, setWorkflowSegmentTabs] = useState(() =>
    readSegmentTabs(WORKFLOW_SEGMENT_TABS_KEY, WORKFLOW_SEGMENTS),
  )
  const [quoteSegmentTabs, setQuoteSegmentTabs] = useState(() => readQuoteSegmentTabs())
  const [quoteCustomLists, setQuoteCustomLists] = useState(() => readQuoteCustomLists())
  const [orderSegmentTabs, setOrderSegmentTabs] = useState(() =>
    readSegmentTabs(ORDER_SEGMENT_TABS_KEY, ORDER_SEGMENTS),
  )
  const [productionSegmentTabs, setProductionSegmentTabs] = useState(() =>
    readSegmentTabs(PRODUCTION_SEGMENT_TABS_KEY, PRODUCTION_SEGMENTS),
  )
  const [activeSegment, setActiveSegment] = useState('depo')
  const [stageInput, setStageInput] = useState('')
  const [pendingStageDeleteId, setPendingStageDeleteId] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [previewStageId, setPreviewStageId] = useState(null)
  const [editingWorkflowSegmentId, setEditingWorkflowSegmentId] = useState(null)
  const [editingWorkflowSegmentDraft, setEditingWorkflowSegmentDraft] = useState('')
  const [pendingWorkflowSegmentDeleteId, setPendingWorkflowSegmentDeleteId] = useState(null)
  const [activeQuoteSegment, setActiveQuoteSegment] = useState('quote')
  const [quoteStageInput, setQuoteStageInput] = useState('')
  const [pendingQuoteStageDeleteId, setPendingQuoteStageDeleteId] = useState(null)
  const [isQuoteOpen, setIsQuoteOpen] = useState(false)
  const [previewQuoteStageId, setPreviewQuoteStageId] = useState(null)
  const [editingQuoteSegmentId, setEditingQuoteSegmentId] = useState(null)
  const [editingQuoteSegmentDraft, setEditingQuoteSegmentDraft] = useState('')
  const [pendingQuoteSegmentDeleteId, setPendingQuoteSegmentDeleteId] = useState(null)
  const [activeOrderSegment, setActiveOrderSegment] = useState('order')
  const [orderStageInput, setOrderStageInput] = useState('')
  const [pendingOrderStageDeleteId, setPendingOrderStageDeleteId] = useState(null)
  const [isOrderOpen, setIsOrderOpen] = useState(false)
  const [previewOrderStageId, setPreviewOrderStageId] = useState(null)
  const [editingOrderSegmentId, setEditingOrderSegmentId] = useState(null)
  const [editingOrderSegmentDraft, setEditingOrderSegmentDraft] = useState('')
  const [pendingOrderSegmentDeleteId, setPendingOrderSegmentDeleteId] = useState(null)
  const [activeProductionSegment, setActiveProductionSegment] = useState('production')
  const [productionStageInput, setProductionStageInput] = useState('')
  const [pendingProductionStageDeleteId, setPendingProductionStageDeleteId] = useState(null)
  const [isProductionOpen, setIsProductionOpen] = useState(false)
  const [previewProductionStageId, setPreviewProductionStageId] = useState(null)
  const [editingProductionSegmentId, setEditingProductionSegmentId] = useState(null)
  const [editingProductionSegmentDraft, setEditingProductionSegmentDraft] = useState('')
  const [pendingProductionSegmentDeleteId, setPendingProductionSegmentDeleteId] = useState(null)
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [dashboardFinanceCards, setDashboardFinanceCards] = useState(() =>
    loadDashboardFinanceCards(),
  )
  const [dashboardFinanceInput, setDashboardFinanceInput] = useState('')
  const [pendingDashboardFinanceDeleteId, setPendingDashboardFinanceDeleteId] = useState(null)
  const [isDashboardFinanceOpen, setIsDashboardFinanceOpen] = useState(false)
  const [previewDashboardFinanceId, setPreviewDashboardFinanceId] = useState(null)
  const activeSegmentSource = getSegmentSourceId(workflowSegmentTabs, activeSegment)
  const activeQuoteSegmentSource = getSegmentSourceId(quoteSegmentTabs, activeQuoteSegment)
  const activeOrderSegmentSource = getSegmentSourceId(orderSegmentTabs, activeOrderSegment)
  const activeProductionSegmentSource = getSegmentSourceId(
    productionSegmentTabs,
    activeProductionSegment,
  )

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
    function refreshDashboardFinanceCards() {
      setDashboardFinanceCards(loadDashboardFinanceCards())
    }
    function refreshOptionLists() {
      setOptionLists(readOptionLists())
    }
    function refreshQuoteSegmentTabs() {
      setQuoteSegmentTabs(readQuoteSegmentTabs())
    }
    function refreshQuoteCustomLists() {
      setQuoteCustomLists(readQuoteCustomLists())
    }
    window.addEventListener('bach:workflow-stages-updated', refresh)
    window.addEventListener('bach:depo-workflow-stages-updated', refreshDepoStages)
    window.addEventListener('bach:production-fulfillment-updated', refreshPartDelivery)
    window.addEventListener(DASHBOARD_FINANCE_CARDS_EVENT, refreshDashboardFinanceCards)
    window.addEventListener('bach:option-lists-updated', refreshOptionLists)
    window.addEventListener(QUOTE_SEGMENT_TABS_EVENT, refreshQuoteSegmentTabs)
    window.addEventListener(QUOTE_CUSTOM_LISTS_EVENT, refreshQuoteCustomLists)
    return () => {
      window.removeEventListener('bach:workflow-stages-updated', refresh)
      window.removeEventListener('bach:depo-workflow-stages-updated', refreshDepoStages)
      window.removeEventListener('bach:production-fulfillment-updated', refreshPartDelivery)
      window.removeEventListener(DASHBOARD_FINANCE_CARDS_EVENT, refreshDashboardFinanceCards)
      window.removeEventListener('bach:option-lists-updated', refreshOptionLists)
      window.removeEventListener(QUOTE_SEGMENT_TABS_EVENT, refreshQuoteSegmentTabs)
      window.removeEventListener(QUOTE_CUSTOM_LISTS_EVENT, refreshQuoteCustomLists)
    }
  }, [])

  function persist(nextFullStages) {
    publishWorkflowStages(nextFullStages)
    setWorkflowStages(loadWorkflowStages())
  }

  function getSegmentStagesFrom(fullStages, segment = activeSegment) {
    if (segment === 'quote') return getQuoteStageOptions(fullStages)
    if (segment === 'order') return getOrderStageOptions(fullStages)
    if (segment === 'production') return getProductionStageOptions(fullStages)
    return getProductionStageOptions(fullStages)
  }

  function getSegmentStages(segment = activeSegment) {
    if (segment === 'partDelivery') return partDeliverySituations
    if (segment === 'depo') return depoStages
    if (segment === 'quoteStatus') return optionLists.status || []
    if (String(segment).startsWith('quote-custom')) return quoteCustomLists[segment] || []
    return getSegmentStagesFrom(workflowStages, segment)
  }

  function mergeSegmentStages(segment, segmentStages, fullStages = loadWorkflowStages()) {
    if (segment === 'quote') return mergeQuoteStagesIntoWorkflow(fullStages, segmentStages)
    if (segment === 'order') return mergeOrderStagesIntoWorkflow(fullStages, segmentStages)
    return mergeProductionStagesIntoWorkflow(fullStages, segmentStages)
  }

  const segmentRecord = useMemo(() => {
    const stages = getSegmentStages(activeSegmentSource)
    const currentStageId =
      previewStageId && stages.some((stage) => stage.id === previewStageId) ? previewStageId : ''
    return { stages, currentStageId }
  }, [workflowStages, depoStages, activeSegmentSource, previewStageId, partDeliverySituations])

  const quoteSegmentRecord = useMemo(() => {
    const stages = getSegmentStages(activeQuoteSegmentSource)
    const currentStageId =
      previewQuoteStageId && stages.some((stage) => stage.id === previewQuoteStageId)
        ? previewQuoteStageId
        : ''
    return { stages, currentStageId }
  }, [workflowStages, activeQuoteSegmentSource, previewQuoteStageId, optionLists, quoteCustomLists])

  const orderSegmentRecord = useMemo(() => {
    const stages = getSegmentStages(activeOrderSegmentSource)
    const currentStageId =
      previewOrderStageId && stages.some((stage) => stage.id === previewOrderStageId)
        ? previewOrderStageId
        : ''
    return { stages, currentStageId }
  }, [workflowStages, activeOrderSegmentSource, previewOrderStageId])

  const productionSegmentRecord = useMemo(() => {
    const stages = getSegmentStages(activeProductionSegmentSource)
    const currentStageId =
      previewProductionStageId && stages.some((stage) => stage.id === previewProductionStageId)
        ? previewProductionStageId
        : ''
    return { stages, currentStageId }
  }, [
    workflowStages,
    activeProductionSegmentSource,
    previewProductionStageId,
    partDeliverySituations,
  ])

  const dashboardFinanceRecord = useMemo(() => {
    const currentStageId =
      previewDashboardFinanceId &&
      dashboardFinanceCards.some((card) => card.id === previewDashboardFinanceId)
        ? previewDashboardFinanceId
        : ''
    return { stages: dashboardFinanceCards, currentStageId }
  }, [dashboardFinanceCards, previewDashboardFinanceId])
  const dashboardFinanceMetricCards = useMemo(
    () => buildFinanceMetricCards({ includeHidden: true }),
    [dashboardFinanceCards],
  )

  function persistDepo(nextDepoStages) {
    publishDepoWorkflowStages(nextDepoStages)
    setDepoStages(loadDepoWorkflowStages())
  }

  function addStage(chosenColor, inputLabel) {
    const label = String(inputLabel ?? stageInput ?? '').trim()
    if (!label || isReservedPlaceholderLabel(label)) return

    if (activeSegmentSource === 'depo') {
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
    const segmentStages =
      activeSegmentSource === 'quote'
        ? getQuoteStageOptions(fullStages)
        : activeSegmentSource === 'order'
          ? getOrderStageOptions(fullStages)
          : getProductionStageOptions(fullStages)
    if (segmentStages.some((item) => item.label === label)) return
    const nextStage = {
      id: createId('stage'),
      label,
      color: chosenColor || stageColors[segmentStages.length % stageColors.length],
      note: 'Yeni süreç aşaması eklendi.',
    }
    const nextSegmentStages =
      activeSegmentSource === 'order'
        ? appendOrderStage(segmentStages, nextStage)
        : activeSegmentSource === 'quote'
          ? appendQuoteStage(segmentStages, nextStage)
          : appendProductionStage(segmentStages, nextStage)
    persist(mergeSegmentStages(activeSegmentSource, nextSegmentStages, fullStages))
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
    if (activeSegmentSource === 'depo') {
      persistDepo(depoStages.map((item) => (item.id === stage.id ? { ...item, color } : item)))
      return
    }
    const fullStages = loadWorkflowStages()
    const segmentStages = getSegmentStagesFrom(fullStages).map((item) =>
      item.id === stage.id ? { ...item, color } : item,
    )
    persist(mergeSegmentStages(activeSegmentSource, segmentStages, fullStages))
  }

  function updateStageLabel(stage, label) {
    const clean = String(label || '').trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return
    if (activeSegmentSource === 'depo') {
      if (depoStages.some((item) => item.id !== stage.id && item.label === clean)) return
      persistDepo(
        depoStages.map((item) => (item.id === stage.id ? { ...item, label: clean } : item)),
      )
      return
    }
    const fullStages = loadWorkflowStages()
    const segmentStages = getSegmentStagesFrom(fullStages)
    if (segmentStages.some((item) => item.id !== stage.id && item.label === clean)) return
    const nextSegmentStages = segmentStages.map((item) =>
      item.id === stage.id ? { ...item, label: clean } : item,
    )
    persist(mergeSegmentStages(activeSegmentSource, nextSegmentStages, fullStages))
  }

  function copyStage(stage) {
    if (activeSegmentSource === 'depo') {
      const sourceIndex = depoStages.findIndex((item) => item.id === stage.id)
      if (sourceIndex < 0) return
      const source = depoStages[sourceIndex]
      const nextStage = {
        ...source,
        id: createId('depo-stage-copy'),
        label: buildCopyLabel(source.label, depoStages),
      }
      const nextStages = [...depoStages]
      nextStages.splice(sourceIndex + 1, 0, nextStage)
      persistDepo(nextStages)
      setPreviewStageId(nextStage.id)
      setPendingStageDeleteId(null)
      return
    }

    const fullStages = loadWorkflowStages()
    const segmentStages = getSegmentStagesFrom(fullStages)
    const sourceIndex = segmentStages.findIndex((item) => item.id === stage.id)
    if (sourceIndex < 0) return
    const source = segmentStages[sourceIndex]
    const nextStage = {
      ...source,
      id: createId('stage-copy'),
      label: buildCopyLabel(source.label, segmentStages),
    }
    const nextSegmentStages = [...segmentStages]
    nextSegmentStages.splice(sourceIndex + 1, 0, nextStage)
    persist(mergeSegmentStages(activeSegmentSource, nextSegmentStages, fullStages))
    setPreviewStageId(nextStage.id)
    setPendingStageDeleteId(null)
  }

  function reorderStages(nextSegmentStages) {
    if (activeSegmentSource === 'depo') {
      persistDepo(nextSegmentStages)
      return
    }
    const fullStages = loadWorkflowStages()
    persist(mergeSegmentStages(activeSegmentSource, nextSegmentStages, fullStages))
  }

  function removeStage(stage) {
    if (activeSegmentSource === 'depo') {
      persistDepo(depoStages.filter((item) => item.id !== stage.id))
      if (previewStageId === stage.id) setPreviewStageId(null)
      setPendingStageDeleteId(null)
      return
    }
    const fullStages = loadWorkflowStages()
    const nextSegmentStages = getSegmentStagesFrom(fullStages).filter(
      (item) => item.id !== stage.id,
    )
    persist(mergeSegmentStages(activeSegmentSource, nextSegmentStages, fullStages))
    if (previewStageId === stage.id) setPreviewStageId(null)
    setPendingStageDeleteId(null)
  }

  function toggleEditor() {
    setIsOpen((current) => !current)
    setPendingStageDeleteId(null)
  }

  function addQuoteStage(chosenColor, inputLabel) {
    const label = String(inputLabel ?? quoteStageInput ?? '').trim()
    if (!label || isReservedPlaceholderLabel(label) || activeQuoteSegmentSource !== 'quote') return

    const fullStages = loadWorkflowStages()
    const segmentStages = getQuoteStageOptions(fullStages)
    if (segmentStages.some((item) => item.label === label)) return
    const nextStage = {
      id: createId('stage'),
      label,
      color: chosenColor || stageColors[segmentStages.length % stageColors.length],
      note: 'Yeni teklif süreci aşaması eklendi.',
    }
    const nextSegmentStages = appendQuoteStage(segmentStages, nextStage)
    persist(mergeSegmentStages('quote', nextSegmentStages, fullStages))
    setPreviewQuoteStageId(nextStage.id)
    setQuoteStageInput('')
  }

  function selectQuoteStage(stage) {
    if (!stage) {
      setPreviewQuoteStageId(null)
      return
    }
    if (previewQuoteStageId === stage.id) {
      setPreviewQuoteStageId(null)
      return
    }
    setPreviewQuoteStageId(stage.id)
  }

  function updateQuoteStageColor(stage, color) {
    const fullStages = loadWorkflowStages()
    const segmentStages = getQuoteStageOptions(fullStages).map((item) =>
      item.id === stage.id ? { ...item, color } : item,
    )
    persist(mergeSegmentStages('quote', segmentStages, fullStages))
  }

  function updateQuoteStageLabel(stage, label) {
    const clean = String(label || '').trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return
    const fullStages = loadWorkflowStages()
    const segmentStages = getQuoteStageOptions(fullStages)
    if (segmentStages.some((item) => item.id !== stage.id && item.label === clean)) return
    const nextSegmentStages = segmentStages.map((item) =>
      item.id === stage.id ? { ...item, label: clean } : item,
    )
    persist(mergeSegmentStages('quote', nextSegmentStages, fullStages))
  }

  function copyQuoteStage(stage) {
    const fullStages = loadWorkflowStages()
    const segmentStages = getQuoteStageOptions(fullStages)
    const sourceIndex = segmentStages.findIndex((item) => item.id === stage.id)
    if (sourceIndex < 0) return
    const source = segmentStages[sourceIndex]
    const nextStage = {
      ...source,
      id: createId('stage-copy'),
      label: buildCopyLabel(source.label, segmentStages),
    }
    const nextSegmentStages = [...segmentStages]
    nextSegmentStages.splice(sourceIndex + 1, 0, nextStage)
    persist(mergeSegmentStages('quote', nextSegmentStages, fullStages))
    setPreviewQuoteStageId(nextStage.id)
    setPendingQuoteStageDeleteId(null)
  }

  function reorderQuoteStages(nextSegmentStages) {
    const fullStages = loadWorkflowStages()
    persist(mergeSegmentStages('quote', nextSegmentStages, fullStages))
  }

  function removeQuoteStage(stage) {
    const fullStages = loadWorkflowStages()
    const nextSegmentStages = getQuoteStageOptions(fullStages).filter(
      (item) => item.id !== stage.id,
    )
    persist(mergeSegmentStages('quote', nextSegmentStages, fullStages))
    if (previewQuoteStageId === stage.id) setPreviewQuoteStageId(null)
    setPendingQuoteStageDeleteId(null)
  }

  function toggleQuoteEditor() {
    setIsQuoteOpen((current) => !current)
    setPendingQuoteStageDeleteId(null)
  }

  function addOrderStage(chosenColor, inputLabel) {
    const label = String(inputLabel ?? orderStageInput ?? '').trim()
    if (!label || isReservedPlaceholderLabel(label) || activeOrderSegmentSource !== 'order') return

    const fullStages = loadWorkflowStages()
    const segmentStages = getOrderStageOptions(fullStages)
    if (segmentStages.some((item) => item.label === label)) return
    const nextStage = {
      id: createId('stage'),
      label,
      color: chosenColor || stageColors[segmentStages.length % stageColors.length],
      note: 'Yeni sipariş süreci aşaması eklendi.',
    }
    const nextSegmentStages = appendOrderStage(segmentStages, nextStage)
    persist(mergeSegmentStages('order', nextSegmentStages, fullStages))
    setPreviewOrderStageId(nextStage.id)
    setOrderStageInput('')
  }

  function selectOrderStage(stage) {
    if (!stage) {
      setPreviewOrderStageId(null)
      return
    }
    if (previewOrderStageId === stage.id) {
      setPreviewOrderStageId(null)
      return
    }
    setPreviewOrderStageId(stage.id)
  }

  function updateOrderStageColor(stage, color) {
    const fullStages = loadWorkflowStages()
    const segmentStages = getOrderStageOptions(fullStages).map((item) =>
      item.id === stage.id ? { ...item, color } : item,
    )
    persist(mergeSegmentStages('order', segmentStages, fullStages))
  }

  function updateOrderStageLabel(stage, label) {
    const clean = String(label || '').trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return
    const fullStages = loadWorkflowStages()
    const segmentStages = getOrderStageOptions(fullStages)
    if (segmentStages.some((item) => item.id !== stage.id && item.label === clean)) return
    const nextSegmentStages = segmentStages.map((item) =>
      item.id === stage.id ? { ...item, label: clean } : item,
    )
    persist(mergeSegmentStages('order', nextSegmentStages, fullStages))
  }

  function copyOrderStage(stage) {
    const fullStages = loadWorkflowStages()
    const segmentStages = getOrderStageOptions(fullStages)
    const sourceIndex = segmentStages.findIndex((item) => item.id === stage.id)
    if (sourceIndex < 0) return
    const source = segmentStages[sourceIndex]
    const nextStage = {
      ...source,
      id: createId('stage-copy'),
      label: buildCopyLabel(source.label, segmentStages),
    }
    const nextSegmentStages = [...segmentStages]
    nextSegmentStages.splice(sourceIndex + 1, 0, nextStage)
    persist(mergeSegmentStages('order', nextSegmentStages, fullStages))
    setPreviewOrderStageId(nextStage.id)
    setPendingOrderStageDeleteId(null)
  }

  function reorderOrderStages(nextSegmentStages) {
    const fullStages = loadWorkflowStages()
    persist(mergeSegmentStages('order', nextSegmentStages, fullStages))
  }

  function removeOrderStage(stage) {
    const fullStages = loadWorkflowStages()
    const nextSegmentStages = getOrderStageOptions(fullStages).filter(
      (item) => item.id !== stage.id,
    )
    persist(mergeSegmentStages('order', nextSegmentStages, fullStages))
    if (previewOrderStageId === stage.id) setPreviewOrderStageId(null)
    setPendingOrderStageDeleteId(null)
  }

  function toggleOrderEditor() {
    setIsOrderOpen((current) => !current)
    setPendingOrderStageDeleteId(null)
  }

  function addProductionStage(chosenColor, inputLabel) {
    const label = String(inputLabel ?? productionStageInput ?? '').trim()
    if (
      !label ||
      isReservedPlaceholderLabel(label) ||
      activeProductionSegmentSource !== 'production'
    )
      return

    const fullStages = loadWorkflowStages()
    const segmentStages = getProductionStageOptions(fullStages)
    if (segmentStages.some((item) => item.label === label)) return
    const nextStage = {
      id: createId('stage'),
      label,
      color: chosenColor || stageColors[segmentStages.length % stageColors.length],
      note: 'Yeni üretim süreci aşaması eklendi.',
    }
    const nextSegmentStages = appendProductionStage(segmentStages, nextStage)
    persist(mergeSegmentStages('production', nextSegmentStages, fullStages))
    setPreviewProductionStageId(nextStage.id)
    setProductionStageInput('')
  }

  function selectProductionStage(stage) {
    if (!stage) {
      setPreviewProductionStageId(null)
      return
    }
    if (previewProductionStageId === stage.id) {
      setPreviewProductionStageId(null)
      return
    }
    setPreviewProductionStageId(stage.id)
  }

  function updateProductionStageColor(stage, color) {
    const fullStages = loadWorkflowStages()
    const segmentStages = getProductionStageOptions(fullStages).map((item) =>
      item.id === stage.id ? { ...item, color } : item,
    )
    persist(mergeSegmentStages('production', segmentStages, fullStages))
  }

  function updateProductionStageLabel(stage, label) {
    const clean = String(label || '').trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return
    const fullStages = loadWorkflowStages()
    const segmentStages = getProductionStageOptions(fullStages)
    if (segmentStages.some((item) => item.id !== stage.id && item.label === clean)) return
    const nextSegmentStages = segmentStages.map((item) =>
      item.id === stage.id ? { ...item, label: clean } : item,
    )
    persist(mergeSegmentStages('production', nextSegmentStages, fullStages))
  }

  function copyProductionStage(stage) {
    const fullStages = loadWorkflowStages()
    const segmentStages = getProductionStageOptions(fullStages)
    const sourceIndex = segmentStages.findIndex((item) => item.id === stage.id)
    if (sourceIndex < 0) return
    const source = segmentStages[sourceIndex]
    const nextStage = {
      ...source,
      id: createId('stage-copy'),
      label: buildCopyLabel(source.label, segmentStages),
    }
    const nextSegmentStages = [...segmentStages]
    nextSegmentStages.splice(sourceIndex + 1, 0, nextStage)
    persist(mergeSegmentStages('production', nextSegmentStages, fullStages))
    setPreviewProductionStageId(nextStage.id)
    setPendingProductionStageDeleteId(null)
  }

  function reorderProductionStages(nextSegmentStages) {
    const fullStages = loadWorkflowStages()
    persist(mergeSegmentStages('production', nextSegmentStages, fullStages))
  }

  function removeProductionStage(stage) {
    const fullStages = loadWorkflowStages()
    const nextSegmentStages = getProductionStageOptions(fullStages).filter(
      (item) => item.id !== stage.id,
    )
    persist(mergeSegmentStages('production', nextSegmentStages, fullStages))
    if (previewProductionStageId === stage.id) setPreviewProductionStageId(null)
    setPendingProductionStageDeleteId(null)
  }

  function toggleProductionEditor() {
    setIsProductionOpen((current) => !current)
    setPendingProductionStageDeleteId(null)
  }

  function updateWorkflowSegmentTabs(nextTabs) {
    setWorkflowSegmentTabs(nextTabs)
    saveSegmentTabs(WORKFLOW_SEGMENT_TABS_KEY, nextTabs)
  }

  function updateQuoteSegmentTabs(nextTabs) {
    setQuoteSegmentTabs(saveQuoteSegmentTabs(nextTabs))
  }

  function updateOrderSegmentTabs(nextTabs) {
    setOrderSegmentTabs(nextTabs)
    saveSegmentTabs(ORDER_SEGMENT_TABS_KEY, nextTabs)
  }

  function updateProductionSegmentTabs(nextTabs) {
    setProductionSegmentTabs(nextTabs)
    saveSegmentTabs(PRODUCTION_SEGMENT_TABS_KEY, nextTabs)
  }

  function selectWorkflowSegment(segment) {
    setActiveSegment(segment.id)
    setStageInput('')
    setPendingStageDeleteId(null)
    setPendingWorkflowSegmentDeleteId(null)
    setPreviewStageId(null)
  }

  function selectQuoteSegment(segment) {
    setActiveQuoteSegment(segment.id)
    setQuoteStageInput('')
    setPendingQuoteStageDeleteId(null)
    setPendingQuoteSegmentDeleteId(null)
    setPreviewQuoteStageId(null)
  }

  function selectOrderSegment(segment) {
    setActiveOrderSegment(segment.id)
    setOrderStageInput('')
    setPendingOrderStageDeleteId(null)
    setPendingOrderSegmentDeleteId(null)
    setPreviewOrderStageId(null)
  }

  function selectProductionSegment(segment) {
    setActiveProductionSegment(segment.id)
    setProductionStageInput('')
    setPendingProductionStageDeleteId(null)
    setPendingProductionSegmentDeleteId(null)
    setPreviewProductionStageId(null)
  }

  function copyWorkflowSegment(segment) {
    const copy = {
      ...segment,
      id: createId('workflow-segment-copy'),
      label: buildSegmentCopyLabel(segment.label, workflowSegmentTabs),
      sourceId: segment.sourceId || segment.id,
      builtIn: false,
    }
    const index = workflowSegmentTabs.findIndex((item) => item.id === segment.id)
    const next = [...workflowSegmentTabs]
    next.splice(index + 1, 0, copy)
    updateWorkflowSegmentTabs(next)
    selectWorkflowSegment(copy)
  }

  function copyQuoteSegment(segment) {
    const copy = {
      ...segment,
      id: createId('quote-segment-copy'),
      label: buildSegmentCopyLabel(segment.label, quoteSegmentTabs),
      sourceId: segment.sourceId || segment.id,
      builtIn: false,
    }
    const index = quoteSegmentTabs.findIndex((item) => item.id === segment.id)
    const next = [...quoteSegmentTabs]
    next.splice(index + 1, 0, copy)
    updateQuoteSegmentTabs(next)
    selectQuoteSegment(copy)
  }

  function copyOrderSegment(segment) {
    const copy = {
      ...segment,
      id: createId('order-segment-copy'),
      label: buildSegmentCopyLabel(segment.label, orderSegmentTabs),
      sourceId: segment.sourceId || segment.id,
      builtIn: false,
    }
    const index = orderSegmentTabs.findIndex((item) => item.id === segment.id)
    const next = [...orderSegmentTabs]
    next.splice(index + 1, 0, copy)
    updateOrderSegmentTabs(next)
    selectOrderSegment(copy)
  }

  function copyProductionSegment(segment) {
    const copy = {
      ...segment,
      id: createId('production-segment-copy'),
      label: buildSegmentCopyLabel(segment.label, productionSegmentTabs),
      sourceId: segment.sourceId || segment.id,
      builtIn: false,
    }
    const index = productionSegmentTabs.findIndex((item) => item.id === segment.id)
    const next = [...productionSegmentTabs]
    next.splice(index + 1, 0, copy)
    updateProductionSegmentTabs(next)
    selectProductionSegment(copy)
  }

  function renameWorkflowSegment(segment, label) {
    const clean = String(label || '').trim()
    if (!clean) return
    updateWorkflowSegmentTabs(
      workflowSegmentTabs.map((item) =>
        item.id === segment.id ? { ...item, label: clean } : item,
      ),
    )
    setEditingWorkflowSegmentId(null)
    setEditingWorkflowSegmentDraft('')
  }

  function renameQuoteSegment(segment, label) {
    const clean = String(label || '').trim()
    if (!clean) return
    updateQuoteSegmentTabs(
      quoteSegmentTabs.map((item) => (item.id === segment.id ? { ...item, label: clean } : item)),
    )
    setEditingQuoteSegmentId(null)
    setEditingQuoteSegmentDraft('')
  }

  function renameOrderSegment(segment, label) {
    const clean = String(label || '').trim()
    if (!clean) return
    updateOrderSegmentTabs(
      orderSegmentTabs.map((item) => (item.id === segment.id ? { ...item, label: clean } : item)),
    )
    setEditingOrderSegmentId(null)
    setEditingOrderSegmentDraft('')
  }

  function renameProductionSegment(segment, label) {
    const clean = String(label || '').trim()
    if (!clean) return
    updateProductionSegmentTabs(
      productionSegmentTabs.map((item) =>
        item.id === segment.id ? { ...item, label: clean } : item,
      ),
    )
    setEditingProductionSegmentId(null)
    setEditingProductionSegmentDraft('')
  }

  function deleteWorkflowSegment(segment) {
    const next = workflowSegmentTabs.filter((item) => item.id !== segment.id)
    if (!next.length) return
    updateWorkflowSegmentTabs(next)
    setPendingWorkflowSegmentDeleteId(null)
    if (activeSegment === segment.id) selectWorkflowSegment(next[0])
  }

  function reorderQuoteSegments(nextTabs) {
    updateQuoteSegmentTabs(nextTabs)
  }

  function addQuoteStatusTab() {
    const sourceId = createId('quote-custom')
    const tab = {
      id: sourceId,
      label: uniqueSegmentLabel('Yeni Durum', quoteSegmentTabs),
      sourceId,
      builtIn: false,
      kind: 'status',
    }
    setQuoteCustomLists(saveQuoteCustomList(sourceId, []))
    updateQuoteSegmentTabs([...quoteSegmentTabs, tab])
    selectQuoteSegment(tab)
  }

  function deleteQuoteSegment(segment) {
    const next = quoteSegmentTabs.filter((item) => item.id !== segment.id)
    if (!next.length) return
    const sourceId = quoteSegmentSource(segment)
    const stillUsed = next.some((item) => quoteSegmentSource(item) === sourceId)
    if (!stillUsed && isQuoteCustomStatusSegment(segment)) {
      setQuoteCustomLists(deleteQuoteCustomList(sourceId))
    }
    updateQuoteSegmentTabs(next)
    setPendingQuoteSegmentDeleteId(null)
    if (activeQuoteSegment === segment.id) selectQuoteSegment(next[0])
  }

  function deleteOrderSegment(segment) {
    const next = orderSegmentTabs.filter((item) => item.id !== segment.id)
    if (!next.length) return
    updateOrderSegmentTabs(next)
    setPendingOrderSegmentDeleteId(null)
    if (activeOrderSegment === segment.id) selectOrderSegment(next[0])
  }

  function deleteProductionSegment(segment) {
    const next = productionSegmentTabs.filter((item) => item.id !== segment.id)
    if (!next.length) return
    updateProductionSegmentTabs(next)
    setPendingProductionSegmentDeleteId(null)
    if (activeProductionSegment === segment.id) selectProductionSegment(next[0])
  }

  function persistDashboardFinanceCards(nextCards) {
    setDashboardFinanceCards(publishDashboardFinanceCards(nextCards))
  }

  function addDashboardFinanceCard(chosenColor, inputLabel) {
    const label = String(inputLabel ?? dashboardFinanceInput ?? '').trim()
    if (!label || isReservedPlaceholderLabel(label)) return
    if (dashboardFinanceCards.some((card) => normalizeLabel(card.label) === normalizeLabel(label)))
      return
    const nextCard = {
      id: createId('dashboard-finance-card'),
      label,
      color: chosenColor || stageColors[dashboardFinanceCards.length % stageColors.length],
    }
    persistDashboardFinanceCards([...dashboardFinanceCards, nextCard])
    setPreviewDashboardFinanceId(nextCard.id)
    setDashboardFinanceInput('')
  }

  function selectDashboardFinanceCard(card) {
    if (!card) {
      setPreviewDashboardFinanceId(null)
      return
    }
    setPreviewDashboardFinanceId((current) => (current === card.id ? null : card.id))
  }

  function updateDashboardFinanceCardColor(card, color) {
    persistDashboardFinanceCards(
      dashboardFinanceCards.map((item) => (item.id === card.id ? { ...item, color } : item)),
    )
  }

  function updateDashboardFinanceCardLabel(card, label) {
    const clean = String(label || '').trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return
    if (
      dashboardFinanceCards.some(
        (item) => item.id !== card.id && normalizeLabel(item.label) === normalizeLabel(clean),
      )
    )
      return
    persistDashboardFinanceCards(
      dashboardFinanceCards.map((item) => (item.id === card.id ? { ...item, label: clean } : item)),
    )
  }

  function copyDashboardFinanceCard(card) {
    const sourceIndex = dashboardFinanceCards.findIndex((item) => item.id === card.id)
    if (sourceIndex < 0) return
    const source = dashboardFinanceCards[sourceIndex]
    const nextCard = {
      ...source,
      id: createId('dashboard-finance-card-copy'),
      label: buildCopyLabel(source.label, dashboardFinanceCards),
    }
    const nextCards = [...dashboardFinanceCards]
    nextCards.splice(sourceIndex + 1, 0, nextCard)
    persistDashboardFinanceCards(nextCards)
    setPreviewDashboardFinanceId(nextCard.id)
    setPendingDashboardFinanceDeleteId(null)
  }

  function reorderDashboardFinanceCards(nextCards) {
    persistDashboardFinanceCards(nextCards)
  }

  function removeDashboardFinanceCard(card) {
    persistDashboardFinanceCards(dashboardFinanceCards.filter((item) => item.id !== card.id))
    if (previewDashboardFinanceId === card.id) setPreviewDashboardFinanceId(null)
    setPendingDashboardFinanceDeleteId(null)
  }

  function toggleDashboardFinanceEditor() {
    setIsDashboardFinanceOpen((current) => !current)
    setPendingDashboardFinanceDeleteId(null)
  }

  function toggleDashboardFinanceVisibility(cardId) {
    persistDashboardFinanceCards(
      dashboardFinanceCards.map((card) =>
        card.id === cardId ? { ...card, visible: card.visible === false } : card,
      ),
    )
  }

  const activeQuoteSegmentMeta = quoteSegmentTabs.find(
    (segment) => segment.id === activeQuoteSegment,
  )

  const quoteSearchTerms = useMemo(
    () => [
      'Teklif Süreçleri',
      'teklif',
      'öncelik',
      'durum',
      ...quoteSegmentTabs.map((tab) => tab.label),
      ...getQuoteStageOptions(workflowStages).map((stage) => stage.label),
      ...(optionLists.status || []).map((item) => item.label),
      ...Object.values(quoteCustomLists).flatMap((list) => list.map((item) => item.label)),
    ],
    [quoteSegmentTabs, workflowStages, optionLists.status, quoteCustomLists],
  )

  const orderSearchTerms = useMemo(
    () => [
      'Sipariş Süreçleri',
      'sipariş',
      'order',
      ...orderSegmentTabs.map((tab) => tab.label),
      ...getOrderStageOptions(workflowStages).map((stage) => stage.label),
    ],
    [orderSegmentTabs, workflowStages],
  )

  const depoSearchTerms = useMemo(
    () => [
      'Depo Süreçleri',
      'depo',
      'teslim',
      'araç',
      ...workflowSegmentTabs.map((tab) => tab.label),
      ...depoStages.map((stage) => stage.label),
    ],
    [workflowSegmentTabs, depoStages],
  )

  const productionSearchTerms = useMemo(
    () => [
      'Üretim Süreçleri',
      'üretim',
      'production',
      'parça',
      'teslim',
      ...productionSegmentTabs.map((tab) => tab.label),
      ...getProductionStageOptions(workflowStages).map((stage) => stage.label),
      ...partDeliverySituations.map((item) => item.label),
    ],
    [productionSegmentTabs, workflowStages, partDeliverySituations],
  )

  const dashboardSearchTerms = useMemo(
    () => [
      'Dashboard Süreçleri',
      'dashboard',
      'finans',
      'kasa',
      ...dashboardFinanceCards.map((card) => card.label),
    ],
    [dashboardFinanceCards],
  )

  const showQuote = matchesProcessSearch(searchQuery, quoteSearchTerms)
  const showOrder = matchesProcessSearch(searchQuery, orderSearchTerms)
  const showDepo = matchesProcessSearch(searchQuery, depoSearchTerms)
  const showProduction = matchesProcessSearch(searchQuery, productionSearchTerms)
  const showDashboard = matchesProcessSearch(searchQuery, dashboardSearchTerms)

  return (
    <>
      {showQuote ? (
        <ProcessSettingsSectionShell
          title="Teklif Süreçleri"
          description="Teklif akışındaki süreç aşamaları bu ayrı panelden yönetilir. Sekme sırası teklifler sayfasındaki kolon sırasını belirler."
        >
          <div className="mt-5 flex items-start gap-2">
            <SegmentTabs
              tabs={quoteSegmentTabs}
              activeId={activeQuoteSegment}
              onSelect={selectQuoteSegment}
              onCopy={copyQuoteSegment}
              onRename={renameQuoteSegment}
              onDelete={deleteQuoteSegment}
              onReorder={reorderQuoteSegments}
              getCount={(segment) => getSegmentStages(segment.sourceId || segment.id).length}
              editId={editingQuoteSegmentId}
              setEditId={setEditingQuoteSegmentId}
              editDraft={editingQuoteSegmentDraft}
              setEditDraft={setEditingQuoteSegmentDraft}
              pendingDeleteId={pendingQuoteSegmentDeleteId}
              setPendingDeleteId={setPendingQuoteSegmentDeleteId}
            />
            <button
              type="button"
              onClick={addQuoteStatusTab}
              className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-blue-400/45 bg-blue-500/10 px-3 text-xs font-black uppercase tracking-wide text-blue-300 transition-colors hover:border-blue-400/70 hover:bg-blue-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              Durum Ekle
            </button>
          </div>

          <div className="mt-5">
            {isQuoteWorkflowSegment(activeQuoteSegmentMeta) ? (
              <ProcessPanelModule
                key={activeQuoteSegment}
                className={PROCESS_PANEL_INNER_CLASS}
                activeLabel="Aktif Süreç"
                countSuffix="süreç tanımlı"
                emptyMessage="Henüz teklif süreci eklenmedi."
                addPlaceholder="Yeni teklif süreci adı..."
                record={quoteSegmentRecord}
                isOpen={isQuoteOpen}
                onToggle={toggleQuoteEditor}
                stageInput={quoteStageInput}
                setStageInput={setQuoteStageInput}
                onAddStage={addQuoteStage}
                onSelectStage={selectQuoteStage}
                onUpdateStageColor={updateQuoteStageColor}
                onUpdateStageLabel={updateQuoteStageLabel}
                onCopyStage={copyQuoteStage}
                onReorderStages={reorderQuoteStages}
                pendingStageDeleteId={pendingQuoteStageDeleteId}
                setPendingStageDeleteId={setPendingQuoteStageDeleteId}
                onRemoveStage={removeQuoteStage}
              />
            ) : (
              <OptionListPanel
                hideHeader
                title={activeQuoteSegmentMeta?.label || 'Teklif Durumu'}
                description={
                  isQuoteStatusSegment(activeQuoteSegmentMeta)
                    ? 'Taslak, onaylandı, reddedildi vb. Teklif listesi ve filtrelerine yansır.'
                    : 'Bu duruma özel seçenekler teklifler sayfasında ayrı kolon olarak görünür.'
                }
                options={
                  isQuoteStatusSegment(activeQuoteSegmentMeta)
                    ? optionLists.status || []
                    : quoteCustomLists[activeQuoteSegmentSource] || []
                }
                onChange={(next) => {
                  if (isQuoteStatusSegment(activeQuoteSegmentMeta)) {
                    saveOptionList('status', next)
                    setOptionLists(readOptionLists())
                    return
                  }
                  setQuoteCustomLists(saveQuoteCustomList(activeQuoteSegmentSource, next))
                }}
                placeholder="Yeni durum adı..."
                activeLabel="Aktif Durum"
                countSuffix="durum tanımlı"
                emptyMessage="Henüz teklif durumu eklenmedi."
              />
            )}
          </div>
        </ProcessSettingsSectionShell>
      ) : null}

      {showOrder ? (
        <ProcessSettingsSectionShell
          title="Sipariş Süreçleri"
          description="Sipariş akışındaki süreç aşamaları bu ayrı panelden yönetilir. Değişiklikler siparişler sayfasına anında yansır."
        >
          <div className="mt-5">
            <SegmentTabs
              tabs={orderSegmentTabs}
              activeId={activeOrderSegment}
              onSelect={selectOrderSegment}
              onCopy={copyOrderSegment}
              onRename={renameOrderSegment}
              onDelete={deleteOrderSegment}
              getCount={(segment) => getSegmentStages(segment.sourceId || segment.id).length}
              editId={editingOrderSegmentId}
              setEditId={setEditingOrderSegmentId}
              editDraft={editingOrderSegmentDraft}
              setEditDraft={setEditingOrderSegmentDraft}
              pendingDeleteId={pendingOrderSegmentDeleteId}
              setPendingDeleteId={setPendingOrderSegmentDeleteId}
            />
          </div>

          <div className="mt-5">
            <ProcessPanelModule
              key={activeOrderSegment}
              className={PROCESS_PANEL_INNER_CLASS}
              activeLabel="Aktif Süreç"
              countSuffix="süreç tanımlı"
              emptyMessage="Henüz sipariş süreci eklenmedi."
              addPlaceholder="Yeni sipariş süreci adı..."
              record={orderSegmentRecord}
              isOpen={isOrderOpen}
              onToggle={toggleOrderEditor}
              stageInput={orderStageInput}
              setStageInput={setOrderStageInput}
              onAddStage={addOrderStage}
              onSelectStage={selectOrderStage}
              onUpdateStageColor={updateOrderStageColor}
              onUpdateStageLabel={updateOrderStageLabel}
              onCopyStage={copyOrderStage}
              onReorderStages={reorderOrderStages}
              pendingStageDeleteId={pendingOrderStageDeleteId}
              setPendingStageDeleteId={setPendingOrderStageDeleteId}
              onRemoveStage={removeOrderStage}
            />
          </div>
        </ProcessSettingsSectionShell>
      ) : null}

      {showDepo ? (
        <ProcessSettingsSectionShell
          title="Depo Süreçleri"
          description={
            'Depo akışındaki süreç aşamaları bu ayrı panelden yönetilir. Depo listesinde üretimdeki gibi süreç butonları görünür. "Araç Teslim" ve "Teslim Edildi" aşamalarında fotoğraf yüklenir.'
          }
        >
          <div className="mt-5">
            <SegmentTabs
              tabs={workflowSegmentTabs}
              activeId={activeSegment}
              onSelect={selectWorkflowSegment}
              onCopy={copyWorkflowSegment}
              onRename={renameWorkflowSegment}
              onDelete={deleteWorkflowSegment}
              getCount={(segment) => getSegmentStages(segment.sourceId || segment.id).length}
              editId={editingWorkflowSegmentId}
              setEditId={setEditingWorkflowSegmentId}
              editDraft={editingWorkflowSegmentDraft}
              setEditDraft={setEditingWorkflowSegmentDraft}
              pendingDeleteId={pendingWorkflowSegmentDeleteId}
              setPendingDeleteId={setPendingWorkflowSegmentDeleteId}
            />
          </div>

          <div className="mt-5">
            <ProcessPanelModule
              key={activeSegment}
              className={PROCESS_PANEL_INNER_CLASS}
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
              onCopyStage={copyStage}
              onReorderStages={reorderStages}
              pendingStageDeleteId={pendingStageDeleteId}
              setPendingStageDeleteId={setPendingStageDeleteId}
              onRemoveStage={removeStage}
            />
          </div>
        </ProcessSettingsSectionShell>
      ) : null}

      {showProduction ? (
        <ProcessSettingsSectionShell
          title="Üretim Süreçleri"
          description="Üretim akışı ve parça teslim durumları bu ayrı panelden yönetilir. Değişiklikler üretim kayıtlarına yansır."
        >
          <div className="mt-5">
            <SegmentTabs
              tabs={productionSegmentTabs}
              activeId={activeProductionSegment}
              onSelect={selectProductionSegment}
              onCopy={copyProductionSegment}
              onRename={renameProductionSegment}
              onDelete={deleteProductionSegment}
              getCount={(segment) => getSegmentStages(segment.sourceId || segment.id).length}
              editId={editingProductionSegmentId}
              setEditId={setEditingProductionSegmentId}
              editDraft={editingProductionSegmentDraft}
              setEditDraft={setEditingProductionSegmentDraft}
              pendingDeleteId={pendingProductionSegmentDeleteId}
              setPendingDeleteId={setPendingProductionSegmentDeleteId}
            />
          </div>

          <div className="mt-5">
            {activeProductionSegmentSource === 'partDelivery' ? (
              <OptionListPanel
                hideHeader
                title="Parça teslim durumları"
                description="Üretim takibindeki kısmi teslimat ve adet satırı durumları buradan yönetilir."
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
                key={activeProductionSegment}
                className={PROCESS_PANEL_INNER_CLASS}
                activeLabel="Aktif Süreç"
                countSuffix="süreç tanımlı"
                emptyMessage="Henüz üretim süreci eklenmedi."
                addPlaceholder="Yeni üretim süreci adı..."
                record={productionSegmentRecord}
                isOpen={isProductionOpen}
                onToggle={toggleProductionEditor}
                stageInput={productionStageInput}
                setStageInput={setProductionStageInput}
                onAddStage={addProductionStage}
                onSelectStage={selectProductionStage}
                onUpdateStageColor={updateProductionStageColor}
                onUpdateStageLabel={updateProductionStageLabel}
                onCopyStage={copyProductionStage}
                onReorderStages={reorderProductionStages}
                pendingStageDeleteId={pendingProductionStageDeleteId}
                setPendingStageDeleteId={setPendingProductionStageDeleteId}
                onRemoveStage={removeProductionStage}
              />
            )}
          </div>
        </ProcessSettingsSectionShell>
      ) : null}

      {showDashboard ? (
        <ProcessSettingsSectionShell
          title="Dashboard Süreçleri"
          description="Dashboard finans kartlarının görünürlük durumunu buradan yönetin."
        >
          <div className="mt-5">
            <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-gray-500">
              Kasa ve Finans Görünümü
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {dashboardFinanceMetricCards.map((card) => {
                const config = dashboardFinanceCards.find((item) => item.id === card.id)
                const isVisible = config?.visible !== false
                const Icon = card.icon
                const ToggleIcon = isVisible ? Eye : EyeOff
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => toggleDashboardFinanceVisibility(card.id)}
                    className={`flex min-h-[104px] flex-col justify-between rounded-2xl border p-3 text-left shadow-card transition-colors ${
                      isVisible
                        ? 'border-dark-500/55 bg-dark-800/75 hover:border-blue-500/35'
                        : 'border-dashed border-dark-500/45 bg-dark-700/30 opacity-55 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="max-w-[8rem] text-[10px] font-black uppercase leading-snug tracking-[0.18em] text-gray-400">
                          {card.label}
                        </p>
                        <p
                          className={`mt-2 break-words text-[1rem] font-black leading-tight tracking-tight ${card.valueTone}`}
                        >
                          {card.value}
                        </p>
                      </div>
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-dark-500/65 bg-dark-700/70 ${card.iconTone}`}
                      >
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-[11px] font-semibold leading-snug text-gray-400">
                        {card.sub || 'Dashboard finans kartı'}
                      </p>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[12px] font-black ${
                          isVisible
                            ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                            : 'border-dark-500/50 bg-dark-800/60 text-gray-500'
                        }`}
                      >
                        <ToggleIcon className="h-3 w-3" />
                        {isVisible ? 'Göster' : 'Gizle'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </ProcessSettingsSectionShell>
      ) : null}
    </>
  )
}
