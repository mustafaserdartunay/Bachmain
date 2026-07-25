type PricingBadgeProps = {
  children: string
}

export default function PricingBadge({ children }: PricingBadgeProps) {
  return (
    <span className="absolute -top-3.5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#2563EB] px-4 py-1.5 text-[11px] font-bold tracking-[0.06em] text-white uppercase shadow-[0_8px_20px_rgba(37,99,235,0.35)]">
      {children}
    </span>
  )
}
