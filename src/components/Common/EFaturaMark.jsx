/**
 * Türkiye e-FATURA markası — kırmızı daire içinde stilize “e” + e-FATURA yazısı.
 * GİB belge görsellerinde kullanılan orijinal ikon dili.
 */
function EFaturaLogoSvg({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="30" fill="#fff" stroke="#C41E3A" strokeWidth="3.5" />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fill="#C41E3A"
        fontFamily="Arial Black, Arial, Helvetica, sans-serif"
        fontSize="34"
        fontWeight="800"
        letterSpacing="-1"
      >
        e
      </text>
    </svg>
  )
}

export default function EFaturaMark({ size = 36, className = '', showLabel = true }) {
  const labelH = showLabel ? Math.round(size * 0.28) : 0
  const totalH = size + (showLabel ? labelH + 2 : 0)

  return (
    <span
      className={`inline-flex flex-col items-center justify-center ${className}`}
      style={{ width: size, height: totalH }}
      title="e-Fatura"
      aria-label="e-Fatura"
    >
      <EFaturaLogoSvg size={size} />
      {showLabel ? (
        <span
          className="mt-0.5 font-black leading-none tracking-tight text-[#C41E3A]"
          style={{ fontSize: Math.max(8, labelH) }}
        >
          e-FATURA
        </span>
      ) : null}
    </span>
  )
}

/** Liste satırı — orijinal daire e-Fatura ikonu. */
export function EFaturaBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#C41E3A]/30 bg-white shadow-sm ${className}`}
      title="e-Fatura"
      aria-label="e-Fatura"
    >
      <EFaturaLogoSvg size={28} />
    </span>
  )
}
