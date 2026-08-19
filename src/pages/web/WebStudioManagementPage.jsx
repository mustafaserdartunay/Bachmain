import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getDropelyaYonetimUrl } from '../../utils/dropelyaStudio'

export default function WebStudioManagementPage() {
  const src = useMemo(() => getDropelyaYonetimUrl(), [])
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const origin = new URL(src).origin
    fetch(origin, { mode: 'no-cors', cache: 'no-store' })
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    const timer = window.setTimeout(() => {
      if (!cancelled) setReady(true)
    }, 1200)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [src])

  return (
    <div className="fixed inset-0 z-[70] bg-[#e8eef6]">
      {failed ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-lg font-bold text-[#203375]">Studio yönetim açılamadı</p>
          <p className="max-w-md text-sm text-[#64748b]">
            Dropelya yönetim sunucusu kapalı. Yerelde şu adresi çalıştırın, sonra tekrar deneyin:
          </p>
          <p className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#203375]">
            http://localhost:3000/yonetim
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#203375] px-4 py-2 text-sm font-semibold text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Uygulamaya dön
          </Link>
        </div>
      ) : (
        <iframe
          title="Studio yönetim"
          src={src}
          className={`h-full w-full border-0 bg-white transition-opacity duration-500 ${
            ready ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}
