/** Thermal / label size presets (mm). */

export const LABEL_SIZE_PRESETS = [
  { id: '30x20', label: '30×20 mm', widthMm: 30, heightMm: 20 },
  { id: '40x30', label: '40×30 mm', widthMm: 40, heightMm: 30 },
  { id: '50x30', label: '50×30 mm', widthMm: 50, heightMm: 30 },
  { id: '58x40', label: '58×40 mm (termik)', widthMm: 58, heightMm: 40 },
  { id: '70x50', label: '70×50 mm', widthMm: 70, heightMm: 50 },
  { id: '100x50', label: '100×50 mm', widthMm: 100, heightMm: 50 },
  { id: '100x100', label: '100×100 mm', widthMm: 100, heightMm: 100 },
  { id: '100x150', label: '100×150 mm', widthMm: 100, heightMm: 150 },
  { id: 'custom', label: 'Özel', widthMm: 50, heightMm: 30 },
]

export function getLabelPreset(id) {
  return LABEL_SIZE_PRESETS.find((item) => item.id === id) || LABEL_SIZE_PRESETS[2]
}
