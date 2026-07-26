'use client'

import AuthHero from '../components/auth/AuthHero'
import ForgotPasswordPanel from '../components/auth/ForgotPasswordPanel'

export default function ForgotPasswordPage() {
  return (
    <div className="auth-ds bg-[#F8FAFC]">
      <section className="relative overflow-x-clip pt-[120px] pb-[120px]">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#E2E8F0]/55 via-[#F1F5F9]/35 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-12">
          <AuthHero
            title="Şifremi Unuttum"
            eyebrow="Hesabınızı kurtarın"
            subtitle="Sıfırlama bağlantısı e-posta ile gelir; yönetim panelinde iletim durumu görünür."
          />
          <div className="mt-14 lg:mt-16">
            <ForgotPasswordPanel />
          </div>
        </div>
      </section>
    </div>
  )
}
