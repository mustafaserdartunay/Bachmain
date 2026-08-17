import { ChevronDown } from 'lucide-react'
import WorkflowStageEditor from './WorkflowStageEditor'
import { filterWorkflowStageList, resolveProcessActiveStage } from './processPanelUtils'

/**
 * Süreç paneli standardı — teklif süreci, teklif durumu ve benzeri
 * liste+düzenleme panelleri bu bileşen üzerinden üretilir.
 */
export default function ProcessPanelModule({
  activeLabel = 'Aktif',
  countSuffix = 'tanımlı',
  emptyMessage = 'Henüz kayıt eklenmedi.',
  addPlaceholder = 'Yeni ad...',
  record,
  isOpen,
  onToggle,
  stageInput,
  setStageInput,
  onAddStage,
  onSelectStage,
  onUpdateStageColor,
  onUpdateStageLabel,
  onCopyStage,
  onReorderStages,
  pendingStageDeleteId,
  setPendingStageDeleteId,
  onRemoveStage,
  summaryLine,
  activeDisplayLabel,
  emptySelectionLabel = '',
  allowDeselect = true,
  compact = false,
  className = '',
}) {
  const stages = filterWorkflowStageList(record?.stages || [])
  const panelRecord = { ...record, stages }
  const selectedCount = record?.selectedStageIds?.length || 0
  const activeStage = resolveProcessActiveStage(panelRecord)
  const displayLabel = activeDisplayLabel
    ?? (selectedCount > 1
      ? `${selectedCount} etiket seçili`
      : (activeStage?.label || stages[0]?.label || emptySelectionLabel))
  const isPlaceholder = !activeDisplayLabel && selectedCount <= 1 && !activeStage && !stages[0] && Boolean(emptySelectionLabel)

  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 bg-dark-900/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors focus-within:border-blue-400/40 ${className}`}>
      <div className="sticky top-0 z-10 border-b border-white/5 bg-dark-800/90 backdrop-blur-md">
        <button
          type="button"
          onClick={onToggle}
          className={`w-full text-left transition-colors hover:bg-white/[0.03] ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className={`font-black uppercase tracking-wider text-gray-500 ${compact ? 'text-[11px]' : 'text-[12px]'}`}>{activeLabel}</p>
              <p className={`flex items-center gap-1.5 font-bold ${compact ? 'mt-0.5 text-xs' : 'mt-1 text-sm'} ${isPlaceholder ? 'text-gray-500' : 'text-white'}`}>
                <span className={`shrink-0 rounded-full ${compact ? 'h-2 w-2' : 'h-2.5 w-2.5'} ${isPlaceholder ? 'bg-gray-500' : (activeStage?.color || 'bg-blue-500')}`} />
                <span className="truncate">{displayLabel}</span>
              </p>
              {summaryLine ?? (
                <p className={`text-gray-500 ${compact ? 'mt-0.5 text-[12px]' : 'mt-1 text-xs'}`}>{stages.length} {countSuffix}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className={`font-bold text-gray-400 ${compact ? 'text-[12px]' : 'text-xs'}`}>{isOpen ? 'Gizle' : 'Düzenle'}</span>
              <ChevronDown className={`text-gray-400 transition-transform ${compact ? 'h-3 w-3' : 'h-4 w-4'} ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>
      </div>

      {isOpen && (
        <div className={`max-h-[min(28rem,70vh)] overflow-y-auto ${compact ? 'p-2' : 'p-3'}`} onClick={(event) => event.stopPropagation()}>
          <WorkflowStageEditor
            record={panelRecord}
            stageInput={stageInput}
            setStageInput={setStageInput}
            onAddStage={onAddStage}
            onSelectStage={onSelectStage}
            onUpdateStageColor={onUpdateStageColor}
            onUpdateStageLabel={onUpdateStageLabel}
            onCopyStage={onCopyStage}
            onReorderStages={onReorderStages}
            pendingStageDeleteId={pendingStageDeleteId}
            setPendingStageDeleteId={setPendingStageDeleteId}
            onRemoveStage={onRemoveStage}
            emptyMessage={emptyMessage}
            addPlaceholder={addPlaceholder}
            allowDeselect={allowDeselect}
          />
        </div>
      )}
    </div>
  )
}
