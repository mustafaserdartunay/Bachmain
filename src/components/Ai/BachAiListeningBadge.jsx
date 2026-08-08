import { YF_TEXT_CLASS } from '../../utils/dashboardDesign'

/**
 * Privacy indicator while wake-word / Realtime listening is active.
 * Shows only when `active` — never implies background cloud listening.
 */
export default function BachAiListeningBadge({
  active = false,
  label = 'Bach AI dinliyor…',
  className = '',
}) {
  if (!active) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full border border-[rgba(37,99,235,0.28)] bg-[rgba(37,99,235,0.10)] px-3 py-1.5 ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
      </span>
      <span className={`${YF_TEXT_CLASS} text-blue-700`}>{label}</span>
    </div>
  )
}
