import { Moon, Orbit, Sparkles, Sun, Sunrise, Sunset } from 'lucide-react'

const ICONS = {
  dark: Moon,
  space: Orbit,
  evening: Sunset,
  morning: Sunrise,
  light: Sun,
  special: Sparkles,
}

export default function ThemeModeIcon({ mode = 'dark', className = 'h-5 w-5 shrink-0' }) {
  const Icon = ICONS[mode] || Moon
  return <Icon className={className} strokeWidth={2} aria-hidden />
}
