import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { createBehaviorEngine } from '../../bachy/behaviorEngine'
import { startBachyEventBridge } from '../../bachy/eventBridge'
import { getBachySettings, subscribeBachySettings } from '../../bachy/settingsStore'
import { BACHY_REACTION_EVENT } from '../../bachy/constants'
import { reactSpeech } from '../../bachy/speech'
import BachySpeechBubble from './BachySpeechBubble'
import BachyQuickMenu from './BachyQuickMenu'
import BachyChat from './BachyChat'
import BachyConfetti from './BachyConfetti'

const BachyCanvas = lazy(() => import('./BachyCanvas'))

/** Living 3D Bachy — mounts beside sidebar logo only (never over content panels). */
export default function BachyFloating({ slot = 'logo', collapsed = false }) {
  const { pathname } = useLocation()
  const engineRef = useRef(null)
  if (!engineRef.current) engineRef.current = createBehaviorEngine()

  const [settings, setSettings] = useState(getBachySettings)
  const [state, setState] = useState(() => engineRef.current.getState())
  const [hover, setHover] = useState(false)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const [bubble, setBubble] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [menu, setMenu] = useState({ open: false, x: 0, y: 0 })
  const [confetti, setConfetti] = useState(false)
  const shellRef = useRef(null)

  useEffect(() => subscribeBachySettings(setSettings), [])
  useEffect(() => engineRef.current.subscribe(setState), [])
  useEffect(() => startBachyEventBridge(engineRef.current), [])

  useEffect(() => {
    const intensityMs =
      settings.motionIntensity === 'lively'
        ? 7000
        : settings.motionIntensity === 'minimal'
          ? 22000
          : 12000
    const id = setInterval(() => engineRef.current.tickIdle(), intensityMs)
    engineRef.current.tickIdle()
    return () => clearInterval(id)
  }, [settings.motionIntensity])

  useEffect(() => {
    function onReaction(e) {
      const detail = e.detail
      if (detail?.celebrate) {
        setConfetti(true)
        setTimeout(() => setConfetti(false), 100)
      }
      if (detail?.speak) {
        reactSpeech(engineRef.current, pathname).then((text) => {
          if (text && settings.notificationStyle !== 'none') setBubble(text)
        })
      }
    }
    window.addEventListener(BACHY_REACTION_EVENT, onReaction)
    return () => window.removeEventListener(BACHY_REACTION_EVENT, onReaction)
  }, [pathname, settings.notificationStyle])

  useEffect(() => {
    if (!settings.followPointer) return undefined
    function onMove(event) {
      const rect = shellRef.current?.getBoundingClientRect()
      if (!rect) return
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      setPointer({
        x: (event.clientX - cx) / Math.max(rect.width, 1),
        y: (event.clientY - cy) / Math.max(rect.height, 1),
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [settings.followPointer])

  const sizePx = useMemo(() => {
    const base = collapsed ? 44 : 56
    return Math.round(base * (settings.size || 1))
  }, [settings.size, collapsed])

  const intensity =
    settings.motionIntensity === 'lively'
      ? 1.35
      : settings.motionIntensity === 'minimal'
        ? 0.55
        : settings.motionIntensity === 'off'
          ? 0
          : 1

  const onContextMenu = useCallback((event) => {
    event.preventDefault()
    setMenu({ open: true, x: event.clientX, y: event.clientY })
  }, [])

  function onQuickAction(id) {
    if (id === 'chat' || id === 'mail' || id === 'whatsapp' || id === 'offer' || id === 'report') {
      setChatOpen(true)
    }
  }

  if (!settings.enabled || slot !== 'logo') return null

  const character = (
    <div className="relative flex shrink-0 flex-col items-center" style={{ width: sizePx }}>
      {bubble ? (
        <div className="pointer-events-auto absolute bottom-full left-1/2 z-10 mb-1 w-max max-w-[9.5rem] -translate-x-1/2">
          <BachySpeechBubble text={bubble} onClose={() => setBubble('')} />
        </div>
      ) : null}
      <div
        ref={shellRef}
        className="relative overflow-hidden rounded-xl"
        style={{ width: sizePx, height: sizePx }}
        onPointerEnter={() => {
          setHover(true)
          if (settings.smileOnHover) {
            engineRef.current.setReaction({
              priority: 10,
              emotion: 'happy',
              activity: 'wait_user',
              celebrate: false,
            })
          }
        }}
        onPointerLeave={() => setHover(false)}
        onDoubleClick={() => setChatOpen(true)}
        onContextMenu={onContextMenu}
        role="button"
        tabIndex={0}
        aria-label="Bachy AI asistanı"
        onKeyDown={(e) => {
          if (e.key === 'Enter') setChatOpen(true)
        }}
      >
        <BachyConfetti active={confetti} />
        <Suspense fallback={<div className="h-full w-full animate-pulse rounded-xl bg-white/40" />}>
          {settings.motionEnabled && intensity > 0 ? (
            <BachyCanvas
              compact
              emotion={state.emotion}
              activity={state.activity}
              hover={hover}
              pointer={pointer}
              followPointer={settings.followPointer}
              intensity={intensity}
              celebrating={state.emotion === 'celebrating' || confetti}
            />
          ) : (
            <div className="flex h-full items-end justify-center text-[10px] font-bold text-ds-muted">
              Bachy
            </div>
          )}
        </Suspense>
      </div>
    </div>
  )

  return (
    <>
      {character}
      {typeof document !== 'undefined'
        ? createPortal(
            <>
              <BachyQuickMenu
                open={menu.open}
                x={menu.x}
                y={menu.y}
                onClose={() => setMenu((m) => ({ ...m, open: false }))}
                onAction={onQuickAction}
              />
              <BachyChat
                open={chatOpen}
                onClose={() => setChatOpen(false)}
                engineState={state}
                pathname={pathname}
                dock="sidebar"
              />
            </>,
            document.body,
          )
        : null}
    </>
  )
}
