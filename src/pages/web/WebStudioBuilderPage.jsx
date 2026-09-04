import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { getStoredSession } from '../../utils/platformAuth'
import { WEB_STUDIO_MANAGEMENT_PATH } from '../../data/webMenu'

function buildStudioUrls(token) {
  const params = new URLSearchParams({ embed: '1' })
  if (token) params.set('authToken', token)
  const query = params.toString()
  const path = `/website-os/website/builder?${query}`
  const openPath = `/website-os/website/builder${token ? `?authToken=${encodeURIComponent(token)}` : ''}`
  return { embedSrc: path, openHref: openPath }
}

export default function WebStudioBuilderPage() {
  const { embedSrc, openHref } = useMemo(() => buildStudioUrls(getStoredSession().token || ''), [])
  const [active, setActive] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setActive(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className={`web-studio-fullscreen ${active ? 'is-active' : ''}`.trim()}>
      <div className="web-studio-backbar">
        <Link to="/" className="web-studio-back-link" title="BACHMAIN'e dön">
          <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
          <span>BACHMAIN&apos;e dön</span>
        </Link>
        <p className="web-studio-backbar-title">Studio · Web düzenleme</p>
        <div className="ml-auto flex items-center gap-2">
          <Link to={WEB_STUDIO_MANAGEMENT_PATH} className="web-studio-back-link">
            Yönetim
          </Link>
          <a
            href={openHref}
            target="_blank"
            rel="noopener noreferrer"
            className="web-studio-back-link"
            title="Tam ekran yeni sekmede"
          >
            Tam ekran
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>
      <iframe
        title="BACHMAIN Studio — web sitesi düzenleme"
        src={embedSrc}
        className="web-studio-embed-frame"
        allow="clipboard-write"
      />
    </div>
  )
}
