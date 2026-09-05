'use client'

import { useSearchParams } from 'react-router-dom'
import AuthAmbient from '../components/auth/AuthAmbient'
import LoginPanel from '../components/auth/LoginPanel'
import StudioAuthShell from '../components/studio/StudioAuthShell'

export default function LoginPage() {
  const [params] = useSearchParams()
  const isStudio = params.get('next') === 'studio'

  if (isStudio) {
    return (
      <StudioAuthShell
        kicker="Üye girişi"
        title="Studio hesabınız"
        lead="Yalnızca Studio üyeliği. Bachmain uygulama hesabı buradan giriş vermez."
      >
        <LoginPanel />
      </StudioAuthShell>
    )
  }

  return (
    <div className="auth-ds relative flex min-h-[100dvh] flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <h1 className="sr-only">Giriş Yap</h1>
      <AuthAmbient />
      <section className="relative z-10 flex min-h-[100dvh] flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1600px]">
          <LoginPanel />
        </div>
      </section>
    </div>
  )
}
