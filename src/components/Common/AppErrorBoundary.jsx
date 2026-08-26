import { Component } from 'react'
import { useLocation } from 'react-router-dom'
import { APP_SURFACE_PANEL_CLASS, YF_TEXT_CLASS, YFB_TEXT_CLASS } from '../../utils/dashboardDesign'
import { BTN_PRIMARY } from '../../utils/buttonStyles'

const CHUNK_RELOAD_KEY = 'bach-chunk-reload'

function isStaleChunkError(error) {
  const msg = String(error?.message || error || '')
  return /Loading chunk|dynamically imported module|Failed to fetch|error loading dynamically imported/i.test(
    msg,
  )
}

/** Vite deploy sonrası eski chunk 404 → bir kez yenile. */
export function installChunkLoadRecovery() {
  if (typeof window === 'undefined') return

  function reloadOnce() {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
    } catch {
      /* ignore */
    }
    window.location.reload()
  }

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()
    reloadOnce()
  })

  window.addEventListener('unhandledrejection', (event) => {
    if (isStaleChunkError(event.reason)) reloadOnce()
  })
}

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error, info) {
    console.error('[bachmain] render error', error, info?.componentStack)
    if (isStaleChunkError(error)) {
      try {
        if (sessionStorage.getItem(CHUNK_RELOAD_KEY) !== '1') {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
          window.location.reload()
        }
      } catch {
        /* ignore */
      }
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    const isPage = this.props.variant === 'page'
    const title = isPage ? 'Bu bölümde beklenmeyen bir hata oluştu.' : 'Sayfa yüklenemedi'
    const body = isPage
      ? 'Diğer menüler çalışmaya devam eder. Bu bölümü yeniden deneyin.'
      : 'Uygulama beklenmeyen bir hata verdi. Yenilemeyi deneyin; sorun sürerse çıkış yapıp tekrar girin.'

    return (
      <div
        className={
          isPage
            ? 'flex min-h-[40vh] items-center justify-center p-6'
            : 'flex min-h-[100dvh] items-center justify-center p-6'
        }
      >
        <section className={`${APP_SURFACE_PANEL_CLASS} max-w-md p-6 text-center`}>
          <p className={`${YFB_TEXT_CLASS} text-[var(--ink)]`}>{title}</p>
          <p className={`${YF_TEXT_CLASS} mt-2 whitespace-normal`}>{body}</p>
          <button
            type="button"
            className={`${BTN_PRIMARY} mt-5 w-full px-4 text-white`}
            onClick={() => {
              if (isPage) {
                this.setState({ error: null })
                return
              }
              window.location.reload()
            }}
          >
            {isPage ? 'Tekrar dene' : 'Yenile'}
          </button>
        </section>
      </div>
    )
  }
}

/** Route-level boundary — bir sayfa çökünce Layout/CRM ayakta kalır. */
export function PageErrorBoundary({ children }) {
  const location = useLocation()
  return (
    <AppErrorBoundary variant="page" resetKey={location.pathname + location.search}>
      {children}
    </AppErrorBoundary>
  )
}
