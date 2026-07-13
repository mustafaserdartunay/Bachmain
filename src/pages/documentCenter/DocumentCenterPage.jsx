import { Link } from 'react-router-dom'
import {
  Archive,
  FileStack,
  History,
  LayoutTemplate,
  PenLine,
  Printer,
  QrCode,
  Store,
  Tags,
  Workflow,
} from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import { DOCUMENT_CENTER_BASE, documentCenterChildMenus } from '../../data/documentCenterMenu'
import { loadDocTemplates } from '../../utils/docTemplatesStore'

const FEATURED = [
  { to: `${DOCUMENT_CENTER_BASE}/tasarimci`, title: 'Document Designer', desc: 'Sürükle-bırak görsel şablon editörü', icon: PenLine },
  { to: `${DOCUMENT_CENTER_BASE}/sablonlar`, title: 'Şablonlar', desc: 'Taslak, yayın, arşiv yönetimi', icon: LayoutTemplate },
  { to: `${DOCUMENT_CENTER_BASE}/etiket`, title: 'Label / Barkod / QR', desc: 'Termal etiket ve kod tasarımı', icon: Tags },
  { to: `${DOCUMENT_CENTER_BASE}/yazdir`, title: 'Yazdır / PDF', desc: 'Canlı önizleme ve PDF indirme', icon: Printer },
  { to: `${DOCUMENT_CENTER_BASE}/marketplace`, title: 'Marketplace', desc: 'Hazır şablon paketleri', icon: Store },
  { to: `${DOCUMENT_CENTER_BASE}/workflow`, title: 'Workflow', desc: 'Onay → PDF → E-posta otomasyonu', icon: Workflow },
]

export default function DocumentCenterPage() {
  const templates = loadDocTemplates()

  return (
    <AppPageShell>
      <AppPageHeader title="Belge Merkezi" />

      <section className="card space-y-3">
        <div className="flex items-center gap-2">
          <FileStack className="h-4 w-4 text-blue-300" />
          <h2 className="text-sm font-black uppercase tracking-wide text-gray-300">Enterprise Document Platform</h2>
        </div>
        <p className="text-sm font-semibold text-gray-400">
          Kod yazmadan teklif, sipariş, etiket, PDF ve mesaj şablonlarını görsel olarak tasarlayın.
          Değişkenler, sürümleme, yazdırma profilleri ve marketplace tek merkezde.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FEATURED.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.to}
              to={card.to}
              className="card block space-y-3 transition hover:border-blue-400/40"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/50 bg-dark-700/60 text-blue-300">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="text-base font-black text-white">{card.title}</h2>
              <p className="text-xs font-semibold text-gray-500">{card.desc}</p>
            </Link>
          )
        })}
      </div>

      <section className="card">
        <div className="mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-blue-300" />
          <h3 className="text-sm font-black uppercase tracking-wide text-gray-300">Son şablonlar</h3>
        </div>
        {templates.length === 0 ? (
          <p className="text-sm font-semibold text-gray-500">
            Henüz şablon yok.{' '}
            <Link to={`${DOCUMENT_CENTER_BASE}/tasarimci`} className="text-blue-300 hover:underline">
              Document Designer ile başlayın
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-2">
            {templates.slice(0, 8).map((tpl) => (
              <li key={tpl.id}>
                <Link
                  to={`${DOCUMENT_CENTER_BASE}/tasarimci?id=${encodeURIComponent(tpl.id)}`}
                  className="flex items-center justify-between rounded-xl border border-dark-500/40 px-3 py-2 text-sm hover:bg-dark-700/50"
                >
                  <span className="font-bold text-white">{tpl.name}</span>
                  <span className="text-xs font-semibold uppercase text-gray-500">
                    {tpl.status || 'draft'} · {tpl.docType}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="mb-3 flex items-center gap-2">
          <Archive className="h-4 w-4 text-blue-300" />
          <h3 className="text-sm font-black uppercase tracking-wide text-gray-300">Tüm modüller</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {documentCenterChildMenus.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="rounded-lg border border-dark-500/40 px-3 py-1.5 text-[11px] font-bold text-gray-300 hover:bg-dark-700/60"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </AppPageShell>
  )
}
