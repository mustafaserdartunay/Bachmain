import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { APPEARANCE_EVENT, getStoredAppearance, toggleAppearance } from '../../utils/appearanceMode'

export default function AppearanceToggle() {
  const [mode, setMode] = useState(() => getStoredAppearance())

  useEffect(() => {
    function sync(event) {
      setMode(event?.detail || getStoredAppearance())
    }
    window.addEventListener(APPEARANCE_EVENT, sync)
    return () => window.removeEventListener(APPEARANCE_EVENT, sync)
  }, [])

  const isNight = mode === 'night'
  const label = isNight ? 'Gündüz moduna geç' : 'Gece moduna geç'

  return (
    <button
      type="button"
      className="appearance-switch shrink-0"
      data-mode={mode}
      onClick={() => setMode(toggleAppearance(mode))}
      aria-label={label}
      title={label}
      aria-pressed={isNight}
    >
      <span className="appearance-switch-track" aria-hidden="true">
        <span className="appearance-switch-thumb" />
        <span className="appearance-switch-icon appearance-switch-icon--day">
          <Sun className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
        <span className="appearance-switch-icon appearance-switch-icon--night">
          <Moon className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
      </span>
    </button>
  )
}
