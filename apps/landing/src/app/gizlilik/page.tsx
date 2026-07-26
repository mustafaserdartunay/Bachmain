import type { Metadata } from 'next'
import { buildMetadata } from '../../seo/buildMetadata'
import { PAGE_SEO } from '../../seo/pages'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import Breadcrumbs from '../../components/seo/Breadcrumbs'

const seo = PAGE_SEO['/gizlilik']
export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <div className="page-mesh">
      {seo.breadcrumbs ? <Breadcrumbs items={seo.breadcrumbs} /> : null}
      <RouteSchemas path={seo.path} seo={seo} />
      <section className="page-hero text-center">
        <h1 className="text-4xl font-extrabold text-slate-900">Gizlilik Politikası</h1>
      </section>
      <article className="mx-auto max-w-3xl px-4 pb-20 text-base leading-relaxed text-slate-600">
        <p>
          BACHMAIN olarak kişisel verilerinizin güvenliğine önem veriyoruz. Bu politika; hangi
          verileri işlediğimizi, hangi amaçlarla kullandığımızı ve haklarınızı özetler.
        </p>
        <p>
          Verileriniz hizmet sunumu, güvenlik, destek ve yasal yükümlülükler kapsamında işlenir.
          Detaylı talepleriniz için destek@bachmain.com adresine yazabilirsiniz.
        </p>
      </article>
    </div>
  )
}
