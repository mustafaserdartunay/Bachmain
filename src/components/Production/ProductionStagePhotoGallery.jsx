import { useRef, useState } from 'react'
import { Camera, Eye, Pencil, Trash2 } from 'lucide-react'
import { PhotoLightbox } from './ProductionLineItemStagePhotos'
import {
  createStagePhoto,
  normalizeStagePhotos,
  readImageFileAsDataUrl,
} from '../../utils/productionStagePhotos'

/**
 * Mockup photo block — always available on process cards.
 * Large square preview + Eye / Camera / Edit / Delete under image.
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
  const fileRef = useRef(null)
  const addRef = useRef(null)

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

  return (
    <div className="space-y-2">
      {activePhoto ? (
        <button
          type="button"
          onClick={() => setPreview(activePhoto)}
          className="relative h-[128px] w-full overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-[#F1F5F9]"
          title="Fotoğrafı görüntüle"
        >
          <img src={activePhoto.dataUrl} alt={stageLabel || 'Süreç fotoğrafı'} className="h-full w-full object-cover" />
          {photos.length > 1 ? (
            <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-black text-white">
              {safeIndex + 1}/{photos.length}
            </span>
          ) : null}
        </button>
      ) : (
        <label
          className={`flex h-[128px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-[#94A3B8] transition-colors hover:border-[#79a6d2] hover:bg-[#EFF6FF] hover:text-[#1E3A8A] ${
            readOnly ? 'pointer-events-none opacity-60' : ''
          }`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#E2E8F0]">
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
              className={`h-1.5 w-1.5 rounded-full ${
                index === safeIndex ? 'bg-[#3B82F6]' : 'bg-[#CBD5E1]'
              }`}
              aria-label={`Fotoğraf ${index + 1}`}
            />
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={!activePhoto}
          onClick={() => activePhoto && setPreview(activePhoto)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#2563EB] disabled:opacity-30"
          title="Görüntüle"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        {!readOnly ? (
          <>
            <button
              type="button"
              onClick={() => addRef.current?.click()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#2563EB]"
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
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#2563EB] disabled:opacity-30"
              title="Düzenle"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={!activePhoto}
              onClick={removeActivePhoto}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#DC2626] disabled:opacity-30"
              title="Sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        ) : null}
      </div>

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
