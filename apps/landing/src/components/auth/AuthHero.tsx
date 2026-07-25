import { motion } from 'framer-motion'

type AuthHeroProps = {
  title: string
  eyebrow: string
  subtitle?: string
}

/** Shared hero for login / forgot / reset — matches register language. */
export default function AuthHero({ title, eyebrow, subtitle }: AuthHeroProps) {
  return (
    <header className="mx-auto max-w-[960px] px-4 text-center">
      <motion.p
        className="text-[14px] font-medium tracking-tight text-[#64748B] sm:text-[16px]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {eyebrow}
      </motion.p>

      <motion.div
        className="mt-6 flex flex-col items-center justify-center gap-4 sm:gap-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
      >
        <img
          src="/assets/bachmain-logo.png"
          alt="BACHMAIN"
          className="h-[1.65rem] w-auto select-none sm:h-8"
          decoding="async"
          draggable={false}
        />
        <h1 className="text-[2.75rem] leading-[1.05] font-light tracking-tight text-[#0F172A] sm:text-[3.5rem] lg:text-[72px]">
          {title}
        </h1>
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
    </header>
  )
}
