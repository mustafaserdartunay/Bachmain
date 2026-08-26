import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { AppPageBackLink, AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import {
  APP_SURFACE_PANEL_CLASS,
  PAGE_CENTER_TITLE_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  PAGE_SUMMARY_METRICS_CLASS,
} from '../../utils/dashboardDesign'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { listTruckControlCards, TRUCK_CONTROL_DETAIL_PATH } from '../../utils/truckControlCenter'
import { getActiveOrgScope } from '../../utils/orgScope'
import { LOGISTICS_EVENT } from '../../utils/logisticsStore'
import { SEVKIYAT_EVENT } from '../../utils/sevkiyatStore'
import { TCC_MUTED, TCC_YF, TCC_YFB } from '../../components/Logistics/TruckControl/truckControlUi'
import '../../components/Logistics/TruckControl/truckControl.css'

export default function TirSevkiyatPage() {
  const [cards, setCards] = useState(() => listTruckControlCards(getActiveOrgScope()))

  useEffect(() => {
    const refresh = () => setCards(listTruckControlCards(getActiveOrgScope()))
    window.addEventListener(SEVKIYAT_EVENT, refresh)
    window.addEventListener(LOGISTICS_EVENT, refresh)
    return () => {
      window.removeEventListener(SEVKIYAT_EVENT, refresh)
      window.removeEventListener(LOGISTICS_EVENT, refresh)
    }
  }, [])

  const inTransit = cards.filter((c) => c.status === 'in_transit').length
  const gps = cards.filter((c) => c.hasLiveGps).length

  return (
    <AppPageShell className="customers-page-type w-full">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink to="/lojistik" label="Lojistik" />}
        centerTitle="TIR SEVKİYAT"
        centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
      />
      <SummaryMetrics
        className={PAGE_SUMMARY_METRICS_CLASS}
        columns={4}
        items={[
          { title: 'TIR / Sevkiyat', value: String(cards.length) },
          { title: 'Yolda', value: String(inTransit) },
          { title: 'Canlı GPS', value: String(gps) },
          { title: 'GPS yok', value: String(cards.length - gps) },
        ]}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {cards.map((card) => (
          <article key={card.id} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`${TCC_YFB} text-[var(--ink)]`}>
                  {card.plate || card.title || 'Plaka yok'}
                </p>
                <p className={TCC_YF}>{card.subtitle || '—'}</p>
                <p className={TCC_MUTED}>{card.code}</p>
                <p className={TCC_MUTED}>
                  {card.statusLabel} · {card.stopCount || 0} teslimat ·{' '}
                  {card.driverName || 'Şoför yok'}
                </p>
                {card.hasLiveGps ? (
                  <p className={`${TCC_MUTED} mt-1 text-emerald-600`}>Canlı GPS</p>
                ) : (
                  <p className={`${TCC_MUTED} mt-1`}>Canlı GPS bağlantısı yok</p>
                )}
              </div>
              <Truck className="h-8 w-8 shrink-0 text-[var(--muted)]" />
            </div>
            <Link
              to={TRUCK_CONTROL_DETAIL_PATH(card.id)}
              className="tcc-chip mt-4 inline-flex no-underline"
            >
              Detayları Gör
            </Link>
          </article>
        ))}
      </div>
      {!cards.length ? (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-6 text-center`}>
          <p className={TCC_YFB}>Kayıtlı TIR sevkiyatı yok</p>
          <p className={`${TCC_MUTED} mt-2`}>
            Sevkiyat süreç sayfasından veya yük planından oluşan gerçek kayıtlar burada listelenir.
            Demo sevkiyat üretilmez.
          </p>
          <Link to="/sevkiyat" className="tcc-chip mt-4 inline-flex no-underline">
            Sevkiyat listesi
          </Link>
        </section>
      ) : null}
    </AppPageShell>
  )
}
