import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  Check,
  FileText,
  ImagePlus,
  Package,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { isStudioFullscreenRoute } from '../../data/webMenu'
import {
  consumeTourForceFlag,
  isTourBlockedPath,
  markTourFinished,
  shouldAutoStartTour,
  TOUR_STEPS,
  GUIDED_TOUR_START_EVENT,
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
  const cardW = Math.min(360, vw - 24)
  const cardH = 300
  const gap = 16
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
  top = Math.max(12, Math.min(top, vh - Math.min(cardH, vh * 0.55) - 12))
  left = Math.max(12, Math.min(left, vw - cardW - 12))
  return { left, top }
}

function pointerPoint(rect) {
  if (!rect) {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.42,
    }
  }
  return {
    x: rect.left + Math.min(48, rect.width * 0.55),
    y: rect.top + Math.min(36, rect.height * 0.55),
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

function SceneMark({ id }) {
  if (id === 'company-logo' || id === 'company-save') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden>
        <rect x="10" y="12" width="44" height="40" rx="8" fill="none" stroke="#93c5fd" strokeWidth="2.2" />
        <path d="M18 40l10-11 8 7 10-14" fill="none" stroke="#a78bfa" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="24" cy="24" r="4" fill="#60a5fa" />
      </svg>
    )
  }
  if (id === 'customer-form') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden>
        <circle cx="24" cy="22" r="8" fill="none" stroke="#93c5fd" strokeWidth="2.2" />
        <path d="M10 46c2-8 8-12 14-12s12 4 14 12" fill="none" stroke="#93c5fd" strokeWidth="2.2" />
        <circle cx="44" cy="24" r="6" fill="none" stroke="#a78bfa" strokeWidth="2" />
        <path d="M36 46c1.4-6 6-9 10-9 3 0 6 1.5 8 5" fill="none" stroke="#a78bfa" strokeWidth="2" />
      </svg>
    )
  }
  if (id === 'product-create') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden>
        <path d="M12 24l20-10 20 10v22L32 56 12 46V24z" fill="none" stroke="#93c5fd" strokeWidth="2.2" />
        <path d="M12 24l20 10 20-10M32 34v22" fill="none" stroke="#a78bfa" strokeWidth="2" />
      </svg>
    )
  }
  if (id === 'quote-create') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden>
        <rect x="14" y="10" width="30" height="42" rx="4" fill="none" stroke="#93c5fd" strokeWidth="2.2" />
        <path d="M22 22h14M22 30h14M22 38h8" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
        <circle cx="46" cy="44" r="10" fill="#1d4ed8" />
        <path d="M41 44l3.2 3.2 7-7" fill="none" stroke="#dbeafe" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 64 64" aria-hidden>
      <rect x="12" y="16" width="40" height="32" rx="6" fill="none" stroke="#93c5fd" strokeWidth="2.2" />
      <path d="M20 28h24M20 36h16" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function WelcomeArt() {
  const nodes = [
    { label: 'Profil', caption: 'Logo + bilgiler', Icon: Building2 },
    { label: 'Müşteri', caption: 'Kart açın', Icon: UserRound },
    { label: 'Ürün', caption: 'Kalem ekleyin', Icon: Package },
    { label: 'Teklif', caption: 'Süreci başlatın', Icon: FileText },
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

export default function AppGuidedTour() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [hole, setHole] = useState(null)
  const [clicking, setClicking] = useState(false)
  const dwellRef = useRef(null)
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
    window.clearTimeout(dwellRef.current)
    window.clearInterval(pollRef.current)
    window.clearTimeout(clickRef.current)
  }, [])

  const finish = useCallback(
    (skipped = false) => {
      stopTimers()
      markTourFinished(user, { skipped })
      consumeTourForceFlag()
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
        el?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
        setHole(measureTarget(current.target) || next)
        setClicking(false)
        window.clearTimeout(clickRef.current)
        clickRef.current = window.setTimeout(() => setClicking(true), 520)
        return true
      }
      return false
    }

    if (!syncHole()) {
      pollRef.current = window.setInterval(() => {
        tries += 1
        if (syncHole() || tries > 25) {
          window.clearInterval(pollRef.current)
          if (tries > 25) setHole(null)
        }
      }, 90)
    }

    const onMove = () => {
      if (current.kind === 'spotlight') {
        const next = measureTarget(current.target)
        if (next) setHole(next)
      }
    }
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)

    if (current.dwellMs > 0) {
      dwellRef.current = window.setTimeout(() => goTo(stepIndex + 1), current.dwellMs)
    }

    return () => {
      window.removeEventListener('resize', onMove, true)
      window.removeEventListener('scroll', onMove, true)
      window.clearInterval(pollRef.current)
      window.clearTimeout(dwellRef.current)
      window.clearTimeout(clickRef.current)
    }
  }, [active, goTo, location.pathname, navigate, stepIndex])

  if (!active || typeof document === 'undefined') return null
  if (isTourBlockedPath(location.pathname) || isStudioFullscreenRoute(location.pathname)) return null

  const point = pointerPoint(hole)
  const cardPos = placeCard(hole)
  const chapterIndex = Math.max(0, CHAPTERS.indexOf(step.chapter || 'Profil'))

  return createPortal(
    <div className="agt-root" role="dialog" aria-modal="true" aria-label="Uygulama eğitim turu">
      <div className="agt-rail" aria-hidden>
        <i style={{ width: `${progressPct}%` }} />
      </div>
      <DimWithHole rect={step.kind === 'spotlight' ? hole : null} />

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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 3.5l14.5 8.4-6.4 1.5-3.2 6.6L5 3.5z"
              fill="#f8fafc"
              stroke="#1d4ed8"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}

      {step.kind === 'welcome' ? (
        <div className="agt-welcome">
          <span className="agt-kicker">
            <Sparkles className="h-3 w-3" />
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
          className="agt-card"
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
          <div className="agt-scene">
            <SceneMark id={step.id} />
          </div>
          <h2 className="agt-title">{step.title}</h2>
          <p className="agt-body">{step.body}</p>
          {step.hint ? (
            <div className="agt-hint">
              {step.id === 'company-logo' ? <ImagePlus className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              {step.hint}
            </div>
          ) : null}
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
                Devam
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step.kind === 'complete' ? (
        <div className="agt-complete">
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
