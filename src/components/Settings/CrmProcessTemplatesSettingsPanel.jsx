import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Pencil, X } from 'lucide-react'
import ProcessPanelModule from '../DocumentEditor/ProcessPanelModule'
import InlineDeleteConfirm from '../Common/InlineDeleteConfirm'
import { isReservedPlaceholderLabel } from '../DocumentEditor/processPanelUtils'
import { stageColors } from '../DocumentEditor/stageColors'
import {
  addCrmProcessTemplate,
  loadRawCrmProcessTemplates,
} from '../../utils/crmProcessTemplatesStore'
import { publishCrmProcessTemplateRemoval, publishCrmProcessTemplates, publishCrmTemplateStages } from '../../utils/crmProcessTemplatePublish'

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function normalizeLabel(label) {
  return String(label || '').trim().toLocaleLowerCase('tr-TR')
}

function buildCopyLabel(label, templates) {
  const base = `${String(label || 'Süreç').trim()} Kopya`
  const used = new Set(Object.values(templates || {}).map((template) => normalizeLabel(template.label)))
  if (!used.has(normalizeLabel(base))) return base
  let index = 2
  while (used.has(normalizeLabel(`${base} ${index}`))) index += 1
  return `${base} ${index}`
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
  const [editingCrmTemplateId, setEditingCrmTemplateId] = useState(null)
  const [editingCrmTemplateDraft, setEditingCrmTemplateDraft] = useState('')

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

  function startEditCrmTemplate(template) {
    setEditingCrmTemplateId(template.id)
    setEditingCrmTemplateDraft(template.label)
    setPendingCrmTemplateDeleteId(null)
  }

  function cancelEditCrmTemplate() {
    setEditingCrmTemplateId(null)
    setEditingCrmTemplateDraft('')
  }

  function commitEditCrmTemplate(templateId) {
    const clean = editingCrmTemplateDraft.trim()
    const current = loadRawCrmProcessTemplates()
    if (!clean || !current[templateId]) {
      cancelEditCrmTemplate()
      return
    }
    if (Object.values(current).some((template) => template.id !== templateId && normalizeLabel(template.label) === normalizeLabel(clean))) {
      cancelEditCrmTemplate()
      return
    }
    const next = publishCrmProcessTemplates({
      ...current,
      [templateId]: { ...current[templateId], label: clean },
    })
    setCrmTemplates(next)
    cancelEditCrmTemplate()
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
    cancelEditCrmTemplate()
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
        <p className="mt-1 text-[13px] font-bold text-gray-600">
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
                <span className="text-[13px] font-black uppercase tracking-wide text-red-200">
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
              {editingCrmTemplateId === template.id ? (
                <form
                  className="flex items-center gap-1 px-1 py-1"
                  onSubmit={(event) => {
                    event.preventDefault()
                    commitEditCrmTemplate(template.id)
                  }}
                >
                  <input
                    value={editingCrmTemplateDraft}
                    onChange={(event) => setEditingCrmTemplateDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') cancelEditCrmTemplate()
                    }}
                    className="h-7 w-32 rounded-lg border border-violet-500/40 bg-dark-900/70 px-2 text-[13px] font-black uppercase text-white outline-none"
                    autoFocus
                  />
                  <button type="submit" className="rounded-md p-1 text-emerald-300 hover:bg-emerald-500/15" title="Kaydet">
                    <Check className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={cancelEditCrmTemplate} className="rounded-md p-1 text-gray-500 hover:bg-dark-600 hover:text-gray-300" title="Vazgeç">
                    <X className="h-3 w-3" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveCrmTemplateId(template.id)
                    setPreviewStageId(null)
                    setPendingStageDeleteId(null)
                    setPendingCrmTemplateDeleteId(null)
                    setStageInput('')
                    cancelEditCrmTemplate()
                  }}
                  className={`px-3 py-1.5 text-[13px] font-black uppercase tracking-wide transition-colors ${
                    isActive ? 'text-violet-300' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {template.label}
                  <span className="ml-1 text-[12px] font-bold text-gray-500">({template.stages.length})</span>
                </button>
              )}
              {editingCrmTemplateId !== template.id && (
                <>
                  <button
                    type="button"
                    onClick={() => copyCrmTemplate(template)}
                    className="rounded-md p-1 text-gray-500 transition-colors hover:bg-emerald-500/15 hover:text-emerald-300"
                    aria-label={`${template.label} sürecini kopyala`}
                    title="Süreç türünü kopyala"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditCrmTemplate(template)}
                    className="rounded-md p-1 text-gray-500 transition-colors hover:bg-blue-500/15 hover:text-blue-300"
                    aria-label={`${template.label} sürecini düzenle`}
                    title="Süreç türünü düzenle"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </>
              )}
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
        onCopyStage={copyStage}
        onReorderStages={reorderStages}
        pendingStageDeleteId={pendingStageDeleteId}
        setPendingStageDeleteId={setPendingStageDeleteId}
        onRemoveStage={removeStage}
      />
    </section>
  )
}
