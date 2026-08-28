import { FolderOpen, Plus } from 'lucide-react'
import { YF_TEXT_CLASS } from '../../utils/dashboardDesign'

function noteCount(category) {
  if (Array.isArray(category?.notes) && category.notes.length) return category.notes.length
  return String(category?.content || '').trim() ? 1 : 0
}

/**
 * Form altı buton şeridi.
 * Tek tık: seç + notları göster · tekrar tık: genel listeye dön.
 */
export default function NotebookCategorySection({
  categories = [],
  selectedId = null,
  onSelect,
  onClearSelect,
  onCreateCategory,
}) {
  return (
    <section className="border-b border-[rgba(140,145,165,0.14)] px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-[12px] font-normal leading-tight text-[var(--muted)]">
          {selectedId
            ? 'Seçili buton notları · tekrar tıkla → genel liste'
            : 'Buton seçilmezse genel listeye kaydedilir'}
        </p>
        <button
          type="button"
          onClick={onCreateCategory}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-xl border border-dashed border-blue-400/45 bg-blue-500/10 px-2.5 text-[11px] font-bold uppercase tracking-wide text-blue-600 transition-colors hover:border-blue-400/70 hover:bg-blue-500/20"
        >
          <Plus className="h-3.5 w-3.5" />
          Buton Ekle
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[rgba(140,145,165,0.22)] px-3 py-3 text-center text-[12px] font-normal text-[var(--muted)]">
          Henüz buton yok. Süreçler → Not Defteri veya buradan ekleyin.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => {
            const isSelected = selectedId === category.id
            const count = noteCount(category)
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  if (isSelected) onClearSelect?.()
                  else onSelect?.(category)
                }}
                className={`inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-xl border px-2.5 py-1.5 text-left transition-colors ${
                  isSelected
                    ? 'border-blue-500/50 bg-blue-500/15 text-blue-700'
                    : 'border-[rgba(140,145,165,0.18)] bg-white/45 text-[var(--ink)] hover:bg-blue-500/5'
                }`}
                title={
                  isSelected
                    ? `${category.title} seçili · tekrar tıklayınca genel liste`
                    : `${category.title} · notları göster ve buraya kaydet`
                }
              >
                <FolderOpen className="h-3.5 w-3.5 shrink-0" strokeWidth={2.1} />
                <span className="truncate text-[12px] font-semibold">{category.title}</span>
                <span className={`${YF_TEXT_CLASS} !text-[11px] tabular-nums`}>{count}</span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
