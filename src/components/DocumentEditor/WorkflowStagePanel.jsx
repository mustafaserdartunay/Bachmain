import ProcessPanelModule from './ProcessPanelModule'

export default function WorkflowStagePanel({
  title,
  record,
  isOpen,
  onToggle,
  stageInput,
  setStageInput,
  onAddStage,
  onSelectStage,
  onUpdateStageColor,
  onUpdateStageLabel,
  onReorderStages,
  pendingStageDeleteId,
  setPendingStageDeleteId,
  onRemoveStage,
  compact = false,
}) {
  return (
    <div>
      {title ? <h2 className="mb-3 text-base font-bold text-white">{title}</h2> : null}
      <ProcessPanelModule
        activeLabel="Aktif Süreç"
        countSuffix="süreç tanımlı"
        emptyMessage="Henüz süreç eklenmedi."
        addPlaceholder="Yeni süreç adı..."
        record={record}
        isOpen={isOpen}
        onToggle={onToggle}
        stageInput={stageInput}
        setStageInput={setStageInput}
        onAddStage={onAddStage}
        onSelectStage={onSelectStage}
        onUpdateStageColor={onUpdateStageColor}
        onUpdateStageLabel={onUpdateStageLabel}
        onReorderStages={onReorderStages}
        pendingStageDeleteId={pendingStageDeleteId}
        setPendingStageDeleteId={setPendingStageDeleteId}
        onRemoveStage={onRemoveStage}
        allowDeselect={false}
        compact={compact}
      />
    </div>
  )
}
