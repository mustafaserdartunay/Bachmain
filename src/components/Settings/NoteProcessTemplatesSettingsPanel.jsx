import { useEffect, useMemo, useState } from 'react'
import { FolderOpen, Plus } from 'lucide-react'
import ProcessSettingsSectionShell from './ProcessSettingsSectionShell'
import NotebookCategoryDetailModal from '../Layout/NotebookCategoryDetailModal'
import {
  loadNotebookCategories,
  NOTEBOOK_CATEGORIES_EVENT,
  sortNotebookCategories,
  uniqueNotebookCategoryTitle,
} from '../../utils/notebookCategoryStore'
import { matchesProcessSearch } from '../../utils/processSettingsSearch'
import { APP_LABEL_CLASS, APP_METRIC_ROW_CLASS, YF_TEXT_CLASS } from '../../utils/dashboardDesign'

function noteCount(category) {
  if (Array.isArray(category?.notes) && category.notes.length) return category.notes.length
  return String(category?.content || '').trim() ? 1 : 0
}

function previewContent(content = '') {
  const line = String(content)
    .split('\n')
    .map((row) => row.trim())
    .find(Boolean)
  if (!line) return 'Boş sayfa · aç ikonu veya satıra tıklayın'
  return line.length > 80 ? `${line.slice(0, 80)}…` : line
}

/**
 * Not Defteri Süreçleri — yalnızca header not defteri buton sayfalarını yönetir.
 */
export default function NoteProcessTemplatesSettingsPanel({ searchQuery = '' }) {
  const [categories, setCategories] = useState(() =>
    sortNotebookCategories(loadNotebookCategories()),
  )
  const [detailCategory, setDetailCategory] = useState(null)

  useEffect(() => {
    function refresh() {
      setCategories(sortNotebookCategories(loadNotebookCategories()))
    }
    window.addEventListener(NOTEBOOK_CATEGORIES_EVENT, refresh)
    window.addEventListener('bach:crm-updated', refresh)
    return () => {
      window.removeEventListener(NOTEBOOK_CATEGORIES_EVENT, refresh)
      window.removeEventListener('bach:crm-updated', refresh)
    }
  }, [])

  const sorted = useMemo(() => sortNotebookCategories(categories), [categories])
  const totalNotes = sorted.reduce((sum, category) => sum + noteCount(category), 0)

  if (!matchesProcessSearch(searchQuery, 'Not Defteri Süreçleri')) return null

  function handleCreate() {
    setDetailCategory({
      title: uniqueNotebookCategoryTitle('Yeni Buton', sorted),
      notes: [],
    })
  }

  function handleChanged(nextCategory) {
    setCategories(sortNotebookCategories(loadNotebookCategories()))
    if (nextCategory?.id) {
      setDetailCategory(nextCategory)
      return
    }
    setDetailCategory(null)
  }

  return (
    <>
      <ProcessSettingsSectionShell
        title="Not Defteri Süreçleri"
        description="Header not defterindeki buton sayfalarını buradan oluşturun. Her buton açılır pencereli bir not sayfasıdır; not defteri ile canlı bağlıdır."
        meta={`${sorted.length} buton · ${totalNotes} not`}
      >
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className={YF_TEXT_CLASS}>Buton sayfaları</p>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-blue-400/45 bg-blue-500/10 px-3 text-xs font-black uppercase tracking-wide text-blue-300 transition-colors hover:border-blue-400/70 hover:bg-blue-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Buton Ekle
          </button>
        </div>

        <div className="mt-4 space-y-1.5">
          {sorted.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--glass-border)] px-4 py-8 text-center text-[13px] font-normal text-[var(--muted)]">
              Henüz buton sayfası yok. Buton ekleyin; header not defterinde de görünür.
            </p>
          ) : (
            sorted.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  const fresh =
                    loadNotebookCategories().find((item) => item.id === category.id) || category
                  setDetailCategory(fresh)
                }}
                className={`${APP_METRIC_ROW_CLASS} w-full gap-2`}
              >
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                    <FolderOpen className="h-4 w-4" strokeWidth={2.1} />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className={`${APP_LABEL_CLASS} !font-semibold block`}>
                      {category.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] font-normal text-[var(--muted)]">
                      {previewContent(category.content)}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-[12px] font-bold text-[var(--muted)]">
                  {noteCount(category)} not
                </span>
              </button>
            ))
          )}
        </div>
      </ProcessSettingsSectionShell>

      <NotebookCategoryDetailModal
        open={Boolean(detailCategory)}
        category={detailCategory}
        onClose={() => setDetailCategory(null)}
        onChanged={handleChanged}
      />
    </>
  )
}
