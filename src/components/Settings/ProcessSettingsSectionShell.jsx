/**
 * Süreçler Yönetimi — Teklif Süreçleri referans kabuğu.
 * Tüm süreç panelleri aynı cam/mavi premium yüzeyi kullanır.
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
      className={`relative overflow-hidden rounded-3xl border border-blue-500/20 bg-dark-800/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.35)] ${className}`.trim()}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_46%)]" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(to_right,transparent,rgba(96,165,250,0.6),transparent)]" />
      <div className="relative z-10">
        <h2 className="text-4xl font-black tracking-tight text-blue-400 sm:text-5xl">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm font-semibold text-gray-400">{description}</p>
        ) : null}
        {meta ? <p className="mt-1 text-[13px] font-bold text-gray-500">{meta}</p> : null}
        {children}
      </div>
    </section>
  )
}

export const PROCESS_PANEL_INNER_CLASS = 'rounded-2xl border-white/10 bg-dark-900/35 shadow-inner'
