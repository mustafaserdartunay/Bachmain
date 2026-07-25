type PricingMascotProps = {
  src: string
  alt: string
  variant: 'starter' | 'pro' | 'enterprise'
}

/**
 * Bachy poses locked to reference mockup positions.
 * Never stretch — height-driven, width:auto.
 */
export default function PricingMascot({ src, alt, variant }: PricingMascotProps) {
  const base =
    'pointer-events-none absolute z-20 w-auto max-w-none select-none drop-shadow-[0_18px_28px_rgba(15,23,42,0.18)]'

  if (variant === 'starter') {
    return (
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={`${base} -left-8 bottom-4 h-[210px] sm:-left-12 sm:h-[250px] lg:-left-[4.5rem] lg:bottom-6 lg:h-[300px] xl:-left-20 xl:h-[320px]`}
      />
    )
  }

  if (variant === 'pro') {
    return (
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={`${base} -left-6 top-12 h-[190px] sm:-left-10 sm:top-10 sm:h-[220px] lg:-left-14 lg:top-8 lg:h-[250px] xl:-left-16 xl:h-[270px]`}
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`${base} -top-14 left-[8%] h-[110px] sm:-top-16 sm:h-[130px] lg:-top-[4.5rem] lg:left-[6%] lg:h-[150px] xl:-top-20 xl:h-[165px]`}
    />
  )
}
