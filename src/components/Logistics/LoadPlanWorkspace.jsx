import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../Layout/AppPageLayout'
import TruckScene3D from './TruckScene3D'
import TruckTopView from './TruckTopView'
import PalletScene3D from './PalletScene3D'
import {
  loadLoadPlans,
  loadVehicles,
  upsertLoadPlan,
  LOGISTICS_EVENT,
} from '../../utils/logisticsStore'
import { loadPalletTypes } from '../../utils/logisticsStore'
import { optimizeTruckLoad, packBoxesOnPallet, computeBalance } from '../../utils/loadOptimizer'
import { volumeM3 } from '../../utils/logisticsCatalogs'
import './logistics.css'

const WIZARD = [
  { id: 1, label: 'Kaynak' },
  { id: 2, label: 'Seçim' },
  { id: 3, label: 'Paletler' },
  { id: 4, label: 'Yerleşim' },
  { id: 5, label: 'Onay' },
]

function demoPallets(palletTypes) {
  const euro = palletTypes.find((p) => p.id === 'euro') || palletTypes[0]
  const customers = [
    { customer: 'Acme GmbH', city: 'München', country: 'DE', address: 'Industriestr. 12' },
    { customer: 'Nordic Pack AB', city: 'Stockholm', country: 'SE', address: 'Hamngatan 4' },
    { customer: 'Box Italia SRL', city: 'Milano', country: 'IT', address: 'Via Roma 8' },
    { customer: 'Iberia Cartón', city: 'Barcelona', country: 'ES', address: 'Carrer Nord 22' },
    { customer: 'Paris Emballage', city: 'Lyon', country: 'FR', address: 'Rue Vert 3' },
  ]
  return customers.map((c, i) => {
    const loadH = 900 + i * 40
    const weightKg = 420 + i * 55
    return {
      id: `pal-live-${i + 1}`,
      code: `PL-${String(i + 1).padStart(3, '0')}`,
      palletTypeId: euro?.id,
      lengthMm: euro?.lengthMm || 1200,
      widthMm: euro?.widthMm || 800,
      heightMm: euro?.heightMm || 144,
      loadHeightMm: loadH,
      weightKg,
      volumeM3: volumeM3(euro?.lengthMm || 1200, euro?.widthMm || 800, loadH),
      boxCount: 12 + i * 2,
      invoiceNo: `INV-2026-${100 + i}`,
      waybillNo: `IRS-${200 + i}`,
      ...c,
    }
  })
}

export default function LoadPlanWorkspace({ mode = 'plan' }) {
  const [step, setStep] = useState(mode === 'placement' ? 4 : 1)
  const [vehicles, setVehicles] = useState(loadVehicles)
  const [palletTypes, setPalletTypes] = useState(loadPalletTypes)
  const [plans, setPlans] = useState(loadLoadPlans)
  const [source, setSource] = useState('depo')
  const [selectionMode, setSelectionMode] = useState('manual')
  const [vehicleId, setVehicleId] = useState(() => loadVehicles()[0]?.id || '')
  const [pallets, setPallets] = useState(() => demoPallets(loadPalletTypes()))
  const [placements, setPlacements] = useState([])
  const [view3d, setView3d] = useState(mode === 'placement')
  const [planId, setPlanId] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    function refresh() {
      setVehicles(loadVehicles())
      setPalletTypes(loadPalletTypes())
      setPlans(loadLoadPlans())
    }
    window.addEventListener(LOGISTICS_EVENT, refresh)
    return () => window.removeEventListener(LOGISTICS_EVENT, refresh)
  }, [])

  const vehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) || vehicles[0],
    [vehicles, vehicleId],
  )

  const balance = useMemo(
    () => computeBalance(
      placements,
      vehicle?.innerLengthMm || 13600,
      vehicle?.innerWidthMm || 2450,
      placements.reduce((s, p) => s + Number(p.weightKg || 0), 0),
    ),
    [placements, vehicle],
  )

  const stats = useMemo(() => {
    const totalKg = pallets.reduce((s, p) => s + Number(p.weightKg || 0), 0)
    const totalM3 = pallets.reduce((s, p) => s + Number(p.volumeM3 || 0), 0)
    const capKg = Number(vehicle?.maxWeightKg || 1)
    const capM3 = Number(vehicle?.maxVolumeM3 || 1)
    return {
      palletCount: pallets.length,
      placed: placements.length,
      totalKg,
      totalM3: totalM3.toFixed(2),
      fillKg: Math.min(100, Math.round((totalKg / capKg) * 100)),
      fillM3: Math.min(100, Math.round((totalM3 / capM3) * 100)),
    }
  }, [pallets, placements, vehicle])

  function runAiOptimize() {
    if (!vehicle) return
    const result = optimizeTruckLoad(vehicle, pallets)
    setPlacements(result.placements)
    setStep(4)
    setMessage(
      result.unplaced.length
        ? `AI yerleşim: ${result.placements.length} palet · ${result.unplaced.length} yerleşemedi · doluluk %${result.fillPct}`
        : `AI yerleşim tamam: ${result.placements.length} palet · doluluk %${result.fillPct} · denge ${result.balance.score}`,
    )
  }

  function handleDropPallet(palletId, xMm, yMm) {
    const pallet = pallets.find((p) => p.id === palletId)
    if (!pallet || !vehicle) return
    const existing = placements.find((p) => p.palletId === palletId)
    const lengthMm = pallet.lengthMm
    const widthMm = pallet.widthMm
    const nextPlacement = {
      palletId,
      xMm: Math.round(Math.max(0, Math.min(vehicle.innerLengthMm - lengthMm, xMm))),
      yMm: Math.round(Math.max(0, Math.min(vehicle.innerWidthMm - widthMm, yMm))),
      zMm: 0,
      lengthMm,
      widthMm,
      heightMm: (pallet.heightMm || 144) + (pallet.loadHeightMm || 1000),
      weightKg: pallet.weightKg,
      customer: pallet.customer,
      address: pallet.address,
    }
    if (existing) {
      setPlacements(placements.map((p) => (p.palletId === palletId ? nextPlacement : p)))
    } else {
      setPlacements([...placements, nextPlacement])
    }
  }

  function savePlan(status = 'draft') {
    const saved = upsertLoadPlan({
      id: planId || undefined,
      vehicleId: vehicle?.id,
      source,
      selectionMode,
      pallets,
      placements,
      balance,
      status,
    })
    const row = saved[0]
    setPlanId(row.id)
    setPlans(saved)
    setMessage(`Plan kaydedildi: ${row.code}`)
    setStep(5)
  }

  function addManualPallet() {
    const euro = palletTypes.find((p) => p.id === 'euro') || palletTypes[0]
    const n = pallets.length + 1
    setPallets([
      ...pallets,
      {
        id: `pal-man-${Date.now()}`,
        code: `PL-${String(n).padStart(3, '0')}`,
        palletTypeId: euro?.id,
        lengthMm: euro?.lengthMm || 1200,
        widthMm: euro?.widthMm || 800,
        heightMm: euro?.heightMm || 144,
        loadHeightMm: 1000,
        weightKg: 500,
        volumeM3: volumeM3(euro?.lengthMm || 1200, euro?.widthMm || 800, 1000),
        boxCount: 10,
        customer: 'Manuel müşteri',
        city: 'İstanbul',
        country: 'TR',
        address: 'Depo çıkış',
        invoiceNo: `INV-M-${n}`,
        waybillNo: `IRS-M-${n}`,
      },
    ])
  }

  const sampleLayerPack = useMemo(() => {
    const euro = palletTypes[0]
    if (!euro) return { layers: [] }
    return packBoxesOnPallet(euro, Array.from({ length: 16 }, (_, i) => ({
      id: `b${i}`,
      lengthMm: 400,
      widthMm: 300,
      heightMm: 300,
      grossKg: 8,
    })))
  }, [palletTypes])

  const title = mode === 'placement' ? 'Tır Yerleşimi' : 'Yükleme Planı'

  return (
    <AppPageShell className="slp-shell">
      <AppPageHeader
        title={title}
        subtitle="Smart Load Planner · WMS + TMS"
        actions={(
          <div className="slp-toolbar">
            <button type="button" className="slp-btn slp-btn--primary" onClick={runAiOptimize}>
              <Sparkles className="inline h-3.5 w-3.5 mr-1" />
              AI Optimize
            </button>
            <button type="button" className="slp-btn" onClick={() => savePlan('active')}>
              Kaydet
            </button>
            <Link to="/lojistik/sevkiyatlar" className="slp-btn slp-btn--ghost">Sevkiyatlar</Link>
          </div>
        )}
      />

      <div className="slp-metrics">
        <div className="slp-metric"><strong>{stats.palletCount}</strong><span>Palet</span></div>
        <div className="slp-metric"><strong>{stats.placed}</strong><span>Yerleşen</span></div>
        <div className="slp-metric"><strong>%{stats.fillKg}</strong><span>KG Doluluk</span></div>
        <div className="slp-metric"><strong>%{stats.fillM3}</strong><span>m³ Doluluk</span></div>
        <div className="slp-metric"><strong>{balance.score}</strong><span>Denge Skoru</span></div>
        <div className="slp-metric"><strong>{plans.length}</strong><span>Plan</span></div>
      </div>

      {message ? <div className="slp-glass slp-panel" style={{ fontWeight: 700, color: 'var(--accent)' }}>{message}</div> : null}

      <div className="slp-wizard">
        {WIZARD.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`slp-wizard__step${step === s.id ? ' is-active' : ''}${step > s.id ? ' is-done' : ''}`}
            onClick={() => setStep(s.id)}
          >
            {s.id}. {s.label}
          </button>
        ))}
      </div>

      {step <= 2 && (
        <div className="slp-glass slp-panel slp-form-grid">
          <div className="slp-field">
            <label>Kaynak</label>
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="depo">Depo</option>
              <option value="sube">Şube</option>
            </select>
          </div>
          <div className="slp-field">
            <label>Seçim tipi</label>
            <select value={selectionMode} onChange={(e) => setSelectionMode(e.target.value)}>
              <option value="customer">Cari bazlı</option>
              <option value="order">Sipariş bazlı</option>
              <option value="invoice">Fatura bazlı</option>
              <option value="waybill">İrsaliye bazlı</option>
              <option value="production">Üretim bazlı</option>
              <option value="manual">Manuel ürün</option>
            </select>
          </div>
          <div className="slp-field">
            <label>Araç</label>
            <select value={vehicle?.id || ''} onChange={(e) => setVehicleId(e.target.value)}>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} · {v.brand} {v.model}
                </option>
              ))}
            </select>
          </div>
          <div className="slp-toolbar" style={{ alignSelf: 'end' }}>
            <button type="button" className="slp-btn slp-btn--primary" onClick={() => setStep(3)}>
              Devam
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="slp-glass slp-panel">
          <div className="slp-toolbar" style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0, flex: 1 }}>Palet kartları</h3>
            <button type="button" className="slp-btn" onClick={addManualPallet}>
              <Plus className="inline h-3.5 w-3.5 mr-1" />
              Palet ekle
            </button>
            <button type="button" className="slp-btn slp-btn--primary" onClick={() => setStep(4)}>
              Yerleşime geç
            </button>
          </div>
          <div className="slp-table-wrap">
            <table className="slp-table">
              <thead>
                <tr>
                  <th>Palet</th>
                  <th>Müşteri</th>
                  <th>Adres</th>
                  <th>Fatura</th>
                  <th>İrsaliye</th>
                  <th>KG</th>
                  <th>m³</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pallets.map((p) => (
                  <tr key={p.id}>
                    <td>{p.code}</td>
                    <td>{p.customer}</td>
                    <td>{p.city}, {p.country}</td>
                    <td>{p.invoiceNo}</td>
                    <td>{p.waybillNo}</td>
                    <td>{p.weightKg}</td>
                    <td>{Number(p.volumeM3).toFixed(2)}</td>
                    <td>
                      <button
                        type="button"
                        className="slp-btn slp-btn--ghost"
                        onClick={() => setPallets(pallets.filter((x) => x.id !== p.id))}
                        aria-label="Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="slp-hero" style={{ marginTop: 14 }}>
            <div>
              <h3>3D Palet katmanları</h3>
              <PalletScene3D pallet={palletTypes[0]} layers={sampleLayerPack.layers} />
            </div>
            <div className="slp-glass slp-panel">
              <h3>Katman özeti</h3>
              <p style={{ fontSize: 13, fontWeight: 600 }}>
                {sampleLayerPack.layers.length} katman · {sampleLayerPack.totalKg?.toFixed?.(0) || 0} kg
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Koli → palet istif motoru yükseklik ve KG limitlerini korur.
              </p>
            </div>
          </div>
        </div>
      )}

      {step >= 4 && (
        <div className="slp-stage">
          <aside className="slp-glass slp-palette">
            <h3>Palet havuzu</h3>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', margin: 0 }}>
              Sürükleyip tır zeminine bırakın
            </p>
            {pallets.map((p) => {
              const placed = placements.some((x) => x.palletId === p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  className="slp-pallet-chip"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}
                  style={{ opacity: placed ? 0.55 : 1 }}
                >
                  <strong>{p.code} · {p.customer}</strong>
                  <span>{p.weightKg} kg · {p.city} · {placed ? 'Yerleşti' : 'Bekliyor'}</span>
                </button>
              )
            })}
            <div className="slp-balance" style={{ marginTop: 8 }}>
              {[
                ['Sol', balance.leftPct],
                ['Sağ', balance.rightPct],
                ['Ön', balance.frontPct],
                ['Arka', balance.rearPct],
              ].map(([label, pct]) => (
                <div key={label}>
                  <span style={{ fontSize: 11, fontWeight: 800 }}>{label} %{pct}</span>
                  <div className="slp-balance__bar"><i style={{ width: `${pct}%` }} /></div>
                </div>
              ))}
            </div>
          </aside>

          <div className="slp-canvas-wrap" style={{ position: 'relative' }}>
            <div className="slp-view-tabs">
              <button type="button" className={`slp-btn${view3d ? '' : ' slp-btn--primary'}`} onClick={() => setView3d(false)}>Üst</button>
              <button type="button" className={`slp-btn${view3d ? ' slp-btn--primary' : ''}`} onClick={() => setView3d(true)}>3D</button>
              <button type="button" className="slp-btn slp-btn--primary" onClick={runAiOptimize}>AI</button>
            </div>
            {view3d ? (
              <TruckScene3D vehicle={vehicle} placements={placements} />
            ) : (
              <TruckTopView
                vehicle={vehicle}
                placements={placements}
                pallets={pallets}
                onChangePlacements={setPlacements}
                onDropPallet={handleDropPallet}
              />
            )}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="slp-glass slp-panel">
          <h3>Plan onayı</h3>
          <p style={{ fontWeight: 600 }}>
            {placements.length} palet yerleşti · denge {balance.score}
            {balance.safe ? ' · güvenli' : ' · dengeyi kontrol edin'}
          </p>
          <div className="slp-toolbar">
            <Link to="/lojistik/rotalar" className="slp-btn slp-btn--primary">Rota oluştur</Link>
            <Link to="/lojistik/evraklar" className="slp-btn">Evraklar</Link>
            <Link to="/lojistik/teslimatlar" className="slp-btn">Teslimatlar</Link>
          </div>
        </div>
      )}
    </AppPageShell>
  )
}
