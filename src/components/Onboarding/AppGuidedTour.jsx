import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  Check,
  FileText,
  Package,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { isStudioFullscreenRoute } from '../../data/webMenu'
import {
  consumeTourForceFlag,
  GUIDED_TOUR_SIDEBAR_EVENT,
  GUIDED_TOUR_START_EVENT,
  isTourBlockedPath,
  markTourFinished,
  shouldAutoStartTour,
  TOUR_STEPS,
} from './guidedTourStorage'
import './app-guided-tour.css'

const PAD = 10
const CHAPTERS = ['Profil', 'Müşteri', 'Ürün', 'Teklif']

function measureTarget(selector) {
  if (!selector || typeof document === 'undefined') return null
  const el = document.querySelector(selector)
  if (!el) return null
  const rect = el.getBoundingClientRect()
  if (rect.width < 2 && rect.height < 2) return null
  const top = Math.max(8, rect.top - PAD)
  const left = Math.max(8, rect.left - PAD)
  const width = Math.min(window.innerWidth - left - 8, rect.width + PAD * 2)
  const height = Math.min(window.innerHeight - top - 8, rect.height + PAD * 2)
  return { top, left, width, height, round: Math.min(rect.width, rect.height) < 56 }
}

function placeCard(rect) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const cardW = Math.min(344, vw - 24)
  const cardH = 268
  const gap = 18
  if (!rect) {
    return { left: Math.max(12, (vw - cardW) / 2), top: Math.max(12, vh * 0.16) }
  }
  let left = rect.left + rect.width + gap
  let top = rect.top
  if (left + cardW > vw - 12) left = rect.left - cardW - gap
  if (left < 12) {
    left = Math.max(12, Math.min(rect.left, vw - cardW - 12))
    top = rect.top + rect.height + gap
    if (top + cardH > vh - 12) top = Math.max(12, rect.top - cardH - gap)
  }
  top = Math.max(12, Math.min(top, vh - Math.min(cardH, vh * 0.52) - 12))
  left = Math.max(12, Math.min(left, vw - cardW - 12))
  return { left, top }
}

function pointerPoint(rect) {
  if (!rect) {
    return { x: window.innerWidth / 2, y: window.innerHeight * 0.42 }
  }
  return {
    x: rect.left + Math.min(42, Math.max(18, rect.width * 0.62)),
    y: rect.top + Math.min(34, Math.max(16, rect.height * 0.58)),
  }
}

function DimWithHole({ rect }) {
  if (!rect) {
    return <div className="agt-dim agt-dim--full" />
  }
  const { top, left, width, height } = rect
  return (
    <>
      <div className="agt-dim" style={{ top: 0, left: 0, right: 0, height: Math.max(0, top) }} />
      <div className="agt-dim" style={{ top: top + height, left: 0, right: 0, bottom: 0 }} />
      <div className="agt-dim" style={{ top, left: 0, width: Math.max(0, left), height }} />
      <div className="agt-dim" style={{ top, left: left + width, right: 0, height }} />
      <div
        className={`agt-ring${rect.round ? ' agt-ring--round' : ''}`}
        style={{ top, left, width, height }}
      />
    </>
  )
}

function WelcomeArt() {
  const nodes = [
    { label: 'Profil', caption: 'Ayarlar sayfası', Icon: Building2 },
    { label: 'Müşteri', caption: 'Yeni kart', Icon: UserRound },
    { label: 'Ürün', caption: 'Stok listesi', Icon: Package },
    { label: 'Teklif', caption: 'Süreç ekranı', Icon: FileText },
  ]
  return (
    <div className="agt-timeline">
      {nodes.map((node) => (
        <div key={node.label} className="agt-node">
          <span className="agt-node-icon">
            <node.Icon className="h-4 w-4" />
          </span>
          <strong>{node.label}</strong>
          <em>{node.caption}</em>
        </div>
      ))}
    </div>
  )
}

function syncTourChrome(step) {
  window.dispatchEvent(
    new CustomEvent(GUIDED_TOUR_SIDEBAR_EVENT, {
      detail: {
        expand: Boolean(step?.expandSidebar),
        menu: step?.openMenu || null,
      },
    }),
  )
}

export default function AppGuidedTour() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [hole, setHole] = useState(null)
  const [clicking, setClicking] = useState(false)
  const pollRef = useRef(null)
  const clickRef = useRef(null)
  const autoStartedRef = useRef(false)

  const step = TOUR_STEPS[stepIndex] || TOUR_STEPS[0]
  const spotlightSteps = useMemo(
    () => TOUR_STEPS.filter((item) => item.kind === 'spotlight'),
    [],
  )
  const spotlightPos = Math.max(
    0,
    spotlightSteps.findIndex((item) => item.id === step.id),
  )
  const progressPct = ((stepIndex + 1) / TOUR_STEPS.length) * 100

  const stopTimers = useCallback(() => {
    window.clearInterval(pollRef.current)
    window.clearTimeout(clickRef.current)
  }, [])

  const finish = useCallback(
    (skipped = false) => {
      stopTimers()
      markTourFinished(user, { skipped })
      consumeTourForceFlag()
      window.dispatchEvent(
        new CustomEvent(GUIDED_TOUR_SIDEBAR_EVENT, { detail: { expand: false, menu: null } }),
      )
      setActive(false)
      setStepIndex(0)
      setHole(null)
    },
    [stopTimers, user],
  )

  const goTo = useCallback(
    (nextIndex) => {
      stopTimers()
      if (nextIndex >= TOUR_STEPS.length) {
        finish(false)
        return
      }
      if (nextIndex < 0) {
        setStepIndex(0)
        return
      }
      setHole(null)
      setClicking(false)
      setStepIndex(nextIndex)
    },
    [finish, stopTimers],
  )

  const startTour = useCallback(() => {
    stopTimers()
    autoStartedRef.current = true
    setStepIndex(0)
    setHole(null)
    setActive(true)
  }, [stopTimers])

  useEffect(() => {
    if (!user || autoStartedRef.current || active) return undefined
    if (isStudioFullscreenRoute(location.pathname) || isTourBlockedPath(location.pathname)) {
      return undefined
    }
    if (shouldAutoStartTour(user)) {
      autoStartedRef.current = true
      startTour()
    }
    return undefined
  }, [user, location.pathname, startTour, active])

  useEffect(() => {
    function onStart() {
      startTour()
    }
    window.addEventListener(GUIDED_TOUR_START_EVENT, onStart)
    return () => window.removeEventListener(GUIDED_TOUR_START_EVENT, onStart)
  }, [startTour])

  useEffect(() => {
    if (!active) return undefined
    try {
      const params = new URLSearchParams(location.search)
      if (params.get('egitim') === '1') {
        params.delete('egitim')
        const next = `${location.pathname}${params.toString() ? `?${params}` : ''}${location.hash || ''}`
        navigate(next, { replace: true })
      }
    } catch {
      /* ignore */
    }
    return undefined
  }, [active, location.hash, location.pathname, location.search, navigate])

  useEffect(() => {
    if (!active) return undefined
    const current = TOUR_STEPS[stepIndex]
    if (!current) return undefined
    if (isTourBlockedPath(location.pathname) || isStudioFullscreenRoute(location.pathname)) {
      return undefined
    }
    syncTourChrome(current)
    if (current.path && location.pathname !== current.path) {
      navigate(current.path)
      return undefined
    }
    if (current.path === '/stok/urunler') {
      window.dispatchEvent(new CustomEvent('erlenbox:open-products-list'))
    }

    let tries = 0
    const syncHole = () => {
      if (current.kind !== 'spotlight') {
        setHole(null)
        return true
      }
      const next = measureTarget(current.target)
      if (next) {
        const el = document.querySelector(current.target)
        el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
        window.setTimeout(() => {
          setHole(measureTarget(current.target) || next)
        }, 80)
        setClicking(false)
        window.clearTimeout(clickRef.current)
        clickRef.current = window.setTimeout(() => setClicking(true), 480)
        return true
      }
      return false
    }

    const first = window.setTimeout(() => {
      if (!syncHole()) {
        pollRef.current = window.setInterval(() => {
          tries += 1
          if (syncHole() || tries > 30) {
            window.clearInterval(pollRef.current)
            if (tries > 30) setHole(null)
          }
        }, 100)
      }
    }, 60)

    const onMove = () => {
      if (current.kind === 'spotlight') {
        const next = measureTarget(current.target)
        if (next) setHole(next)
      }
    }
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)

    return () => {
      window.clearTimeout(first)
      window.removeEventListener('resize', onMove, true)
      window.removeEventListener('scroll', onMove, true)
      window.clearInterval(pollRef.current)
      window.clearTimeout(clickRef.current)
    }
  }, [active, location.pathname, navigate, stepIndex])

  if (!active || typeof document === 'undefined') return null
  if (isTourBlockedPath(location.pathname) || isStudioFullscreenRoute(location.pathname)) return null

  const point = pointerPoint(hole)
  const cardPos = placeCard(hole)
  const chapterIndex = Math.max(0, CHAPTERS.indexOf(step.chapter || 'Profil'))
  const nextLabel = stepIndex >= TOUR_STEPS.length - 2 ? 'Bitir' : 'Devam et'

  return createPortal(
    <div className="agt-root" role="dialog" aria-modal="true" aria-label="Uygulama eğitim turu">
      <div className="agt-rail" aria-hidden>
        <i style={{ width: `${progressPct}%` }} />
      </div>
      <DimWithHole rect={step.kind === 'spotlight' ? hole : null} />

      {step.kind === 'spotlight' && hole ? (
        <div className="agt-beacon" style={{ top: hole.top, left: hole.left }} aria-hidden />
      ) : null}

      {step.kind === 'spotlight' ? (
        <div
          className={`agt-pointer${clicking ? ' is-clicking' : ''}`}
          style={{
            '--agt-x': `${point.x}px`,
            '--agt-y': `${point.y}px`,
            transform: `translate(${point.x}px, ${point.y}px)`,
          }}
          aria-hidden
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 3.5l14.5 8.4-6.4 1.5-3.2 6.6L5 3.5z"
              fill="#fff"
              stroke="#ea580c"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}

      {step.kind === 'welcome' ? (
        <div className="agt-welcome agt-skin">
          <div className="agt-wordmark">
            BACHMAIN <b>.</b>
          </div>
          <span className="agt-kicker">
            <span className="agt-kicker-dot" />
            Canlı eğitim
          </span>
          <h2 className="agt-title">{step.title}</h2>
          <p className="agt-body">{step.body}</p>
          <WelcomeArt />
          <div className="agt-actions">
            <button type="button" className="agt-btn agt-btn--ghost" onClick={() => finish(true)}>
              Şimdi değil
            </button>
            <div className="agt-actions-right">
              <button type="button" className="agt-btn agt-btn--next" onClick={() => goTo(1)}>
                Eğitime başla
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step.kind === 'spotlight' ? (
        <div
          key={step.id}
          className="agt-card agt-skin"
          style={{ left: cardPos.left, top: cardPos.top }}
        >
          <div className="agt-step-index">
            {step.chapter} · {spotlightPos + 1}/{spotlightSteps.length}
          </div>
          <div className="agt-progress" aria-hidden>
            {CHAPTERS.map((chapter, index) => (
              <span
                key={chapter}
                className={index < chapterIndex ? 'is-done' : index === chapterIndex ? 'is-active' : ''}
              >
                <i />
              </span>
            ))}
          </div>
          <h2 className="agt-title">{step.title}</h2>
          <p className="agt-body">{step.body}</p>
          {step.action ? <p className="agt-action">{step.action}</p> : null}
          <div className="agt-actions">
            <button type="button" className="agt-btn agt-btn--ghost" onClick={() => finish(true)}>
              Atla
            </button>
            <div className="agt-actions-right">
              {stepIndex > 1 ? (
                <button type="button" className="agt-btn agt-btn--ghost" onClick={() => goTo(stepIndex - 1)}>
                  Geri
                </button>
              ) : null}
              <button type="button" className="agt-btn agt-btn--next" onClick={() => goTo(stepIndex + 1)}>
                {nextLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step.kind === 'complete' ? (
        <div className="agt-complete agt-skin">
          <div className="agt-burst">
            <span>
              <Check className="h-7 w-7" strokeWidth={2.6} />
            </span>
          </div>
          <h2 className="agt-title">{step.title}</h2>
          <p className="agt-body">{step.body}</p>
          <div className="agt-actions">
            <button type="button" className="agt-btn agt-btn--ghost" onClick={() => goTo(1)}>
              Yeniden izle
            </button>
            <div className="agt-actions-right">
              <button type="button" className="agt-btn agt-btn--next" onClick={() => finish(false)}>
                Uygulamaya geç
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  )
}
