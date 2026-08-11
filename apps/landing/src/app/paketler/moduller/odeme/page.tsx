import type { Metadata } from 'next'
import { Suspense } from 'react'
import { buildMetadata } from '../../../../seo/buildMetadata'
import PageView from '../../../../views/ModuleStoreCheckoutPage'

const seo = {
  path: '/paketler/moduller/odeme',
  title: 'Modül Satın Alma | BACHMAIN',
  description: 'Seçtiğiniz Bachmain modüllerini onaylayın ve satın alma işlemini tamamlayın.',
  ogTitle: 'Modül Satın Alma',
  ogDescription: 'Modül sepeti ödeme özeti',
  twitterTitle: 'Modül Satın Alma | BACHMAIN',
  twitterDescription: 'Modül sepeti ödeme özeti',
  h1: 'Satın Alma Özeti',
  schemaType: 'WebPage' as const,
  noIndex: true,
}

export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PageView />
    </Suspense>
  )
}
