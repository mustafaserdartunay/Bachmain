import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME } from '../seo/site'

export const metadata: Metadata = {
  title: { absolute: `Sayfa bulunamadı | ${SITE_NAME}` },
  description:
    'Aradığınız sayfa taşınmış veya kaldırılmış olabilir. BACHMAIN ana sayfasına dönebilirsiniz.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="page-mesh">
      <section className="page-hero text-center" aria-labelledby="not-found-heading">
        <p className="pill">404</p>
        <h1
          id="not-found-heading"
          className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 lg:text-5xl"
        >
          Sayfa bulunamadı
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
          Aradığınız adres geçersiz veya kaldırılmış olabilir. CRM, ERP ve fiyatlandırma sayfalarına
          ana menüden ulaşabilirsiniz.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            Ana sayfaya dön
          </Link>
          <Link href="/crm" className="btn-secondary">
            CRM’i keşfet
          </Link>
          <Link href="/help" className="btn-secondary">
            Yardım merkezi
          </Link>
        </div>
      </section>
    </div>
  )
}
