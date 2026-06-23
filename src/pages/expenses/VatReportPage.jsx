import { useMemo } from 'react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { Percent, Receipt, TrendingDown } from 'lucide-react'
import { formatTL } from '../../utils/productPricing'
import { readSalesInvoices } from '../../utils/salesInvoicesStore'
import { getTreasuryMovements } from '../../utils/treasuryStore'

const VAT_RATE = 0.2

export default function VatReportPage() {
  const summary = useMemo(() => {
    const salesBase = readSalesInvoices().reduce((sum, item) => sum + item.totalAmount, 0)
    const salesVat = salesBase * VAT_RATE

    const purchaseBase = getTreasuryMovements()
      .filter((item) => item.direction === 'out' && item.type === 'Gider Ödemesi')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const purchaseVat = purchaseBase * VAT_RATE

    return {
      salesBase,
      salesVat,
      purchaseBase,
      purchaseVat,
      netVat: salesVat - purchaseVat,
    }
  }, [])

  return (
    <AppPageShell>
      <AppPageHeader title="KDV Raporu" />

      <SummaryMetrics
        columns={3}
        items={[
          { title: 'Kesilen KDV', value: formatTL(summary.salesVat), icon: Receipt, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Alınan KDV', value: formatTL(summary.purchaseVat), icon: TrendingDown, tone: 'orange', valueTone: 'orange' },
          { title: 'Net KDV', value: formatTL(summary.netVat), icon: Percent, tone: summary.netVat >= 0 ? 'blue' : 'red', valueTone: summary.netVat >= 0 ? 'blue' : 'red' },
        ]}
      />

      <AppPagePanel title="KDV Özeti">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-300">Satış (KDV Hariç)</p>
            <p className="mt-2 text-xl font-black text-white">{formatTL(summary.salesBase)}</p>
            <p className="mt-1 text-sm text-emerald-300">KDV: {formatTL(summary.salesVat)}</p>
          </div>
          <div className="rounded-2xl border border-orange-500/25 bg-orange-500/5 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-orange-300">Alış / Gider (KDV Hariç)</p>
            <p className="mt-2 text-xl font-black text-white">{formatTL(summary.purchaseBase)}</p>
            <p className="mt-1 text-sm text-orange-300">KDV: {formatTL(summary.purchaseVat)}</p>
          </div>
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
