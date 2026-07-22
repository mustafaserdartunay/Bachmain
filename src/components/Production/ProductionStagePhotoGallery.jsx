import { useRef, useState } from 'react'
import { Camera, Eye, Pencil, Trash2 } from 'lucide-react'
import { PhotoLightbox } from './ProductionLineItemStagePhotos'
import {
  createStagePhoto,
  normalizeStagePhotos,
  readImageFileAsDataUrl,
} from '../../utils/productionStagePhotos'

async function readFileAsDataUrl(file) {
  if (file.type.startsWith('image/')) return readImageFileAsDataUrl(file)
  if (file.type.startsWith('video/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Video okunamadı.'))
      reader.readAsDataURL(file)
    })
  }
  throw new Error('Desteklenmeyen dosya türü.')
}

/**
 * Stage media block — drag & drop, multi upload, lightbox.
 */
export default function ProductionStagePhotoGallery({
  stageId,
  stageLabel,
  allPhotos = [],
  readOnly = false,
  onPhotosChange,
}) {
  const [preview, setPreview] = useState(null)
  const [replaceId, setReplaceId] = useState(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)
  const addRef = useRef(null)

  const normalizedAll = normalizeStagePhotos(allPhotos)
  const photos = normalizedAll.filter((photo) => photo.stageId === stageId)
  const safeIndex = photos.length ? Math.min(slideIndex, photos.length - 1) : 0
  const activePhoto = photos[safeIndex] || null
  const inputId = `prod-stage-cam-${stageId}`

  async function handleFiles(fileList, mode = 'append') {
    const files = Array.from(fileList || []).filter(
      (file) => file.type.startsWith('image/') || file.type.startsWith('video/'),
    )
    if (!files.length || readOnly || typeof onPhotosChange !== 'function') return
    try {
      if (mode === 'replace' && replaceId) {
        const dataUrl = await readFileAsDataUrl(files[0])
        onPhotosChange(
          normalizedAll.map((photo) =>
            photo.id === replaceId
              ? {
                  ...photo,
                  dataUrl,
                  mimeType: files[0].type,
                  createdAt: new Date().toLocaleString('tr-TR'),
                }
              : photo,
          ),
        )
        setReplaceId(null)
        return
      }
      const created = []
      for (const file of files) {
        const dataUrl = await readFileAsDataUrl(file)
        created.push(
          createStagePhoto({
            dataUrl,
            stageId,
            stageLabel,
            caption: file.type.startsWith('video/') ? 'Video' : '',
          }),
        )
      }
      onPhotosChange([...normalizedAll, ...created])
      setSlideIndex(photos.length + created.length - 1)
    } catch (error) {
      window.alert(error.message || 'Medya yüklenemedi.')
    }
  }

  function removeActivePhoto() {
    if (!activePhoto || readOnly || typeof onPhotosChange !== 'function') return
    onPhotosChange(normalizedAll.filter((photo) => photo.id !== activePhoto.id))
    setSlideIndex((current) => Math.max(0, current - 1))
  }

  const dropHandlers = readOnly
    ? {}
    : {
        onDragEnter: (event) => {
          event.preventDefault()
          setDragging(true)
        },
        onDragOver: (event) => {
          event.preventDefault()
          setDragging(true)
        },
        onDragLeave: () => setDragging(false),
        onDrop: (event) => {
          event.preventDefault()
          setDragging(false)
          handleFiles(event.dataTransfer?.files, 'append')
        },
      }

  return (
    <div className="space-y-2">
      {activePhoto ? (
        <button
          type="button"
          onClick={() => setPreview(activePhoto)}
          className="relative h-[128px] w-full overflow-hidden rounded-[12px] border border-[var(--border,#E2E8F0)] bg-[var(--surface-raised,#F1F5F9)] transition hover:scale-[1.01]"
          title="Görüntüle"
          {...dropHandlers}
        >
          {String(activePhoto.caption || '').includes('Video') ||
          String(activePhoto.mimeType || '').startsWith('video/') ? (
            <video src={activePhoto.dataUrl} className="h-full w-full object-cover" muted />
          ) : (
            <img
              src={activePhoto.dataUrl}
              alt={stageLabel || 'Süreç fotoğrafı'}
              className="h-full w-full object-cover transition duration-300 hover:scale-105"
            />
          )}
          {photos.length > 1 ? (
            <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-black text-white">
              {safeIndex + 1}/{photos.length}
            </span>
          ) : null}
        </button>
      ) : (
        <label
          htmlFor={inputId}
          className={`flex h-[128px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed text-[var(--muted,#94A3B8)] transition-colors ${
            dragging
              ? 'border-blue-400 bg-blue-50 text-blue-700'
              : 'border-[var(--border,#CBD5E1)] bg-[var(--surface-raised,#F8FAFC)] hover:border-[color-mix(in_srgb,var(--accent)_50%,#CBD5E1)] hover:bg-blue-50/60 hover:text-[var(--bach-navy,#1E3A8A)]'
          } ${readOnly ? 'pointer-events-none opacity-60' : ''}`}
          {...dropHandlers}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[var(--border,#E2E8F0)]">
            <Camera className="h-5 w-5" />
          </span>
          <span className="text-[12px] font-bold">Fotoğraf Ekle</span>
          <span className="text-[10px] font-semibold opacity-70">
            Sürükle bırak · video destekli
          </span>
        </label>
      )}

      {photos.length > 1 ? (
        <div className="flex justify-center gap-1">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSlideIndex(index)}
              className={`h-1.5 w-1.5 rounded-full ${
                index === safeIndex ? 'bg-[var(--accent,#3B82F6)]' : 'bg-[var(--border,#CBD5E1)]'
              }`}
              aria-label={`Medya ${index + 1}`}
            />
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={!activePhoto}
          onClick={() => activePhoto && setPreview(activePhoto)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border,#E2E8F0)] bg-white text-[var(--muted,#64748B)] transition hover:scale-110 hover:text-blue-600 disabled:opacity-30"
          title="Görüntüle"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        {!readOnly ? (
          <>
            <button
              type="button"
              onClick={() => addRef.current?.click()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border,#E2E8F0)] bg-white text-[var(--muted,#64748B)] transition hover:scale-110 hover:text-blue-600"
              title="Fotoğraf / video ekle"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={!activePhoto}
              onClick={() => {
                if (!activePhoto) return
                setReplaceId(activePhoto.id)
                fileRef.current?.click()
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border,#E2E8F0)] bg-white text-[var(--muted,#64748B)] transition hover:scale-110 hover:text-blue-600 disabled:opacity-30"
              title="Düzenle"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={!activePhoto}
              onClick={removeActivePhoto}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border,#E2E8F0)] bg-white text-[var(--muted,#64748B)] transition hover:scale-110 hover:text-red-600 disabled:opacity-30"
              title="Sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        ) : null}
      </div>

      <input
        id={inputId}
        ref={addRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files, 'append')
          event.target.value = ''
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files, 'replace')
          event.target.value = ''
        }}
      />

      <PhotoLightbox photo={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
