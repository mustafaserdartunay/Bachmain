import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { toTitleCaseTr } from '../../utils/autoCapitalize'
import {
  APP_ACTIVATION_ROW_CLASS,
  APP_DASHBOARD_PANEL_BODY_CLASS,
  APP_DASHBOARD_PANEL_SIZE_CLASS,
  APP_LABEL_CLASS,
  APP_METRIC_ROW_CLASS,
  APP_PANEL_CLASS,
  APP_PANEL_TITLE_CLASS,
} from '../../utils/dashboardDesign'

const FINANCE_METRIC_COLORS = {
  cash: 'text-emerald-600',
  bank: 'text-blue-600',
  cheques: 'text-violet-600',
  'promissory-notes': 'text-fuchsia-600',
  'live-assets': 'text-indigo-600',
  receivables: 'text-cyan-600',
  future: 'text-lime-600',
  possible: 'text-sky-600',
  payables: 'text-orange-600',
  'stock-value': 'text-teal-600',
}

function DragHandle({ dragHandleProps }) {
  return (
    <div
      {...dragHandleProps}
      className="flex h-5 w-4 shrink-0 cursor-grab touch-none items-center justify-center self-center text-[var(--muted)] opacity-55 transition-opacity hover:opacity-100 active:cursor-grabbing"
      title="Sürükleyerek sırala"
      aria-label="Sürükleyerek sırala"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none grid grid-cols-2 gap-x-[3px] gap-y-[2.5px]"
      >
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} className="h-[2.5px] w-[2.5px] rounded-full bg-current" />
        ))}
      </span>
    </div>
  )
}

/**
 * Güncel Durum finans özeti — süreçler ayarında aynı satır görünümü + sürükle-bırak.
 */
export default function GuncelDurumFinanceSettings({
  metricCards = [],
  configCards = [],
  onToggleVisibility,
  onReorder,
}) {
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const orderedCards = configCards
    .map((config) => {
      const metric = metricCards.find((item) => item.id === config.id)
      return metric ? { ...metric, visible: config.visible !== false } : null
    })
    .filter(Boolean)

  function endDrag() {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  function beginDrag(index, event) {
    setDraggedIndex(index)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }

  function handleDrop(targetIndex, event) {
    event.preventDefault()
    event.stopPropagation()
    if (draggedIndex == null || draggedIndex === targetIndex) {
      endDrag()
      return
    }
    const nextIds = orderedCards.map((card) => card.id)
    const [moved] = nextIds.splice(draggedIndex, 1)
    nextIds.splice(targetIndex, 0, moved)
    onReorder?.(nextIds)
    endDrag()
  }

  return (
    <section className={`${APP_PANEL_CLASS} ${APP_DASHBOARD_PANEL_SIZE_CLASS}`}>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        <h3 className={APP_PANEL_TITLE_CLASS}>Finans Özeti</h3>
        <span className="ml-auto text-[12px] font-normal text-[var(--muted)]">
          Sürükleyerek sıralayın · Göster / Gizle
        </span>
      </div>

      <div className={APP_DASHBOARD_PANEL_BODY_CLASS}>
        {orderedCards.map((card, index) => {
          const palette = FINANCE_METRIC_COLORS[card.id] || FINANCE_METRIC_COLORS.cash
          const Icon = card.icon
          const isVisible = card.visible !== false
          const hasDual =
            card.valueExVat != null &&
            card.valueIncVat != null &&
            String(card.valueExVat) !== '' &&
            String(card.valueIncVat) !== ''
          const rowClass = hasDual ? APP_ACTIVATION_ROW_CLASS : APP_METRIC_ROW_CLASS
          const isDragging = draggedIndex === index
          const isDragOver = dragOverIndex === index && draggedIndex !== index
          const ToggleIcon = isVisible ? Eye : EyeOff

          return (
            <div
              key={card.id}
              onDragOver={(event) => {
                if (draggedIndex == null) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                if (draggedIndex !== index) setDragOverIndex(index)
              }}
              onDragLeave={() => {
                if (dragOverIndex === index) setDragOverIndex(null)
              }}
              onDrop={(event) => handleDrop(index, event)}
              className={`${isDragging ? 'opacity-40' : ''} ${
                isDragOver ? 'ring-2 ring-blue-400/35 rounded-xl' : ''
              }`}
            >
              <div className={`${rowClass} ${isVisible ? '' : 'opacity-50'} !cursor-default gap-2`}>
                <DragHandle
                  dragHandleProps={{
                    draggable: true,
                    onDragStart: (event) => {
                      event.stopPropagation()
                      beginDrag(index, event)
                    },
                    onDragEnd: endDrag,
                  }}
                />
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  {Icon ? <Icon className={`h-3.5 w-3.5 shrink-0 ${palette}`} /> : null}
                  <span className={APP_LABEL_CLASS} title={card.label}>
                    {toTitleCaseTr(card.label)}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                  {hasDual ? (
                    <>
                      <span
                        className={`text-[11px] font-extrabold tabular-nums leading-tight ${palette}`}
                      >
                        <span className="mr-1 text-[9px] font-bold text-[var(--muted)]">Hariç</span>
                        {card.valueExVat}
                      </span>
                      <span
                        className={`text-[11px] font-extrabold tabular-nums leading-tight ${palette}`}
                      >
                        <span className="mr-1 text-[9px] font-bold text-[var(--muted)]">Dahil</span>
                        {card.valueIncVat}
                      </span>
                    </>
                  ) : (
                    <span
                      className={`text-xs font-extrabold tabular-nums leading-tight ${palette}`}
                      title={card.value}
                    >
                      {card.value}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleVisibility?.(card.id)}
                  className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border px-2 text-[11px] font-bold transition-colors ${
                    isVisible
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700'
                      : 'border-[var(--glass-border)] bg-white/20 text-[var(--muted)]'
                  }`}
                  title={isVisible ? 'Gizle' : 'Göster'}
                >
                  <ToggleIcon className="h-3 w-3" />
                  {isVisible ? 'Göster' : 'Gizle'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
