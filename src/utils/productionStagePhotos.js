function createPhotoId() {
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function stageAllowsPhotos(stageLabel) {
  return String(stageLabel || '').trim().toLocaleLowerCase('tr-TR') !== 'beklemede'
}

export function normalizeStagePhotos(photos) {
  if (!Array.isArray(photos)) return []
  return photos
    .filter((photo) => photo?.dataUrl)
    .map((photo) => ({
      id: photo.id || createPhotoId(),
      dataUrl: String(photo.dataUrl),
      caption: photo.caption || '',
      stageId: photo.stageId || '',
      stageLabel: photo.stageLabel || '',
      createdAt: photo.createdAt || '',
    }))
}

export function createStagePhoto({ dataUrl, stageId = '', stageLabel = '', caption = '' }) {
  return {
    id: createPhotoId(),
    dataUrl,
    stageId,
    stageLabel,
    caption,
    createdAt: new Date().toLocaleString('tr-TR'),
  }
}

export async function readImageFileAsDataUrl(file) {
  if (!file) return ''
  if (!file.type?.startsWith('image/')) {
    throw new Error('Lütfen geçerli bir görsel dosyası seçin.')
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Görsel okunamadı.'))
    reader.readAsDataURL(file)
  })
}
