export const stageColors = [
  'bg-blue-500',
  'bg-sky-500',
  'bg-cyan-500',
  'bg-teal-500',
  'bg-emerald-500',
  'bg-lime-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-rose-500',
  'bg-pink-500',
  'bg-fuchsia-500',
  'bg-purple-500',
  'bg-violet-500',
  'bg-indigo-500',
  'bg-slate-500',
  'bg-stone-500',
  'bg-zinc-500',
]

const defaultListRowSurface = 'border-dark-500/45 bg-dark-800/55 hover:border-blue-500/35 hover:bg-dark-700/60'

export const stageRowSurfaces = {
  'bg-blue-500': 'border-blue-500/35 bg-blue-500/12 hover:border-blue-400/50 hover:bg-blue-500/18',
  'bg-sky-500': 'border-sky-500/35 bg-sky-500/12 hover:border-sky-400/50 hover:bg-sky-500/18',
  'bg-cyan-500': 'border-cyan-500/35 bg-cyan-500/12 hover:border-cyan-400/50 hover:bg-cyan-500/18',
  'bg-teal-500': 'border-teal-500/35 bg-teal-500/12 hover:border-teal-400/50 hover:bg-teal-500/18',
  'bg-emerald-500': 'border-emerald-500/35 bg-emerald-500/12 hover:border-emerald-400/50 hover:bg-emerald-500/18',
  'bg-lime-500': 'border-lime-500/35 bg-lime-500/12 hover:border-lime-400/50 hover:bg-lime-500/18',
  'bg-green-500': 'border-green-500/35 bg-green-500/12 hover:border-green-400/50 hover:bg-green-500/18',
  'bg-amber-500': 'border-amber-500/35 bg-amber-500/12 hover:border-amber-400/50 hover:bg-amber-500/18',
  'bg-yellow-500': 'border-yellow-500/35 bg-yellow-500/12 hover:border-yellow-400/50 hover:bg-yellow-500/18',
  'bg-orange-500': 'border-orange-500/35 bg-orange-500/12 hover:border-orange-400/50 hover:bg-orange-500/18',
  'bg-red-500': 'border-red-500/35 bg-red-500/12 hover:border-red-400/50 hover:bg-red-500/18',
  'bg-rose-500': 'border-rose-500/35 bg-rose-500/12 hover:border-rose-400/50 hover:bg-rose-500/18',
  'bg-pink-500': 'border-pink-500/35 bg-pink-500/12 hover:border-pink-400/50 hover:bg-pink-500/18',
  'bg-fuchsia-500': 'border-fuchsia-500/35 bg-fuchsia-500/12 hover:border-fuchsia-400/50 hover:bg-fuchsia-500/18',
  'bg-purple-500': 'border-purple-500/35 bg-purple-500/12 hover:border-purple-400/50 hover:bg-purple-500/18',
  'bg-violet-500': 'border-violet-500/35 bg-violet-500/12 hover:border-violet-400/50 hover:bg-violet-500/18',
  'bg-indigo-500': 'border-indigo-500/35 bg-indigo-500/12 hover:border-indigo-400/50 hover:bg-indigo-500/18',
  'bg-slate-500': 'border-slate-500/35 bg-slate-500/12 hover:border-slate-400/50 hover:bg-slate-500/18',
  'bg-stone-500': 'border-stone-500/35 bg-stone-500/12 hover:border-stone-400/50 hover:bg-stone-500/18',
  'bg-zinc-500': 'border-zinc-500/35 bg-zinc-500/12 hover:border-zinc-400/50 hover:bg-zinc-500/18',
}

export function getStageRowSurfaceClasses(stage) {
  return stageRowSurfaces[stage?.color] || defaultListRowSurface
}

export function getStageColumnSurfaceClasses(stage) {
  return stageRowSurfaces[stage?.color] || ''
}

const defaultBadgeSurface =
  'border-slate-700/40 bg-slate-600/30 dark:border-slate-500/35 dark:bg-slate-900/55'

export const stageBadgeSurfaces = Object.fromEntries(
  Object.entries(stageRowSurfaces).map(([color, surface]) => [
    color,
    surface.replace(/bg-([\w-]+)\/12/, 'bg-$1/30').replace(/\s*hover:[^\s]+/g, ''),
  ]),
)

export function getStageBadgeSurfaceClasses(stage) {
  return stageBadgeSurfaces[stage?.color] || defaultBadgeSurface
}
