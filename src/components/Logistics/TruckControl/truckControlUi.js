import {
  APP_LABEL_CLASS,
  APP_SURFACE_PANEL_CLASS,
  APP_VALUE_CLASS,
  YF_TEXT_CLASS,
  YFB_TEXT_CLASS,
} from '../../../utils/dashboardDesign'

export const TCC_PANEL = `${APP_SURFACE_PANEL_CLASS} p-4`
export const TCC_YF = YF_TEXT_CLASS
export const TCC_YFB = YFB_TEXT_CLASS
export const TCC_LABEL = APP_LABEL_CLASS
export const TCC_VALUE = APP_VALUE_CLASS
export const TCC_MUTED = 'text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)]'
export const TCC_INPUT =
  'h-9 w-full rounded-xl border border-[var(--glass-border)] bg-transparent px-3 text-[14px] font-normal leading-tight text-[var(--ink)] outline-none focus:border-blue-400'

export function toneClass(tone) {
  if (tone === 'green') return 'text-emerald-600'
  if (tone === 'red') return 'text-rose-600'
  if (tone === 'amber') return 'text-amber-600'
  if (tone === 'blue') return 'text-blue-600'
  return 'text-[var(--muted)]'
}
