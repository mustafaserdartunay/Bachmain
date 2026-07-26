'use client'

import { motion } from 'framer-motion'

type RegisterHeroProps = {
  step: 'plan' | 'form' | 'payment' | 'pending'
  planName?: string
}

const titleCls =
  'mt-6 text-4xl font-extrabold uppercase tracking-[-0.04em] text-blue-700 sm:text-5xl lg:text-[3.2rem] lg:leading-[1.1]'

export default function RegisterHero({ step, planName }: RegisterHeroProps) {
  const eyebrow =
    step === 'plan'
      ? 'Önce paketinizi seçin, ardından hesabınızı oluşturun'
      : step === 'form'
        ? `${planName || 'Paket'} — hesap bilgilerinizi girin`
        : step === 'payment'
          ? `${planName || 'Paket'} — ödeme adımı`
          : 'Ödeme onayınız bekleniyor'

  const title =
    step === 'plan' ? 'Paketler' : step === 'payment' || step === 'pending' ? 'Ödeme' : 'Üye Ol'

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

      <motion.h1
        className={titleCls}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
      >
        {title}
      </motion.h1>

      <motion.p
        className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed font-medium text-[#64748B] sm:text-[18px] lg:text-[24px] lg:leading-snug lg:font-semibold"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
      >
        {step === 'plan' ? (
          <>
            Her ölçekteki <span className="font-semibold text-[#475569]">işletme</span> için en
            doğru çözüm.
          </>
        ) : step === 'pending' ? (
          <>Yönetim ödemenizi onayladığında e-posta ile bilgilendirilirsiniz.</>
        ) : (
          <>
            Seçtiğiniz paket: <span className="font-semibold text-[#2563EB]">{planName}</span>
          </>
        )}
      </motion.p>
    </header>
  )
}
