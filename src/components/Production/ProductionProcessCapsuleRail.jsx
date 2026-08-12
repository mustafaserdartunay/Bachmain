import { useRef, useState } from 'react'
import { ImagePlus, Pencil, Trash2 } from 'lucide-react'
import {
  COP_KUTUSU_BUTTON_CLASS,
  COP_KUTUSU_ICON_CLASS,
  KALEM_BUTTON_CLASS,
  KALEM_ICON_CLASS,
} from '../../utils/buttonStyles'
import { splitQuantityRowDateTime } from '../../utils/productionLineItems'

const STAGE_FILLS = [
  '#3b82f6',
  '#10b981',
  '#ff5e62',
  '#2563eb',
  '#ea580c',
  '#8b5cf6',
  '#e11d48',
  '#60a5fa',
]

function resolveKind(step) {
  if (step.isCancelled) return 'cancel'
  if (step.isError) return 'error'
  if (step.isActive) return 'active'
  if (step.isComplete) return 'done'
  return 'pending'
}

function statusLabel(kind) {
  if (kind === 'cancel') return 'İptal'
  if (kind === 'error') return 'Problem'
  if (kind === 'active') return 'Devam Ediyor'
  if (kind === 'done') return 'Tamamlandı'
  return 'Beklemede'
}

/**
 * Process rail with stage photos — hover shows design-system edit / delete.
 * Add button only when the stage has no photos yet.
 */
export default function ProductionProcessCapsuleRail({
  steps = [],
  stagePhotos = [],
  readOnly = false,
  onStageClick,
  onAddPhotos,
  onReplacePhoto,
  onDeletePhoto,
}) {
  const addRefs = useRef({})
  const replaceRefs = useRef({})
  const [hoveredPhotoId, setHoveredPhotoId] = useState(null)

  if (!steps.length) {
    return (
      <p className="text-[12px] font-semibold text-[var(--muted,#94A3B8)]">Süreç tanımlı değil</p>
    )
  }

  return (
    <div
      className="min-w-0 flex-1 overflow-x-auto overflow-y-visible px-1 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="list"
      aria-label="Üretim süreç adımları"
    >
      <div
        className="mx-auto grid min-w-max gap-0 px-2"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(7.75rem, 1fr))` }}
      >
        {steps.map((step, index) => {
          const kind = resolveKind(step)
          const fill = STAGE_FILLS[index % STAGE_FILLS.length]
          const nextFill = STAGE_FILLS[(index + 1) % STAGE_FILLS.length]
          const isActive = kind === 'active'
          const isDone = kind === 'done'
          const isPending = kind === 'pending'
          const prevVisited =
            index > 0 && (Boolean(steps[index - 1]?.isComplete) || Boolean(steps[index - 1]?.isActive))
          const clickable = !readOnly && typeof onStageClick === 'function'
          const nextVisited =
            Boolean(steps[index + 1]?.isComplete) || Boolean(steps[index + 1]?.isActive) || isActive
          const photos = (stagePhotos || []).filter((photo) => photo.stageId === step.id)
          const canAddPhoto = !readOnly && typeof onAddPhotos === 'function' && photos.length === 0
          const canEditPhoto = !readOnly && typeof onReplacePhoto === 'function'
          const canDeletePhoto = !readOnly && typeof onDeletePhoto === 'function'
          const stageStamp = splitQuantityRowDateTime(step.stageAt)

          return (
            <div
              key={step.id || `${step.label}-${index}`}
              className="relative flex min-w-0 flex-col items-center px-1 py-1"
              role="listitem"
            >
              {index < steps.length - 1 ? (
                <span
                  className={`prod-process-connector absolute left-1/2 top-[18px] z-0 h-[2px] w-full ${
                    isDone || isActive || prevVisited ? 'prod-process-connector-live' : ''
                  }`}
                  style={{
                    background:
                      isDone || isActive || prevVisited
                        ? `linear-gradient(90deg, ${fill}, ${nextFill}${nextVisited ? '' : '88'})`
                        : 'var(--border, #E2E8F0)',
                  }}
                  aria-hidden
                />
              ) : null}
              {index > 0 ? (
                <span
                  className="absolute right-1/2 top-[18px] z-0 h-[2px] w-1/2"
                  style={{
                    background: prevVisited || isDone || isActive ? fill : 'var(--border, #E2E8F0)',
                    opacity: prevVisited || isDone || isActive ? 1 : 0.75,
                  }}
                  aria-hidden
                />
              ) : null}

              <button
                type="button"
                disabled={!clickable}
                title={`${step.label} — ${statusLabel(kind)}`}
                onClick={() => onStageClick?.(step.id)}
                className={`group relative z-[1] flex w-full flex-col items-center gap-1.5 ${
                  clickable ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <span
                  className={`prod-process-dot relative flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-black transition-all duration-300 ${
                    clickable ? 'group-hover:scale-110' : ''
                  } ${
                    isPending
                      ? 'border-2 border-[var(--border,#CBD5E1)] bg-white text-[var(--muted,#94A3B8)]'
                      : 'text-white shadow-[0_4px_14px_rgba(15,23,42,0.14)]'
                  } ${isActive ? 'prod-process-dot-active ring-[3px] ring-blue-100/90' : ''} ${
                    isDone ? 'prod-process-dot-done' : ''
                  }`}
                  style={isPending ? undefined : { background: isActive ? undefined : fill }}
                >
                  {index + 1}
                  {isActive ? (
                    <span
                      className="prod-process-dot-pulse pointer-events-none absolute inset-0 rounded-full"
                      aria-hidden
                    />
                  ) : null}
                </span>

                <span
                  className={`w-full px-0.5 text-center text-[10px] font-bold leading-snug ${
                    isActive
                      ? 'text-[#2563eb]'
                      : isDone
                        ? 'text-[var(--ink,#0F172A)]'
                        : 'text-[var(--muted,#64748B)]'
                  }`}
                >
                  {step.label}
                </span>
                {stageStamp.date ? (
                  <span className="flex flex-col items-center gap-0 leading-tight">
                    <span className="text-[10px] font-bold tabular-nums text-[var(--muted,#64748B)]">
                      {stageStamp.date}
                    </span>
                    {stageStamp.time ? (
                      <span className="text-[9px] font-semibold tabular-nums text-[var(--muted,#94A3B8)]">
                        {stageStamp.time}
                      </span>
                    ) : null}
                    {step.stageActor ? (
                      <span
                        className="mt-0.5 max-w-full truncate px-0.5 text-[9px] font-semibold text-[var(--muted,#64748B)]"
                        title={step.stageActor}
                      >
                        {step.stageActor}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </button>

              <div className="relative z-[1] mt-2 flex w-full flex-col items-center gap-1.5">
                {photos.length > 0 ? (
                  <div className="flex w-full flex-col items-center gap-1.5">
                    {photos.slice(0, 3).map((photo) => {
                      const actionsOpen = hoveredPhotoId === photo.id
                      return (
                      <div
                        key={photo.id}
                        className="relative mx-auto flex h-14 w-[7.5rem] items-center justify-center"
                        onMouseEnter={() => setHoveredPhotoId(photo.id)}
                        onMouseLeave={() => setHoveredPhotoId(null)}
                      >
                        {!readOnly && canEditPhoto ? (
                          <span
                            className={`absolute left-0 top-1/2 z-[2] -translate-y-1/2 transition-opacity duration-150 ${
                              actionsOpen
                                ? 'pointer-events-auto opacity-100'
                                : 'pointer-events-none opacity-0'
                            }`}
                          >
                            <button
                              type="button"
                              className={KALEM_BUTTON_CLASS}
                              title="Fotoğrafı düzenle"
                              aria-label="Fotoğrafı düzenle"
                              tabIndex={actionsOpen ? 0 : -1}
                              onClick={(event) => {
                                event.stopPropagation()
                                replaceRefs.current[photo.id]?.click()
                              }}
                            >
                              <Pencil className={KALEM_ICON_CLASS} strokeWidth={2.25} />
                            </button>
                          </span>
                        ) : null}

                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--ds-surface-muted,#F8FAFC)] ring-1 ring-[var(--border,#E2E8F0)] shadow-sm">
                          <img
                            src={photo.dataUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {!readOnly && canDeletePhoto ? (
                          <span
                            className={`absolute right-0 top-1/2 z-[2] -translate-y-1/2 transition-opacity duration-150 ${
                              actionsOpen
                                ? 'pointer-events-auto opacity-100'
                                : 'pointer-events-none opacity-0'
                            }`}
                          >
                            <button
                              type="button"
                              className={COP_KUTUSU_BUTTON_CLASS}
                              title="Fotoğrafı sil"
                              aria-label="Fotoğrafı sil"
                              tabIndex={actionsOpen ? 0 : -1}
                              onClick={(event) => {
                                event.stopPropagation()
                                onDeletePhoto?.(photo)
                              }}
                            >
                              <Trash2 className={COP_KUTUSU_ICON_CLASS} strokeWidth={2.25} />
                            </button>
                          </span>
                        ) : null}

                        <input
                          ref={(node) => {
                            replaceRefs.current[photo.id] = node
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={!canEditPhoto}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) onReplacePhoto?.(photo, file)
                            event.target.value = ''
                          }}
                        />
                      </div>
                      )
                    })}
                    {photos.length > 3 ? (
                      <span className="text-[10px] font-bold tabular-nums text-[var(--muted,#64748B)]">
                        +{photos.length - 3}
                      </span>
                    ) : null}
                  </div>
                ) : canAddPhoto ? (
                  <>
                    <button
                      type="button"
                      onClick={() => addRefs.current[step.id]?.click()}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border,#E2E8F0)] bg-white text-[var(--muted,#64748B)] shadow-sm transition hover:border-blue-300 hover:text-[var(--accent,#2563EB)]"
                      title={`${step.label} — fotoğraf ekle`}
                      aria-label={`${step.label} fotoğraf ekle`}
                    >
                      <ImagePlus className="h-4 w-4" />
                    </button>
                    <input
                      ref={(node) => {
                        addRefs.current[step.id] = node
                      }}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        onAddPhotos?.(step, event.target.files)
                        event.target.value = ''
                      }}
                    />
                  </>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { STAGE_FILLS }
