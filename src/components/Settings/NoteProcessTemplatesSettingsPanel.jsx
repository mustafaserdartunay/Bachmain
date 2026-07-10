import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Pencil, X } from 'lucide-react'
import ProcessPanelModule from '../DocumentEditor/ProcessPanelModule'
import InlineDeleteConfirm from '../Common/InlineDeleteConfirm'
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

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function normalizeLabel(label) {
  return String(label || '').trim().toLocaleLowerCase('tr-TR')
}

function buildCopyLabel(label, templates) {
  const base = `${String(label || 'Not Süreci').trim()} Kopya`
  const used = new Set(Object.values(templates || {}).map((template) => normalizeLabel(template.label)))
  if (!used.has(normalizeLabel(base))) return base
  let index = 2
  while (used.has(normalizeLabel(`${base} ${index}`))) index += 1
  return `${base} ${index}`
}

export default function NoteProcessTemplatesSettingsPanel() {
  const [templates, setTemplates] = useState(() => loadRawNoteProcessTemplates())
  const [activeTemplateId, setActiveTemplateId] = useState(() => Object.keys(loadRawNoteProcessTemplates())[0] || '')
  const [templateInput, setTemplateInput] = useState('')
  const [pendingTemplateDeleteId, setPendingTemplateDeleteId] = useState(null)
  const [stageInput, setStageInput] = useState('')
  const [pendingStageDeleteId, setPendingStageDeleteId] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [previewStageId, setPreviewStageId] = useState(null)
  const [editingTemplateId, setEditingTemplateId] = useState(null)
  const [editingTemplateDraft, setEditingTemplateDraft] = useState('')

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
    const currentStageId = previewStageId && stages.some((stage) => stage.id === previewStageId) ? previewStageId : ''
    return { stages, currentStageId }
  }, [templates, activeTemplateId, previewStageId])

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
    persistStages(getActiveStages().map((item) => (item.id === stage.id ? { ...item, color } : item)))
  }

  function updateStageLabel(stage, label) {
    const clean = String(label || '').trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return
    const stages = getActiveStages()
    if (stages.some((item) => item.id !== stage.id && normalizeLabel(item.label) === normalizeLabel(clean))) return
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

  function startEditTemplate(template) {
    setEditingTemplateId(template.id)
    setEditingTemplateDraft(template.label)
    setPendingTemplateDeleteId(null)
  }

  function cancelEditTemplate() {
    setEditingTemplateId(null)
    setEditingTemplateDraft('')
  }

  function commitEditTemplate(templateId) {
    const clean = editingTemplateDraft.trim()
    const current = loadRawNoteProcessTemplates()
    if (!clean || !current[templateId]) {
      cancelEditTemplate()
      return
    }
    if (Object.values(current).some((template) => template.id !== templateId && normalizeLabel(template.label) === normalizeLabel(clean))) {
      cancelEditTemplate()
      return
    }
    const next = saveRawNoteProcessTemplates({
      ...current,
      [templateId]: { ...current[templateId], label: clean },
    })
    setTemplates(next)
    cancelEditTemplate()
  }

  function copyTemplate(template) {
    const current = loadRawNoteProcessTemplates()
    if (!current[template.id]) return
    const nextId = createId('note-template-copy')
    const next = saveRawNoteProcessTemplates({
      ...current,
      [nextId]: {
        ...current[template.id],
        id: nextId,
        label: buildCopyLabel(current[template.id].label, current),
        stages: (current[template.id].stages || []).map((stage) => ({ ...stage, id: createId('note-status-copy') })),
      },
    })
    setTemplates(next)
    setActiveTemplateId(nextId)
    setPreviewStageId(null)
    setPendingTemplateDeleteId(null)
    cancelEditTemplate()
  }

  function removeTemplate(templateId) {
    const next = removeNoteProcessTemplate(templateId)
    setTemplates(next)
    setPendingTemplateDeleteId(null)
    setPreviewStageId(null)
    setStageInput('')
    if (!next[activeTemplateId]) setActiveTemplateId(Object.keys(next)[0] || '')
  }

  function createTemplate(event) {
    event.preventDefault()
    const label = templateInput.trim()
    if (!label) return
    const next = addNoteProcessTemplate(label)
    setTemplates(next)
    const created = Object.values(next).find((template) => template.label === label)
    if (created) setActiveTemplateId(created.id)
    setTemplateInput('')
    setIsOpen(false)
  }

  const templateCount = Object.keys(templates).length

  return (
    <section className="card space-y-4">
      <div>
        <h2 className="text-base font-black text-white">Not Defteri Süreçleri</h2>
        <p className="mt-1 text-xs font-semibold text-gray-500">
          Not defteri kayıtlarında kullanılacak süreç türleri ve durum menüsü buradan yönetilir.
        </p>
        <p className="mt-1 text-[13px] font-bold text-gray-600">
          {templateCount} süreç türü · {getActiveStages().length} aktif durum
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.values(templates).map((template) => {
          const isActive = activeTemplateId === template.id
          if (pendingTemplateDeleteId === template.id) {
            return (
              <div key={template.id} className="inline-flex items-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-2 py-1.5">
                <span className="text-[13px] font-black uppercase tracking-wide text-red-200">{template.label}</span>
                <InlineDeleteConfirm onConfirm={() => removeTemplate(template.id)} onCancel={() => setPendingTemplateDeleteId(null)} />
              </div>
            )
          }

          return (
            <div
              key={template.id}
              className={`inline-flex items-center overflow-hidden rounded-xl border transition-colors ${
                isActive ? 'border-violet-500/50 bg-violet-500/15' : 'border-dark-500/50 bg-dark-700/50'
              }`}
            >
              {editingTemplateId === template.id ? (
                <form
                  className="flex items-center gap-1 px-1 py-1"
                  onSubmit={(event) => {
                    event.preventDefault()
                    commitEditTemplate(template.id)
                  }}
                >
                  <input
                    value={editingTemplateDraft}
                    onChange={(event) => setEditingTemplateDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') cancelEditTemplate()
                    }}
                    className="h-7 w-32 rounded-lg border border-violet-500/40 bg-dark-900/70 px-2 text-[13px] font-black uppercase text-white outline-none"
                    autoFocus
                  />
                  <button type="submit" className="rounded-md p-1 text-emerald-300 hover:bg-emerald-500/15" title="Kaydet">
                    <Check className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={cancelEditTemplate} className="rounded-md p-1 text-gray-500 hover:bg-dark-600 hover:text-gray-300" title="Vazgeç">
                    <X className="h-3 w-3" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTemplateId(template.id)
                    setPreviewStageId(null)
                    setPendingStageDeleteId(null)
                    setPendingTemplateDeleteId(null)
                    setStageInput('')
                    cancelEditTemplate()
                  }}
                  className={`px-3 py-1.5 text-[13px] font-black uppercase tracking-wide transition-colors ${
                    isActive ? 'text-violet-300' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {template.label}
                  <span className="ml-1 text-[12px] font-bold text-gray-500">({template.stages.length})</span>
                </button>
              )}
              {editingTemplateId !== template.id && (
                <>
                  <button type="button" onClick={() => copyTemplate(template)} className="rounded-md p-1 text-gray-500 transition-colors hover:bg-emerald-500/15 hover:text-emerald-300" title="Süreç türünü kopyala">
                    <Copy className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => startEditTemplate(template)} className="rounded-md p-1 text-gray-500 transition-colors hover:bg-blue-500/15 hover:text-blue-300" title="Süreç türünü düzenle">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => setPendingTemplateDeleteId(template.id)} className="mr-1.5 rounded-md p-0.5 text-gray-500 transition-colors hover:bg-red-500/20 hover:text-red-300" title="Süreç türünü sil">
                    <X className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>

      <form className="flex flex-wrap items-center gap-2" onSubmit={createTemplate}>
        <input
          value={templateInput}
          onChange={(event) => setTemplateInput(event.target.value)}
          placeholder="Yeni not defteri süreç türü..."
          className="form-input min-w-[220px] flex-1"
        />
        <button type="submit" className="btn-primary px-4 py-2 text-xs font-black uppercase">
          Tür Ekle
        </button>
      </form>

      <ProcessPanelModule
        key={activeTemplateId || 'empty-note-process'}
        activeLabel="Aktif Durum"
        countSuffix="durum tanımlı"
        emptyMessage={activeTemplateId ? 'Henüz durum eklenmedi.' : 'Önce not defteri süreç türü ekleyin.'}
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
    </section>
  )
}
