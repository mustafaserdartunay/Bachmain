/**
 * Kapalı / Açık dinamik özellik anahtarı — Bach CTA button sistemi.
 * Kapalı: rose gradient · Açık: sky→blue gradient · kayan pill + hover lift.
 */
export default function FeatureToggleButton({
  enabled,
  onChange,
  onLabel = 'Açık',
  offLabel = 'Kapalı',
  ariaLabel = 'Özellik durumu',
  className = '',
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={ariaLabel}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-[52px] w-[168px] shrink-0 items-stretch overflow-hidden rounded-xl p-1 shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] transition-transform duration-200 hover:-translate-y-0.5 ${className}`.trim()}
      style={{
        backgroundImage: enabled
          ? 'linear-gradient(to bottom right, #8ad9ff, #60a5fa, #3b82f6)'
          : 'linear-gradient(to bottom right, #fda4af, #f43f5e, #e11d48)',
      }}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-[10px] bg-white shadow-[0_4px_12px_-6px_rgba(30,35,60,0.45)] transition-all duration-300 ease-out ${
          enabled ? 'left-[calc(50%+2px)]' : 'left-1'
        }`}
      />
      <span
        className={`relative z-[1] flex flex-1 items-center justify-center text-[12px] font-black uppercase tracking-wide transition-colors duration-300 ${
          enabled ? 'text-white/80' : 'text-[var(--ink,#1e2235)]'
        }`}
      >
        {offLabel}
      </span>
      <span
        className={`relative z-[1] flex flex-1 items-center justify-center text-[12px] font-black uppercase tracking-wide transition-colors duration-300 ${
          enabled ? 'text-[var(--ink,#1e2235)]' : 'text-white/80'
        }`}
      >
        {onLabel}
      </span>
    </button>
  )
}
