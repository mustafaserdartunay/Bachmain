import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import {
  APPEARANCE_EVENT,
  applyAppearance,
  getStoredAppearance,
} from '../../utils/appearanceMode'

export default function AppearanceToggle() {
  const [mode, setMode] = useState(() => getStoredAppearance())

  useEffect(() => {
    function sync(event) {
      setMode(event?.detail || getStoredAppearance())
    }
    window.addEventListener(APPEARANCE_EVENT, sync)
    return () => window.removeEventListener(APPEARANCE_EVENT, sync)
  }, [])

  function select(nextMode) {
    if (nextMode === mode) return
    setMode(applyAppearance(nextMode))
  }

  return (
    <div
      className="appearance-toggle"
      role="group"
      aria-label="Görünüm modu"
    >
      <button
        type="button"
        onClick={() => select('day')}
        className={`appearance-toggle-btn ${mode === 'day' ? 'is-active' : ''}`}
        aria-pressed={mode === 'day'}
        aria-label="Gündüz modu"
        title="Gündüz modu"
      >
        <span className="icon-wrap">
          <Sun className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>
      <button
        type="button"
        onClick={() => select('night')}
        className={`appearance-toggle-btn ${mode === 'night' ? 'is-active' : ''}`}
        aria-pressed={mode === 'night'}
        aria-label="Gece modu"
        title="Gece modu"
      >
        <span className="icon-wrap">
          <Moon className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>
    </div>
  )
}
