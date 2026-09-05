import type { Metadata } from 'next'
import StudioPaketPage from '../../../views/StudioPaketPage'

export const metadata: Metadata = {
  title: 'Bachmain Studio Paketi | 990,00₺',
  description: 'Bachmain Studio tek paket: sürükle-bırak web sitesi ve yayın paneli. 990,00₺.',
  icons: {
    icon: [{ url: '/assets/logo-icon.svg', type: 'image/svg+xml' }],
    shortcut: '/assets/logo-icon.svg',
    apple: '/assets/logo-icon.svg',
  },
}

export default function Page() {
  return <StudioPaketPage />
}
