import { useRef, useState } from 'react'
import { Camera, Pencil, Trash2 } from 'lucide-react'
import { PhotoLightbox } from './ProductionLineItemStagePhotos'
import {
  createStagePhoto,
  normalizeStagePhotos,
  readImageFileAsDataUrl,
  stageAllowsPhotos,
} from '../../utils/productionStagePhotos'

export default function ProductionStagePhotoGallery({
  stageId,
  stageLabel,
  allPhotos = [],
  readOnly = false,
  onPhotosChange,
}) {
  const [preview, setPreview] = useState(null)
  const [replaceId, setReplaceId] = useState(null)
  const fileRef = useRef(null)

  if (!stageAllowsPhotos(stageLabel)) return null

  const normalizedAll = normalizeStagePhotos(allPhotos)
  const photos = normalizedAll.filter((photo) => photo.stageId === stageId)

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
    } catch (error) {
      window.alert(error.message || 'Fotoğraf yüklenemedi.')
    }
  }

  function removePhoto(photoId) {
    if (readOnly || typeof onPhotosChange !== 'function') return
    onPhotosChange(normalizedAll.filter((photo) => photo.id !== photoId))
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-white/60"
          >
            <button
              type="button"
              onClick={() => setPreview(photo)}
              className="h-full w-full"
              title="Önizle"
            >
              <img src={photo.dataUrl} alt="" className="h-full w-full object-cover" />
            </button>
            {!readOnly ? (
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/45 p-1">
                <button
                  type="button"
                  className="rounded p-0.5 text-white hover:bg-white/20"
                  title="Düzenle"
                  onClick={() => {
                    setReplaceId(photo.id)
                    fileRef.current?.click()
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  className="rounded p-0.5 text-white hover:bg-white/20"
                  title="Sil"
                  onClick={() => removePhoto(photo.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ) : null}
          </div>
        ))}

        {!readOnly ? (
          <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--bach-sky,#79a6d2)]/50 bg-[rgba(121,166,210,0.08)] text-[var(--bach-navy,#203375)] transition-colors hover:bg-[rgba(121,166,210,0.14)]">
            <Camera className="h-4 w-4" />
            <span className="px-1 text-center text-[10px] font-bold leading-tight">Fotoğraf Ekle</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                handleFiles(event.target.files, 'append')
                event.target.value = ''
              }}
            />
          </label>
        ) : null}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files, replaceId ? 'replace' : 'append')
          event.target.value = ''
        }}
      />

      <PhotoLightbox photo={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
