'use client'

import { motion, useReducedMotion } from 'framer-motion'

type AuthHeroProps = {
  title: string
  eyebrow?: string
  subtitle?: string
  showBachy?: boolean
  showLogo?: boolean
  showTrust?: boolean
  uppercaseTitle?: boolean
}

const titleCls =
  'text-4xl font-extrabold tracking-[-0.045em] text-blue-700 sm:text-5xl lg:text-[3.2rem] lg:leading-[1.1]'

/** Shared hero for login / forgot / reset — Bachy lightly greets without covering form. */
export default function AuthHero({
  title,
  eyebrow,
  subtitle,
  showBachy = true,
  showLogo = true,
  showTrust = true,
  uppercaseTitle = false,
}: AuthHeroProps) {
  const reduce = useReducedMotion()

  return (
    <header className="relative mx-auto max-w-[960px] px-4 text-center">
      {showBachy ? (
        <motion.img
          src="/bachy/bachy-register.webp"
          alt=""
          width={120}
          height={220}
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute -right-2 top-0 hidden h-28 w-auto select-none sm:block lg:-right-6 lg:h-36"
          animate={reduce ? undefined : { y: [0, -5, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : null}

      {eyebrow ? (
        <motion.p
          className="text-[14px] font-medium tracking-tight text-[#64748B] sm:text-[16px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {eyebrow}
        </motion.p>
      ) : null}

      <motion.div
        className={`flex flex-wrap items-center justify-center gap-3 sm:gap-4 ${eyebrow ? 'mt-6' : ''}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
      >
        {showLogo ? (
          <img
            src="/assets/bachmain-logo.png"
            alt="BACHMAIN"
            width={160}
            height={36}
            className="h-[1.65rem] w-auto select-none sm:h-8"
            decoding="async"
            fetchPriority="high"
            draggable={false}
          />
        ) : null}
        <h1 className={`${titleCls}${uppercaseTitle ? ' uppercase' : ''}`}>{title}</h1>
      </motion.div>

      {subtitle ? (
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed font-medium text-[#64748B] sm:text-[18px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
        >
          {subtitle}
        </motion.p>
      ) : null}

      {showTrust ? (
        <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Güven unsurları">
          {['KVKK', 'SSL', 'Veri Güvenliği', 'Bulut Altyapı'].map((t) => (
            <li
              key={t}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-600"
            >
              {t}
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  )
}
