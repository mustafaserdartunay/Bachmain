import { useMemo } from 'react'
import { ExternalLink, Globe2 } from 'lucide-react'

const WEBSITE_OS_ORIGIN = (import.meta.env.VITE_WEBSITE_URL || '').replace(/\/$/, '')

function readAuthToken() {
  try {
    return localStorage.getItem('bachmain_auth_token') || ''
  } catch {
    return ''
  }
}

function buildStudioUrls(token) {
  const params = new URLSearchParams({ embed: '1' })
  if (token) params.set('authToken', token)
  const query = params.toString()

  // Same-origin: Website OS build lives under /website-os/ inside CRM
  const localPath = `/website-os/website/dashboard?${query}`
  const openPath = `/website-os/website/dashboard${token ? `?authToken=${encodeURIComponent(token)}` : ''}`

  if (WEBSITE_OS_ORIGIN && !WEBSITE_OS_ORIGIN.includes('site.bachmain.com')) {
    return {
      embedSrc: `${WEBSITE_OS_ORIGIN}/website/dashboard?${query}`,
      openHref: `${WEBSITE_OS_ORIGIN}/website/dashboard${token ? `?authToken=${encodeURIComponent(token)}` : ''}`,
    }
  }

  return { embedSrc: localPath, openHref: openPath }
}

export default function WebStudioPage() {
  const { embedSrc, openHref } = useMemo(() => buildStudioUrls(readAuthToken()), [])

  return (
    <div className="web-studio-embed-shell flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-3 px-1 lg:px-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--glass-bg)]">
            <Globe2 className="h-4 w-4 text-[var(--muted)]" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-bold uppercase text-[var(--muted)]">Dropelya Studio</p>
            <p className="truncate text-[12px] text-[var(--muted)]/80">
              Ürünler · koleksiyonlar · builder · şablonlar · yayın
            </p>
          </div>
        </div>
        <a
          href={openHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-dark-500/40 px-3 py-2 text-[12px] font-semibold text-[var(--muted)] transition-opacity hover:opacity-80"
        >
          Tam ekran
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
      <iframe
        title="Dropelya — Website OS yönetim paneli"
        src={embedSrc}
        className="web-studio-embed-frame min-h-0 w-full flex-1 rounded-2xl border border-dark-500/40 bg-white shadow-card"
        allow="clipboard-write"
      />
    </div>
  )
}
