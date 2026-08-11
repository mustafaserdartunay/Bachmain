import { useMemo, useState } from 'react'
import { ArchiveRestore, Trash2 } from 'lucide-react'
import {
  COP_KUTUSU_BUTTON_CLASS,
  COP_KUTUSU_ICON_CLASS,
  GERI_YUKLE_BUTTON_CLASS,
  GERI_YUKLE_ICON_CLASS,
} from '../../utils/buttonStyles'

/**
 * Production process activity log with soft-delete / restore / bulk actions.
 */
export default function ProductionActivityTimeline({
  activities = [],
  trash = [],
  className = '',
  onDelete,
  onRestore,
  onPurgeTrash,
}) {
  const [selectedLive, setSelectedLive] = useState(() => new Set())
  const [selectedTrash, setSelectedTrash] = useState(() => new Set())
  const [showTrash, setShowTrash] = useState(false)

  const rows = useMemo(
    () => (Array.isArray(activities) ? [...activities].reverse() : []),
    [activities],
  )
  const trashRows = useMemo(
    () => (Array.isArray(trash) ? [...trash].reverse() : []),
    [trash],
  )

  const canManage = typeof onDelete === 'function'

  function toggleLive(id) {
    setSelectedLive((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleTrash(id) {
    setSelectedTrash((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllLive() {
    setSelectedLive(new Set(rows.map((item) => item.id).filter(Boolean)))
  }

  function clearLiveSelection() {
    setSelectedLive(new Set())
  }

  if (!rows.length && !trashRows.length) {
    return (
      <div className={`rounded-2xl border border-dashed border-[var(--border)] bg-transparent px-4 py-6 text-center ${className}`.trim()}>
        <p className="text-[13px] font-semibold text-[var(--muted)]">Henüz süreç günlüğü yok.</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {canManage && rows.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-ds-border px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)] hover:bg-[var(--ds-surface-muted)]/40"
            onClick={selectedLive.size === rows.length ? clearLiveSelection : selectAllLive}
          >
            {selectedLive.size === rows.length ? 'Seçimi kaldır' : 'Tümünü seç'}
          </button>
          <button
            type="button"
            disabled={!selectedLive.size}
            className={`${COP_KUTUSU_BUTTON_CLASS} disabled:opacity-40`}
            title="Seçilenleri sil"
            aria-label="Seçilenleri sil"
            onClick={() => {
              onDelete?.([...selectedLive])
              clearLiveSelection()
            }}
          >
            <Trash2 className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-[#fda4af]/50 px-2.5 py-1 text-[11px] font-semibold text-[#e11d48] hover:bg-[#fff1f2]"
            onClick={() => {
              if (!window.confirm('Tüm süreç günlüğü silinsin mi?')) return
              onDelete?.(rows.map((item) => item.id).filter(Boolean))
              clearLiveSelection()
            }}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
            Toplu sil
          </button>
          {trashRows.length > 0 ? (
            <button
              type="button"
              className="ml-auto rounded-lg border border-ds-border px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)] hover:bg-[var(--ds-surface-muted)]/40"
              onClick={() => setShowTrash((open) => !open)}
            >
              Silinenler ({trashRows.length})
            </button>
          ) : null}
        </div>
      ) : null}

      {rows.length ? (
        <ol className="space-y-0">
          {rows.map((item, index) => {
            const rawDate = String(item.date || '')
            const timeMatch = rawDate.match(/(\d{1,2}:\d{2})/)
            const timeLabel = timeMatch ? timeMatch[1] : rawDate.slice(0, 16) || '—'
            const isLast = index === rows.length - 1
            const checked = selectedLive.has(item.id)

            return (
              <li key={item.id || `${item.date}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
                {!isLast ? (
                  <span className="absolute left-[7px] top-3 bottom-0 w-px bg-[rgba(140,145,165,0.25)]" aria-hidden />
                ) : null}
                {canManage ? (
                  <label className="relative z-[1] mt-0.5 flex h-3.5 w-3.5 shrink-0 cursor-pointer items-center justify-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleLive(item.id)}
                      className="h-3.5 w-3.5 rounded border-ds-border"
                    />
                  </label>
                ) : (
                  <span className="relative z-[1] mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[var(--bach-sky,#79a6d2)] bg-white" />
                )}
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold tabular-nums text-[var(--bach-sky,#79a6d2)]">{timeLabel}</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-[var(--ink)]">{item.text || '—'}</p>
                    </div>
                    {canManage ? (
                      <button
                        type="button"
                        className={COP_KUTUSU_BUTTON_CLASS}
                        title="Sil"
                        aria-label="Sil"
                        onClick={() => onDelete?.([item.id])}
                      >
                        <Trash2 className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} />
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="text-[13px] font-semibold text-[var(--muted)]">Aktif günlük kaydı yok.</p>
      )}

      {showTrash && trashRows.length > 0 ? (
        <div className="space-y-2 rounded-ds-lg border border-dashed border-ds-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">Silinenler</p>
            <button
              type="button"
              disabled={!selectedTrash.size}
              className={`${GERI_YUKLE_BUTTON_CLASS} disabled:opacity-40`}
              onClick={() => {
                onRestore?.([...selectedTrash])
                setSelectedTrash(new Set())
              }}
            >
              <ArchiveRestore className={GERI_YUKLE_ICON_CLASS} strokeWidth={2.25} />
              Geri yükle
            </button>
            <button
              type="button"
              className="rounded-lg border border-[#fda4af]/50 px-2.5 py-1 text-[11px] font-semibold text-[#e11d48] hover:bg-[#fff1f2]"
              onClick={() => {
                if (!window.confirm('Silinenler kalıcı olarak temizlensin mi?')) return
                onPurgeTrash?.(null)
                setSelectedTrash(new Set())
              }}
            >
              Çöpü boşalt
            </button>
          </div>
          <ul className="space-y-2">
            {trashRows.map((item) => (
              <li key={item.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selectedTrash.has(item.id)}
                  onChange={() => toggleTrash(item.id)}
                  className="mt-1 h-3.5 w-3.5 rounded border-ds-border"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold tabular-nums text-[var(--muted)]">{item.date || '—'}</p>
                  <p className="text-[13px] font-semibold text-[var(--muted)] line-through">{item.text || '—'}</p>
                </div>
                <button
                  type="button"
                  className={GERI_YUKLE_BUTTON_CLASS}
                  title="Geri yükle"
                  aria-label="Geri yükle"
                  onClick={() => onRestore?.([item.id])}
                >
                  <ArchiveRestore className={GERI_YUKLE_ICON_CLASS} strokeWidth={2.25} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
