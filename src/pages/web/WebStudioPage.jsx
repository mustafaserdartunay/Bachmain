import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

const DROPELYA_ADMIN_ORIGIN = (
  import.meta.env.VITE_DROPELYA_ADMIN_URL ||
  import.meta.env.VITE_WEBSITE_URL ||
  (import.meta.env.PROD ? 'https://dropelya.com' : 'http://localhost:3000')
).replace(/\/$/, '')

function buildEmbedSrc() {
  const params = new URLSearchParams({ embed: '1' })
  return `${DROPELYA_ADMIN_ORIGIN}/yonetim?${params.toString()}`
}

export default function WebStudioPage() {
  const embedSrc = useMemo(() => buildEmbedSrc(), [])
  const [active, setActive] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setActive(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className={`web-studio-fullscreen ${active ? 'is-active' : ''}`.trim()}>
      <div className="web-studio-backbar">
        <Link to="/" className="web-studio-back-link" title="BachMain'e dön">
          <ChevronLeft className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
          <span>BachMain&apos;e Dön</span>
        </Link>
        <p className="web-studio-backbar-title">Dropelya Web · Yönetim</p>
      </div>
      <iframe
        title="Dropelya mağaza yönetimi"
        src={embedSrc}
        className="web-studio-embed-frame"
        allow="clipboard-write"
      />
    </div>
  )
}
