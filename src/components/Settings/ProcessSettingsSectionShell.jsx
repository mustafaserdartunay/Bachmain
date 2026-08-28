import { APP_SURFACE_PANEL_CLASS } from '../../utils/dashboardDesign'

/**
 * Süreçler Yönetimi — Teklif Süreçleri referans kabuğu.
 * Cam zemin (app-surface-panel); opak gri tabaka yok.
 */
export default function ProcessSettingsSectionShell({
  title,
  description,
  meta,
  children,
  className = '',
}) {
  return (
    <section
      className={`process-settings-section-shell relative overflow-hidden rounded-3xl border border-blue-500/20 ${APP_SURFACE_PANEL_CLASS} p-6 ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_46%)]" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(96,165,250,0.45),transparent)]" />
      <div className="relative z-10">
        <h2 className="text-4xl font-black tracking-tight text-blue-400 sm:text-5xl">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm font-semibold text-[var(--muted)]">{description}</p>
        ) : null}
        {meta ? <p className="mt-1 text-[13px] font-bold text-[var(--muted)]">{meta}</p> : null}
        {children}
      </div>
    </section>
  )
}

export const PROCESS_PANEL_INNER_CLASS =
  'rounded-2xl border border-[var(--glass-border)] bg-white/10 shadow-inner backdrop-blur-sm'
