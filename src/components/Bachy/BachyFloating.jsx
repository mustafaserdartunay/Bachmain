import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

const IDLE_SRC = '/bachy/bachy-idle.png'

/** Premium image Bachy beside CRM logo — never overlays content panels. */
export default function BachyFloating({ slot = 'logo', collapsed = false }) {
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const engineRef = useRef(null)
  if (!engineRef.current) engineRef.current = createBehaviorEngine()

  const [settings, setSettings] = useState(getBachySettings)
  const [state, setState] = useState(() => engineRef.current.getState())
  const [bubble, setBubble] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [menu, setMenu] = useState({ open: false, x: 0, y: 0 })
  const [wave, setWave] = useState(false)

  useEffect(() => subscribeBachySettings(setSettings), [])
  useEffect(() => engineRef.current.subscribe(setState), [])
  useEffect(() => startBachyEventBridge(engineRef.current), [])

  useEffect(() => {
    const id = setInterval(() => engineRef.current.tickIdle(), 14000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function onReaction(e) {
      const detail = e.detail
      if (detail?.speak) {
        reactSpeech(engineRef.current, pathname).then((text) => {
          if (text && settings.notificationStyle !== 'none') setBubble(text)
        })
      }
    }
    window.addEventListener(BACHY_REACTION_EVENT, onReaction)
    return () => window.removeEventListener(BACHY_REACTION_EVENT, onReaction)
  }, [pathname, settings.notificationStyle])

  const sizePx = useMemo(
    () => Math.round((collapsed ? 40 : 52) * (settings.size || 1)),
    [collapsed, settings.size],
  )

  const onContextMenu = useCallback((event) => {
    event.preventDefault()
    setMenu({ open: true, x: event.clientX, y: event.clientY })
  }, [])

  if (!settings.enabled || slot !== 'logo') return null

  const celebrating = state.emotion === 'celebrating'

  return (
    <>
      <div className="relative flex shrink-0 flex-col items-center" style={{ width: sizePx }}>
        <AnimatePresence>
          {bubble ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-full left-1/2 z-10 mb-1 w-max max-w-[9rem] -translate-x-1/2"
            >
              <BachySpeechBubble text={bubble} onClose={() => setBubble('')} />
            </motion.div>
          ) : null}
        </AnimatePresence>
        <motion.button
          type="button"
          aria-label="Bachy AI asistanı"
          className="relative overflow-hidden rounded-xl border-0 bg-transparent p-0"
          style={{ width: sizePx, height: sizePx }}
          animate={
            reduce
              ? undefined
              : celebrating
                ? { y: [0, -6, 0], rotate: [0, -4, 4, 0] }
                : wave
                  ? { rotate: [0, 8, -6, 0] }
                  : { y: [0, -3, 0] }
          }
          transition={
            celebrating || wave
              ? { duration: 0.7 }
              : { duration: 3.8, repeat: Infinity, ease: 'easeInOut' }
          }
          onHoverStart={() => setWave(true)}
          onHoverEnd={() => setWave(false)}
          onDoubleClick={() => setChatOpen(true)}
          onClick={() => setChatOpen(true)}
          onContextMenu={onContextMenu}
        >
          <img
            src={IDLE_SRC}
            alt=""
            className="h-full w-full object-contain object-bottom drop-shadow-md"
            draggable={false}
          />
        </motion.button>
      </div>
      {typeof document !== 'undefined'
        ? createPortal(
            <>
              <BachyQuickMenu
                open={menu.open}
                x={menu.x}
                y={menu.y}
                onClose={() => setMenu((m) => ({ ...m, open: false }))}
                onAction={(id) => {
                  if (id !== 'settings') setChatOpen(true)
                }}
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
