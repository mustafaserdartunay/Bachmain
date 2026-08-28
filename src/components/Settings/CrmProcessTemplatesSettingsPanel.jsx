import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import ProcessPanelModule from '../DocumentEditor/ProcessPanelModule'
import ProcessSettingsSectionShell, {
  PROCESS_PANEL_INNER_CLASS,
} from './ProcessSettingsSectionShell'
import SegmentTabs from './SegmentTabs'
import { isReservedPlaceholderLabel } from '../DocumentEditor/processPanelUtils'
import { stageColors } from '../DocumentEditor/stageColors'
import {
  addCrmProcessTemplate,
  loadRawCrmProcessTemplates,
} from '../../utils/crmProcessTemplatesStore'
import {
  publishCrmProcessTemplateRemoval,
  publishCrmProcessTemplates,
  publishCrmTemplateStages,
} from '../../utils/crmProcessTemplatePublish'
import { matchesProcessSearch } from '../../utils/processSettingsSearch'

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function normalizeLabel(label) {
  return String(label || '')
    .trim()
    .toLocaleLowerCase('tr-TR')
}

function buildCopyLabel(label, templates) {
  const base = `${String(label || 'Süreç').trim()} Kopya`
  const used = new Set(
    Object.values(templates || {}).map((template) => normalizeLabel(template.label)),
  )
  if (!used.has(normalizeLabel(base))) return base
  let index = 2
  while (used.has(normalizeLabel(`${base} ${index}`))) index += 1
  return `${base} ${index}`
}

export default function CrmProcessTemplatesSettingsPanel({ searchQuery = '' }) {
  const [crmTemplates, setCrmTemplates] = useState(() => loadRawCrmProcessTemplates())
  const [activeCrmTemplateId, setActiveCrmTemplateId] = useState(
    () => Object.keys(loadRawCrmProcessTemplates())[0] || 'toplanti',
  )
  const [crmTemplateInput, setCrmTemplateInput] = useState('')
  const [pendingCrmTemplateDeleteId, setPendingCrmTemplateDeleteId] = useState(null)
  const [stageInput, setStageInput] = useState('')
  const [pendingStageDeleteId, setPendingStageDeleteId] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [previewStageId, setPreviewStageId] = useState(null)
  const [editingCrmTemplateId, setEditingCrmTemplateId] = useState(null)
  const [editingCrmTemplateDraft, setEditingCrmTemplateDraft] = useState('')

  const crmTabs = useMemo(
    () =>
      Object.values(crmTemplates).map((template) => ({
        id: template.id,
        label: template.label,
        sourceId: template.id,
      })),
    [crmTemplates],
  )

  useEffect(() => {
    function refreshCrmTemplates() {
      const next = loadRawCrmProcessTemplates()
      setCrmTemplates(next)
      if (!next[activeCrmTemplateId]) {
        setActiveCrmTemplateId(Object.keys(next)[0] || 'toplanti')
      }
    }
    window.addEventListener('bach:crm-process-templates-updated', refreshCrmTemplates)
    return () =>
      window.removeEventListener('bach:crm-process-templates-updated', refreshCrmTemplates)
  }, [activeCrmTemplateId])

  function getActiveCrmStages() {
    return crmTemplates[activeCrmTemplateId]?.stages || []
  }

  function persistCrmStages(nextStages) {
    publishCrmTemplateStages(activeCrmTemplateId, nextStages)
    setCrmTemplates(loadRawCrmProcessTemplates())
  }

  const segmentRecord = useMemo(() => {
    const stages = getActiveCrmStages()
    const currentStageId =
      previewStageId && stages.some((stage) => stage.id === previewStageId) ? previewStageId : ''
    return { stages, currentStageId }
  }, [crmTemplates, activeCrmTemplateId, previewStageId])

  function selectCrmSegment(segment) {
    setActiveCrmTemplateId(segment.id)
    setPreviewStageId(null)
    setPendingStageDeleteId(null)
    setPendingCrmTemplateDeleteId(null)
    setStageInput('')
    setEditingCrmTemplateId(null)
    setEditingCrmTemplateDraft('')
  }

  function addStage(chosenColor, inputLabel) {
    const label = String(inputLabel ?? stageInput ?? '').trim()
    if (!label || isReservedPlaceholderLabel(label)) return

    const segmentStages = getActiveCrmStages()
    if (segmentStages.some((item) => item.label === label)) return

    const lower = label.toLocaleLowerCase('tr-TR')
    const nextStage = {
      id: createId('crm-stage'),
      label,
      color: chosenColor || stageColors[segmentStages.length % stageColors.length],
      note: 'Yeni CRM süreç aşaması.',
      showsSchedule: lower.includes('plan'),
      isTerminal: lower.includes('tamam') || lower.includes('bitti') || lower.includes('hazır'),
    }
    persistCrmStages([...segmentStages, nextStage])
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
    persistCrmStages(
      getActiveCrmStages().map((item) => (item.id === stage.id ? { ...item, color } : item)),
    )
  }

  function updateStageLabel(stage, label) {
    const clean = String(label || '').trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return

    const segmentStages = getActiveCrmStages()
    if (segmentStages.some((item) => item.id !== stage.id && item.label === clean)) return
    persistCrmStages(
      segmentStages.map((item) => (item.id === stage.id ? { ...item, label: clean } : item)),
    )
  }

  function copyStage(stage) {
    const segmentStages = getActiveCrmStages()
    const sourceIndex = segmentStages.findIndex((item) => item.id === stage.id)
    if (sourceIndex < 0) return
    const source = segmentStages[sourceIndex]
    const nextStage = {
      ...source,
      id: createId('crm-stage-copy'),
      label: (() => {
        const base = `${source.label} Kopya`
        const used = new Set(segmentStages.map((item) => normalizeLabel(item.label)))
        if (!used.has(normalizeLabel(base))) return base
        let index = 2
        while (used.has(normalizeLabel(`${base} ${index}`))) index += 1
        return `${base} ${index}`
      })(),
    }
    const nextStages = [...segmentStages]
    nextStages.splice(sourceIndex + 1, 0, nextStage)
    persistCrmStages(nextStages)
    setPreviewStageId(nextStage.id)
    setPendingStageDeleteId(null)
  }

  function reorderStages(nextSegmentStages) {
    persistCrmStages(nextSegmentStages)
  }

  function removeStage(stage) {
    persistCrmStages(getActiveCrmStages().filter((item) => item.id !== stage.id))
    if (previewStageId === stage.id) setPreviewStageId(null)
    setPendingStageDeleteId(null)
  }

  function removeCrmTemplate(templateId) {
    const next = publishCrmProcessTemplateRemoval(templateId)
    setCrmTemplates(next)
    setPendingCrmTemplateDeleteId(null)
    setPreviewStageId(null)
    setStageInput('')
    if (!next[activeCrmTemplateId]) {
      setActiveCrmTemplateId(Object.keys(next)[0] || '')
    }
  }

  function renameCrmSegment(segment, label) {
    const clean = String(label || '').trim()
    const current = loadRawCrmProcessTemplates()
    if (!clean || !current[segment.id]) {
      setEditingCrmTemplateId(null)
      setEditingCrmTemplateDraft('')
      return
    }
    if (
      Object.values(current).some(
        (template) =>
          template.id !== segment.id && normalizeLabel(template.label) === normalizeLabel(clean),
      )
    ) {
      setEditingCrmTemplateId(null)
      setEditingCrmTemplateDraft('')
      return
    }
    const next = publishCrmProcessTemplates({
      ...current,
      [segment.id]: { ...current[segment.id], label: clean },
    })
    setCrmTemplates(next)
    setEditingCrmTemplateId(null)
    setEditingCrmTemplateDraft('')
  }

  function copyCrmSegment(segment) {
    const template = crmTemplates[segment.id]
    if (!template) return
    copyCrmTemplate(template)
  }

  function copyCrmTemplate(template) {
    const current = loadRawCrmProcessTemplates()
    if (!current[template.id]) return
    const nextId = createId('crm-template-copy')
    const copiedStages = (current[template.id].stages || []).map((stage) => ({
      ...stage,
      id: createId('crm-stage-copy'),
    }))
    const next = publishCrmProcessTemplates({
      ...current,
      [nextId]: {
        ...current[template.id],
        id: nextId,
        label: buildCopyLabel(current[template.id].label, current),
        stages: copiedStages,
      },
    })
    setCrmTemplates(next)
    setActiveCrmTemplateId(nextId)
    setPreviewStageId(null)
    setPendingCrmTemplateDeleteId(null)
    setEditingCrmTemplateId(null)
    setEditingCrmTemplateDraft('')
  }

  function deleteCrmSegment(segment) {
    removeCrmTemplate(segment.id)
  }

  function submitNewTemplate(event) {
    event.preventDefault()
    const label = crmTemplateInput.trim()
    if (!label) return
    const next = addCrmProcessTemplate(label)
    setCrmTemplates(next)
    const created = Object.values(next).find((template) => template.label === label)
    if (created) setActiveCrmTemplateId(created.id)
    setCrmTemplateInput('')
  }

  function toggleEditor() {
    setIsOpen((current) => !current)
    setPendingStageDeleteId(null)
  }

  const templateCount = Object.keys(crmTemplates).length

  if (!matchesProcessSearch(searchQuery, 'Crm Süreçleri')) return null

  return (
    <ProcessSettingsSectionShell
      title="Crm Süreçleri"
      description="CRM süreç panosundaki aşama butonları buradan yönetilir. Her süreç türü için aşamalar ayrı tanımlanır."
      meta={`${templateCount} süreç türü · ${getActiveCrmStages().length} aktif aşama`}
    >
      <div className="mt-5 flex items-start gap-2">
        <SegmentTabs
          tabs={crmTabs}
          activeId={activeCrmTemplateId}
          onSelect={selectCrmSegment}
          onCopy={copyCrmSegment}
          onRename={renameCrmSegment}
          onDelete={deleteCrmSegment}
          getCount={(segment) => crmTemplates[segment.id]?.stages?.length || 0}
          editId={editingCrmTemplateId}
          setEditId={setEditingCrmTemplateId}
          editDraft={editingCrmTemplateDraft}
          setEditDraft={setEditingCrmTemplateDraft}
          pendingDeleteId={pendingCrmTemplateDeleteId}
          setPendingDeleteId={setPendingCrmTemplateDeleteId}
        />
        <form
          className="inline-flex h-[34px] shrink-0 items-center gap-1.5"
          onSubmit={submitNewTemplate}
        >
          <input
            value={crmTemplateInput}
            onChange={(event) => setCrmTemplateInput(event.target.value)}
            placeholder="Yeni tür..."
            className="h-[34px] w-28 rounded-xl border border-dashed border-blue-400/45 bg-blue-500/10 px-2.5 text-xs font-bold text-blue-200 placeholder:text-blue-300/50 outline-none focus:border-blue-400/70 sm:w-36"
          />
          <button
            type="submit"
            className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-blue-400/45 bg-blue-500/10 px-3 text-xs font-black uppercase tracking-wide text-blue-300 transition-colors hover:border-blue-400/70 hover:bg-blue-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Tür Ekle
          </button>
        </form>
      </div>

      <div className="mt-5">
        <ProcessPanelModule
          key={activeCrmTemplateId}
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
  )
}
