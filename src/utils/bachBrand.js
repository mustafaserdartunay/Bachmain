/** Soft, muted CRM process card palette — distinct but easy on the eyes. */

import { DUZENLEME_KALEMI_BUTTON_CLASS, TEKLIFLER_COP_KUTUSU_BUTTON_CLASS } from './buttonStyles'

export const CRM_SOFT_STAGES = [
  {
    accent: 'bg-amber-400',
    stroke: '#fbbf24',
    surface: 'bg-amber-500/12',
    surfaceActive: 'bg-amber-500/32',
    border: 'border-amber-500/22',
    borderActive: 'border-amber-400/40',
    ring: 'ring-amber-400/18',
    text: 'text-amber-900 dark:text-amber-100',
  },
  {
    accent: 'bg-sky-400',
    stroke: '#38bdf8',
    surface: 'bg-sky-500/12',
    surfaceActive: 'bg-sky-500/32',
    border: 'border-sky-500/22',
    borderActive: 'border-sky-400/40',
    ring: 'ring-sky-400/18',
    text: 'text-sky-900 dark:text-sky-100',
  },
  {
    accent: 'bg-violet-400',
    stroke: '#a78bfa',
    surface: 'bg-violet-500/12',
    surfaceActive: 'bg-violet-500/32',
    border: 'border-violet-500/22',
    borderActive: 'border-violet-400/40',
    ring: 'ring-violet-400/18',
    text: 'text-violet-900 dark:text-violet-100',
  },
  {
    accent: 'bg-green-500',
    stroke: '#22c55e',
    surface: 'bg-green-500/22',
    surfaceActive: 'bg-green-500/42',
    border: 'border-green-500/35',
    borderActive: 'border-green-500/55',
    ring: 'ring-green-500/25',
    text: 'text-black',
  },
]

export function getCrmSoftStageStyle(index = 0) {
  return CRM_SOFT_STAGES[index % CRM_SOFT_STAGES.length]
}

export function getCrmStageAccent(index = 0) {
  return getCrmSoftStageStyle(index).accent
}

export const CRM_BADGE_TEXT = 'text-black dark:text-white'

export const CRM_BADGE_APPOINTMENT =
  'border border-green-500 bg-green-400/70 text-black dark:border-green-400 dark:bg-green-500/55 dark:text-white'

export const CRM_BADGE_TASK =
  'border border-orange-700/40 bg-orange-600/30 text-black dark:border-orange-500/35 dark:bg-orange-900/55 dark:text-white'

export const CRM_BADGE_TEMPLATES = {
  numune: 'border border-amber-700/40 bg-amber-600/30 text-black dark:border-amber-500/35 dark:bg-amber-900/55 dark:text-white',
  teklif: 'border border-indigo-700/40 bg-indigo-600/30 text-black dark:border-indigo-500/35 dark:bg-indigo-900/55 dark:text-white',
  ziyaret: 'border border-violet-700/40 bg-violet-600/30 text-black dark:border-violet-500/35 dark:bg-violet-900/55 dark:text-white',
  toplanti: 'border border-blue-700/40 bg-blue-600/30 text-black dark:border-blue-500/35 dark:bg-blue-900/55 dark:text-white',
  tahsilat: 'border border-emerald-700/40 bg-emerald-600/30 text-black dark:border-emerald-500/35 dark:bg-emerald-900/55 dark:text-white',
  genel: 'border border-slate-700/40 bg-slate-600/30 text-black dark:border-slate-500/35 dark:bg-slate-900/55 dark:text-white',
}

export const CRM_BADGE_TEMPLATE_DEFAULT =
  'border border-slate-700/40 bg-slate-600/30 text-black dark:border-slate-500/35 dark:bg-slate-900/55 dark:text-white'

export function getCrmTemplateBadgeClass(templateId) {
  return CRM_BADGE_TEMPLATES[templateId] || CRM_BADGE_TEMPLATE_DEFAULT
}

export const CRM_EDIT_BUTTON_CLASS = DUZENLEME_KALEMI_BUTTON_CLASS

export const CRM_DELETE_BUTTON_CLASS = TEKLIFLER_COP_KUTUSU_BUTTON_CLASS

export const CRM_ASSIGNEE_ICON_CLASS = 'text-black'
export const CRM_ASSIGNEE_TEXT_CLASS = 'text-black'

export const CRM_STAGE_REACHED_TEXT = 'text-[var(--text-strong)]'
export const CRM_STAGE_IDLE_TEXT = 'text-[var(--text-soft)]'

/** @deprecated Use CRM_* exports — kept for any lingering imports */
export const BACH_GRADIENT_CORAL_BLUE = CRM_BADGE_APPOINTMENT
export const BACH_GRADIENT_BLUE_CORAL = CRM_BADGE_TASK
export const BACH_BADGE_APPOINTMENT = CRM_BADGE_APPOINTMENT
export const BACH_BADGE_TASK = CRM_BADGE_TASK
export const BACH_BADGE_TEMPLATE = CRM_BADGE_TEMPLATE_DEFAULT
export const BACH_EDIT_BUTTON_CLASS = CRM_EDIT_BUTTON_CLASS
export const BACH_DELETE_BUTTON_CLASS = CRM_DELETE_BUTTON_CLASS
export const BACH_ASSIGNEE_ICON_CLASS = CRM_ASSIGNEE_ICON_CLASS
export const BACH_ASSIGNEE_TEXT_CLASS = CRM_ASSIGNEE_TEXT_CLASS
export const BACH_STAGE_REACHED_TEXT = CRM_STAGE_REACHED_TEXT
export const BACH_STAGE_IDLE_TEXT = CRM_STAGE_IDLE_TEXT
export const getCrmStageGradient = getCrmStageAccent
export const CRM_STAGE_GRADIENTS = CRM_SOFT_STAGES.map((stage) => stage.accent)
