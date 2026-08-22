import type { Metadata } from 'next'
import BusinessHomeRedirect from '../../components/seo/BusinessHomeRedirect'

export const metadata: Metadata = {
  title: 'BACHMAIN',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://bachmain.com/' },
}

export default function Page() {
  return <BusinessHomeRedirect />
}
