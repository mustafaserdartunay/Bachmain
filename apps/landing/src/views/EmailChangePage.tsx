'use client'

import AuthAmbient from '../components/auth/AuthAmbient'
import EmailChangePanel from '../components/auth/EmailChangePanel'

export default function EmailChangePage() {
  return (
    <div className="auth-ds relative flex min-h-[100dvh] flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <AuthAmbient />
      <section className="relative z-10 flex min-h-[100dvh] flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:px-10">
        <div className="w-full max-w-[560px]">
          <h1 className="mb-8 text-center text-3xl font-extrabold tracking-[-0.04em] text-[#2563EB] sm:text-4xl">
            E-posta Değiştir
          </h1>
          <EmailChangePanel />
        </div>
      </section>
    </div>
  )
}
