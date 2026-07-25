export const stageColors = [
  'bg-white',
  'bg-black',
  'bg-slate-500',
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-green-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-purple-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-rose-500',
  'bg-red-700',
  'bg-orange-700',
  'bg-amber-700',
  'bg-green-700',
  'bg-teal-700',
  'bg-blue-700',
  'bg-indigo-700',
  'bg-purple-700',
  'bg-pink-700',
  'bg-stone-600',
]

/** List rows: always match action icon gray-300; color lives in the swatch only. */
const listRowSurface = 'border-gray-300/45 bg-transparent hover:border-gray-300/70'

/** Explicit column surfaces so Tailwind can see full class names at build time. */
export const stageRowSurfaces = {
  'bg-white': 'border-slate-300/70 bg-slate-100 hover:border-slate-400/80 hover:bg-slate-50',
  'bg-black': 'border-zinc-800/55 bg-zinc-900/30 hover:border-zinc-700/70 hover:bg-zinc-900/40',
  'bg-slate-500':
    'border-slate-500/35 bg-slate-500/12 hover:border-slate-400/50 hover:bg-slate-500/18',
  'bg-red-500': 'border-red-500/35 bg-red-500/12 hover:border-red-400/50 hover:bg-red-500/18',
  'bg-orange-500':
    'border-orange-500/35 bg-orange-500/12 hover:border-orange-400/50 hover:bg-orange-500/18',
  'bg-amber-500':
    'border-amber-500/35 bg-amber-500/12 hover:border-amber-400/50 hover:bg-amber-500/18',
  'bg-yellow-500':
    'border-yellow-500/35 bg-yellow-500/12 hover:border-yellow-400/50 hover:bg-yellow-500/18',
  'bg-lime-500': 'border-lime-500/35 bg-lime-500/12 hover:border-lime-400/50 hover:bg-lime-500/18',
  'bg-green-500':
    'border-green-500/35 bg-green-500/12 hover:border-green-400/50 hover:bg-green-500/18',
  'bg-emerald-500':
    'border-emerald-500/35 bg-emerald-500/12 hover:border-emerald-400/50 hover:bg-emerald-500/18',
  'bg-teal-500': 'border-teal-500/35 bg-teal-500/12 hover:border-teal-400/50 hover:bg-teal-500/18',
  'bg-cyan-500': 'border-cyan-500/35 bg-cyan-500/12 hover:border-cyan-400/50 hover:bg-cyan-500/18',
  'bg-sky-500': 'border-sky-500/35 bg-sky-500/12 hover:border-sky-400/50 hover:bg-sky-500/18',
  'bg-blue-500': 'border-blue-500/35 bg-blue-500/12 hover:border-blue-400/50 hover:bg-blue-500/18',
  'bg-indigo-500':
    'border-indigo-500/35 bg-indigo-500/12 hover:border-indigo-400/50 hover:bg-indigo-500/18',
  'bg-violet-500':
    'border-violet-500/35 bg-violet-500/12 hover:border-violet-400/50 hover:bg-violet-500/18',
  'bg-purple-500':
    'border-purple-500/35 bg-purple-500/12 hover:border-purple-400/50 hover:bg-purple-500/18',
  'bg-fuchsia-500':
    'border-fuchsia-500/35 bg-fuchsia-500/12 hover:border-fuchsia-400/50 hover:bg-fuchsia-500/18',
  'bg-pink-500': 'border-pink-500/35 bg-pink-500/12 hover:border-pink-400/50 hover:bg-pink-500/18',
  'bg-rose-500': 'border-rose-500/35 bg-rose-500/12 hover:border-rose-400/50 hover:bg-rose-500/18',
  'bg-red-700': 'border-red-700/35 bg-red-700/12 hover:border-red-600/50 hover:bg-red-700/18',
  'bg-orange-700':
    'border-orange-700/35 bg-orange-700/12 hover:border-orange-600/50 hover:bg-orange-700/18',
  'bg-amber-700':
    'border-amber-700/35 bg-amber-700/12 hover:border-amber-600/50 hover:bg-amber-700/18',
  'bg-green-700':
    'border-green-700/35 bg-green-700/12 hover:border-green-600/50 hover:bg-green-700/18',
  'bg-teal-700': 'border-teal-700/35 bg-teal-700/12 hover:border-teal-600/50 hover:bg-teal-700/18',
  'bg-blue-700': 'border-blue-700/35 bg-blue-700/12 hover:border-blue-600/50 hover:bg-blue-700/18',
  'bg-indigo-700':
    'border-indigo-700/35 bg-indigo-700/12 hover:border-indigo-600/50 hover:bg-indigo-700/18',
  'bg-purple-700':
    'border-purple-700/35 bg-purple-700/12 hover:border-purple-600/50 hover:bg-purple-700/18',
  'bg-pink-700': 'border-pink-700/35 bg-pink-700/12 hover:border-pink-600/50 hover:bg-pink-700/18',
  'bg-stone-600':
    'border-stone-600/35 bg-stone-600/12 hover:border-stone-500/50 hover:bg-stone-600/18',
}

export function getStageRowSurfaceClasses() {
  return listRowSurface
}

export function getStageColumnSurfaceClasses(stage) {
  return stageRowSurfaces[stage?.color] || ''
}

const defaultBadgeSurface =
  'border-slate-700/40 bg-slate-600/30 dark:border-slate-500/35 dark:bg-slate-900/55'

export const stageBadgeSurfaces = {
  'bg-white': 'border-slate-300/70 bg-slate-100',
  'bg-black': 'border-zinc-800/55 bg-zinc-900/40',
  'bg-slate-500': 'border-slate-500/40 bg-slate-500/30',
  'bg-red-500': 'border-red-500/40 bg-red-500/30',
  'bg-orange-500': 'border-orange-500/40 bg-orange-500/30',
  'bg-amber-500': 'border-amber-500/40 bg-amber-500/30',
  'bg-yellow-500': 'border-yellow-500/40 bg-yellow-500/30',
  'bg-lime-500': 'border-lime-500/40 bg-lime-500/30',
  'bg-green-500': 'border-green-500/40 bg-green-500/30',
  'bg-emerald-500': 'border-emerald-500/40 bg-emerald-500/30',
  'bg-teal-500': 'border-teal-500/40 bg-teal-500/30',
  'bg-cyan-500': 'border-cyan-500/40 bg-cyan-500/30',
  'bg-sky-500': 'border-sky-500/40 bg-sky-500/30',
  'bg-blue-500': 'border-blue-500/40 bg-blue-500/30',
  'bg-indigo-500': 'border-indigo-500/40 bg-indigo-500/30',
  'bg-violet-500': 'border-violet-500/40 bg-violet-500/30',
  'bg-purple-500': 'border-purple-500/40 bg-purple-500/30',
  'bg-fuchsia-500': 'border-fuchsia-500/40 bg-fuchsia-500/30',
  'bg-pink-500': 'border-pink-500/40 bg-pink-500/30',
  'bg-rose-500': 'border-rose-500/40 bg-rose-500/30',
  'bg-red-700': 'border-red-700/40 bg-red-700/30',
  'bg-orange-700': 'border-orange-700/40 bg-orange-700/30',
  'bg-amber-700': 'border-amber-700/40 bg-amber-700/30',
  'bg-green-700': 'border-green-700/40 bg-green-700/30',
  'bg-teal-700': 'border-teal-700/40 bg-teal-700/30',
  'bg-blue-700': 'border-blue-700/40 bg-blue-700/30',
  'bg-indigo-700': 'border-indigo-700/40 bg-indigo-700/30',
  'bg-purple-700': 'border-purple-700/40 bg-purple-700/30',
  'bg-pink-700': 'border-pink-700/40 bg-pink-700/30',
  'bg-stone-600': 'border-stone-600/40 bg-stone-600/30',
}

export function getStageBadgeSurfaceClasses(stage) {
  return stageBadgeSurfaces[stage?.color] || defaultBadgeSurface
}
