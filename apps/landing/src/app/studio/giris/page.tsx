import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginPage from '../../../views/LoginPage'

export const metadata: Metadata = {
  title: 'Studio Giriş | Bachmain Studio',
  description: 'Bachmain Studio hesabınıza giriş yapın.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage isStudio />
    </Suspense>
  )
}
