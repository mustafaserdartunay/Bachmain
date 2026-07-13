import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Code2, LayoutTemplate, Save } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import DocumentVisualDesigner from '../../components/DocumentDesigner/DocumentVisualDesigner'
import { DOCUMENT_CENTER_BASE } from '../../data/documentCenterMenu'
import {
  emptyDocTemplate,
  getDocTemplateById,
  saveDocTemplate,
} from '../../utils/docTemplatesStore'
import { migrateTemplateToVisual } from '../../utils/docCanvasEngine'
import { flushWorkspaceNow } from '../../utils/workspaceStorage'
import { BTN_SUCCESS } from '../../utils/buttonStyles'

export default function DocTemplateDesignerPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [draft, setDraft] = useState(() => {
    const id = params.get('id')
    const found = (id && getDocTemplateById(id)) || emptyDocTemplate()
    return migrateTemplateToVisual({ ...found, designMode: found.designMode || 'visual' })
  })
  const [saved, setSaved] = useState(false)
  const [mode, setMode] = useState(() => params.get('mode') || 'visual')

  useEffect(() => {
    const id = params.get('id')
    if (id) {
      const found = getDocTemplateById(id)
      if (found) setDraft(migrateTemplateToVisual({ ...found, designMode: found.designMode || 'visual' }))
    }
  }, [params])

  function patchDraft(patch) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      window.alert('Şablon adı gerekli.')
      return
    }
    const savedTpl = saveDocTemplate({
      ...draft,
      designMode: mode === 'html' ? 'html' : 'visual',
    })
    setDraft(migrateTemplateToVisual(savedTpl))
    setSaved(true)
    await flushWorkspaceNow()
    window.setTimeout(() => setSaved(false), 1600)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Document Designer"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`${DOCUMENT_CENTER_BASE}/sablonlar`)}
              className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2.5 text-xs font-black uppercase text-gray-300"
            >
              Liste
            </button>
            <div className="inline-flex overflow-hidden rounded-xl border border-dark-500/50">
              <button
                type="button"
                onClick={() => setMode('visual')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-black uppercase ${mode === 'visual' ? 'bg-blue-500/20 text-blue-300' : 'bg-dark-700/70 text-gray-400'}`}
              >
                <LayoutTemplate className="h-3.5 w-3.5" /> Görsel
              </button>
              <button
                type="button"
                onClick={() => setMode('html')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-black uppercase ${mode === 'html' ? 'bg-blue-500/20 text-blue-300' : 'bg-dark-700/70 text-gray-400'}`}
              >
                <Code2 className="h-3.5 w-3.5" /> HTML
              </button>
            </div>
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

      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        <label className="block space-y-1">
          <span className="text-[11px] font-black uppercase text-gray-500">Şablon adı</span>
          <input className="form-input" value={draft.name} onChange={(e) => patchDraft({ name: e.target.value })} />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-black uppercase text-gray-500">Belge tipi</span>
          <select className="form-input" value={draft.docType} onChange={(e) => patchDraft({ docType: e.target.value })}>
            <option value="quote">Teklif</option>
            <option value="order">Sipariş</option>
            <option value="production">Üretim</option>
            <option value="label">Etiket</option>
            <option value="generic">Genel</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] font-black uppercase text-gray-500">Sayfa</span>
          <select className="form-input" value={draft.pageSize} onChange={(e) => patchDraft({ pageSize: e.target.value })}>
            <option value="A4">A4</option>
            <option value="A5">A5</option>
            <option value="Letter">Letter</option>
          </select>
        </label>
      </div>

      {mode === 'visual' ? (
        <DocumentVisualDesigner
          template={draft}
          onChange={patchDraft}
          onSave={handleSave}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="card space-y-3">
            <label className="block space-y-1.5">
              <span className="text-[11px] font-black uppercase text-gray-500">Üst bilgi (HTML)</span>
              <textarea className="form-input min-h-24 font-mono text-xs" value={draft.headerHtml} onChange={(e) => patchDraft({ headerHtml: e.target.value })} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-black uppercase text-gray-500">Gövde</span>
              <textarea className="form-input min-h-48 font-mono text-xs" value={draft.bodyHtml} onChange={(e) => patchDraft({ bodyHtml: e.target.value })} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-black uppercase text-gray-500">Alt bilgi</span>
              <textarea className="form-input min-h-20 font-mono text-xs" value={draft.footerHtml} onChange={(e) => patchDraft({ footerHtml: e.target.value })} />
            </label>
          </section>
          <section className="card overflow-hidden p-0">
            <div className="border-b border-dark-500/40 px-4 py-3 text-xs font-black uppercase text-gray-400">HTML önizleme</div>
            <iframe
              title="HTML önizleme"
              className="min-h-[640px] w-full bg-white"
              srcDoc={`<!DOCTYPE html><html><body style="font-family:Arial;padding:16px">${draft.headerHtml || ''}${draft.bodyHtml || ''}${draft.footerHtml || ''}</body></html>`}
            />
          </section>
        </div>
      )}
    </AppPageShell>
  )
}
