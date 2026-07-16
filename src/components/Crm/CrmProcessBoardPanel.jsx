import { GitBranch } from 'lucide-react'
import { AppPagePanel } from '../Layout/AppPageLayout'
import AgendaNoteBoard, { AgendaNoteItem } from './AgendaNoteBoard'
import CrmProcessCard from './CrmProcessCard'
import CrmProcessFilters from './CrmProcessFilters'
import { saveCrmProcessFilter } from '../../utils/crmProcessFilterUtils'

const PROCESS_SCOPE_OPTIONS = [
  { id: 'active', label: 'Devam eden' },
  { id: 'done', label: 'Tamamlanan' },
  { id: 'all', label: 'Tümü' },
]

export default function CrmProcessBoardPanel({
  entries,
  notes = [],
  noteCount = 0,
  processFilter,
  onProcessFilterChange,
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  activeMenu,
  setActiveMenu,
  onStageClick,
  onStagePhotosChange,
  onMailClick,
  onWhatsAppClick,
  onEdit,
  onDelete,
  onNoteSave,
  onNoteToggleComplete,
  onNoteEdit,
  onNoteDelete,
  onNoteDeleteCompleted,
}) {
  return (
    <AppPagePanel
      title="CRM Süreçleri"
      description="Görev, randevu ve notları filtreleyin; süreç aşamalarını güncelleyin."
      action={(
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">
            {entries.length} kayıt
          </span>
          <div className="flex gap-1 rounded-xl border border-dark-500/50 bg-dark-700/50 p-1">
            {PROCESS_SCOPE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onProcessFilterChange(option.id)
                  saveCrmProcessFilter(option.id)
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-black transition-colors ${
                  processFilter === option.id
                    ? 'bg-blue-500/15 text-blue-300'
                    : 'text-gray-500 hover:bg-dark-600/50 hover:text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    >
      <AgendaNoteBoard
        composerOnly
        notes={notes}
        totalRecordCount={noteCount}
        onSave={onNoteSave}
        onDeleteCompleted={onNoteDeleteCompleted}
        composerClassName="mb-4 rounded-xl border border-[rgba(140,145,165,0.14)] bg-white/20 p-3"
        showComposer={Boolean(onNoteSave)}
      />

      <CrmProcessFilters
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        filters={filters}
        onFilterChange={onFilterChange}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />

      <div className="mt-4 space-y-2">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-dark-500/50 bg-dark-800/30 px-6 py-10 text-center">
            <GitBranch className="mx-auto mb-2 h-6 w-6 text-gray-600" />
            <p className="text-sm font-black text-white">Filtreye uygun kayıt yok</p>
            <p className="mt-1 text-xs text-gray-500">
              Filtreleri gevşetin veya yukarıdan not ekleyin; header takvim ve oluştur butonları da buraya yansır.
            </p>
          </div>
        ) : (
          entries.map((entry) => {
            if (entry.kind === 'note') {
              return (
                <AgendaNoteItem
                  key={`note-${entry.id}`}
                  note={entry.record}
                  onToggleComplete={onNoteToggleComplete}
                  onEdit={onNoteEdit}
                  onDelete={onNoteDelete}
                />
              )
            }

            return (
              <CrmProcessCard
                key={`${entry.kind}-${entry.id}`}
                entry={entry}
                onStageClick={onStageClick}
                onStagePhotosChange={onStagePhotosChange}
                onMailClick={onMailClick}
                onWhatsAppClick={onWhatsAppClick}
                onEdit={() => onEdit(entry)}
                onDelete={() => onDelete(entry)}
              />
            )
          })
        )}
      </div>
    </AppPagePanel>
  )
}
