import { motion } from 'framer-motion'

export default function PricingHero() {
  return (
    <header className="mx-auto max-w-[960px] px-4 text-center">
      <motion.p
        className="text-[14px] font-medium tracking-tight text-[#64748B] sm:text-[16px]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        İhtiyacınıza en uygun paketi seçin
      </motion.p>

      <motion.h1
        className="mt-4 text-[2.5rem] leading-[1.1] font-extrabold tracking-tight text-[#0F172A] sm:text-[3.25rem] lg:text-[72px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
      >
        BachMain{' '}
        <span className="relative inline-block text-[#2563EB]">
          Paketleri
          <span
            className="absolute right-[2%] -bottom-1 left-[10%] h-[6px] rounded-full bg-[#FFB000] sm:h-[8px] lg:-bottom-2 lg:h-[10px]"
            aria-hidden
          />
        </span>
      </motion.h1>

      <motion.p
        className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed font-medium text-[#64748B] sm:text-[18px] lg:text-[24px] lg:leading-snug lg:font-semibold"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
      >
        Her ölçekteki <span className="font-semibold text-[#475569]">işletme</span> için en doğru
        çözüm.
      </motion.p>
    </header>
  )
}
