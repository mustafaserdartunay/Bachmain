import { useEffect } from 'react'
import { Camera, Trash2, X, ZoomIn } from 'lucide-react'
import {
  createStagePhoto,
  normalizeStagePhotos,
  readImageFileAsDataUrl,
  stageAllowsPhotos,
} from '../../utils/productionStagePhotos'

export function PhotoLightbox({ photo, onClose }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!photo) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-xl border border-white/20 bg-black/50 p-2 text-white hover:bg-black/70"
        aria-label="Kapat"
      >
        <X className="h-5 w-5" />
      </button>
      <div
        className="max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl border border-white/15 bg-dark-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <img
          src={photo.dataUrl}
          alt={photo.caption || photo.stageLabel || 'Üretim fotoğrafı'}
          className="max-h-[78vh] w-full object-contain"
        />
        {(photo.stageLabel || photo.caption || photo.createdAt) && (
          <div className="border-t border-white/10 px-4 py-3 text-center">
            {photo.stageLabel && (
              <p className="text-xs font-black uppercase tracking-wide text-blue-300">{photo.stageLabel}</p>
            )}
            {photo.caption && <p className="mt-1 text-sm font-semibold text-white">{photo.caption}</p>}
            {photo.createdAt && <p className="mt-1 text-[11px] text-gray-400">{photo.createdAt}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export function ProductionStageColumnPhotos({
  stageId,
  stageLabel,
  allPhotos = [],
  readOnly = false,
  theme = 'light',
  compact = false,
  inline = false,
  onPhotosChange,
  onPreview,
}) {
  if (!stageAllowsPhotos(stageLabel)) return null

  const isDark = theme === 'dark'
  const normalizedAll = normalizeStagePhotos(allPhotos)
  const columnPhotos = normalizedAll.filter((photo) => photo.stageId === stageId)
  const photo = columnPhotos[0] || null

  if (readOnly && !photo) return null

  const uploadClass = isDark
    ? 'border-dark-500/50 bg-dark-800/50 text-gray-500 hover:border-blue-500/40 hover:text-blue-300'
    : 'border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-soft)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]'

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || readOnly || typeof onPhotosChange !== 'function' || photo) return
    try {
      const dataUrl = await readImageFileAsDataUrl(file)
      const nextPhoto = createStagePhoto({ dataUrl, stageId, stageLabel })
      const withoutStage = normalizedAll.filter((item) => item.stageId !== stageId)
      onPhotosChange([...withoutStage, nextPhoto])
    } catch (error) {
      window.alert(error.message || 'Fotoğraf yüklenemedi.')
    }
  }

  function handleRemove(event) {
    event.stopPropagation()
    if (readOnly || typeof onPhotosChange !== 'function' || !photo) return
    onPhotosChange(normalizedAll.filter((item) => item.id !== photo.id))
  }

  const tileSize = inline
    ? (compact ? 'h-6 w-6' : 'h-8 w-8')
    : compact ? 'h-7 w-7' : 'h-10 w-10'
  const iconSize = inline
    ? (compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5')
    : compact ? 'h-2.5 w-2.5' : 'h-3 w-3'

  if (inline) {
    const tileClass =
      `flex ${compact ? 'h-6 w-6' : 'h-8 w-8'} shrink-0 items-center justify-center overflow-hidden rounded border p-0`

    return (
      <div
        className={`relative flex ${compact ? 'h-6 w-6' : 'h-8 w-8'} shrink-0 items-center justify-center`}
        onClick={(event) => event.stopPropagation()}
      >
        {photo ? (
          <button
            type="button"
            onClick={() => onPreview?.(photo)}
            className={`${tileClass} transition-all hover:ring-1 ${
              isDark
                ? 'border-white/25 hover:ring-blue-400/50'
                : 'border-[var(--border)] hover:ring-[var(--accent)]/35'
            }`}
            title="Büyüt"
          >
            <img src={photo.dataUrl} alt="" className="h-full w-full object-cover" />
          </button>
        ) : !readOnly ? (
          <label
            className={`${tileClass} cursor-pointer border-dashed border-white/35 bg-black/20 text-white/70 transition-colors hover:border-white/60 hover:bg-black/30 hover:text-white`}
            title={`${stageLabel} fotoğrafı ekle`}
          >
            <Camera className={iconSize} />
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
        ) : null}
        {photo && !readOnly && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -right-0.5 -top-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full border border-red-500/50 bg-dark-900 text-red-300 shadow-sm hover:bg-red-500/20"
            title="Fotoğrafı sil"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`flex w-full flex-col items-center ${compact ? 'gap-0.5' : 'gap-1'}`}>
      {photo ? (
        <>
          <button
            type="button"
            onClick={() => onPreview?.(photo)}
            className={`group relative ${tileSize} overflow-hidden rounded-md border transition-all hover:ring-2 ${
              isDark
                ? 'border-dark-500/50 hover:ring-blue-500/40'
                : 'border-[var(--border)] hover:ring-[var(--accent)]/35'
            }`}
            title="Büyüt"
          >
            <img src={photo.dataUrl} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
              <ZoomIn className={`${iconSize} text-white opacity-0 transition-opacity group-hover:opacity-100`} />
            </span>
          </button>
          {!readOnly && (
            <button
              type="button"
              onClick={handleRemove}
              className={`inline-flex items-center gap-0.5 rounded-md transition-colors ${
                compact ? 'p-0.5' : 'px-1.5 py-0.5 text-[9px] font-bold'
              } ${
                isDark
                  ? 'text-red-300 hover:bg-red-500/10'
                  : 'text-red-600 hover:bg-red-500/10'
              }`}
              title="Fotoğrafı sil"
            >
              <Trash2 className={iconSize} />
              {!compact && 'Sil'}
            </button>
          )}
        </>
      ) : !readOnly ? (
        <label
          className={`flex ${tileSize} cursor-pointer flex-col items-center justify-center rounded-md border border-dashed transition-colors ${uploadClass}`}
          title={`${stageLabel} fotoğrafı ekle`}
        >
          <Camera className={iconSize} />
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      ) : (
        compact ? <div className={tileSize} aria-hidden /> : null
      )}
    </div>
  )
}
