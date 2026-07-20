import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Activity,
  Boxes,
  Factory,
  MapPinned,
  Package,
  Route,
  Sparkles,
  Truck,
  Warehouse,
} from 'lucide-react'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { twinSubMenus } from '../data/digitalTwinMenu'
import Twin3DGate from '../components/DigitalTwin/Twin3DGate'
import {
  BOTTLENECKS,
  FACTORY_LINES,
  FLOW_STAGES,
  FORECASTS,
  MACHINES,
  PALLETS,
  STATUS_COLORS,
  TWIN_KPIS,
  VEHICLE_TYPES,
  buildWarehouseZones,
  readTwinPrefs,
  writeTwinPrefs,
} from '../twin/demoState'

function heatColor(fill) {
  if (fill > 75) return 'bg-rose-500/80'
  if (fill > 45) return 'bg-amber-400/70'
  return 'bg-emerald-500/50'
}

export default function DigitalTwinCenterPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('view') || 'control'
  const [prefs, setPrefs] = useState(() => ({ enable3d: false, ...readTwinPrefs() }))
  const [flowTick, setFlowTick] = useState(4)
  const [whatIf, setWhatIf] = useState({ orders: 10, machines: 0, warehouses: 0 })
  const zones = useMemo(() => buildWarehouseZones(), [])

  useEffect(() => {
    function sync() {
      setPrefs({ enable3d: false, ...readTwinPrefs() })
    }
    window.addEventListener('bach:twin-prefs-updated', sync)
    return () => window.removeEventListener('bach:twin-prefs-updated', sync)
  }, [])

  useEffect(() => {
    if (tab !== 'orderFlow' && tab !== 'production') return undefined
    const id = setInterval(() => setFlowTick((n) => (n + 1) % FLOW_STAGES.length), 1600)
    return () => clearInterval(id)
  }, [tab])

  function setView(id) {
    const next = new URLSearchParams(params)
    if (id === 'control') next.delete('view')
    else next.set('view', id)
    setParams(next, { replace: true })
  }

  function toggle3d() {
    const next = writeTwinPrefs({ enable3d: !prefs.enable3d })
    setPrefs({ enable3d: false, ...next })
  }

  const simResult = useMemo(() => {
    const delayRisk = Math.min(95, 12 + whatIf.orders * 3 - whatIf.machines * 8)
    const throughput = Math.max(10, 100 + whatIf.machines * 18 - whatIf.orders * 2)
    const costDelta = whatIf.warehouses * 4.5 - whatIf.machines * 1.2 + whatIf.orders * 0.3
    return { delayRisk, throughput, costDelta }
  }, [whatIf])

  return (
    <div className="w-full space-y-5 pb-8">
      <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <Factory className="h-5 w-5" />
              <h1 className="text-xl font-black uppercase tracking-wide">Digital Twin Center</h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              ERP üzerinde görselleştirme katmanı. İş mantığı değişmez — üretim, depo, palet ve
              lojistik canlı izlenir. 3D isteğe bağlıdır.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggle3d}
              className={`rounded-xl border px-3 py-2 text-xs font-black uppercase ${
                prefs.enable3d
                  ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-100'
                  : 'border-dark-500/50 bg-dark-700/70 text-gray-300'
              }`}
            >
              3D {prefs.enable3d ? 'Açık' : 'Kapalı'}
            </button>
            <Link
              to="/lojistik/yukleme-plani"
              className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-black uppercase text-amber-200"
            >
              <Truck className="h-4 w-4" />
              AI Yükleme
            </Link>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-1.5">
        {twinSubMenus.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setView(t.id)}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide ${
              tab === t.id
                ? 'bg-cyan-500/20 text-cyan-100'
                : 'bg-dark-800/80 text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'control' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Sipariş', value: TWIN_KPIS.ordersOpen, icon: Boxes },
              { label: 'Üretim', value: TWIN_KPIS.productionRunning, icon: Factory },
              { label: 'Depo %', value: TWIN_KPIS.warehouseFillPct, icon: Warehouse },
              { label: 'Palet', value: TWIN_KPIS.palletsReady, icon: Package },
              { label: 'Tır', value: TWIN_KPIS.trucksLoading, icon: Truck },
              { label: 'Teslimat', value: TWIN_KPIS.deliveriesToday, icon: MapPinned },
              { label: 'Tahsilat', value: TWIN_KPIS.collectionsPending, icon: Activity },
              { label: 'AI Alert', value: TWIN_KPIS.aiAlerts, icon: Sparkles },
            ].map((k) => (
              <div key={k.label} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
                <div className="flex items-center gap-2 text-gray-400">
                  <k.icon className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase">{k.label}</span>
                </div>
                <div className="mt-1 text-3xl font-black text-white">{k.value}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <h2 className="text-xs font-black uppercase text-rose-300">Bottleneck</h2>
              <ul className="mt-2 space-y-2">
                {BOTTLENECKS.map((b) => (
                  <li
                    key={b.entity}
                    className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm"
                  >
                    <div className="font-bold text-white">{b.entity}</div>
                    <div className="text-xs text-gray-400">
                      Bekleme {b.waitMinutes} dk · {b.cause}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <h2 className="text-xs font-black uppercase text-violet-300">AI Tahminleri</h2>
              <ul className="mt-2 space-y-2">
                {FORECASTS.map((f) => (
                  <li
                    key={f.kind}
                    className="rounded-lg border border-violet-500/20 px-3 py-2 text-sm"
                  >
                    <div className="font-bold text-white">{f.kind}</div>
                    <div className="text-xs text-gray-400">
                      {f.detail} · %{Math.round(f.confidence * 100)}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}

      {tab === 'factory' && (
        <div className="space-y-4">
          <Twin3DGate enabled={Boolean(prefs.enable3d)} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FACTORY_LINES.map((line) => (
              <div
                key={line.id}
                className={`${APP_SURFACE_PANEL_CLASS} border-l-4 p-4`}
                style={{ borderLeftColor: STATUS_COLORS[line.status] }}
              >
                <div className="text-sm font-black text-white">{line.name}</div>
                <div
                  className="mt-1 text-xs font-bold"
                  style={{ color: STATUS_COLORS[line.status] }}
                >
                  {line.status}
                </div>
                <div className="mt-2 text-[11px] text-gray-500">
                  {line.orderNo} · OEE %{line.oee}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'warehouse' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Smart Warehouse · Heat Map</h2>
          <p className="mt-1 text-xs text-gray-500">Depo → Koridor → Raf · doluluk renkleri</p>
          <div className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-12">
            {zones.map((z) => (
              <div
                key={z.id}
                title={`${z.id} · %${z.fill}`}
                className={`aspect-square rounded-md ${heatColor(z.fill)} flex items-end justify-center pb-0.5 text-[8px] font-bold text-white/90`}
              >
                {z.fill}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-3 text-[10px] text-gray-500">
            <span className="inline-flex items-center gap-1">
              <i className="inline-block h-2.5 w-2.5 rounded bg-emerald-500/50" /> Düşük
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="inline-block h-2.5 w-2.5 rounded bg-amber-400/70" /> Orta
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="inline-block h-2.5 w-2.5 rounded bg-rose-500/80" /> Yoğun
            </span>
          </div>
        </section>
      )}

      {tab === 'truck' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Truck View · AI Loading</h2>
          <p className="mt-1 text-xs text-gray-500">
            Mevcut 3D sürükle-bırak yükleme motoru lojistik modülünde. Araç tipleri:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {VEHICLE_TYPES.map((v) => (
              <span
                key={v}
                className="rounded-full border border-dark-500/50 px-3 py-1 text-xs text-gray-300"
              >
                {v}
              </span>
            ))}
          </div>
          <Link
            to="/lojistik/yukleme-plani"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-xs font-black uppercase text-amber-100"
          >
            <Truck className="h-4 w-4" />
            Yük Hesaplama / 3D Yerleşim
          </Link>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-gray-400">
            <li>Palet dizilimi · ağırlık merkezi · denge · boş alan</li>
            <li>Maksimum kapasite · yükleme / boşaltma sırası</li>
          </ul>
        </section>
      )}

      {tab === 'pallet' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {PALLETS.map((p) => (
            <div key={p.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <div className="flex h-24 items-end justify-center gap-1 rounded-lg bg-gradient-to-t from-amber-700/40 to-amber-400/20 p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-6 rounded-sm bg-amber-500/80"
                    style={{ height: `${40 + (i % 3) * 18}%` }}
                  />
                ))}
              </div>
              <div className="mt-3 text-sm font-black text-white">{p.id}</div>
              <div className="text-xs text-gray-400">{p.customer}</div>
              <dl className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-gray-500">
                <div>Ağırlık: {p.weightKg} kg</div>
                <div>Yükseklik: {p.heightMm} mm</div>
                <div>Hacim: {p.volumeM3} m³</div>
                <div>SKU: {p.skuCount}</div>
                <div>Fatura: {p.invoice}</div>
                <div>İrsaliye: {p.waybill}</div>
                <div className="col-span-2">Teslimat: {p.delivery}</div>
              </dl>
            </div>
          ))}
        </div>
      )}

      {tab === 'machine' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MACHINES.map((m) => (
            <div
              key={m.id}
              className={`${APP_SURFACE_PANEL_CLASS} border-t-4 p-4`}
              style={{ borderTopColor: STATUS_COLORS[m.status] || '#64748b' }}
            >
              <div className="text-sm font-black text-white">{m.name}</div>
              <div className="text-xs font-bold" style={{ color: STATUS_COLORS[m.status] }}>
                {m.status}
              </div>
              <div className="mt-2 text-[11px] text-gray-500">
                Hız {m.speed} · Enerji {m.energy} kW
              </div>
            </div>
          ))}
        </div>
      )}

      {(tab === 'production' || tab === 'orderFlow') && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <h2 className="text-sm font-black uppercase text-gray-300">
            {tab === 'production' ? 'Production Flow' : 'Order Flow'} · SIP-24021
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {FLOW_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-2">
                <div
                  className={`rounded-xl px-3 py-2 text-xs font-black transition-all ${
                    i === flowTick
                      ? 'scale-105 bg-cyan-500/30 text-cyan-100 ring-2 ring-cyan-400/50'
                      : i < flowTick
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : 'bg-dark-800 text-gray-500'
                  }`}
                >
                  {stage}
                </div>
                {i < FLOW_STAGES.length - 1 ? <span className="text-gray-600">→</span> : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'customerFlow' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Customer Flow</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-300">
            <li>Lead / CRM kayıt</li>
            <li>Teklif → Onay</li>
            <li>Sipariş → Üretim twin</li>
            <li>Depo / Palet / Yükleme</li>
            <li>Teslimat · Tahsilat</li>
          </ol>
        </section>
      )}

      {tab === 'route' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <div className="flex items-center gap-2 text-gray-300">
            <Route className="h-4 w-4" />
            <h2 className="text-sm font-black uppercase">Route Digital Twin</h2>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Google Maps entegrasyonu DT-3. Şimdilik durak özeti + kurye takip bağlantısı.
          </p>
          <div className="mt-3 space-y-2 text-sm text-gray-300">
            <div>Rota TR-IST-01 · 5 durak · ETA 18:40</div>
            <div>Gecikme riski: düşük</div>
          </div>
          <Link
            to="/kurye-takip"
            className="mt-3 inline-block text-xs font-bold text-cyan-300 hover:underline"
          >
            Kurye Takip →
          </Link>
        </section>
      )}

      {tab === 'live' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <h2 className="text-sm font-black uppercase text-gray-300">Live Monitoring</h2>
          <p className="mt-1 text-xs text-gray-500">
            Kalite noktaları · foto / video / ölçüm (DT-2 feed)
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {['QC-1 Görsel', 'QC-2 Ölçüm', 'QC-3 AI'].map((q) => (
              <div
                key={q}
                className="rounded-xl border border-dark-500/40 bg-dark-800/60 p-4 text-center text-xs font-bold text-gray-300"
              >
                {q}
                <div className="mt-2 h-16 rounded-lg bg-gradient-to-br from-dark-700 to-dark-900" />
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'whatif' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <h2 className="text-sm font-black uppercase text-gray-300">What If Simülasyon</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { key: 'orders', label: 'Yeni sipariş' },
              { key: 'machines', label: 'Yeni makine' },
              { key: 'warehouses', label: 'Yeni depo' },
            ].map((f) => (
              <label key={f.key} className="block space-y-1 text-xs font-bold text-gray-400">
                {f.label}
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={whatIf[f.key]}
                  onChange={(e) => setWhatIf((w) => ({ ...w, [f.key]: Number(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-white">{whatIf[f.key]}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-xl border border-dark-500/40 p-3">
              Gecikme riski
              <div className="text-2xl font-black text-amber-300">%{simResult.delayRisk}</div>
            </div>
            <div className="rounded-xl border border-dark-500/40 p-3">
              Üretim hızı
              <div className="text-2xl font-black text-emerald-300">{simResult.throughput}</div>
            </div>
            <div className="rounded-xl border border-dark-500/40 p-3">
              Maliyet etkisi
              <div className="text-2xl font-black text-sky-300">
                {simResult.costDelta.toFixed(1)}%
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
