import { useMemo, useRef, useState } from 'react'
import { Camera, ImagePlus, Settings2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { HEADER_ACTION_GRADIENTS } from '../Layout/HeaderCashActionsPanel'
import ProductionStagePhotoGallery from './ProductionStagePhotoGallery'
import {
  createStagePhoto,
  normalizeStagePhotos,
  readImageFileAsDataUrl,
} from '../../utils/productionStagePhotos'

/** Solid brand fills cycling like header CTAs */
const STAGE_FILLS = [
  '#3b82f6', // cash / primary blue
  '#10b981', // success
  '#ff5e62', // expense
  '#2563eb', // primary
  '#ea580c', // amber
  '#8b5cf6', // violet
  '#e11d48', // danger
  '#60a5fa',
]

function resolveStatus(step) {
  if (step.isCancelled) return { label: 'İptal', kind: 'cancel' }
  if (step.isError) return { label: 'Problem', kind: 'error' }
  if (step.isActive) return { label: 'Devam Ediyor', kind: 'active' }
  if (step.isComplete) return { label: 'Tamamlandı', kind: 'done' }
  return { label: 'Beklemede', kind: 'pending' }
}

function countPhotos(photos, stageId) {
  return photos.filter((photo) => photo.stageId === stageId).length
}

/**
 * Minimal horizontal process stepper (reference style) + photo strip under stages.
 */
export default function ProductionProcessStageBar({
  steps = [],
  stagePhotos = [],
  readOnly = false,
  onStageClick,
  onPhotosChange,
  showEditLink = true,
  showPhotoStrip = true,
  showActiveGallery = false,
}) {
  const navigate = useNavigate()
  const fileRefs = useRef({})
  const [focusStageId, setFocusStageId] = useState(null)
  const normalizedPhotos = useMemo(() => normalizeStagePhotos(stagePhotos), [stagePhotos])

  const activeStep =
    steps.find((step) => step.id === focusStageId) ||
    steps.find((step) => step.isActive) ||
    steps.find((step) => step.isComplete && !steps[steps.indexOf(step) + 1]?.isComplete) ||
    steps[0]

  if (!steps.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border,#CBD5E1)] px-4 py-6 text-center">
        <p className="text-[13px] font-semibold text-[var(--muted,#64748B)]">
          Henüz üretim süreci tanımlanmamış.
        </p>
        {showEditLink ? (
          <button
            type="button"
            onClick={() => navigate('/ayarlar/etiketler')}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br px-3 py-2 text-[12px] font-bold text-white shadow-sm from-[#93c5fd] via-[#3b82f6] to-[#2563eb]"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Süreçleri Düzenle
          </button>
        ) : null}
      </div>
    )
  }

  async function handleFiles(step, fileList) {
    if (readOnly || typeof onPhotosChange !== 'function') return
    const files = Array.from(fileList || []).filter((file) => file.type?.startsWith('image/'))
    if (!files.length) return
    try {
      const created = []
      for (const file of files) {
        const dataUrl = await readImageFileAsDataUrl(file)
        created.push(
          createStagePhoto({
            dataUrl,
            stageId: step.id,
            stageLabel: step.label,
          }),
        )
      }
      onPhotosChange([...normalizedPhotos, ...created])
    } catch (error) {
      window.alert(error?.message || 'Görsel yüklenemedi.')
    }
  }

  return (
    <div className="w-full space-y-4">
      {showEditLink ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/ayarlar/etiketler')}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--muted,#94A3B8)] hover:text-[var(--accent,#2563EB)]"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Süreçleri düzenle
          </button>
        </div>
      ) : null}

      <div
        className="w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        aria-label="Üretim süreçleri"
      >
        <div
          className="mx-auto grid min-w-[640px] gap-0 px-2"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((step, index) => {
            const status = resolveStatus(step)
            const fill = STAGE_FILLS[index % STAGE_FILLS.length]
            const isDone = status.kind === 'done'
            const isActive = status.kind === 'active'
            const isPending = status.kind === 'pending'
            const prevDone = index > 0 && Boolean(steps[index - 1]?.isComplete)
            const clickable = !readOnly && typeof onStageClick === 'function'
            const photoCount = countPhotos(normalizedPhotos, step.id)

            return (
              <div
                key={step.id || `${step.label}-${index}`}
                className="relative flex min-w-0 flex-col items-center px-1"
                role="listitem"
              >
                {/* connector line behind circles */}
                {index < steps.length - 1 ? (
                  <span
                    className="absolute left-1/2 top-[15px] z-0 h-[2px] w-full"
                    style={{
                      background:
                        isDone || (isActive && prevDone)
                          ? `linear-gradient(90deg, ${fill}, ${STAGE_FILLS[(index + 1) % STAGE_FILLS.length]}${steps[index + 1]?.isComplete || steps[index + 1]?.isActive ? '' : '55'})`
                          : isDone
                            ? fill
                            : 'var(--border, #E2E8F0)',
                    }}
                    aria-hidden
                  />
                ) : null}
                {index > 0 ? (
                  <span
                    className="absolute right-1/2 top-[15px] z-0 h-[2px] w-1/2"
                    style={{
                      background: prevDone || isDone || isActive ? fill : 'var(--border, #E2E8F0)',
                      opacity: prevDone || isDone || isActive ? 1 : 0.7,
                    }}
                    aria-hidden
                  />
                ) : null}

                <button
                  type="button"
                  disabled={!clickable}
                  title={`${step.label} — ${status.label}`}
                  onClick={() => {
                    setFocusStageId(step.id)
                    onStageClick?.(step.id)
                  }}
                  className={`relative z-[1] flex w-full flex-col items-center gap-1.5 ${
                    clickable ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-black transition-transform duration-200 ${
                      clickable ? 'hover:scale-110' : ''
                    } ${
                      isPending
                        ? 'border-2 border-[var(--border,#CBD5E1)] bg-white text-[var(--muted,#94A3B8)]'
                        : 'text-white shadow-[0_4px_12px_rgba(15,23,42,0.12)]'
                    } ${isActive ? 'ring-4 ring-blue-100' : ''}`}
                    style={isPending ? undefined : { background: fill }}
                  >
                    {index + 1}
                  </span>

                  <span className="w-full truncate text-center text-[12px] font-bold text-[var(--ink,#0F172A)]">
                    {step.label}
                  </span>
                  <span
                    className={`text-center text-[11px] font-semibold ${
                      isActive
                        ? 'text-[#3b82f6]'
                        : isDone
                          ? 'text-[var(--muted,#64748B)]'
                          : 'text-[var(--muted,#94A3B8)]'
                    }`}
                  >
                    {status.label}
                  </span>
                  {isActive ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6]" aria-hidden />
                  ) : step.completedAt ? (
                    <span className="text-center text-[10px] font-medium text-[var(--muted,#94A3B8)]">
                      {step.completedAt}
                    </span>
                  ) : (
                    <span className="h-1.5" aria-hidden />
                  )}
                </button>

                {showPhotoStrip ? (
                  <button
                    type="button"
                    disabled={readOnly || typeof onPhotosChange !== 'function'}
                    onClick={() => {
                      setFocusStageId(step.id)
                      fileRefs.current[step.id]?.click()
                    }}
                    className="mt-2 inline-flex items-center gap-1 rounded-full border border-[var(--border,#E2E8F0)] bg-white px-2 py-0.5 text-[10px] font-bold text-[var(--muted,#64748B)] transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-50"
                    title={photoCount ? `${photoCount} fotoğraf` : 'Fotoğraf ekle'}
                  >
                    {photoCount ? (
                      <Camera className="h-3 w-3" />
                    ) : (
                      <ImagePlus className="h-3 w-3" />
                    )}
                    {photoCount || '—'}
                  </button>
                ) : null}

                <input
                  ref={(node) => {
                    fileRefs.current[step.id] = node
                  }}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={readOnly}
                  onChange={(event) => {
                    handleFiles(step, event.target.files)
                    event.target.value = ''
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {showActiveGallery && activeStep ? (
        <div className="rounded-2xl border border-[var(--border,#E2E8F0)] bg-white/80 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[12px] font-bold text-[var(--ink,#0F172A)]">
              {activeStep.label}
              <span className="ml-2 font-semibold text-[var(--muted,#94A3B8)]">fotoğraflar</span>
            </p>
            <span
              className={`rounded-full bg-gradient-to-br px-2.5 py-0.5 text-[10px] font-black text-white ${HEADER_ACTION_GRADIENTS.cash}`}
            >
              {resolveStatus(activeStep).label}
            </span>
          </div>
          <ProductionStagePhotoGallery
            stageId={activeStep.id}
            stageLabel={activeStep.label}
            allPhotos={stagePhotos}
            readOnly={readOnly}
            onPhotosChange={onPhotosChange}
          />
        </div>
      ) : null}
    </div>
  )
}
