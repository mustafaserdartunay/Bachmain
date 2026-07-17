import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../Layout/AppPageLayout'
import {
  deleteBoxType,
  deletePackageType,
  deletePalletType,
  deleteTrailer,
  deleteVehicle,
  loadBoxTypes,
  loadPackageTypes,
  loadPalletTypes,
  loadTrailers,
  loadVehicles,
  upsertBoxType,
  upsertPackageType,
  upsertPalletType,
  upsertTrailer,
  upsertVehicle,
  LOGISTICS_EVENT,
} from '../../utils/logisticsStore'
import { DOOR_TYPES, VEHICLE_TYPES, volumeM3 } from '../../utils/logisticsCatalogs'
import PalletScene3D from './PalletScene3D'
import TruckScene3D from './TruckScene3D'
import './logistics.css'

const CONFIG = {
  vehicles: {
    title: 'Araçlar',
    load: loadVehicles,
    save: upsertVehicle,
    remove: deleteVehicle,
    empty: () => ({
      type: 'truck',
      brand: '',
      model: '',
      plate: '',
      driver: '',
      phone: '',
      company: '',
      weightKg: 7500,
      innerLengthMm: 13600,
      innerWidthMm: 2450,
      innerHeightMm: 2700,
      maxPallets: 33,
      maxWeightKg: 24000,
      maxVolumeM3: 90,
      doorType: 'rear',
      refrigerated: false,
      gps: true,
      trackingNo: '',
    }),
    columns: [
      ['plate', 'Plaka'],
      ['type', 'Tip'],
      ['brand', 'Marka'],
      ['driver', 'Şoför'],
      ['maxPallets', 'Max Palet'],
      ['maxWeightKg', 'Max KG'],
    ],
  },
  trailers: {
    title: 'Dorse Tipleri',
    load: loadTrailers,
    save: upsertTrailer,
    remove: deleteTrailer,
    empty: () => ({
      label: 'Yeni dorse',
      innerLengthMm: 13600,
      innerWidthMm: 2450,
      innerHeightMm: 2700,
      maxWeightKg: 24000,
      maxPallets: 33,
    }),
    columns: [
      ['label', 'Ad'],
      ['innerLengthMm', 'Uzunluk'],
      ['innerWidthMm', 'Genişlik'],
      ['innerHeightMm', 'Yükseklik'],
      ['maxPallets', 'Max Palet'],
      ['maxWeightKg', 'Max KG'],
    ],
  },
  pallets: {
    title: 'Paletler',
    load: loadPalletTypes,
    save: upsertPalletType,
    remove: deletePalletType,
    empty: () => ({
      label: 'Özel Palet',
      lengthMm: 1200,
      widthMm: 800,
      heightMm: 144,
      tareKg: 25,
      maxHeightMm: 2200,
      maxKg: 1500,
    }),
    columns: [
      ['label', 'Palet'],
      ['lengthMm', 'L'],
      ['widthMm', 'W'],
      ['heightMm', 'H'],
      ['maxKg', 'Max KG'],
      ['maxHeightMm', 'Max Yükseklik'],
    ],
  },
  boxes: {
    title: 'Koli Tipleri',
    load: loadBoxTypes,
    save: upsertBoxType,
    remove: deleteBoxType,
    empty: () => ({
      label: 'Yeni koli',
      lengthMm: 400,
      widthMm: 300,
      heightMm: 300,
      grossKg: 0.5,
      netKg: 0.4,
      stackable: true,
      maxStack: 5,
    }),
    columns: [
      ['label', 'Koli'],
      ['lengthMm', 'L'],
      ['widthMm', 'W'],
      ['heightMm', 'H'],
      ['grossKg', 'Brüt'],
      ['maxStack', 'İstif'],
    ],
  },
  packages: {
    title: 'Paket Tipleri',
    load: loadPackageTypes,
    save: upsertPackageType,
    remove: deletePackageType,
    empty: () => ({ label: 'Özel Paket', units: 1 }),
    columns: [
      ['label', 'Paket'],
      ['units', 'Adet'],
    ],
  },
}

export default function LogisticsMasterPage({ kind = 'vehicles' }) {
  const cfg = CONFIG[kind]
  const [rows, setRows] = useState(cfg.load)
  const [draft, setDraft] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    function refresh() {
      setRows(cfg.load())
    }
    refresh()
    window.addEventListener(LOGISTICS_EVENT, refresh)
    return () => window.removeEventListener(LOGISTICS_EVENT, refresh)
  }, [cfg, kind])

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) || rows[0],
    [rows, selectedId],
  )

  function openNew() {
    setDraft(cfg.empty())
  }

  function saveDraft(e) {
    e.preventDefault()
    if (!draft) return
    const payload = { ...draft }
    if (kind === 'vehicles' || kind === 'trailers') {
      payload.maxVolumeM3 = volumeM3(
        payload.innerLengthMm || payload.lengthMm,
        payload.innerWidthMm || payload.widthMm,
        payload.innerHeightMm || payload.heightMm,
      )
    }
    if (kind === 'boxes') {
      payload.volumeM3 = volumeM3(payload.lengthMm, payload.widthMm, payload.heightMm)
    }
    cfg.save(payload)
    setDraft(null)
    setRows(cfg.load())
  }

  return (
    <AppPageShell className="slp-shell">
      <AppPageHeader
        title={cfg.title}
        subtitle="Smart Load Planner · master data"
        actions={(
          <button type="button" className="slp-btn slp-btn--primary" onClick={openNew}>
            <Plus className="inline h-3.5 w-3.5 mr-1" />
            Yeni
          </button>
        )}
      />

      {draft ? (
        <form className="slp-glass slp-panel slp-form-grid" onSubmit={saveDraft}>
          {kind === 'vehicles' && (
            <>
              <div className="slp-field"><label>Tip</label>
                <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
                  {VEHICLE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              {['brand', 'model', 'plate', 'driver', 'phone', 'company', 'trackingNo'].map((key) => (
                <div className="slp-field" key={key}>
                  <label>{key}</label>
                  <input value={draft[key] || ''} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
                </div>
              ))}
              {['innerLengthMm', 'innerWidthMm', 'innerHeightMm', 'maxPallets', 'maxWeightKg', 'weightKg'].map((key) => (
                <div className="slp-field" key={key}>
                  <label>{key}</label>
                  <input type="number" value={draft[key] || 0} onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })} />
                </div>
              ))}
              <div className="slp-field"><label>Kapı</label>
                <select value={draft.doorType} onChange={(e) => setDraft({ ...draft, doorType: e.target.value })}>
                  {DOOR_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div className="slp-field"><label>Soğutmalı</label>
                <select value={draft.refrigerated ? '1' : '0'} onChange={(e) => setDraft({ ...draft, refrigerated: e.target.value === '1' })}>
                  <option value="0">Hayır</option>
                  <option value="1">Evet</option>
                </select>
              </div>
            </>
          )}
          {kind === 'trailers' && (
            <>
              <div className="slp-field"><label>Ad</label>
                <input value={draft.label || ''} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
              </div>
              {['innerLengthMm', 'innerWidthMm', 'innerHeightMm', 'maxPallets', 'maxWeightKg'].map((key) => (
                <div className="slp-field" key={key}>
                  <label>{key}</label>
                  <input type="number" value={draft[key] || 0} onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })} />
                </div>
              ))}
            </>
          )}
          {kind === 'pallets' && (
            <>
              <div className="slp-field"><label>Ad</label>
                <input value={draft.label || ''} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
              </div>
              {['lengthMm', 'widthMm', 'heightMm', 'tareKg', 'maxHeightMm', 'maxKg'].map((key) => (
                <div className="slp-field" key={key}>
                  <label>{key}</label>
                  <input type="number" value={draft[key] || 0} onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })} />
                </div>
              ))}
            </>
          )}
          {kind === 'boxes' && (
            <>
              <div className="slp-field"><label>Ad</label>
                <input value={draft.label || ''} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
              </div>
              {['lengthMm', 'widthMm', 'heightMm', 'grossKg', 'netKg', 'maxStack'].map((key) => (
                <div className="slp-field" key={key}>
                  <label>{key}</label>
                  <input type="number" value={draft[key] || 0} onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })} />
                </div>
              ))}
            </>
          )}
          {kind === 'packages' && (
            <>
              <div className="slp-field"><label>Ad</label>
                <input value={draft.label || ''} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
              </div>
              <div className="slp-field"><label>Adet</label>
                <input type="number" value={draft.units || 1} onChange={(e) => setDraft({ ...draft, units: Number(e.target.value) })} />
              </div>
            </>
          )}
          <div className="slp-toolbar" style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="slp-btn slp-btn--primary">Kaydet</button>
            <button type="button" className="slp-btn" onClick={() => setDraft(null)}>İptal</button>
          </div>
        </form>
      ) : null}

      <div className="slp-hero">
        <div className="slp-glass slp-panel slp-table-wrap">
          <table className="slp-table">
            <thead>
              <tr>
                {cfg.columns.map(([k, label]) => <th key={k}>{label}</th>)}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedId(row.id)}
                  style={{ cursor: 'pointer', background: selected?.id === row.id ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : undefined }}
                >
                  {cfg.columns.map(([k]) => (
                    <td key={k}>{String(row[k] ?? '—')}</td>
                  ))}
                  <td>
                    {!row.system ? (
                      <button
                        type="button"
                        className="slp-btn slp-btn--ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          cfg.remove(row.id)
                          setRows(cfg.load())
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="slp-glass slp-panel">
          <h3>Önizleme</h3>
          {kind === 'vehicles' || kind === 'trailers' ? (
            <TruckScene3D
              vehicle={kind === 'vehicles' ? selected : {
                innerLengthMm: selected?.innerLengthMm,
                innerWidthMm: selected?.innerWidthMm,
                innerHeightMm: selected?.innerHeightMm,
              }}
              placements={[]}
            />
          ) : null}
          {kind === 'pallets' ? <PalletScene3D pallet={selected} layers={[]} /> : null}
          {kind === 'boxes' || kind === 'packages' ? (
            <div className="slp-empty">
              {selected?.label}
              <br />
              {kind === 'boxes'
                ? `${selected?.lengthMm}×${selected?.widthMm}×${selected?.heightMm} mm`
                : `${selected?.units || 1} adet/paket`}
            </div>
          ) : null}
        </div>
      </div>
    </AppPageShell>
  )
}
