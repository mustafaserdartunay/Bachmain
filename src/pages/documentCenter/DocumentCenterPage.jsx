import { Link } from 'react-router-dom'
import { FileStack, PenLine, Printer, LayoutTemplate, Tags, History } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import { DOCUMENT_CENTER_BASE } from '../../data/documentCenterMenu'
import { loadDocTemplates } from '../../utils/docTemplatesStore'

const cards = [
  { to: `${DOCUMENT_CENTER_BASE}/sablonlar`, title: 'Şablonlar', desc: 'Teklif, sipariş ve etiket şablonlarını yönetin.', icon: LayoutTemplate },
  { to: `${DOCUMENT_CENTER_BASE}/tasarimci`, title: 'Tasarımcı', desc: 'Yeni şablon oluşturun veya düzenleyin.', icon: PenLine },
  { to: `${DOCUMENT_CENTER_BASE}/etiket`, title: 'Etiket / Barkod / QR', desc: 'Termal etiket boyutları, barkod ve QR tasarlayın.', icon: Tags },
  { to: `${DOCUMENT_CENTER_BASE}/yazdir`, title: 'Yazdır / PDF', desc: 'Belge seçip şablonla yazdırın veya PDF indirin.', icon: Printer },
  { to: `${DOCUMENT_CENTER_BASE}/kayitlar`, title: 'Yazdırma Kayıtları', desc: 'Yazdırma ve PDF işlem geçmişi.', icon: History },
]

export default function DocumentCenterPage() {
  const templates = loadDocTemplates()

  return (
    <AppPageShell>
      <AppPageHeader
        title="Belge Merkezi"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
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
          <FileStack className="h-4 w-4 text-blue-300" />
          <h3 className="text-sm font-black uppercase tracking-wide text-gray-300">Son şablonlar</h3>
        </div>
        {templates.length === 0 ? (
          <p className="text-sm font-semibold text-gray-500">
            Henüz şablon yok.{' '}
            <Link to={`${DOCUMENT_CENTER_BASE}/tasarimci`} className="text-blue-300 hover:underline">
              İlk şablonunuzu oluşturun
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
                  <span className="text-xs font-semibold uppercase text-gray-500">{tpl.docType}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppPageShell>
  )
}
