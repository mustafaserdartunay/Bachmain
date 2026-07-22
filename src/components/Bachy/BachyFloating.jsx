import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

function positionClass(position) {
  if (position === 'bottom-left') return 'left-3 sm:left-5'
  if (position === 'bottom-center') return 'left-1/2 -translate-x-1/2'
  return 'right-3 sm:right-[calc(var(--shell-gap)+1rem)] lg:right-[calc(5.5rem+1rem)]'
}

export default function BachyFloating() {
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
        x: (event.clientX - cx) / (rect.width || 1),
        y: (event.clientY - cy) / (rect.height || 1),
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [settings.followPointer])

  const sizePx = useMemo(() => Math.round(148 * (settings.size || 1)), [settings.size])
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
    if (id === 'chat') setChatOpen(true)
    else if (id === 'mail') {
      setChatOpen(true)
      setBubble('Mail metnini birlikte yazalım — ne göndermek istiyorsun?')
    } else if (id === 'whatsapp') {
      setChatOpen(true)
      setBubble('WhatsApp mesajını birlikte hazırlayalım.')
    } else if (id === 'offer') {
      setChatOpen(true)
      setBubble('Teklif için müşteri ve ürünleri söylemen yeterli.')
    } else if (id === 'report') {
      setChatOpen(true)
      setBubble('Hangi raporu inceleyelim?')
    }
  }

  if (!settings.enabled) return null

  return (
    <>
      <div
        ref={shellRef}
        className={`pointer-events-none fixed bottom-[calc(var(--ds-bottom-nav-h,4rem)+0.75rem)] z-[112] flex flex-col items-end lg:bottom-6 ${positionClass(settings.position)}`}
        style={{ width: sizePx, height: sizePx + 8 }}
      >
        <div className="pointer-events-none flex w-full flex-col items-end">
          <BachySpeechBubble text={bubble} onClose={() => setBubble('')} />
        </div>
        <div
          className="pointer-events-auto relative overflow-visible"
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
          <Suspense
            fallback={
              <img
                src="/bachy/bachy-reference.png"
                alt="Bachy"
                className="h-full w-full object-contain drop-shadow-lg"
                draggable={false}
              />
            }
          >
            {settings.motionEnabled && intensity > 0 ? (
              <BachyCanvas
                emotion={state.emotion}
                activity={state.activity}
                hover={hover}
                pointer={pointer}
                followPointer={settings.followPointer}
                intensity={intensity}
                celebrating={state.emotion === 'celebrating' || confetti}
              />
            ) : (
              <img
                src="/bachy/bachy-reference.png"
                alt="Bachy"
                className="h-full w-full object-contain drop-shadow-lg"
                draggable={false}
              />
            )}
          </Suspense>
        </div>
      </div>

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
      />
    </>
  )
}
