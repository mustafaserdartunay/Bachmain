import { useRef, useState } from 'react'
import { Camera, Pencil, Trash2, ZoomIn } from 'lucide-react'
import { PhotoLightbox } from './ProductionLineItemStagePhotos'
import {
  createStagePhoto,
  normalizeStagePhotos,
  readImageFileAsDataUrl,
  stageAllowsPhotos,
} from '../../utils/productionStagePhotos'

/**
 * Mockup-style stage photo block:
 * - Large preview (or dashed "Fotoğraf ekle")
 * - Camera / Edit / Delete row under the image
 * - Multiple photos supported (count badge + append)
 */
export default function ProductionStagePhotoGallery({
  stageId,
  stageLabel,
  allPhotos = [],
  readOnly = false,
  onPhotosChange,
  compactCard = false,
}) {
  const [preview, setPreview] = useState(null)
  const [replaceId, setReplaceId] = useState(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const fileRef = useRef(null)
  const addRef = useRef(null)

  if (!stageAllowsPhotos(stageLabel)) return null

  const normalizedAll = normalizeStagePhotos(allPhotos)
  const photos = normalizedAll.filter((photo) => photo.stageId === stageId)
  const safeIndex = photos.length ? Math.min(slideIndex, photos.length - 1) : 0
  const activePhoto = photos[safeIndex] || null

  async function handleFiles(fileList, mode = 'append') {
    const file = fileList?.[0]
    if (!file || readOnly || typeof onPhotosChange !== 'function') return
    try {
      const dataUrl = await readImageFileAsDataUrl(file)
      if (mode === 'replace' && replaceId) {
        onPhotosChange(normalizedAll.map((photo) => (
          photo.id === replaceId
            ? { ...photo, dataUrl, createdAt: new Date().toLocaleString('tr-TR') }
            : photo
        )))
        setReplaceId(null)
        return
      }
      const nextPhoto = createStagePhoto({ dataUrl, stageId, stageLabel })
      onPhotosChange([...normalizedAll, nextPhoto])
      setSlideIndex(photos.length)
    } catch (error) {
      window.alert(error.message || 'Fotoğraf yüklenemedi.')
    }
  }

  function removeActivePhoto() {
    if (!activePhoto || readOnly || typeof onPhotosChange !== 'function') return
    onPhotosChange(normalizedAll.filter((photo) => photo.id !== activePhoto.id))
    setSlideIndex((current) => Math.max(0, current - 1))
  }

  const frameClass = compactCard
    ? 'h-[120px] w-full'
    : 'h-[140px] w-full'

  return (
    <div className="space-y-2">
      {activePhoto ? (
        <button
          type="button"
          onClick={() => setPreview(activePhoto)}
          className={`group relative ${frameClass} overflow-hidden rounded-xl border border-[rgba(140,145,165,0.22)] bg-[#f4f6f8]`}
          title="Büyüt"
        >
          <img src={activePhoto.dataUrl} alt="" className="h-full w-full object-cover" />
          {photos.length > 1 ? (
            <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-black text-white">
              {safeIndex + 1}/{photos.length}
            </span>
          ) : null}
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
            <ZoomIn className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
        </button>
      ) : (
        <label
          className={`flex ${frameClass} cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(140,145,165,0.35)] bg-[#f7f8fa] text-[var(--muted)] transition-colors hover:border-[var(--bach-sky,#79a6d2)]/50 hover:bg-[rgba(121,166,210,0.06)] hover:text-[var(--bach-navy,#203375)] ${
            readOnly ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[rgba(140,145,165,0.18)]">
            <Camera className="h-5 w-5" />
          </span>
          <span className="text-[12px] font-bold">Fotoğraf ekle</span>
          {!readOnly ? (
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                handleFiles(event.target.files, 'append')
                event.target.value = ''
              }}
            />
          ) : null}
        </label>
      )}

      {photos.length > 1 ? (
        <div className="flex justify-center gap-1">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSlideIndex(index)}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                index === safeIndex ? 'bg-[var(--bach-sky,#79a6d2)]' : 'bg-[rgba(140,145,165,0.35)]'
              }`}
              aria-label={`Fotoğraf ${index + 1}`}
            />
          ))}
        </div>
      ) : null}

      {!readOnly ? (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => addRef.current?.click()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(140,145,165,0.22)] bg-white text-[var(--muted)] transition-colors hover:border-blue-400/40 hover:text-blue-600"
            title="Fotoğraf ekle"
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(140,145,165,0.22)] bg-white text-[var(--muted)] transition-colors hover:border-blue-400/40 hover:text-blue-600 disabled:opacity-35"
            title="Fotoğraf düzenle"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!activePhoto}
            onClick={removeActivePhoto}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(140,145,165,0.22)] bg-white text-[var(--muted)] transition-colors hover:border-red-400/40 hover:text-red-500 disabled:opacity-35"
            title="Fotoğraf sil"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <input
        ref={addRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files, 'append')
          event.target.value = ''
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
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
