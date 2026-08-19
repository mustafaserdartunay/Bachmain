import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getDropelyaEmbedUrl, STUDIO_HOST_EVENT, STUDIO_MESSAGE_TYPE } from '../../utils/dropelyaStudio'

export default function WebStudioManagementPage() {
  const { pathname } = useLocation()
  const src = getDropelyaEmbedUrl(pathname)
  const frameRef = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
    const timer = window.setTimeout(() => {
      try {
        const frame = frameRef.current
        if (frame && !frame.contentWindow) setFailed(true)
      } catch {
        /* ignore */
      }
    }, 8000)
    return () => window.clearTimeout(timer)
  }, [src])

  useEffect(() => {
    function onCommand(event) {
      const action = event.detail?.action
      const win = frameRef.current?.contentWindow
      if (!action || !win) return
      win.postMessage({ type: STUDIO_MESSAGE_TYPE, action }, 'http://localhost:3000')
    }
    window.addEventListener(STUDIO_HOST_EVENT, onCommand)
    return () => window.removeEventListener(STUDIO_HOST_EVENT, onCommand)
  }, [])

  useEffect(() => {
    function onMessage(event) {
      if (event.origin !== 'http://localhost:3000') return
      const data = event.data
      if (!data || data.type !== STUDIO_MESSAGE_TYPE) return
      window.dispatchEvent(new CustomEvent('bach:studio-status', { detail: data }))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <div className="studio-crm-host -mx-3 min-h-[calc(100dvh-12.5rem)] overflow-hidden rounded-[22px] border border-[var(--glass-border,rgba(255,255,255,0.75))] bg-[var(--glass-bg,rgba(255,255,255,0.72))] shadow-[0_10px_36px_-14px_rgba(30,35,60,0.14)] sm:-mx-4 lg:mx-0">
      {failed ? (
        <div className="flex min-h-[28rem] flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-base font-bold text-[#203375]">Studio yönetim açılamadı</p>
          <p className="text-sm text-[#64748b]">Dropelya yönetimini yerelde çalıştırın: http://localhost:3000/yonetim</p>
        </div>
      ) : (
        <iframe
          ref={frameRef}
          title="Studio yönetim"
          src={src}
          className="block h-[calc(100dvh-12.5rem)] min-h-[36rem] w-full border-0 bg-transparent"
        />
      )}
    </div>
  )
}
