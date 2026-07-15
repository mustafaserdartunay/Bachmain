import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import {
  APPEARANCE_EVENT,
  getStoredAppearance,
  toggleAppearance,
} from '../../utils/appearanceMode'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'

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
  const Icon = isNight ? Sun : Moon

  return (
    <button
      type="button"
      className={`${HEADER_CONTROL_BUTTON_CLASS} icon-only`}
      onClick={() => setMode(toggleAppearance(mode))}
      aria-label={label}
      title={label}
    >
      <span className="icon-wrap">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  )
}
