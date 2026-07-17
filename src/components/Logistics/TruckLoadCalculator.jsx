import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Minus,
  Pencil,
  Trash2,
  X,
  Package,
  Box,
  Square,
  Truck,
  Sparkles,
} from 'lucide-react'
import { AppPageShell } from '../Layout/AppPageLayout'
import {
  TRUCK_PRESETS,
  GRID_MODULES,
  LOAD_PRESETS,
  SLOT_COLORS,
  computeLoadPlan,
  itemInitials,
  fmtKg,
} from '../../utils/truckLoadCalc'
import { Link } from 'react-router-dom'
import { upsertLoadPlan, loadLoadPlans } from '../../utils/logisticsStore'
import { loadDepoItems } from '../../utils/depoStore'
import { resolveStockScope } from '../../utils/stockScope'
import { buildLoadSuggestions } from '../../utils/loadAiSuggest'
import './truck-load-calculator.css'

const STORAGE_KEY = 'bach-truck-load-calculator-v1'

function uid() {
  return `itm-${Math.random().toString(36).slice(2, 9)}`
}

function badgeTone(pct) {
  if (pct > 100) return 'tlc-badge--bad'
  if (pct > 85) return 'tlc-badge--warn'
  return 'tlc-badge--ok'
}

function readSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function CabSvg() {
  return (
    <svg width="90" height="150" viewBox="0 0 90 150" aria-hidden className="tlc-cab">
      <rect x="18" y="30" width="55" height="70" rx="8" fill="#0f172a" />
      <rect x="26" y="38" width="38" height="26" rx="4" fill="#bfdbfe" />
      <rect x="10" y="95" width="70" height="10" rx="4" fill="#0f172a" />
      <circle cx="30" cy="112" r="11" fill="#1e293b" />
      <circle cx="30" cy="112" r="4.5" fill="#bfdbfe" />
      <circle cx="62" cy="112" r="11" fill="#1e293b" />
      <circle cx="62" cy="112" r="4.5" fill="#bfdbfe" />
    </svg>
  )
}

const PRESET_ICONS = { square: Square, package: Package, box: Box }

export default function TruckLoadCalculator() {
  const saved = readSaved()
  const [wizardStep, setWizardStep] = useState(saved?.wizardStep || 1)
  const [company, setCompany] = useState(saved?.company || 'Merkez Şirket')
  const [branch, setBranch] = useState(saved?.branch || 'Merkez Şube')
  const [warehouse, setWarehouse] = useState(saved?.warehouse || 'Merkez Depo')
  const [stockScope, setStockScope] = useState(saved?.stockScope || 'customer')
  const [selectMode, setSelectMode] = useState(saved?.selectMode || 'product')
  const [truckKey, setTruckKey] = useState(saved?.truckKey || 'tir')
  const [moduleKey, setModuleKey] = useState(saved?.moduleKey || 'euro')
  const [zoom, setZoom] = useState(saved?.zoom || 1)
  const [items, setItems] = useState(() => saved?.items || [
    {
      id: 'itm-seed1',
      name: 'Europalet — Kuru Gıda',
      L: 120,
      W: 80,
      H: 150,
      weight: 500,
      qty: 14,
      stackable: false,
      colorIdx: 0,
    },
    {
      id: 'itm-seed2',
      name: 'Koli — Orta (Tekstil)',
      L: 60,
      W: 40,
      H: 40,
      weight: 15,
      qty: 120,
      stackable: true,
      colorIdx: 1,
    },
  ])
  const [colorCounter, setColorCounter] = useState(saved?.colorCounter || 2)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [toast, setToast] = useState('')

  const truck = TRUCK_PRESETS[truckKey] || TRUCK_PRESETS.tir
  const module = GRID_MODULES[moduleKey] || GRID_MODULES.euro

  const calc = useMemo(
    () => computeLoadPlan(truck, module, items),
    [truck, module, items],
  )

  const ai = useMemo(
    () => buildLoadSuggestions({ items, truckKey, moduleKey }),
    [items, truckKey, moduleKey],
  )

  const depoOptions = useMemo(() => {
    return loadDepoItems()
      .filter((row) => resolveStockScope(row) === stockScope)
      .slice(0, 40)
  }, [stockScope, wizardStep])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        wizardStep, company, branch, warehouse, stockScope, selectMode,
        truckKey, moduleKey, zoom, items, colorCounter,
      }),
    )
  }, [wizardStep, company, branch, warehouse, stockScope, selectMode, truckKey, moduleKey, zoom, items, colorCounter])

  const cell = Math.round(46 * zoom)

  function openNew(preset) {
    setDraft({
      id: '',
      name: preset?.name || '',
      L: preset?.L ?? 120,
      W: preset?.W ?? 80,
      H: preset?.H ?? 150,
      weight: preset?.weight ?? 500,
      qty: 1,
      stackable: Boolean(preset?.stackable),
    })
    setModalOpen(true)
  }

  function openEdit(item) {
    setDraft({ ...item })
    setModalOpen(true)
  }

  function saveDraft(e) {
    e.preventDefault()
    if (!draft?.name?.trim()) return
    if (draft.id) {
      setItems((prev) => prev.map((it) => (it.id === draft.id ? { ...it, ...draft, name: draft.name.trim() } : it)))
    } else {
      const nextIdx = colorCounter
      setColorCounter((c) => c + 1)
      setItems((prev) => [
        ...prev,
        {
          id: uid(),
          colorIdx: nextIdx,
          name: draft.name.trim(),
          L: Number(draft.L) || 1,
          W: Number(draft.W) || 1,
          H: Number(draft.H) || 1,
          weight: Number(draft.weight) || 0,
          qty: Number(draft.qty) || 1,
          stackable: Boolean(draft.stackable),
        },
      ])
    }
    setModalOpen(false)
    setDraft(null)
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id))
    setConfirmId(null)
  }

  function importDepoRow(row) {
    const nextIdx = colorCounter
    setColorCounter((c) => c + 1)
    setItems((prev) => [
      ...prev,
      {
        id: uid(),
        colorIdx: nextIdx,
        name: `${row.product || 'Ürün'}${row.productCode ? ` (${row.productCode})` : ''}`,
        L: 120,
        W: 80,
        H: 150,
        weight: Math.max(20, Number(row.unitPrice) || 50),
        qty: Math.max(1, Number(row.quantity) || Number(row.deliveredQuantity) || 1),
        stackable: false,
        customer: typeof row.customer === 'string' ? row.customer : row.customer?.companyTitle || '',
        orderNo: row.orderId || '',
        invoiceNo: row.invoiceNo || '',
        depoItemId: row.id,
      },
    ])
    setToast('Depo kalemi yüke eklendi')
    window.setTimeout(() => setToast(''), 1800)
  }

  function applyAiTruck() {
    if (ai.recommendedTruckKey) setTruckKey(ai.recommendedTruckKey)
    setToast(ai.tips[0] || 'AI önerisi uygulandı')
    window.setTimeout(() => setToast(''), 2200)
  }

  function saveAsPlan() {
    const savedPlans = upsertLoadPlan({
      source: 'calculator',
      selectionMode: selectMode,
      status: 'planned',
      company,
      branch,
      warehouse,
      stockScope,
      truckKey,
      moduleKey,
      meta: {
        weight: calc.totalWeight,
        slots: calc.totalSlotsUsed,
        totalSlots: calc.totalSlots,
        fillPct: calc.fillPct,
        aiTips: ai.tips,
      },
      pallets: items.map((it) => ({
        id: it.id,
        code: it.name,
        customer: it.customer || '',
        orderNo: it.orderNo || '',
        invoiceNo: it.invoiceNo || '',
        lengthMm: it.L * 10,
        widthMm: it.W * 10,
        heightMm: it.H * 10,
        weightKg: it.weight * it.qty,
        qty: it.qty,
      })),
      placements: [],
    })
    setToast(`Plan kaydedildi · ${savedPlans[0]?.code || ''} → Planlanan Lojistik`)
    window.setTimeout(() => setToast(''), 3200)
  }

  const WIZARD = [
    { id: 1, label: 'Lokasyon' },
    { id: 2, label: 'Stok tipi' },
    { id: 3, label: 'Seçim' },
    { id: 4, label: 'Yükleme' },
  ]

  return (
    <AppPageShell>
      <div className="tlc">
        <div className="tlc-head">
          <div>
            <h1>Yük Hesaplama</h1>
            <p>Şirket → stok tipi → ürün seçimi → akıllı paketleme ve araç yerleşimi.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link to="/lojistik/planlanan" className="tlc-btn tlc-btn--ghost">Planlanan</Link>
            <button type="button" className="tlc-btn tlc-btn--ghost" onClick={saveAsPlan}>
              <Truck className="h-4 w-4" />
              Planı Kaydet
            </button>
            <button type="button" className="tlc-btn tlc-btn--primary" onClick={() => { setWizardStep(4); openNew() }}>
              <Plus className="h-4 w-4" />
              Yük Ekle
            </button>
          </div>
        </div>

        <div className="tlc-card" style={{ padding: 12, marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {WIZARD.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`tlc-btn ${wizardStep === s.id ? 'tlc-btn--primary' : 'tlc-btn--ghost'}`}
              onClick={() => setWizardStep(s.id)}
            >
              {s.id}. {s.label}
            </button>
          ))}
        </div>

        {toast ? (
          <div className="tlc-card" style={{ padding: '12px 16px', marginBottom: 14, fontWeight: 700, color: 'var(--tlc-accent)' }}>
            {toast}
          </div>
        ) : null}

        {wizardStep <= 3 ? (
          <div className="tlc-card tlc-panel" style={{ marginBottom: 16 }}>
            {wizardStep === 1 && (
              <div className="tlc-form">
                <h3 style={{ margin: 0 }}>Adım 1 — Lokasyon</h3>
                <div className="tlc-form-row">
                  <div className="tlc-field" style={{ minWidth: 0 }}>
                    <label>Şirket</label>
                    <input className="tlc-input" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </div>
                  <div className="tlc-field" style={{ minWidth: 0 }}>
                    <label>Şube</label>
                    <input className="tlc-input" value={branch} onChange={(e) => setBranch(e.target.value)} />
                  </div>
                  <div className="tlc-field" style={{ minWidth: 0 }}>
                    <label>Depo</label>
                    <input className="tlc-input" value={warehouse} onChange={(e) => setWarehouse(e.target.value)} />
                  </div>
                </div>
                <div className="tlc-modal-actions">
                  <button type="button" className="tlc-btn tlc-btn--primary" onClick={() => setWizardStep(2)}>Devam</button>
                </div>
              </div>
            )}
            {wizardStep === 2 && (
              <div className="tlc-form">
                <h3 style={{ margin: 0 }}>Adım 2 — Stok tipi</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { id: 'general', title: 'Genel Stok', desc: 'Firmaya ait · satılabilir' },
                    { id: 'customer', title: 'Müşteri Stoğu', desc: 'Cariye özel · kilitli' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className="tlc-preset"
                      style={stockScope === opt.id ? { borderColor: 'var(--tlc-accent)', boxShadow: '0 0 0 3px rgba(37,99,235,.15)' } : undefined}
                      onClick={() => setStockScope(opt.id)}
                    >
                      <strong>{opt.title}</strong>
                      <span>{opt.desc}</span>
                    </button>
                  ))}
                </div>
                <div className="tlc-modal-actions">
                  <button type="button" className="tlc-btn tlc-btn--ghost" onClick={() => setWizardStep(1)}>Geri</button>
                  <button type="button" className="tlc-btn tlc-btn--primary" onClick={() => setWizardStep(3)}>Devam</button>
                </div>
              </div>
            )}
            {wizardStep === 3 && (
              <div className="tlc-form">
                <h3 style={{ margin: 0 }}>Adım 3 — Seçim</h3>
                <div className="tlc-field" style={{ minWidth: 0 }}>
                  <label>Seçim tipi</label>
                  <select className="tlc-input" value={selectMode} onChange={(e) => setSelectMode(e.target.value)}>
                    <option value="customer">Cari</option>
                    <option value="invoice">Fatura</option>
                    <option value="order">Sipariş</option>
                    <option value="waybill">İrsaliye</option>
                    <option value="product">Ürün / Depo kalemi</option>
                  </select>
                </div>
                <div className="tlc-plan-list" style={{ maxHeight: 280 }}>
                  {!depoOptions.length ? (
                    <div className="tlc-empty">Bu stok tipinde depo kalemi yok — manuel yük ekleyebilirsiniz.</div>
                  ) : depoOptions.map((row) => (
                    <div key={row.id} className="tlc-plan-row" style={{ gridTemplateColumns: '2fr 1fr 1fr auto' }}>
                      <div>
                        <strong>{row.product}</strong>
                        <div style={{ fontSize: 11, color: 'var(--tlc-muted)' }}>
                          {typeof row.customer === 'string' ? row.customer : '—'} · {row.orderId || row.productionCode || '—'}
                        </div>
                      </div>
                      <div>{row.productCode || '—'}</div>
                      <div>{row.quantity || row.deliveredQuantity || 0} adet</div>
                      <button type="button" className="tlc-btn tlc-btn--primary" onClick={() => importDepoRow(row)}>Ekle</button>
                    </div>
                  ))}
                </div>
                <div className="tlc-modal-actions">
                  <button type="button" className="tlc-btn tlc-btn--ghost" onClick={() => setWizardStep(2)}>Geri</button>
                  <button type="button" className="tlc-btn tlc-btn--primary" onClick={() => setWizardStep(4)}>Yüklemeye geç</button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {wizardStep >= 4 ? (
          <>
        <div className="tlc-card" style={{ padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Sparkles className="h-4 w-4" style={{ color: 'var(--tlc-accent)' }} />
                AI Load Optimizer
              </strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13, fontWeight: 600, color: 'var(--tlc-muted)' }}>
                {ai.tips.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </div>
            <button type="button" className="tlc-btn tlc-btn--primary" onClick={applyAiTruck}>Önerilen aracı uygula</button>
          </div>
        </div>

        <div className="tlc-card tlc-toolbar">
          <div className="tlc-field">
            <label>Araç Tipi</label>
            <select className="tlc-input" value={truckKey} onChange={(e) => setTruckKey(e.target.value)}>
              {Object.values(TRUCK_PRESETS).map((t) => (
                <option key={t.key} value={t.key}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="tlc-field">
            <label>Yerleşim Referansı (grid birimi)</label>
            <select className="tlc-input" value={moduleKey} onChange={(e) => setModuleKey(e.target.value)}>
              {Object.values(GRID_MODULES).map((m) => (
                <option key={m.key} value={m.key}>{m.name}</option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: 12, color: 'var(--tlc-muted)', fontWeight: 600, paddingBottom: 8, lineHeight: 1.5 }}>
            İç ölçüler: <b>{truck.L}×{truck.W}×{truck.H} cm</b>
            {' '}|{' '}
            Maks. yük: <b>{fmtKg(truck.maxWeight)} kg</b>
          </div>
          <div className="tlc-hint">
            Bu araç yaklaşık bir yerleşim tahminidir; kesin istifleme planı değildir.
          </div>
        </div>

        <div className="tlc-kpis">
          <div className="tlc-card tlc-kpi">
            <div className="tlc-kpi__top">
              <span className="tlc-kpi__label">Ağırlık</span>
              <span className={`tlc-badge ${badgeTone(calc.weightPct)}`}>%{calc.weightPct}</span>
            </div>
            <div className="tlc-kpi__value">{fmtKg(calc.totalWeight)} / {fmtKg(truck.maxWeight)} kg</div>
          </div>
          <div className="tlc-card tlc-kpi">
            <div className="tlc-kpi__top">
              <span className="tlc-kpi__label">Slot / Pozisyon</span>
              <span className={`tlc-badge ${badgeTone(calc.slotPct)}`}>%{calc.slotPct}</span>
            </div>
            <div className="tlc-kpi__value">{calc.totalSlotsUsed} / {calc.totalSlots}</div>
          </div>
          <div className="tlc-card tlc-kpi">
            <div className="tlc-kpi__top">
              <span className="tlc-kpi__label">Doluluk Oranı</span>
              <span className="tlc-badge tlc-badge--info">Taban</span>
            </div>
            <div className="tlc-kpi__value">%{calc.fillPct}</div>
          </div>
          <div className="tlc-card tlc-kpi">
            <div className="tlc-kpi__top">
              <span className="tlc-kpi__label">Uyarılar</span>
              <span className={`tlc-badge ${calc.warnings.length ? 'tlc-badge--bad' : 'tlc-badge--ok'}`}>
                {calc.warnings.length}
              </span>
            </div>
            <div className={`tlc-alert-text ${calc.warnings.length ? 'is-bad' : 'is-ok'}`}>
              {calc.warnings[0] || 'Sorun yok'}
            </div>
          </div>
        </div>

        <div className="tlc-main">
          <div className="tlc-card tlc-panel">
            <div className="tlc-panel__head">
              <h3>Araç Yerleşim Görünümü</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="tlc-icon-btn" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} aria-label="Uzaklaştır">
                  <Minus className="h-4 w-4" />
                </button>
                <button type="button" className="tlc-icon-btn" onClick={() => setZoom((z) => Math.min(2, +(z + 0.2).toFixed(1)))} aria-label="Yakınlaştır">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="tlc-stage">
              <CabSvg />
              <div className="tlc-grid-wrap">
                <div
                  className="tlc-grid"
                  style={{
                    gridTemplateColumns: `repeat(${calc.rowsAlongLength}, ${cell}px)`,
                    gridTemplateRows: `repeat(${calc.colsAcrossWidth}, ${cell}px)`,
                  }}
                >
                  {calc.slotOwner.map((ownerIdx, s) => {
                    if (ownerIdx == null) {
                      return (
                        <button
                          key={`e-${s}`}
                          type="button"
                          className="tlc-slot tlc-slot--empty"
                          style={{ width: cell, height: cell }}
                          onClick={() => openNew()}
                        >
                          +
                        </button>
                      )
                    }
                    const item = calc.results[ownerIdx]
                    const tone = SLOT_COLORS[item.colorIdx % SLOT_COLORS.length]
                    return (
                      <div
                        key={`f-${s}`}
                        className="tlc-slot tlc-slot--filled"
                        style={{ width: cell, height: cell, background: tone.bg, color: tone.fg }}
                        title={item.name}
                        onClick={() => openEdit(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') openEdit(item)
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <span>{itemInitials(item.name)}</span>
                        <span style={{ fontWeight: 600 }}>{fmtKg(item.weight / item.qty)}kg</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="tlc-legend">
              {calc.results.length ? calc.results.map((item) => {
                const tone = SLOT_COLORS[item.colorIdx % SLOT_COLORS.length]
                return (
                  <span key={item.id}>
                    <i style={{ background: tone.bg, border: `1px solid ${tone.fg}22` }} />
                    {item.name}
                    {' '}
                    <span style={{ color: 'var(--tlc-faint)' }}>({item.slotsUsed} slot)</span>
                  </span>
                )
              }) : <span style={{ color: 'var(--tlc-faint)' }}>Henüz yük eklenmedi.</span>}
            </div>
          </div>

          <div className="tlc-card tlc-panel">
            <div className="tlc-panel__head">
              <h3>Yük Planı</h3>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tlc-muted)' }}>
                {calc.results.length} kalem
              </span>
            </div>
            <div className="tlc-plan-head">
              <div>Ürün</div>
              <div>Adet</div>
              <div>Slot</div>
              <div>Ağırlık</div>
              <div />
            </div>
            <div className="tlc-plan-list">
              {!calc.results.length ? (
                <div className="tlc-empty">Henüz yük eklenmedi.</div>
              ) : (
                calc.results.map((item) => {
                  const tone = SLOT_COLORS[item.colorIdx % SLOT_COLORS.length]
                  return (
                    <div key={item.id} className="tlc-plan-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: tone.bg, border: `1px solid ${tone.fg}30`, flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                      </div>
                      <div>{item.qty}</div>
                      <div>{item.slotsUsed}</div>
                      <div>{fmtKg(item.weight)} kg</div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <button type="button" className="tlc-icon-btn tlc-icon-btn--sm" onClick={() => openEdit(item)} aria-label="Düzenle">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" className="tlc-icon-btn tlc-icon-btn--sm tlc-icon-btn--danger" onClick={() => setConfirmId(item.id)} aria-label="Sil">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <button type="button" className="tlc-btn tlc-btn--ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={() => openNew()}>
              <Plus className="h-4 w-4" />
              Yeni Kalem Ekle
            </button>
          </div>
        </div>

        <div className="tlc-card tlc-panel">
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 800 }}>Palet / Koli Seçenekleri — Hızlı Ekle</h3>
          <div className="tlc-presets">
            {LOAD_PRESETS.map((p, idx) => {
              const Icon = PRESET_ICONS[p.icon] || Package
              const tone = SLOT_COLORS[idx % SLOT_COLORS.length]
              return (
                <button key={p.name} type="button" className="tlc-preset" onClick={() => openNew(p)}>
                  <div className="tlc-preset__icon" style={{ background: tone.bg, color: tone.fg }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <strong>{p.name}</strong>
                  <span>{p.L}×{p.W}×{p.H} cm · {p.weight} kg</span>
                </button>
              )
            })}
          </div>
        </div>
          </>
        ) : null}
      </div>

      {modalOpen && draft ? (
        <div className="tlc-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div className="tlc-modal" role="dialog" aria-modal="true">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{draft.id ? 'Kalemi Düzenle' : 'Yük Ekle'}</h3>
              <button type="button" className="tlc-icon-btn" onClick={() => setModalOpen(false)} aria-label="Kapat">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form className="tlc-form" onSubmit={saveDraft}>
              <div className="tlc-field" style={{ minWidth: 0 }}>
                <label>Ürün / Palet / Koli Adı</label>
                <input className="tlc-input" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Örn. Euro Palet — Kuru Gıda" />
              </div>
              <div className="tlc-form-row">
                <div className="tlc-field" style={{ minWidth: 0 }}>
                  <label>Uzunluk (cm)</label>
                  <input className="tlc-input" type="number" min={1} required value={draft.L} onChange={(e) => setDraft({ ...draft, L: e.target.value })} />
                </div>
                <div className="tlc-field" style={{ minWidth: 0 }}>
                  <label>Genişlik (cm)</label>
                  <input className="tlc-input" type="number" min={1} required value={draft.W} onChange={(e) => setDraft({ ...draft, W: e.target.value })} />
                </div>
                <div className="tlc-field" style={{ minWidth: 0 }}>
                  <label>Yükseklik (cm)</label>
                  <input className="tlc-input" type="number" min={1} required value={draft.H} onChange={(e) => setDraft({ ...draft, H: e.target.value })} />
                </div>
              </div>
              <div className="tlc-form-row tlc-form-row--2">
                <div className="tlc-field" style={{ minWidth: 0 }}>
                  <label>Birim Ağırlık (kg)</label>
                  <input className="tlc-input" type="number" min={0} step="0.1" required value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: e.target.value })} />
                </div>
                <div className="tlc-field" style={{ minWidth: 0 }}>
                  <label>Adet</label>
                  <input className="tlc-input" type="number" min={1} required value={draft.qty} onChange={(e) => setDraft({ ...draft, qty: e.target.value })} />
                </div>
              </div>
              <label className="tlc-check">
                <input type="checkbox" checked={Boolean(draft.stackable)} onChange={(e) => setDraft({ ...draft, stackable: e.target.checked })} />
                İstiflenebilir (araç yüksekliğine göre üst üste sayılır)
              </label>
              <div className="tlc-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Vazgeç</button>
                <button type="submit" className="tlc-btn tlc-btn--primary">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {confirmId ? (
        <div className="tlc-overlay" onClick={(e) => { if (e.target === e.currentTarget) setConfirmId(null) }}>
          <div className="tlc-modal" style={{ maxWidth: 360 }}>
            <div style={{ width: 44, height: 44, borderRadius: 16, background: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Trash2 className="h-5 w-5" style={{ color: 'var(--tlc-danger)' }} />
            </div>
            <h3>Bu kalemi sil?</h3>
            <p style={{ fontSize: 14, color: 'var(--tlc-muted)', fontWeight: 600, marginTop: 8 }}>Yük planından kaldırılacak.</p>
            <div className="tlc-modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setConfirmId(null)}>Vazgeç</button>
              <button type="button" className="tlc-btn tlc-btn--danger" onClick={() => removeItem(confirmId)}>Sil</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppPageShell>
  )
}
