import { motion } from 'framer-motion'

type RegisterHeroProps = {
  step: 'plan' | 'form' | 'payment' | 'pending'
  planName?: string
}

export default function RegisterHero({ step, planName }: RegisterHeroProps) {
  const eyebrow =
    step === 'plan'
      ? 'Önce paketinizi seçin, ardından hesabınızı oluşturun'
      : step === 'form'
        ? `${planName || 'Paket'} — hesap bilgilerinizi girin`
        : step === 'payment'
          ? `${planName || 'Paket'} — ödeme adımı`
          : 'Ödeme onayınız bekleniyor'

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
          {step === 'plan'
            ? 'Paketler'
            : step === 'payment' || step === 'pending'
              ? 'Ödeme'
              : 'Üye Ol'}
        </h1>
      </motion.div>

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
