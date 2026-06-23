import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Calendar,
  CheckSquare,
  StickyNote,
} from 'lucide-react'
import { getCrmNotifications } from '../../utils/crmStore'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'

const kindIcons = {
  task: CheckSquare,
  appointment: Calendar,
  note: StickyNote,
}

function urgencyBadge(item) {
  if (item.urgency === 'overdue') return { label: 'GECİKTİ', className: 'bg-red-500/20 text-red-300' }
  if (item.urgency === 'now') return { label: 'ŞİMDİ', className: 'bg-orange-500/20 text-orange-300' }
  return { label: 'BUGÜN', className: 'bg-blue-500/20 text-blue-300' }
}

export default function NotificationDropdown() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(() => getCrmNotifications())

  useEffect(() => {
    function refresh() {
      setNotifications(getCrmNotifications())
    }
    window.addEventListener('bach:crm-updated', refresh)
    const interval = setInterval(refresh, 60000)
    return () => {
      window.removeEventListener('bach:crm-updated', refresh)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined
    function close() { setOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  const count = notifications.length
  const preview = useMemo(() => notifications.slice(0, 8), [notifications])

  function openCrm() {
    setOpen(false)
    navigate('/crm')
  }

  return (
    <div className="relative flex items-center" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`${HEADER_CONTROL_BUTTON_CLASS} relative w-9`}
        aria-label="Bildirimler"
      >
        <Bell className="h-5 w-5 shrink-0" />
        {count > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[9px] font-black text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-96 overflow-hidden rounded-2xl border border-dark-500 bg-dark-800 shadow-2xl shadow-black/35">
          <div className="border-b border-dark-500/55 px-4 py-3">
            <p className="text-sm font-black text-white">CRM Bildirimleri</p>
            <p className="text-[11px] font-semibold text-slate-950">
              Zamanı gelen görevler, randevular ve ajanda notları
            </p>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {preview.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-sm font-bold text-white">Bildirim yok</p>
                <p className="mt-1 text-xs font-semibold text-slate-950">Bugün veya geciken CRM kaydı bulunmuyor.</p>
              </div>
            ) : (
              preview.map((item) => {
                const Icon = kindIcons[item.kind] || Bell
                const badge = urgencyBadge(item)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={openCrm}
                    className="mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-blue-500/10"
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${badge.className}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-xs font-black text-white">{item.title}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${badge.className}`}>
                          {badge.label}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] font-bold text-slate-950">{item.subtitle}</span>
                      {item.detail && (
                        <span className="mt-0.5 block truncate text-[10px] font-medium text-slate-950">{item.detail}</span>
                      )}
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {count > 0 && (
            <div className="border-t border-dark-500/55 p-2">
              <button
                type="button"
                onClick={openCrm}
                className="flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-wide text-blue-300 transition-colors hover:bg-blue-500/10 hover:text-white"
              >
                CRM merkezine git ({count})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
