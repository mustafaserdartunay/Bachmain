import type { Metadata } from 'next'
import { buildMetadata } from '../../seo/buildMetadata'
import { PAGE_SEO } from '../../seo/pages'
import RouteSchemas from '../../components/seo/schema/RouteSchemas'
import Breadcrumbs from '../../components/seo/Breadcrumbs'

const seo = PAGE_SEO['/kvkk']
export const metadata: Metadata = buildMetadata(seo)

export default function Page() {
  return (
    <div className="page-mesh">
      {seo.breadcrumbs ? <Breadcrumbs items={seo.breadcrumbs} /> : null}
      <RouteSchemas path={seo.path} seo={seo} />
      <section className="page-hero text-center">
        <h1 className="text-4xl font-extrabold text-slate-900">KVKK Aydınlatma Metni</h1>
      </section>
      <article className="mx-auto max-w-3xl px-4 pb-20 text-base leading-relaxed text-slate-600">
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu BACHMAIN’dir.
        </p>
        <p>
          Kimlik, iletişim ve işlem verileriniz; sözleşme, meşru menfaat ve açık rıza hukuki
          sebepleriyle işlenebilir. Başvuru haklarınız için destek@bachmain.com kanalını
          kullanabilirsiniz.
        </p>
      </article>
    </div>
  )
}
