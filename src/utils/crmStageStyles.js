import { stageColors } from '../components/DocumentEditor/stageColors'
import { getCrmSoftStageStyle } from './bachBrand'

export const CRM_COLOR_SOFT_STYLES = {
  'bg-blue-500': {
    accent: 'bg-blue-400',
    stroke: '#3b82f6',
    surface: 'bg-blue-500/12',
    border: 'border-blue-500/22',
    borderActive: 'border-blue-500/55',
    ring: 'ring-blue-500/25',
    text: 'text-black',
  },
  'bg-sky-500': {
    accent: 'bg-sky-400',
    stroke: '#38bdf8',
    surface: 'bg-sky-500/12',
    border: 'border-sky-500/22',
    borderActive: 'border-sky-500/55',
    ring: 'ring-sky-500/25',
    text: 'text-black',
  },
  'bg-cyan-500': {
    accent: 'bg-cyan-400',
    stroke: '#06b6d4',
    surface: 'bg-cyan-500/12',
    border: 'border-cyan-500/22',
    borderActive: 'border-cyan-500/55',
    ring: 'ring-cyan-500/25',
    text: 'text-black',
  },
  'bg-teal-500': {
    accent: 'bg-teal-400',
    stroke: '#14b8a6',
    surface: 'bg-teal-500/12',
    border: 'border-teal-500/22',
    borderActive: 'border-teal-500/55',
    ring: 'ring-teal-500/25',
    text: 'text-black',
  },
  'bg-emerald-500': {
    accent: 'bg-emerald-400',
    stroke: '#10b981',
    surface: 'bg-emerald-500/12',
    border: 'border-emerald-500/22',
    borderActive: 'border-emerald-500/55',
    ring: 'ring-emerald-500/25',
    text: 'text-black',
  },
  'bg-lime-500': {
    accent: 'bg-lime-400',
    stroke: '#84cc16',
    surface: 'bg-lime-500/12',
    border: 'border-lime-500/22',
    borderActive: 'border-lime-500/55',
    ring: 'ring-lime-500/25',
    text: 'text-black',
  },
  'bg-green-500': {
    accent: 'bg-green-500',
    stroke: '#22c55e',
    surface: 'bg-green-500/22',
    border: 'border-green-500/35',
    borderActive: 'border-green-500/55',
    ring: 'ring-green-500/25',
    text: 'text-black',
  },
  'bg-amber-500': {
    accent: 'bg-amber-400',
    stroke: '#fbbf24',
    surface: 'bg-amber-500/12',
    border: 'border-amber-500/22',
    borderActive: 'border-amber-500/55',
    ring: 'ring-amber-500/25',
    text: 'text-black',
  },
  'bg-yellow-500': {
    accent: 'bg-yellow-400',
    stroke: '#eab308',
    surface: 'bg-yellow-500/12',
    border: 'border-yellow-500/22',
    borderActive: 'border-yellow-500/55',
    ring: 'ring-yellow-500/25',
    text: 'text-black',
  },
  'bg-orange-500': {
    accent: 'bg-orange-400',
    stroke: '#f97316',
    surface: 'bg-orange-500/12',
    border: 'border-orange-500/22',
    borderActive: 'border-orange-500/55',
    ring: 'ring-orange-500/25',
    text: 'text-black',
  },
  'bg-red-500': {
    accent: 'bg-red-400',
    stroke: '#ef4444',
    surface: 'bg-red-500/12',
    border: 'border-red-500/22',
    borderActive: 'border-red-500/55',
    ring: 'ring-red-500/25',
    text: 'text-black',
  },
  'bg-rose-500': {
    accent: 'bg-rose-400',
    stroke: '#f43f5e',
    surface: 'bg-rose-500/12',
    border: 'border-rose-500/22',
    borderActive: 'border-rose-500/55',
    ring: 'ring-rose-500/25',
    text: 'text-black',
  },
  'bg-pink-500': {
    accent: 'bg-pink-400',
    stroke: '#ec4899',
    surface: 'bg-pink-500/12',
    border: 'border-pink-500/22',
    borderActive: 'border-pink-500/55',
    ring: 'ring-pink-500/25',
    text: 'text-black',
  },
  'bg-fuchsia-500': {
    accent: 'bg-fuchsia-400',
    stroke: '#d946ef',
    surface: 'bg-fuchsia-500/12',
    border: 'border-fuchsia-500/22',
    borderActive: 'border-fuchsia-500/55',
    ring: 'ring-fuchsia-500/25',
    text: 'text-black',
  },
  'bg-purple-500': {
    accent: 'bg-purple-400',
    stroke: '#a855f7',
    surface: 'bg-purple-500/12',
    border: 'border-purple-500/22',
    borderActive: 'border-purple-500/55',
    ring: 'ring-purple-500/25',
    text: 'text-black',
  },
  'bg-violet-500': {
    accent: 'bg-violet-400',
    stroke: '#a78bfa',
    surface: 'bg-violet-500/12',
    border: 'border-violet-500/22',
    borderActive: 'border-violet-500/55',
    ring: 'ring-violet-500/25',
    text: 'text-black',
  },
  'bg-indigo-500': {
    accent: 'bg-indigo-400',
    stroke: '#6366f1',
    surface: 'bg-indigo-500/12',
    border: 'border-indigo-500/22',
    borderActive: 'border-indigo-500/55',
    ring: 'ring-indigo-500/25',
    text: 'text-black',
  },
  'bg-slate-500': {
    accent: 'bg-slate-400',
    stroke: '#64748b',
    surface: 'bg-slate-500/12',
    border: 'border-slate-500/22',
    borderActive: 'border-slate-500/55',
    ring: 'ring-slate-500/25',
    text: 'text-black',
  },
  'bg-stone-500': {
    accent: 'bg-stone-400',
    stroke: '#78716c',
    surface: 'bg-stone-500/12',
    border: 'border-stone-500/22',
    borderActive: 'border-stone-500/55',
    ring: 'ring-stone-500/25',
    text: 'text-black',
  },
  'bg-zinc-500': {
    accent: 'bg-zinc-400',
    stroke: '#71717a',
    surface: 'bg-zinc-500/12',
    border: 'border-zinc-500/22',
    borderActive: 'border-zinc-500/55',
    ring: 'ring-zinc-500/25',
    text: 'text-black',
  },
}

export function withActiveSurface(style) {
  if (style.surfaceActive) return style
  const match = String(style.surface || '').match(/^(bg-[a-z]+-\d+)\/(\d+)$/)
  if (!match) return { ...style, surfaceActive: style.surface }
  const nextOpacity = Math.min(Number(match[2]) + 22, 45)
  return { ...style, surfaceActive: `${match[1]}/${nextOpacity}` }
}

export function getCrmSoftStyleForColor(color, fallbackIndex = 0) {
  let style
  if (color && CRM_COLOR_SOFT_STYLES[color]) {
    style = CRM_COLOR_SOFT_STYLES[color]
  } else {
    const fallbackColor = stageColors[fallbackIndex % stageColors.length]
    style = CRM_COLOR_SOFT_STYLES[fallbackColor] || getCrmSoftStageStyle(fallbackIndex)
  }
  return withActiveSurface(style)
}
