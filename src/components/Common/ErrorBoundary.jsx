import { Component } from 'react'
import { captureException } from '../../utils/sentry'

/**
 * Global React error boundary — prevents white-screen on unexpected render errors.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Beklenmeyen bir hata oluştu',
    }
  }

  componentDidCatch(error, info) {
    captureException(error, {
      componentStack: info?.componentStack,
      boundary: this.props.name || 'root',
    })
  }

  handleReload = () => {
    this.setState({ hasError: false, message: '' })
    if (typeof window !== 'undefined') window.location.assign('/')
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Bir şeyler ters gitti</h1>
          <p className="max-w-md text-sm text-slate-600">
            Sayfa yüklenirken beklenmeyen bir hata oluştu. Verileriniz güvende; sayfayı yenilemeyi
            deneyin.
          </p>
          {import.meta.env.DEV && this.state.message ? (
            <pre className="max-w-lg overflow-auto rounded border border-slate-200 bg-white p-3 text-left text-xs text-red-600">
              {this.state.message}
            </pre>
          ) : null}
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Ana sayfaya dön
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
