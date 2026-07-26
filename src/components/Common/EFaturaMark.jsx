/** GİB e-FATURA mark — liste satırı ve belge önizlemesi için. */
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
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="32" cy="32" r="30" stroke="#C41E3A" strokeWidth="3.5" fill="#fff" />
        <path
          d="M38.5 18.5c-2.2-2.4-5.4-3.8-9.2-3.8-8.2 0-14.2 6.2-14.2 15.4 0 9.4 6.2 15.6 15 15.6 3.6 0 6.6-1 8.8-2.8v-7.2h-8.4v-5.4H48v16.2c-4.2 4.2-10 6.6-17.2 6.6C17.2 53.1 8 43.4 8 30.1 8 16.6 17.4 7 31.2 7c6.2 0 11.4 2 15.2 5.6l-7.9 5.9z"
          fill="#C41E3A"
        />
        <circle cx="32" cy="32" r="4.2" fill="#1e3a8a" />
      </svg>
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

/** Liste satırı için kompakt e rozeti (sütun başı ikon). */
export function EFaturaBadge({ className = '' }) {
  return (
    <span
      className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#C41E3A]/35 bg-white shadow-sm ${className}`}
      title="e-Fatura"
      aria-label="e-Fatura"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="32" cy="32" r="28" stroke="#C41E3A" strokeWidth="4" fill="#fff" />
        <path
          d="M38.5 18.5c-2.2-2.4-5.4-3.8-9.2-3.8-8.2 0-14.2 6.2-14.2 15.4 0 9.4 6.2 15.6 15 15.6 3.6 0 6.6-1 8.8-2.8v-7.2h-8.4v-5.4H48v16.2c-4.2 4.2-10 6.6-17.2 6.6C17.2 53.1 8 43.4 8 30.1 8 16.6 17.4 7 31.2 7c6.2 0 11.4 2 15.2 5.6l-7.9 5.9z"
          fill="#C41E3A"
        />
        <circle cx="32" cy="32" r="4" fill="#1e3a8a" />
      </svg>
      <span className="absolute -bottom-1 -right-1 rounded bg-[#C41E3A] px-1 text-[9px] font-black leading-none text-white">
        e
      </span>
    </span>
  )
}
