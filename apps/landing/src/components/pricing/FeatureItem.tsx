type FeatureItemProps = {
  label: string
  tone?: 'blue' | 'gold'
}

export default function FeatureItem({ label, tone = 'blue' }: FeatureItemProps) {
  const mark = tone === 'gold' ? 'text-[#FFB000]' : 'text-[#2563EB]'
  return (
    <li
      className={`flex items-start gap-3 text-[15px] leading-snug font-medium tracking-tight ${
        tone === 'gold' ? 'text-[#E2E8F0]' : 'text-[#334155]'
      }`}
    >
      <span
        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center ${mark}`}
        aria-hidden
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
          <path
            d="M16.5 5.5 8.25 14 3.5 9.5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{label}</span>
    </li>
  )
}
