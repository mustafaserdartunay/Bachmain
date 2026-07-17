import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Mail,
  MessageCircle,
  Printer,
  Receipt,
  Sparkles,
  Truck,
} from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import {
  getLogisticsSummary,
  loadLoadPlans,
  upsertLoadPlan,
  upsertLogisticsDocument,
  LOGISTICS_EVENT,
} from '../../utils/logisticsStore'
import { DOC_LANGUAGES, DOCUMENT_TYPES } from '../../utils/logisticsCatalogs'
import '../../components/Logistics/logistics.css'

function PlanTable({ rows, onStatus }) {
  if (!rows.length) {
    return <p className="slp-empty">Kayıt yok</p>
  }
  return (
    <div className="slp-table-wrap">
      <table className="slp-table">
        <thead>
          <tr>
            <th>Plan No</th>
            <th>Araç</th>
            <th>Müşteri</th>
            <th>Palet</th>
            <th>KG</th>
            <th>m³ / Doluluk</th>
            <th>Durum</th>
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((plan) => {
            const customers = [...new Set((plan.pallets || []).map((p) => p.customer || p.code).filter(Boolean))]
            return (
              <tr key={plan.id}>
                <td>{plan.code}</td>
                <td>{plan.truckKey || plan.vehicleId || '—'}</td>
                <td>{customers.slice(0, 2).join(', ') || '—'}</td>
                <td>{(plan.pallets || []).length}</td>
                <td>{plan.meta?.weight != null ? Math.round(plan.meta.weight) : '—'}</td>
                <td>{plan.meta?.fillPct != null ? `%${plan.meta.fillPct}` : '—'}</td>
                <td>{plan.status || 'draft'}</td>
                <td>
                  <div className="slp-toolbar">
                    {onStatus ? (
                      <button type="button" className="slp-btn" onClick={() => onStatus(plan)}>
                        İlerlet
                      </button>
                    ) : null}
                    <Link to="/belge-merkezi" className="slp-btn">Belge</Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function usePlans() {
  const [plans, setPlans] = useState(loadLoadPlans)
  useEffect(() => {
    const r = () => setPlans(loadLoadPlans())
    window.addEventListener(LOGISTICS_EVENT, r)
    return () => window.removeEventListener(LOGISTICS_EVENT, r)
  }, [])
  return [plans, setPlans]
}

export function LogisticsDashboardPage() {
  const summary = useMemo(() => getLogisticsSummary(), [])
  const [plans] = usePlans()
  const planned = plans.filter((p) => ['draft', 'planned', 'active'].includes(p.status || 'draft')).length
  const transit = plans.filter((p) => p.status === 'in_transit').length
  const done = plans.filter((p) => p.status === 'delivered').length

  return (
    <AppPageShell className="slp-shell">
      <AppPageHeader
        title="Lojistik Dashboard"
        actions={<Link to="/lojistik/yukleme-plani" className="slp-btn slp-btn--primary"><Sparkles className="inline h-3.5 w-3.5 mr-1" />Yük Hesaplama</Link>}
      />
      <div className="slp-metrics">
        <div className="slp-metric"><strong>{planned}</strong><span>Planlanan</span></div>
        <div className="slp-metric"><strong>{transit}</strong><span>Teslimatta</span></div>
        <div className="slp-metric"><strong>{done}</strong><span>Teslim</span></div>
        <div className="slp-metric"><strong>%{summary.fillVolumePct}</strong><span>Doluluk</span></div>
        <div className="slp-metric"><strong>{summary.vehicles}</strong><span>Araç</span></div>
        <div className="slp-metric"><strong>{summary.deliveriesPending}</strong><span>Bekleyen</span></div>
      </div>
      <div className="slp-glass slp-panel">
        <h3>Hızlı işlem</h3>
        <div className="slp-toolbar">
          <Link to="/lojistik/planlanan" className="slp-btn">Planlanan Lojistik</Link>
          <Link to="/lojistik/teslimatta" className="slp-btn">Teslimatta</Link>
          <Link to="/lojistik/teslim-edildi" className="slp-btn">Teslim Edildi</Link>
          <Link to="/depo" className="slp-btn">Depo Stokları</Link>
        </div>
      </div>
    </AppPageShell>
  )
}

export function PlannedLogisticsPage() {
  const [plans, setPlans] = usePlans()
  const rows = plans.filter((p) => ['draft', 'planned', 'active'].includes(p.status || 'draft'))

  function advance(plan) {
    upsertLoadPlan({ ...plan, status: 'in_transit' })
    setPlans(loadLoadPlans())
  }

  function makeDoc(plan, type, language) {
    upsertLogisticsDocument({
      type,
      language,
      title: `${DOCUMENT_TYPES.find((d) => d.id === type)?.label || type} · ${plan.code}`,
      palletCode: plan.code,
      status: 'ready',
      aiNote: 'OpenAI belge oluşturucu bağlandığında ülkeye uygun ticari metin burada üretilecek.',
    })
  }

  return (
    <AppPageShell className="slp-shell">
      <AppPageHeader
        title="Planlanan Lojistik"
        actions={(
          <div className="slp-toolbar">
            <Link to="/lojistik/yukleme-plani" className="slp-btn slp-btn--primary">Yeni plan</Link>
            <Link to="/belge-merkezi" className="slp-btn"><FileText className="inline h-3.5 w-3.5 mr-1" />Belge Merkezi</Link>
          </div>
        )}
      />
      <PlanTable rows={rows} onStatus={advance} />
      <div className="slp-glass slp-panel" style={{ marginTop: 12 }}>
        <h3>Belge & iletişim</h3>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
          Fatura · İrsaliye · Packing List · Invoice · CMR · PDF · Yazdır · WhatsApp · Mail
        </p>
        <div className="slp-toolbar" style={{ marginTop: 10 }}>
          {rows[0] ? (
            <>
              <button type="button" className="slp-btn" onClick={() => makeDoc(rows[0], 'invoice', 'en')}><Receipt className="inline h-3.5 w-3.5 mr-1" />Invoice EN</button>
              <button type="button" className="slp-btn" onClick={() => makeDoc(rows[0], 'cmr', 'de')}>CMR DE</button>
              <button type="button" className="slp-btn" onClick={() => makeDoc(rows[0], 'packing_list', 'tr')}>Packing List</button>
              <a className="slp-btn" href={`mailto:?subject=${encodeURIComponent(rows[0].code || 'Sevkiyat')}`}><Mail className="inline h-3.5 w-3.5 mr-1" />Mail</a>
              <button type="button" className="slp-btn" onClick={() => window.print()}><Printer className="inline h-3.5 w-3.5 mr-1" />Yazdır</button>
              <a className="slp-btn" href={`https://wa.me/?text=${encodeURIComponent(`Sevkiyat planı: ${rows[0].code}`)}`} target="_blank" rel="noreferrer"><MessageCircle className="inline h-3.5 w-3.5 mr-1" />WhatsApp</a>
            </>
          ) : null}
          <select className="slp-btn" defaultValue="tr" aria-label="Belge dili">
            {DOC_LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>
      </div>
    </AppPageShell>
  )
}

export function InTransitLogisticsPage() {
  const [plans, setPlans] = usePlans()
  const rows = plans.filter((p) => p.status === 'in_transit')

  function deliver(plan) {
    upsertLoadPlan({ ...plan, status: 'delivered', deliveredAt: new Date().toISOString() })
    setPlans(loadLoadPlans())
  }

  return (
    <AppPageShell className="slp-shell">
      <AppPageHeader title="Teslimatta" subtitle="Canlı sevkiyat · kalan durak · harita (Google Maps anahtarı ile)" />
      <div className="slp-glass slp-panel" style={{ marginBottom: 12 }}>
        <div className="slp-toolbar">
          <Truck className="h-4 w-4 text-[color:var(--accent)]" />
          <span style={{ fontWeight: 700 }}>{rows.length} araç yolda</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginTop: 8 }}>
          Google Maps Directions bağlandığında canlı konum, kalan durak ve ETA burada görünür.
        </p>
      </div>
      <PlanTable
        rows={rows}
        onStatus={deliver}
      />
    </AppPageShell>
  )
}

export function DeliveredLogisticsPage() {
  const [plans] = usePlans()
  const rows = plans.filter((p) => p.status === 'delivered')

  return (
    <AppPageShell className="slp-shell">
      <AppPageHeader title="Teslim Edildi" subtitle="Arşiv · imza · fotoğraf · belgeler" />
      <PlanTable rows={rows} />
    </AppPageShell>
  )
}
