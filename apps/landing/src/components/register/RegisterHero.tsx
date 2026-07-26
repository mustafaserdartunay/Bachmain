'use client'

import { motion } from 'framer-motion'

type RegisterHeroProps = {
  step: 'plan' | 'form' | 'payment' | 'pending'
  planName?: string
}

/** Demo / giriş ile aynı: büyük uppercase başlık; form adımında ek metin yok. */
export default function RegisterHero({ step, planName }: RegisterHeroProps) {
  if (step === 'form') {
    return (
      <header className="mx-auto max-w-[640px] px-0 text-center">
        <h1 className="sr-only">Üye Ol</h1>
      </header>
    )
  }

  const title =
    step === 'plan' ? 'Paketler' : step === 'payment' || step === 'pending' ? 'Ödeme' : 'Üye Ol'

  const subtitle =
    step === 'plan' ? (
      <>
        Her ölçekteki <span className="font-semibold text-[#475569]">işletme</span> için en doğru
        çözüm.
      </>
    ) : step === 'pending' ? (
      <>Yönetim ödemenizi onayladığında e-posta ile bilgilendirilirsiniz.</>
    ) : step === 'payment' ? (
      <>
        Seçtiğiniz paket: <span className="font-semibold text-[#2563EB]">{planName}</span>
      </>
    ) : null

  return (
    <header className="mx-auto max-w-[960px] px-4 text-center">
      <motion.h1
        className="text-4xl font-extrabold tracking-[-0.04em] text-[#2563EB] uppercase sm:text-5xl lg:text-[3.2rem] lg:leading-[1.1]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {title}
      </motion.h1>

      {subtitle ? (
        <motion.p
          className="mx-auto mt-4 max-w-2xl text-[14px] leading-relaxed font-medium text-[#64748B] sm:text-[16px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
        >
          {subtitle}
        </motion.p>
      ) : null}
    </header>
  )
}
