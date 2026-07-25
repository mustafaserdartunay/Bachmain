/** BachMain Design System (BDS) v1.0 — Typography */

export const FONT_FAMILY = "'Manrope', system-ui, sans-serif"

/** Primary UI font is Manrope. */
export const FORBIDDEN_FONTS = [
  'Roboto',
  'Arial',
  'Helvetica',
  'Segoe',
  'Montserrat',
  'Plus Jakarta Sans',
  'Verdana',
  'Sora',
  'Poppins',
  'Inter',
]

/**
 * Typography scale (px → rem at 16px root).
 * @type {Record<string, { size: string, sizePx: number, weight: number, lineHeight: number }>}
 */
export const typography = {
  displayXl: { size: '4rem', sizePx: 64, weight: 700, lineHeight: 1.15 },
  display: { size: '3.5rem', sizePx: 56, weight: 700, lineHeight: 1.15 },
  h1: { size: '2.625rem', sizePx: 42, weight: 700, lineHeight: 1.2 },
  h2: { size: '2.125rem', sizePx: 34, weight: 700, lineHeight: 1.2 },
  h3: { size: '1.75rem', sizePx: 28, weight: 600, lineHeight: 1.25 },
  h4: { size: '1.5rem', sizePx: 24, weight: 600, lineHeight: 1.25 },
  h5: { size: '1.25rem', sizePx: 20, weight: 600, lineHeight: 1.3 },
  h6: { size: '1.125rem', sizePx: 18, weight: 600, lineHeight: 1.35 },
  cardTitle: { size: '1.125rem', sizePx: 18, weight: 600, lineHeight: 1.35 },
  sectionTitle: { size: '1rem', sizePx: 16, weight: 600, lineHeight: 1.4 },
  bodyLarge: { size: '1rem', sizePx: 16, weight: 400, lineHeight: 1.5 },
  body: { size: '0.9375rem', sizePx: 15, weight: 400, lineHeight: 1.5 },
  input: { size: '0.9375rem', sizePx: 15, weight: 400, lineHeight: 1.5 },
  button: { size: '0.9375rem', sizePx: 15, weight: 600, lineHeight: 1.4 },
  tableHeader: { size: '0.875rem', sizePx: 14, weight: 600, lineHeight: 1.4 },
  tableBody: { size: '0.875rem', sizePx: 14, weight: 400, lineHeight: 1.4 },
  caption: { size: '0.8125rem', sizePx: 13, weight: 400, lineHeight: 1.4 },
  small: { size: '0.75rem', sizePx: 12, weight: 400, lineHeight: 1.4 },
}

export const fontVariantNumeric = 'tabular-nums'

export default typography
