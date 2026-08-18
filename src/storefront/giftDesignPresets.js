export const GIFT_FONT_PRESETS = [
  {
    id: 'poppins',
    label: 'Poppins',
    hint: 'Mevcut — extra bold başlık',
    sample: 'More Than a Gift',
    body: 'Poppins, ui-sans-serif, system-ui, sans-serif',
    display: 'Poppins, ui-sans-serif, system-ui, sans-serif',
  },
  {
    id: 'playfair',
    label: 'Playfair',
    hint: 'Serif başlık, Poppins gövde',
    sample: 'More Than a Gift',
    body: 'Poppins, ui-sans-serif, system-ui, sans-serif',
    display: '"Playfair Display", Georgia, serif',
  },
  {
    id: 'inter',
    label: 'Inter',
    hint: 'Nötr, ürün vitrini',
    sample: 'More Than a Gift',
    body: 'Inter, ui-sans-serif, system-ui, sans-serif',
    display: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  {
    id: 'cormorant',
    label: 'Cormorant',
    hint: 'Lüks serif başlık',
    sample: 'More Than a Gift',
    body: 'Poppins, ui-sans-serif, system-ui, sans-serif',
    display: '"Cormorant Garamond", Georgia, serif',
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    hint: 'Geometrik sans',
    sample: 'More Than a Gift',
    body: 'Montserrat, ui-sans-serif, system-ui, sans-serif',
    display: 'Montserrat, ui-sans-serif, system-ui, sans-serif',
  },
  {
    id: 'fraunces',
    label: 'Fraunces',
    hint: 'Editorial, yumuşak serif',
    sample: 'More Than a Gift',
    body: 'Poppins, ui-sans-serif, system-ui, sans-serif',
    display: 'Fraunces, Georgia, serif',
  },
]

export const GIFT_BANNER_PRESETS = [
  {
    id: 'classic',
    label: 'Klasik örtü',
    hint: 'Sol alt metin, koyu gradient',
  },
  {
    id: 'center',
    label: 'Sinematik orta',
    hint: 'Ortalanmış başlık ve CTA',
  },
  {
    id: 'split',
    label: 'İkili sahne',
    hint: 'Fotoğraf + krem yazı paneli',
  },
  {
    id: 'light',
    label: 'Açık krem',
    hint: 'Açık overlay, lacivert yazı',
  },
  {
    id: 'magazine',
    label: 'Magazin',
    hint: 'Büyük punto, alt bant',
  },
  {
    id: 'frame',
    label: 'Latte çerçeve',
    hint: 'İç çerçeve, yumuşak sahne',
  },
]

export const GIFT_DESIGN_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Fraunces:wght@700;800&family=Inter:wght@400;700;800&family=Montserrat:wght@400;700;800&family=Playfair+Display:wght@700;800&family=Poppins:wght@400;700;800&display=swap'

export const DEFAULT_GIFT_DESIGN = {
  fontId: 'poppins',
  bannerId: 'classic',
}

export const GIFT_EDITOR_BLOCKS = [
  { id: 'header', label: 'Üst bar', accepts: ['font'] },
  { id: 'shortcuts', label: 'Kısayollar', accepts: ['font'] },
  { id: 'hero', label: 'Banner slayt', accepts: ['banner', 'font'] },
  { id: 'gallery', label: 'Ürün galerisi', accepts: ['font'] },
  { id: 'lottery', label: 'Çekiliş', accepts: ['font'] },
  { id: 'instagram', label: 'Instagram', accepts: ['font'] },
  { id: 'story', label: 'Marka hikâyesi', accepts: ['font'] },
  { id: 'footer', label: 'Footer', accepts: ['font'] },
]

export function normalizeGiftDesign(design) {
  const fontIds = GIFT_FONT_PRESETS.map((item) => item.id)
  const bannerIds = GIFT_BANNER_PRESETS.map((item) => item.id)
  const fontId = fontIds.includes(design && design.fontId) ? design.fontId : DEFAULT_GIFT_DESIGN.fontId
  const bannerId = bannerIds.includes(design && design.bannerId) ? design.bannerId : DEFAULT_GIFT_DESIGN.bannerId
  return { fontId, bannerId }
}

export function parseDesignModule(raw) {
  const text = String(raw || '')
  if (text.startsWith('font:')) return { kind: 'font', id: text.slice(5) }
  if (text.startsWith('banner:')) return { kind: 'banner', id: text.slice(7) }
  return null
}
