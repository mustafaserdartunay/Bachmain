import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DemoPage } from '../../../views/AuthPages'

export const metadata: Metadata = {
  title: 'Studio Demo | Bachmain Studio',
  description: 'Bachmain Studio demosu oluşturun.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DemoPage isStudio />
    </Suspense>
  )
}
