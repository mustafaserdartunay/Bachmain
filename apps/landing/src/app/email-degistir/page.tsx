import type { Metadata } from 'next'
import { Suspense } from 'react'
import PageView from '../../views/EmailChangePage'

export const metadata: Metadata = {
  title: 'E-posta Değiştir | BACHMAIN',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PageView />
    </Suspense>
  )
}
