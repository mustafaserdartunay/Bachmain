import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import ProcessPanelModule from '../DocumentEditor/ProcessPanelModule'
import InlineDeleteConfirm from '../Common/InlineDeleteConfirm'
import { isReservedPlaceholderLabel } from '../DocumentEditor/processPanelUtils'
import { stageColors } from '../DocumentEditor/stageColors'
import {
  addCrmProcessTemplate,
  loadRawCrmProcessTemplates,
} from '../../utils/crmProcessTemplatesStore'
import { publishCrmProcessTemplateRemoval, publishCrmTemplateStages } from '../../utils/crmProcessTemplatePublish'

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export default function CrmProcessTemplatesSettingsPanel() {
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

  useEffect(() => {
    function refreshCrmTemplates() {
      const next = loadRawCrmProcessTemplates()
      setCrmTemplates(next)
      if (!next[activeCrmTemplateId]) {
        setActiveCrmTemplateId(Object.keys(next)[0] || 'toplanti')
      }
    }
    window.addEventListener('bach:crm-process-templates-updated', refreshCrmTemplates)
    return () => window.removeEventListener('bach:crm-process-templates-updated', refreshCrmTemplates)
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
    const currentStageId = previewStageId && stages.some((stage) => stage.id === previewStageId)
      ? previewStageId
      : ''
    return { stages, currentStageId }
  }, [crmTemplates, activeCrmTemplateId, previewStageId])

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
    persistCrmStages(getActiveCrmStages().map((item) => (item.id === stage.id ? { ...item, color } : item)))
  }

  function updateStageLabel(stage, label) {
    const clean = String(label || '').trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return

    const segmentStages = getActiveCrmStages()
    if (segmentStages.some((item) => item.id !== stage.id && item.label === clean)) return
    persistCrmStages(segmentStages.map((item) => (item.id === stage.id ? { ...item, label: clean } : item)))
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

  function toggleEditor() {
    setIsOpen((current) => !current)
    setPendingStageDeleteId(null)
  }

  const templateCount = Object.keys(crmTemplates).length

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-base font-black text-white">Crm Süreçleri</h2>
        <p className="mt-1 text-xs font-semibold text-gray-500">
          CRM süreç panosundaki aşama butonları buradan yönetilir. Her süreç türü için aşamalar ayrı tanımlanır.
        </p>
        <p className="mt-1 text-[11px] font-bold text-gray-600">
          {templateCount} süreç türü · {getActiveCrmStages().length} aktif aşama
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.values(crmTemplates).map((template) => {
          const isActive = activeCrmTemplateId === template.id
          const canDelete = Object.keys(crmTemplates).length > 1

          if (pendingCrmTemplateDeleteId === template.id) {
            return (
              <div
                key={template.id}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-2 py-1.5"
              >
                <span className="text-[11px] font-black uppercase tracking-wide text-red-200">
                  {template.label}
                </span>
                <InlineDeleteConfirm
                  onConfirm={() => removeCrmTemplate(template.id)}
                  onCancel={() => setPendingCrmTemplateDeleteId(null)}
                />
              </div>
            )
          }

          return (
            <div
              key={template.id}
              className={`inline-flex items-center overflow-hidden rounded-xl border transition-colors ${
                isActive
                  ? 'border-violet-500/50 bg-violet-500/15'
                  : 'border-dark-500/50 bg-dark-700/50'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setActiveCrmTemplateId(template.id)
                  setPreviewStageId(null)
                  setPendingStageDeleteId(null)
                  setPendingCrmTemplateDeleteId(null)
                  setStageInput('')
                }}
                className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wide transition-colors ${
                  isActive ? 'text-violet-300' : 'text-gray-400 hover:text-white'
                }`}
              >
                {template.label}
                <span className="ml-1 text-[10px] font-bold text-gray-500">({template.stages.length})</span>
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setPendingCrmTemplateDeleteId(template.id)}
                  className="mr-1.5 rounded-md p-0.5 text-gray-500 transition-colors hover:bg-red-500/20 hover:text-red-300"
                  aria-label={`${template.label} sürecini sil`}
                  title="Süreç türünü sil"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          const next = addCrmProcessTemplate(crmTemplateInput)
          setCrmTemplates(next)
          const created = Object.values(next).find((template) => template.label === crmTemplateInput.trim())
          if (created) setActiveCrmTemplateId(created.id)
          setCrmTemplateInput('')
        }}
      >
        <input
          value={crmTemplateInput}
          onChange={(event) => setCrmTemplateInput(event.target.value)}
          placeholder="Yeni CRM süreç türü..."
          className="form-input min-w-[220px] flex-1"
        />
        <button type="submit" className="btn-primary px-4 py-2 text-xs font-black uppercase">
          Tür Ekle
        </button>
      </form>

      <ProcessPanelModule
        key={activeCrmTemplateId}
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
    </section>
  )
}
