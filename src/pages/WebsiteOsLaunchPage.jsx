import { ExternalLink, Globe2 } from 'lucide-react'

const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://site.bachmain.com'

/**
 * Thin product bridge: CRM/ERP does not embed Website Builder.
 * Website customers should primarily land on Website OS directly.
 */
export default function WebsiteOsLaunchPage() {
  const token = (() => {
    try {
      return localStorage.getItem('bachmain_auth_token') || ''
    } catch {
      return ''
    }
  })()

  const base = WEBSITE_URL.replace(/\/$/, '')
  const href = token
    ? `${base}/website/dashboard?authToken=${encodeURIComponent(token)}`
    : `${base}/website/dashboard`

  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ds-surface-2,#f1f5f9)]">
        <Globe2 className="h-6 w-6" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold">Website OS</h1>
      <p className="text-sm text-[var(--ds-text-muted,#64748b)]">
        Website Builder ayrı bir üründür. CRM/ERP alanından bağımsız olarak sitelerini tasarlarsın.
      </p>
      <a
        href={href}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--ds-navy,#0a1628)] px-4 py-2.5 text-sm font-semibold text-white"
      >
        Website OS&apos;a git <ExternalLink className="h-4 w-4" aria-hidden />
      </a>
    </div>
  )
}
