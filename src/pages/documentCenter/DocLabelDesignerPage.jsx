import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Printer, Save } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import { DOCUMENT_CENTER_BASE } from '../../data/documentCenterMenu'
import {
  emptyDocLabel,
  getDocLabelById,
  loadDocLabels,
  saveDocLabel,
} from '../../utils/docLabelsStore'
import { LABEL_SIZE_PRESETS } from '../../utils/labelPresets'
import { buildLabelHtml, buildLabelSampleContext } from '../../utils/docLabelRender'
import { downloadPdfFromHtml, openPrintWindow } from '../../utils/docPrint'
import { logPrintJob } from '../../utils/docPrintJobsStore'
import { flushWorkspaceNow } from '../../utils/workspaceStorage'
import { readCompanySettings } from '../../utils/companySettings'
import { BTN_SUCCESS } from '../../utils/buttonStyles'
import { useAuth } from '../../auth/AuthContext'

export default function DocLabelDesignerPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [draft, setDraft] = useState(() => {
    const id = params.get('id')
    return (id && getDocLabelById(id)) || emptyDocLabel()
  })
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewErrors, setPreviewErrors] = useState([])
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const labels = useMemo(() => loadDocLabels(), [saved, draft.id])

  useEffect(() => {
    const id = params.get('id')
    if (id) {
      const found = getDocLabelById(id)
      if (found) setDraft(found)
    }
  }, [params])

  useEffect(() => {
    let cancelled = false
    const context = buildLabelSampleContext(readCompanySettings())
    buildLabelHtml(draft, context).then((result) => {
      if (cancelled) return
      setPreviewHtml(result.html)
      setPreviewErrors(result.errors)
    })
    return () => { cancelled = true }
  }, [draft])

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function applyPreset(presetId) {
    const preset = LABEL_SIZE_PRESETS.find((item) => item.id === presetId)
    if (!preset) return
    setDraft((current) => ({
      ...current,
      presetId,
      widthMm: preset.widthMm,
      heightMm: preset.heightMm,
    }))
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      window.alert('Etiket adı gerekli.')
      return
    }
    const savedLabel = saveDocLabel(draft)
    setDraft(savedLabel)
    setSaved(true)
    await flushWorkspaceNow()
    window.setTimeout(() => setSaved(false), 1600)
  }

  async function handlePrint() {
    setBusy(true)
    try {
      const context = buildLabelSampleContext(readCompanySettings())
      const { html } = await buildLabelHtml(draft, context)
      openPrintWindow(html)
      logPrintJob({
        kind: 'print',
        docType: 'label',
        labelId: draft.id,
        labelName: draft.name,
        userEmail: user?.email || '',
      })
      await flushWorkspaceNow()
    } finally {
      setBusy(false)
    }
  }

  async function handlePdf() {
    setBusy(true)
    try {
      const context = buildLabelSampleContext(readCompanySettings())
      const { html } = await buildLabelHtml(draft, context)
      await downloadPdfFromHtml(html, `${draft.name || 'etiket'}.pdf`)
      logPrintJob({
        kind: 'pdf',
        docType: 'label',
        labelId: draft.id,
        labelName: draft.name,
        userEmail: user?.email || '',
      })
      await flushWorkspaceNow()
    } catch (err) {
      window.alert(err.message || 'PDF oluşturulamadı')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Etiket / Barkod / QR"
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`${DOCUMENT_CENTER_BASE}`)}
              className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2.5 text-xs font-black uppercase text-gray-300"
            >
              Özet
            </button>
            <button type="button" disabled={busy} onClick={handlePrint} className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2.5 text-xs font-black uppercase text-gray-300 disabled:opacity-40">
              <Printer className="h-4 w-4" /> Yazdır
            </button>
            <button type="button" disabled={busy} onClick={handlePdf} className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2.5 text-xs font-black uppercase text-gray-300 disabled:opacity-40">
              <Download className="h-4 w-4" /> PDF
            </button>
            <button type="button" onClick={handleSave} className={`${BTN_SUCCESS} gap-2 px-4 py-2.5 text-sm`}>
              <Save className="h-4 w-4" /> Kaydet
            </button>
          </div>
        )}
      />

      {saved ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
          Etiket kaydedildi
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[280px_1fr_1fr]">
        <section className="card space-y-3">
          <h3 className="text-xs font-black uppercase text-gray-400">Kayıtlı etiketler</h3>
          <button
            type="button"
            onClick={() => setDraft(emptyDocLabel())}
            className="w-full rounded-xl border border-dark-500/50 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-dark-700/60"
          >
            + Yeni etiket
          </button>
          <ul className="max-h-[520px] space-y-1 overflow-auto">
            {labels.length === 0 ? (
              <li className="text-xs font-semibold text-gray-500">Henüz etiket yok</li>
            ) : labels.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setDraft(item)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold ${draft.id === item.id ? 'bg-blue-500/20 text-white' : 'text-gray-300 hover:bg-dark-700/50'}`}
                >
                  {item.name}
                  <span className="mt-0.5 block text-[10px] font-semibold uppercase text-gray-500">
                    {item.widthMm}×{item.heightMm} mm
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-[11px] font-black uppercase text-gray-500">Etiket adı</span>
              <input className="form-input" value={draft.name} onChange={(e) => update('name', e.target.value)} />
            </label>
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-[11px] font-black uppercase text-gray-500">Boyut preset</span>
              <select className="form-input" value={draft.presetId} onChange={(e) => applyPreset(e.target.value)}>
                {LABEL_SIZE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>{preset.label}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-black uppercase text-gray-500">Genişlik (mm)</span>
              <input type="number" className="form-input" value={draft.widthMm} onChange={(e) => update('widthMm', Number(e.target.value) || 0)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-black uppercase text-gray-500">Yükseklik (mm)</span>
              <input type="number" className="form-input" value={draft.heightMm} onChange={(e) => update('heightMm', Number(e.target.value) || 0)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-black uppercase text-gray-500">Kopya</span>
              <input type="number" min={1} className="form-input" value={draft.copies} onChange={(e) => update('copies', Number(e.target.value) || 1)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-black uppercase text-gray-500">Grid (sütun × satır)</span>
              <div className="flex gap-2">
                <input type="number" min={1} className="form-input" value={draft.gridCols} onChange={(e) => update('gridCols', Number(e.target.value) || 1)} />
                <input type="number" min={1} className="form-input" value={draft.gridRows} onChange={(e) => update('gridRows', Number(e.target.value) || 1)} />
              </div>
            </label>
          </div>

          <div className="space-y-2 border-t border-dark-500/40 pt-3">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-300">
              <input type="checkbox" checked={draft.showCompany} onChange={(e) => update('showCompany', e.target.checked)} /> Firma
            </label>
            {draft.showCompany ? (
              <input className="form-input font-mono text-xs" value={draft.companyText} onChange={(e) => update('companyText', e.target.value)} />
            ) : null}
            <label className="flex items-center gap-2 text-sm font-bold text-gray-300">
              <input type="checkbox" checked={draft.showTitle} onChange={(e) => update('showTitle', e.target.checked)} /> Başlık
            </label>
            {draft.showTitle ? (
              <input className="form-input font-mono text-xs" value={draft.titleText} onChange={(e) => update('titleText', e.target.value)} />
            ) : null}
            <label className="flex items-center gap-2 text-sm font-bold text-gray-300">
              <input type="checkbox" checked={draft.showSku} onChange={(e) => update('showSku', e.target.checked)} /> SKU
            </label>
            {draft.showSku ? (
              <input className="form-input font-mono text-xs" value={draft.skuText} onChange={(e) => update('skuText', e.target.value)} />
            ) : null}
          </div>

          <div className="space-y-2 border-t border-dark-500/40 pt-3">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-300">
              <input type="checkbox" checked={draft.barcodeEnabled} onChange={(e) => update('barcodeEnabled', e.target.checked)} /> Barkod
            </label>
            {draft.barcodeEnabled ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <select className="form-input" value={draft.barcodeSymbology} onChange={(e) => update('barcodeSymbology', e.target.value)}>
                  <option value="CODE128">Code128</option>
                  <option value="CODE39">Code39</option>
                  <option value="EAN13">EAN-13</option>
                  <option value="EAN8">EAN-8</option>
                </select>
                <input type="number" className="form-input" value={draft.barcodeHeightMm} onChange={(e) => update('barcodeHeightMm', Number(e.target.value) || 12)} placeholder="Yükseklik mm" />
                <input className="form-input font-mono text-xs sm:col-span-2" value={draft.barcodeValue} onChange={(e) => update('barcodeValue', e.target.value)} />
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 sm:col-span-2">
                  <input type="checkbox" checked={draft.barcodeShowText !== false} onChange={(e) => update('barcodeShowText', e.target.checked)} /> İnsan okunur metin
                </label>
              </div>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-dark-500/40 pt-3">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-300">
              <input type="checkbox" checked={draft.qrEnabled} onChange={(e) => update('qrEnabled', e.target.checked)} /> QR kod
            </label>
            {draft.qrEnabled ? (
              <div className="grid gap-2">
                <input className="form-input font-mono text-xs" value={draft.qrValue} onChange={(e) => update('qrValue', e.target.value)} />
                <input type="number" className="form-input" value={draft.qrSizeMm} onChange={(e) => update('qrSizeMm', Number(e.target.value) || 18)} placeholder="Boyut mm" />
              </div>
            ) : null}
          </div>

          <p className="text-[11px] font-semibold text-gray-500">
            Değişkenler: {'{{urun.ad}}'}, {'{{urun.sku}}'}, {'{{urun.barkod}}'}, {'{{sirket.unvan}}'}, {'{{belge.url}}'}
          </p>
        </section>

        <section className="card overflow-hidden p-0">
          <div className="border-b border-dark-500/40 px-4 py-3 text-xs font-black uppercase text-gray-400">
            Önizleme
          </div>
          <iframe title="Etiket önizleme" className="min-h-[640px] w-full bg-white" srcDoc={previewHtml} />
          {previewErrors.length > 0 ? (
            <p className="border-t border-amber-500/20 px-4 py-2 text-[11px] font-semibold text-amber-300">
              {previewErrors.join(' · ')}
            </p>
          ) : null}
        </section>
      </div>
    </AppPageShell>
  )
}
