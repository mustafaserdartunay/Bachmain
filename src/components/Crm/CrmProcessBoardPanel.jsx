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
          <div className="flex gap-1 rounded-xl border border-[rgba(148,163,184,0.25)] bg-white p-1">
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
                    ? 'bg-blue-500/15 text-blue-700'
                    : 'text-[var(--muted)] hover:bg-slate-100 hover:text-[var(--ink)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    >
      {onNoteSave ? (
        <AgendaNoteBoard
          composerOnly
          notes={notes}
          totalRecordCount={noteCount}
          onSave={onNoteSave}
          onDeleteCompleted={onNoteDeleteCompleted}
          composerClassName="mb-4 rounded-xl border border-[rgba(148,163,184,0.25)] bg-white p-3"
          showComposer
        />
      ) : null}

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
          <div className="rounded-xl border border-dashed border-[rgba(148,163,184,0.35)] bg-white px-6 py-10 text-center">
            <GitBranch className="mx-auto mb-2 h-6 w-6 text-[var(--muted)]" />
            <p className="text-sm font-black text-[var(--ink)]">Filtreye uygun kayıt yok</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
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
