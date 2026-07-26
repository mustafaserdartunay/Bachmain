import Link from 'next/link'
import { MODULE_GRAPH } from '../../seo/pages'

const LABEL_BY_PATH: Record<string, string> = {
  '/features': 'Özellikler',
  '/crm': 'CRM',
  '/erp': 'ERP',
  '/stok': 'Depo & Stok',
  '/depo': 'Depo',
  '/finans': 'Finans & Muhasebe',
  '/muhasebe': 'Muhasebe',
  '/cari': 'Cari',
  '/raporlar': 'Raporlama',
  '/dashboard': 'Dashboard',
  '/modules': 'Modüller',
  '/uretim': 'Üretim',
  '/uretim-takibi': 'Üretim Takibi',
  '/modules/ecommerce': 'E-Ticaret',
  '/saha-satis': 'Saha Satış',
  '/e-fatura': 'E-Fatura',
  '/fiyatlar': 'Fiyatlandırma',
  '/teklif': 'Teklif',
  '/siparis': 'Sipariş',
  '/lojistik': 'Lojistik',
  '/sevkiyat': 'Sevkiyat',
  '/paketleme': 'Paketleme',
  '/whatsapp': 'WhatsApp',
  '/sosyal-medya': 'Sosyal Medya',
  '/bayi': 'Bayi',
  '/openai': 'OpenAI',
  '/demo': 'Demo',
  '/faq': 'SSS',
}

type RelatedModulesProps = {
  moduleKey: keyof typeof MODULE_GRAPH
  title?: string
}

/**
 * Internal linking block — semantic association across CRM/ERP/Stock/etc.
 * Minimal chrome to avoid design drift.
 */
export default function RelatedModules({
  moduleKey,
  title = 'İlgili modüller',
}: RelatedModulesProps) {
  const node = MODULE_GRAPH[moduleKey]
  if (!node) return null

  return (
    <section
      className="section-pad border-t border-slate-100/80"
      aria-labelledby="related-modules-heading"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2
          id="related-modules-heading"
          className="text-xl font-bold tracking-tight text-slate-900"
        >
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          {node.name} modülü; muhasebe, üretim, depo, finans, lojistik, WhatsApp ve yapay zeka
          süreçleriyle aynı platformda çalışır.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {node.related.map((path) => (
            <li key={path}>
              <Link
                href={path}
                className="inline-flex rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                {LABEL_BY_PATH[path] || path}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
