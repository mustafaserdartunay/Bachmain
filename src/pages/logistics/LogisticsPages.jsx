import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import {
  getLogisticsSummary,
  loadDeliveries,
  loadLoadPlans,
  loadLogisticsDocuments,
  loadRoutes,
  loadShipments,
  upsertDelivery,
  upsertLogisticsDocument,
  upsertRoute,
  upsertShipment,
  LOGISTICS_EVENT,
} from '../../utils/logisticsStore'
import { DOCUMENT_TYPES, DOC_LANGUAGES } from '../../utils/logisticsCatalogs'
import { logisticsSubMenus } from '../../data/logisticsMenu'
import '../../components/Logistics/logistics.css'

export function LogisticsHubPage() {
  const [summary, setSummary] = useState(getLogisticsSummary)
  useEffect(() => {
    function refresh() {
      setSummary(getLogisticsSummary())
    }
    window.addEventListener(LOGISTICS_EVENT, refresh)
    return () => window.removeEventListener(LOGISTICS_EVENT, refresh)
  }, [])

  return (
    <AppPageShell className="slp-shell">
      <AppPageHeader
        title="Lojistik"
        subtitle="Smart Load Planner · WMS + TMS"
        actions={(
          <Link to="/lojistik/yukleme-plani" className="slp-btn slp-btn--primary">
            <Plus className="inline h-3.5 w-3.5 mr-1" />
            Yeni yükleme
          </Link>
        )}
      />
      <div className="slp-metrics">
        <div className="slp-metric"><strong>{summary.vehicles}</strong><span>Araç</span></div>
        <div className="slp-metric"><strong>{summary.shipments}</strong><span>Sevkiyat</span></div>
        <div className="slp-metric"><strong>{summary.loadPlans}</strong><span>Yükleme Planı</span></div>
        <div className="slp-metric"><strong>%{summary.fillVolumePct}</strong><span>Hacim Doluluk</span></div>
        <div className="slp-metric"><strong>%{summary.fillWeightPct}</strong><span>KG Doluluk</span></div>
        <div className="slp-metric"><strong>{summary.deliveriesPending}</strong><span>Bekleyen Teslim</span></div>
      </div>
      <div className="slp-glass slp-panel">
        <h3>Modüller</h3>
        <div className="slp-metrics">
          {logisticsSubMenus.map((item) => (
            <Link key={item.path} to={item.path} className="slp-metric" style={{ textDecoration: 'none', color: 'inherit' }}>
              <strong style={{ fontSize: 14 }}>{item.label}</strong>
              <span>Aç</span>
            </Link>
          ))}
        </div>
      </div>
    </AppPageShell>
  )
}

export function ShipmentsPage() {
  const [rows, setRows] = useState(loadShipments)
  useEffect(() => {
    const r = () => setRows(loadShipments())
    window.addEventListener(LOGISTICS_EVENT, r)
    return () => window.removeEventListener(LOGISTICS_EVENT, r)
  }, [])

  function create() {
    upsertShipment({
      status: 'planned',
      origin: 'Merkez Depo',
      destination: 'EU Hub',
      vehiclePlate: '34 BM 0101',
      palletCount: 0,
    })
    setRows(loadShipments())
  }

  return (
    <AppPageShell className="slp-shell">
      <AppPageHeader title="Sevkiyatlar" actions={<button type="button" className="slp-btn slp-btn--primary" onClick={create}>Yeni sevkiyat</button>} />
      <div className="slp-glass slp-panel slp-table-wrap">
        <table className="slp-table">
          <thead>
            <tr><th>Kod</th><th>Durum</th><th>Çıkış</th><th>Varış</th><th>Araç</th><th>Palet</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.code}</td><td>{r.status}</td><td>{r.origin}</td><td>{r.destination}</td><td>{r.vehiclePlate}</td><td>{r.palletCount}</td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={6} className="slp-empty">Henüz sevkiyat yok</td></tr> : null}
          </tbody>
        </table>
      </div>
    </AppPageShell>
  )
}

export function RoutesPage() {
  const [rows, setRows] = useState(loadRoutes)
  useEffect(() => {
    const r = () => setRows(loadRoutes())
    window.addEventListener(LOGISTICS_EVENT, r)
    return () => window.removeEventListener(LOGISTICS_EVENT, r)
  }, [])

  function create() {
    upsertRoute({
      name: 'TR → DE ekspres',
      distanceKm: 1850,
      fuelLiters: 520,
      etaHours: 28,
      stops: [
        { city: 'İstanbul', country: 'TR', order: 1 },
        { city: 'Kapıkule', country: 'TR', order: 2, customs: true },
        { city: 'München', country: 'DE', order: 3 },
      ],
    })
    setRows(loadRoutes())
  }

  return (
    <AppPageShell className="slp-shell">
      <AppPageHeader title="Rotalar" subtitle="Teslim sırası · ETA · gümrük noktaları" actions={<button type="button" className="slp-btn slp-btn--primary" onClick={create}>Rota ekle</button>} />
      <div className="slp-glass slp-panel slp-table-wrap">
        <table className="slp-table">
          <thead>
            <tr><th>Kod</th><th>Rota</th><th>Km</th><th>Yakıt L</th><th>ETA (sa)</th><th>Durak</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.code}</td>
                <td>{r.name}</td>
                <td>{r.distanceKm}</td>
                <td>{r.fuelLiters}</td>
                <td>{r.etaHours}</td>
                <td>{(r.stops || []).map((s) => s.city).join(' → ')}</td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={6} className="slp-empty">Rota yok — örnek TR→DE ekleyin</td></tr> : null}
          </tbody>
        </table>
      </div>
      <div className="slp-glass slp-panel">
        <h3>Harita notu</h3>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
          Google Maps Directions API anahtarı bağlandığında canlı rota, trafik ve gümrük ETA burada görünecek.
          Şimdilik rota motoru durak sırası + yakıt/ETA hesabı tutuyor.
        </p>
      </div>
    </AppPageShell>
  )
}

export function DeliveriesPage() {
  const [rows, setRows] = useState(loadDeliveries)
  useEffect(() => {
    const r = () => setRows(loadDeliveries())
    window.addEventListener(LOGISTICS_EVENT, r)
    return () => window.removeEventListener(LOGISTICS_EVENT, r)
  }, [])

  function seed() {
    upsertDelivery({ customer: 'Acme GmbH', city: 'München', palletCode: 'PL-001', status: 'pending' })
    upsertDelivery({ customer: 'Nordic Pack AB', city: 'Stockholm', palletCode: 'PL-002', status: 'in_transit' })
    upsertDelivery({ customer: 'Box Italia SRL', city: 'Milano', palletCode: 'PL-003', status: 'delivered' })
    setRows(loadDeliveries())
  }

  return (
    <AppPageShell className="slp-shell">
      <AppPageHeader
        title="Teslimatlar"
        subtitle="Canlı durum · bekleyen / teslim"
        actions={<button type="button" className="slp-btn slp-btn--primary" onClick={seed}>Örnek yükle</button>}
      />
      <div className="slp-glass slp-panel slp-table-wrap">
        <table className="slp-table">
          <thead>
            <tr><th>Palet</th><th>Müşteri</th><th>Şehir</th><th>Durum</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.palletCode}</td>
                <td>{r.customer}</td>
                <td>{r.city}</td>
                <td>{r.status}</td>
                <td>
                  {r.status !== 'delivered' ? (
                    <button
                      type="button"
                      className="slp-btn"
                      onClick={() => {
                        upsertDelivery({ ...r, status: 'delivered' })
                        setRows(loadDeliveries())
                      }}
                    >
                      Teslim et
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={5} className="slp-empty">Teslimat yok</td></tr> : null}
          </tbody>
        </table>
      </div>
    </AppPageShell>
  )
}

export function LogisticsDocumentsPage() {
  const [rows, setRows] = useState(loadLogisticsDocuments)
  const [type, setType] = useState('cmr')
  const [language, setLanguage] = useState('en')

  useEffect(() => {
    const r = () => setRows(loadLogisticsDocuments())
    window.addEventListener(LOGISTICS_EVENT, r)
    return () => window.removeEventListener(LOGISTICS_EVENT, r)
  }, [])

  function create() {
    upsertLogisticsDocument({
      type,
      language,
      palletCode: 'PL-001',
      title: `${DOCUMENT_TYPES.find((d) => d.id === type)?.label || type} · ${language.toUpperCase()}`,
      status: 'ready',
    })
    setRows(loadLogisticsDocuments())
  }

  return (
    <AppPageShell className="slp-shell">
      <AppPageHeader
        title="Evraklar"
        subtitle="Invoice · Packing List · CMR · çok dilli · Belge Merkezi"
        actions={(
          <div className="slp-toolbar">
            <select className="slp-btn" value={type} onChange={(e) => setType(e.target.value)}>
              {DOCUMENT_TYPES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
            <select className="slp-btn" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {DOC_LANGUAGES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
            <button type="button" className="slp-btn slp-btn--primary" onClick={create}>Belge oluştur</button>
            <Link to="/belge-merkezi" className="slp-btn">Belge Merkezi</Link>
          </div>
        )}
      />
      <div className="slp-glass slp-panel slp-table-wrap">
        <table className="slp-table">
          <thead>
            <tr><th>Belge</th><th>Tip</th><th>Dil</th><th>Palet</th><th>Durum</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{r.type}</td>
                <td>{r.language}</td>
                <td>{r.palletCode}</td>
                <td>{r.status}</td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={5} className="slp-empty">Belge yok</td></tr> : null}
          </tbody>
        </table>
      </div>
    </AppPageShell>
  )
}

export function LogisticsReportsPage() {
  const summary = useMemo(() => getLogisticsSummary(), [])
  return (
    <AppPageShell className="slp-shell">
      <AppPageHeader title="Nakliye Raporları" />
      <div className="slp-metrics">
        <div className="slp-metric"><strong>%{summary.fillVolumePct}</strong><span>Araç Doluluk</span></div>
        <div className="slp-metric"><strong>%{summary.fillWeightPct}</strong><span>KG Doluluk</span></div>
        <div className="slp-metric"><strong>{summary.emptyVolumeM3.toFixed(1)}</strong><span>Boş m³</span></div>
        <div className="slp-metric"><strong>{summary.totalKg.toFixed(0)}</strong><span>Toplam KG</span></div>
        <div className="slp-metric"><strong>{summary.totalM3.toFixed(1)}</strong><span>Toplam m³</span></div>
        <div className="slp-metric"><strong>{summary.deliveriesDone}</strong><span>Teslim</span></div>
        <div className="slp-metric"><strong>{summary.deliveriesPending}</strong><span>Bekleyen</span></div>
        <div className="slp-metric"><strong>{summary.placedPallets}</strong><span>Yerleşen Palet</span></div>
      </div>
      <div className="slp-glass slp-panel">
        <h3>Karlılık</h3>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
          Palet bazlı maliyet / gelir alanları sevkiyat kaydıyla birleştirildiğinde burada navlun marjı hesaplanır.
        </p>
      </div>
    </AppPageShell>
  )
}
