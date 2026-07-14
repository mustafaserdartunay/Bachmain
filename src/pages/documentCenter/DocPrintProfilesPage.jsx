import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Printer, Trash2 } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import { DOCUMENT_CENTER_BASE } from '../../data/documentCenterMenu'
import { PAGE_PRESET_LIST } from '../../utils/docCanvasEngine'
import {
  BARCODE_PRINTER_BRANDS,
  OUTPUT_TARGETS,
  deletePrintProfile,
  emptyPrintProfile,
  listPrintProfiles,
  savePrintProfile,
} from '../../utils/docPrintProfilesStore'
import { BTN_SUCCESS } from '../../utils/buttonStyles'

export default function DocPrintProfilesPage() {
  const [profiles, setProfiles] = useState(() => listPrintProfiles())
  const [draft, setDraft] = useState(() => emptyPrintProfile())
  const [editingId, setEditingId] = useState(null)

  function refresh() {
    setProfiles(listPrintProfiles())
  }

  useEffect(() => {
    refresh()
  }, [])

  function startNew() {
    setEditingId(null)
    setDraft(emptyPrintProfile({ name: 'Yeni Yazıcı Profili' }))
  }

  function startEdit(profile) {
    setEditingId(profile.id)
    setDraft({ ...profile })
  }

  function handleSave() {
    if (!draft.name.trim()) {
      window.alert('Profil adı gerekli')
      return
    }
    const saved = savePrintProfile({ ...draft, id: editingId || draft.id })
    setEditingId(saved.id)
    setDraft(saved)
    refresh()
  }

  function handleDelete(id) {
    if (!window.confirm('Profil silinsin mi?')) return
    deletePrintProfile(id)
    if (editingId === id) startNew()
    refresh()
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Yazıcı Ayarları"
        subtitle="Şablon başına varsayılan yazıcı, kağıt ve çıktı profili"
        actions={(
          <div className="flex gap-2">
            <Link
              to={`${DOCUMENT_CENTER_BASE}/tasarimci`}
              className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2.5 text-xs font-black uppercase text-gray-300"
            >
              Belge Tasarımcısı
            </Link>
            <button type="button" onClick={startNew} className={`${BTN_SUCCESS} gap-2 px-4 py-2.5 text-sm`}>
              <Plus className="h-4 w-4" /> Yeni Profil
            </button>
          </div>
        )}
      />

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="card space-y-2 p-3">
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => startEdit(p)}
              className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition-colors ${
                editingId === p.id
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-200'
                  : 'border-dark-500/40 bg-dark-700/40 text-gray-200 hover:bg-dark-700/70'
              }`}
            >
              <Printer className="h-4 w-4 shrink-0 opacity-60" />
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              <button
                type="button"
                className="rounded-lg p-1 text-rose-300 hover:bg-rose-500/10"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(p.id)
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </button>
          ))}
          {!profiles.length ? (
            <p className="px-2 py-6 text-center text-xs font-semibold text-gray-500">Henüz profil yok</p>
          ) : null}
        </aside>

        <section className="card space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-gray-500">Profil adı</span>
              <input className="form-input" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-gray-500">Varsayılan yazıcı</span>
              <input
                className="form-input"
                placeholder="Örn. Ofis HP LaserJet"
                value={draft.printerName}
                onChange={(e) => setDraft((d) => ({ ...d, printerName: e.target.value }))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-gray-500">Barkod yazıcı markası</span>
              <select className="form-input" value={draft.brand} onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}>
                {BARCODE_PRINTER_BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-gray-500">Kağıt boyutu</span>
              <select className="form-input" value={draft.pageSize} onChange={(e) => setDraft((d) => ({ ...d, pageSize: e.target.value }))}>
                {PAGE_PRESET_LIST.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-gray-500">Yön</span>
              <select className="form-input" value={draft.orientation} onChange={(e) => setDraft((d) => ({ ...d, orientation: e.target.value }))}>
                <option value="portrait">Dikey</option>
                <option value="landscape">Yatay</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-gray-500">Kopya sayısı</span>
              <input
                type="number"
                min={1}
                className="form-input"
                value={draft.copies}
                onChange={(e) => setDraft((d) => ({ ...d, copies: Math.max(1, Number(e.target.value) || 1) }))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-gray-500">Çıktı</span>
              <select className="form-input" value={draft.outputTarget} onChange={(e) => setDraft((d) => ({ ...d, outputTarget: e.target.value }))}>
                {OUTPUT_TARGETS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-gray-500">Varsayılan belge tipi</span>
              <select className="form-input" value={draft.defaultForDocType || ''} onChange={(e) => setDraft((d) => ({ ...d, defaultForDocType: e.target.value }))}>
                <option value="">—</option>
                <option value="quote">Teklif</option>
                <option value="order">Sipariş</option>
                <option value="invoice">Fatura</option>
                <option value="waybill">İrsaliye</option>
                <option value="label">Etiket</option>
                <option value="pos">POS</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['marginTop', 'Üst (mm)'],
              ['marginBottom', 'Alt (mm)'],
              ['marginLeft', 'Sol (mm)'],
              ['marginRight', 'Sağ (mm)'],
            ].map(([key, label]) => (
              <label key={key} className="block space-y-1">
                <span className="text-[11px] font-black uppercase text-gray-500">{label}</span>
                <input
                  type="number"
                  className="form-input"
                  value={draft[key]}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: Number(e.target.value) || 0 }))}
                />
              </label>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            <input
              type="checkbox"
              checked={Boolean(draft.autoPrint)}
              onChange={(e) => setDraft((d) => ({ ...d, autoPrint: e.target.checked }))}
            />
            Otomatik yazdır
          </label>

          <div className="flex justify-end">
            <button type="button" onClick={handleSave} className={`${BTN_SUCCESS} px-5 py-2.5 text-sm`}>
              Kaydet
            </button>
          </div>
        </section>
      </div>
    </AppPageShell>
  )
}
