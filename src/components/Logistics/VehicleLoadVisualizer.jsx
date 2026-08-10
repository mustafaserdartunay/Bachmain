import { Check, Maximize2, Minus, Plus, Search } from 'lucide-react'
import { resolveCargoVisual, resolveVehicleViews } from '../../utils/loadVisualAssets'
import { fmtKg, itemInitials, SLOT_COLORS } from '../../utils/truckLoadCalc'
import { YF_TEXT_CLASS } from '../../utils/dashboardDesign'
import './vehicle-load-visualizer.css'

function ViewChrome({ title, children, onZoomIn, onZoomOut }) {
  return (
    <div className="vlv-card flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--glass-border)] px-3 py-2">
        <p className={`${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>{title}</p>
        <div className="flex items-center gap-1">
          <span className="vlv-icon-btn" aria-hidden>
            <Search className="h-3.5 w-3.5" />
          </span>
          <button
            type="button"
            className="vlv-icon-btn"
            onClick={onZoomOut}
            aria-label="Uzaklaştır"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="vlv-icon-btn"
            onClick={onZoomIn}
            aria-label="Yakınlaştır"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <span className="vlv-icon-btn" aria-hidden>
            <Maximize2 className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
      <div className="relative min-h-[180px] flex-1 overflow-hidden bg-[#f3f6fa]">{children}</div>
    </div>
  )
}

function PhotoStage({ src, alt, plate, children, className = '' }) {
  return (
    <div className={`relative h-full min-h-[180px] w-full ${className}`}>
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain object-center"
      />
      {plate ? (
        <span className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded bg-[#1e293b] px-2 py-0.5 text-[10px] font-bold tracking-wider text-white shadow">
          {plate}
        </span>
      ) : null}
      {children}
    </div>
  )
}

function CargoOverlayStack({ results, maxVisible = 6 }) {
  const items = (results || []).filter((item) => !item.overflow).slice(0, maxVisible)
  if (!items.length) return null
  return (
    <div className="pointer-events-none absolute inset-[18%_22%_28%_22%] z-[5] flex flex-wrap content-end items-end justify-center gap-1 p-1">
      {items.map((item) => (
        <img
          key={item.id}
          src={resolveCargoVisual(item)}
          alt={item.name}
          title={item.name}
          className="h-[42%] max-h-[72px] w-auto max-w-[38%] rounded-md object-contain drop-shadow-md"
        />
      ))}
    </div>
  )
}

function SideCargoOverlay({ results }) {
  const items = (results || []).filter((item) => !item.overflow).slice(0, 8)
  if (!items.length) return null
  return (
    <div className="pointer-events-none absolute inset-[38%_12%_22%_28%] z-[5] flex items-end gap-1 overflow-hidden px-1 pb-1">
      {items.map((item) => (
        <img
          key={item.id}
          src={resolveCargoVisual(item)}
          alt={item.name}
          title={item.name}
          className="h-[70%] w-auto max-w-[18%] rounded-sm object-contain drop-shadow"
        />
      ))}
    </div>
  )
}

function TopGrid({ plan, cell, editingItemId, onEmptySlotClick, onFilledSlotClick }) {
  const cols = plan.colsAcrossWidth || 1
  const rows = plan.rowsAlongLength || 1

  return (
    <div className="absolute inset-[12%_10%_14%_28%] z-[6] overflow-auto rounded-md">
      <div
        className="grid gap-1.5 p-1"
        style={{
          gridTemplateColumns: `repeat(${rows}, minmax(${Math.max(36, cell * 0.7)}px, 1fr))`,
          gridTemplateRows: `repeat(${cols}, minmax(${Math.max(36, cell * 0.7)}px, 1fr))`,
          gridAutoFlow: 'column',
          minHeight: '100%',
          minWidth: '100%',
        }}
      >
        {plan.slotOwner.map((ownerIdx, slotIndex) => {
          if (ownerIdx == null) {
            return (
              <button
                key={`empty-${slotIndex}`}
                type="button"
                className="vlv-slot vlv-slot--empty"
                onClick={onEmptySlotClick}
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )
          }
          const item = plan.results[ownerIdx]
          const tone = SLOT_COLORS[item.colorIdx % SLOT_COLORS.length]
          const selected = editingItemId === item.id
          return (
            <button
              key={`filled-${slotIndex}`}
              type="button"
              className={`vlv-slot vlv-slot--filled ${selected ? 'vlv-slot--selected' : ''}`}
              style={{ borderColor: tone.fg, backgroundColor: `${tone.bg}cc` }}
              title={item.name}
              onClick={() => onFilledSlotClick(item)}
            >
              <img
                src={resolveCargoVisual(item)}
                alt=""
                className="pointer-events-none h-[58%] w-auto max-w-[80%] object-contain"
              />
              <span
                className="truncate text-[9px] font-bold leading-tight"
                style={{ color: tone.fg }}
              >
                {itemInitials(item.name)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Ruler({ labels, className = '' }) {
  return (
    <div
      className={`flex justify-between px-1 text-[9px] font-semibold text-slate-400 ${className}`}
    >
      {labels.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  )
}

export default function VehicleLoadVisualizer({
  truckKey,
  truck,
  plan,
  plate = '',
  editingItemId,
  onEmptySlotClick,
  onFilledSlotClick,
  zoom = 1,
  onZoomChange,
}) {
  const views = resolveVehicleViews(truckKey)
  const cell = Math.round(48 * zoom)
  const lengthCm = Number(truck?.L) || 300
  const widthCm = Number(truck?.W) || 170
  const lengthTicks = [0, Math.round(lengthCm / 2), lengthCm]
  const widthTicks = [0, Math.round(widthCm / 2), widthCm]

  function bumpZoom(delta) {
    if (!onZoomChange) return
    onZoomChange((value) => Math.min(1.8, Math.max(0.7, +(Number(value) + delta).toFixed(1))))
  }

  return (
    <div className="vlv space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <ViewChrome
          title="Arka Görünüm"
          onZoomIn={() => bumpZoom(0.15)}
          onZoomOut={() => bumpZoom(-0.15)}
        >
          <PhotoStage src={views.rear} alt="Araç arka görünüm" plate={plate || undefined}>
            <CargoOverlayStack results={plan.results} />
          </PhotoStage>
        </ViewChrome>

        <ViewChrome
          title="Yan Görünüm"
          onZoomIn={() => bumpZoom(0.15)}
          onZoomOut={() => bumpZoom(-0.15)}
        >
          <PhotoStage src={views.side} alt="Araç yan görünüm">
            <SideCargoOverlay results={plan.results} />
            <div className="absolute inset-x-3 bottom-1 z-10">
              <Ruler labels={lengthTicks.map((n) => `${n}`)} />
            </div>
          </PhotoStage>
        </ViewChrome>
      </div>

      <ViewChrome
        title="Üstten Görünüm"
        onZoomIn={() => bumpZoom(0.15)}
        onZoomOut={() => bumpZoom(-0.15)}
      >
        <div className="relative min-h-[260px] w-full lg:min-h-[320px]">
          <img
            src={views.top}
            alt="Araç üstten görünüm"
            className="absolute inset-0 h-full w-full object-contain object-center"
          />
          <TopGrid
            plan={plan}
            cell={cell}
            editingItemId={editingItemId}
            onEmptySlotClick={onEmptySlotClick}
            onFilledSlotClick={onFilledSlotClick}
          />
          <div className="absolute inset-x-8 bottom-1 z-10">
            <Ruler labels={lengthTicks.map((n) => `${n} cm`)} />
          </div>
          <div className="absolute bottom-8 right-2 top-8 z-10 flex w-6 flex-col justify-between text-[9px] font-semibold text-slate-400">
            {widthTicks
              .slice()
              .reverse()
              .map((n) => (
                <span key={n} className="writing-vertical">
                  {n}
                </span>
              ))}
          </div>
        </div>
      </ViewChrome>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5">
        <LegendSwatch tone="empty" label="Boş Slot" hint="Kullanılabilir alan" />
        <LegendSwatch tone="selected" label="Seçili Yük" hint="Yerleştirilecek yük" />
        <LegendSwatch tone="placed" label="Yerleştirilen Yük" hint="Sabitlenmiş yük" icon="check" />
        <LegendSwatch tone="blocked" label="Engel / Boşluk" hint="Kullanılamayan alan" />
        <span className={`ml-auto ${YF_TEXT_CLASS} !text-[12px]`}>
          {plan.totalSlotsUsed}/{plan.totalSlots} slot · {fmtKg(plan.totalWeight)} kg
        </span>
      </div>
    </div>
  )
}

function LegendSwatch({ tone, label, hint, icon }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`vlv-legend vlv-legend--${tone}`}>
        {icon === 'check' ? (
          <Check className="h-3 w-3" strokeWidth={3} />
        ) : (
          <Plus className="h-3 w-3" />
        )}
      </span>
      <div className="min-w-0">
        <p className={`${YF_TEXT_CLASS} !font-bold !text-[12px] !text-[var(--ink)]`}>{label}</p>
        <p className={`${YF_TEXT_CLASS} !text-[11px]`}>{hint}</p>
      </div>
    </div>
  )
}
