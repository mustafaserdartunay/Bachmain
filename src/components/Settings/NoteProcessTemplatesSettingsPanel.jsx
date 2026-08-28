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
  addNoteProcessTemplate,
  loadRawNoteProcessTemplates,
  NOTE_PROCESS_TEMPLATES_EVENT,
  removeNoteProcessTemplate,
  saveRawNoteProcessTemplates,
  updateNoteTemplateStages,
} from '../../utils/noteProcessTemplatesStore'
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
  const base = `${String(label || 'Not Süreci').trim()} Kopya`
  const used = new Set(
    Object.values(templates || {}).map((template) => normalizeLabel(template.label)),
  )
  if (!used.has(normalizeLabel(base))) return base
  let index = 2
  while (used.has(normalizeLabel(`${base} ${index}`))) index += 1
  return `${base} ${index}`
}

export default function NoteProcessTemplatesSettingsPanel({ searchQuery = '' }) {
  const [templates, setTemplates] = useState(() => loadRawNoteProcessTemplates())
  const [activeTemplateId, setActiveTemplateId] = useState(
    () => Object.keys(loadRawNoteProcessTemplates())[0] || '',
  )
  const [templateInput, setTemplateInput] = useState('')
  const [pendingTemplateDeleteId, setPendingTemplateDeleteId] = useState(null)
  const [stageInput, setStageInput] = useState('')
  const [pendingStageDeleteId, setPendingStageDeleteId] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [previewStageId, setPreviewStageId] = useState(null)
  const [editingTemplateId, setEditingTemplateId] = useState(null)
  const [editingTemplateDraft, setEditingTemplateDraft] = useState('')

  const noteTabs = useMemo(
    () =>
      Object.values(templates).map((template) => ({
        id: template.id,
        label: template.label,
        sourceId: template.id,
      })),
    [templates],
  )

  useEffect(() => {
    function refreshTemplates() {
      const next = loadRawNoteProcessTemplates()
      setTemplates(next)
      if (!next[activeTemplateId]) setActiveTemplateId(Object.keys(next)[0] || '')
    }
    window.addEventListener(NOTE_PROCESS_TEMPLATES_EVENT, refreshTemplates)
    return () => window.removeEventListener(NOTE_PROCESS_TEMPLATES_EVENT, refreshTemplates)
  }, [activeTemplateId])

  function getActiveStages() {
    return templates[activeTemplateId]?.stages || []
  }

  function persistStages(nextStages) {
    updateNoteTemplateStages(activeTemplateId, nextStages)
    setTemplates(loadRawNoteProcessTemplates())
  }

  const segmentRecord = useMemo(() => {
    const stages = getActiveStages()
    const currentStageId =
      previewStageId && stages.some((stage) => stage.id === previewStageId) ? previewStageId : ''
    return { stages, currentStageId }
  }, [templates, activeTemplateId, previewStageId])

  function selectNoteSegment(segment) {
    setActiveTemplateId(segment.id)
    setPreviewStageId(null)
    setPendingStageDeleteId(null)
    setPendingTemplateDeleteId(null)
    setStageInput('')
    setEditingTemplateId(null)
    setEditingTemplateDraft('')
  }

  function addStage(chosenColor, inputLabel) {
    const label = String(inputLabel ?? stageInput ?? '').trim()
    if (!activeTemplateId || !label || isReservedPlaceholderLabel(label)) return
    const stages = getActiveStages()
    if (stages.some((item) => normalizeLabel(item.label) === normalizeLabel(label))) return
    const lower = label.toLocaleLowerCase('tr-TR')
    const nextStage = {
      id: createId('note-status'),
      label,
      color: chosenColor || stageColors[stages.length % stageColors.length],
      note: 'Yeni not durumu.',
      isTerminal: lower.includes('tamam') || lower.includes('kapalı') || lower.includes('bitti'),
    }
    persistStages([...stages, nextStage])
    setPreviewStageId(nextStage.id)
    setStageInput('')
  }

  function selectStage(stage) {
    setPreviewStageId((current) => (current === stage?.id ? null : stage?.id || null))
  }

  function updateStageColor(stage, color) {
    persistStages(
      getActiveStages().map((item) => (item.id === stage.id ? { ...item, color } : item)),
    )
  }

  function updateStageLabel(stage, label) {
    const clean = String(label || '').trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return
    const stages = getActiveStages()
    if (
      stages.some(
        (item) => item.id !== stage.id && normalizeLabel(item.label) === normalizeLabel(clean),
      )
    )
      return
    persistStages(stages.map((item) => (item.id === stage.id ? { ...item, label: clean } : item)))
  }

  function copyStage(stage) {
    const stages = getActiveStages()
    const sourceIndex = stages.findIndex((item) => item.id === stage.id)
    if (sourceIndex < 0) return
    const source = stages[sourceIndex]
    const base = `${source.label} Kopya`
    const used = new Set(stages.map((item) => normalizeLabel(item.label)))
    let label = base
    let index = 2
    while (used.has(normalizeLabel(label))) {
      label = `${base} ${index}`
      index += 1
    }
    const nextStages = [...stages]
    nextStages.splice(sourceIndex + 1, 0, { ...source, id: createId('note-status-copy'), label })
    persistStages(nextStages)
    setPreviewStageId(nextStages[sourceIndex + 1].id)
    setPendingStageDeleteId(null)
  }

  function removeStage(stage) {
    persistStages(getActiveStages().filter((item) => item.id !== stage.id))
    if (previewStageId === stage.id) setPreviewStageId(null)
    setPendingStageDeleteId(null)
  }

  function renameNoteSegment(segment, label) {
    const clean = String(label || '').trim()
    const current = loadRawNoteProcessTemplates()
    if (!clean || !current[segment.id]) {
      setEditingTemplateId(null)
      setEditingTemplateDraft('')
      return
    }
    if (
      Object.values(current).some(
        (template) =>
          template.id !== segment.id && normalizeLabel(template.label) === normalizeLabel(clean),
      )
    ) {
      setEditingTemplateId(null)
      setEditingTemplateDraft('')
      return
    }
    const next = saveRawNoteProcessTemplates({
      ...current,
      [segment.id]: { ...current[segment.id], label: clean },
    })
    setTemplates(next)
    setEditingTemplateId(null)
    setEditingTemplateDraft('')
  }

  function copyNoteSegment(segment) {
    const template = templates[segment.id]
    if (!template) return
    const current = loadRawNoteProcessTemplates()
    const nextId = createId('note-template-copy')
    const next = saveRawNoteProcessTemplates({
      ...current,
      [nextId]: {
        ...current[template.id],
        id: nextId,
        label: buildCopyLabel(current[template.id].label, current),
        stages: (current[template.id].stages || []).map((stage) => ({
          ...stage,
          id: createId('note-status-copy'),
        })),
      },
    })
    setTemplates(next)
    setActiveTemplateId(nextId)
    setPreviewStageId(null)
    setPendingTemplateDeleteId(null)
    setEditingTemplateId(null)
    setEditingTemplateDraft('')
  }

  function deleteNoteSegment(segment) {
    const next = removeNoteProcessTemplate(segment.id)
    setTemplates(next)
    setPendingTemplateDeleteId(null)
    setPreviewStageId(null)
    setStageInput('')
    if (!next[activeTemplateId]) setActiveTemplateId(Object.keys(next)[0] || '')
  }

  function submitNewTemplate(event) {
    event.preventDefault()
    const label = templateInput.trim()
    if (!label) return
    const next = addNoteProcessTemplate(label)
    setTemplates(next)
    const created = Object.values(next).find((template) => template.label === label)
    if (created) setActiveTemplateId(created.id)
    setTemplateInput('')
  }

  const templateCount = Object.keys(templates).length

  if (!matchesProcessSearch(searchQuery, 'Not Defteri Süreçleri')) return null

  return (
    <ProcessSettingsSectionShell
      title="Not Defteri Süreçleri"
      description="Not defteri kayıtlarında kullanılacak süreç türleri ve durum menüsü buradan yönetilir."
      meta={`${templateCount} süreç türü · ${getActiveStages().length} aktif durum`}
    >
      <div className="mt-5 flex items-start gap-2">
        <SegmentTabs
          tabs={noteTabs}
          activeId={activeTemplateId}
          onSelect={selectNoteSegment}
          onCopy={copyNoteSegment}
          onRename={renameNoteSegment}
          onDelete={deleteNoteSegment}
          getCount={(segment) => templates[segment.id]?.stages?.length || 0}
          editId={editingTemplateId}
          setEditId={setEditingTemplateId}
          editDraft={editingTemplateDraft}
          setEditDraft={setEditingTemplateDraft}
          pendingDeleteId={pendingTemplateDeleteId}
          setPendingDeleteId={setPendingTemplateDeleteId}
          allowDelete={noteTabs.length > 0}
        />
        <form
          className="inline-flex h-[34px] shrink-0 items-center gap-1.5"
          onSubmit={submitNewTemplate}
        >
          <input
            value={templateInput}
            onChange={(event) => setTemplateInput(event.target.value)}
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
          key={activeTemplateId || 'empty-note-process'}
          className={PROCESS_PANEL_INNER_CLASS}
          activeLabel="Aktif Durum"
          countSuffix="durum tanımlı"
          emptyMessage={
            activeTemplateId ? 'Henüz durum eklenmedi.' : 'Önce not defteri süreç türü ekleyin.'
          }
          addPlaceholder="Yeni durum adı..."
          record={segmentRecord}
          isOpen={isOpen}
          onToggle={() => {
            setIsOpen((current) => !current)
            setPendingStageDeleteId(null)
          }}
          stageInput={stageInput}
          setStageInput={setStageInput}
          onAddStage={addStage}
          onSelectStage={selectStage}
          onUpdateStageColor={updateStageColor}
          onUpdateStageLabel={updateStageLabel}
          onCopyStage={copyStage}
          onReorderStages={persistStages}
          pendingStageDeleteId={pendingStageDeleteId}
          setPendingStageDeleteId={setPendingStageDeleteId}
          onRemoveStage={removeStage}
        />
      </div>
    </ProcessSettingsSectionShell>
  )
}
