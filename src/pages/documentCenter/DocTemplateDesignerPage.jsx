import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Save } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import { DOCUMENT_CENTER_BASE } from '../../data/documentCenterMenu'
import {
  emptyDocTemplate,
  getDocTemplateById,
  saveDocTemplate,
} from '../../utils/docTemplatesStore'
import { buildDocumentContext, renderTemplateHtml } from '../../utils/docVariableEngine'
import { flushWorkspaceNow } from '../../utils/workspaceStorage'
import { readCompanySettings } from '../../utils/companySettings'
import { BTN_SUCCESS } from '../../utils/buttonStyles'

const SAMPLE_CONTEXT = buildDocumentContext({
  company: readCompanySettings(),
  user: { displayName: 'Kullanıcı' },
  customer: { companyTitle: 'Örnek Müşteri A.Ş.', phone: '0532 000 00 00' },
  document: { id: 'TKL-2026-001', createdAt: '13.07.2026', grandTotal: 12500 },
  lineItems: [
    { product: 'Örnek Ürün', quantity: 10, unitPrice: 1000 },
    { product: 'Hizmet', quantity: 1, unitPrice: 2500 },
  ],
})

export default function DocTemplateDesignerPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [draft, setDraft] = useState(() => {
    const id = params.get('id')
    return (id && getDocTemplateById(id)) || emptyDocTemplate()
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const id = params.get('id')
    if (id) {
      const found = getDocTemplateById(id)
      if (found) setDraft(found)
    }
  }, [params])

  const preview = useMemo(() => renderTemplateHtml(draft, SAMPLE_CONTEXT), [draft])

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      window.alert('Şablon adı gerekli.')
      return
    }
    const savedTpl = saveDocTemplate(draft)
    setDraft(savedTpl)
    setSaved(true)
    await flushWorkspaceNow()
    window.setTimeout(() => setSaved(false), 1600)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Şablon Tasarımcısı"
        actions={(
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`${DOCUMENT_CENTER_BASE}/sablonlar`)}
              className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2.5 text-xs font-black uppercase text-gray-300"
            >
              Liste
            </button>
            <button type="button" onClick={handleSave} className={`${BTN_SUCCESS} gap-2 px-4 py-2.5 text-sm`}>
              <Save className="h-4 w-4" /> Kaydet
            </button>
          </div>
        )}
      />

      {saved ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
          Şablon kaydedildi
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">Şablon adı</span>
              <input className="form-input" value={draft.name} onChange={(e) => update('name', e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">Belge tipi</span>
              <select className="form-input" value={draft.docType} onChange={(e) => update('docType', e.target.value)}>
                <option value="quote">Teklif</option>
                <option value="order">Sipariş</option>
                <option value="production">Üretim</option>
                <option value="generic">Genel</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">Sayfa</span>
              <select className="form-input" value={draft.pageSize} onChange={(e) => update('pageSize', e.target.value)}>
                <option value="A4">A4</option>
                <option value="A5">A5</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">Üst bilgi (HTML + değişken)</span>
            <textarea className="form-input min-h-24 font-mono text-xs" value={draft.headerHtml} onChange={(e) => update('headerHtml', e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">Gövde</span>
            <textarea className="form-input min-h-48 font-mono text-xs" value={draft.bodyHtml} onChange={(e) => update('bodyHtml', e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wide text-gray-500">Alt bilgi</span>
            <textarea className="form-input min-h-20 font-mono text-xs" value={draft.footerHtml} onChange={(e) => update('footerHtml', e.target.value)} />
          </label>

          <p className="text-[11px] font-semibold text-gray-500">
            Örnek değişkenler: {'{{sirket.unvan}}'}, {'{{musteri.unvan}}'}, {'{{belge.no}}'}, {'{{belge.toplam}}'}, {'{{kalemler_html}}'}
          </p>
        </section>

        <section className="card overflow-hidden p-0">
          <div className="border-b border-dark-500/40 px-4 py-3 text-xs font-black uppercase tracking-wide text-gray-400">
            Önizleme (örnek veri)
          </div>
          <iframe
            title="Şablon önizleme"
            className="min-h-[640px] w-full bg-white"
            srcDoc={preview.html}
          />
          {preview.errors.length > 0 ? (
            <p className="border-t border-amber-500/20 px-4 py-2 text-[11px] font-semibold text-amber-300">
              Eksik alanlar: {preview.errors.join(', ')}
            </p>
          ) : null}
        </section>
      </div>
    </AppPageShell>
  )
}
