import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Banknote, Landmark, ScrollText, WalletCards } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { CASH_BASE_PATH } from '../../data/treasuryMenu'
import { formatTL } from '../../utils/productPricing'
import { getCashBankSummary } from '../../utils/treasuryReportUtils'
import { formatTreasuryCurrency } from '../../utils/treasuryStore'

export default function CashBankReportPage() {
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    window.addEventListener('erlenbox:treasury-updated', refresh)
    return () => window.removeEventListener('erlenbox:treasury-updated', refresh)
  }, [refresh])

  const summary = useMemo(() => getCashBankSummary(), [tick])

  return (
    <AppPageShell>
      <AppPageHeader title="Kasa / Banka Raporu" />

      <SummaryMetrics
        columns={4}
        items={[
          { title: 'Nakit Kasa', value: formatTL(summary.cashTotal), icon: Banknote, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Banka', value: formatTL(summary.bankTotal), icon: Landmark, tone: 'blue', valueTone: 'blue' },
          { title: 'Çek Portföyü', value: formatTL(summary.chequeTotal), icon: ScrollText, tone: 'purple', valueTone: 'purple' },
          { title: 'Toplam Varlık', value: formatTL(summary.grandTotal), icon: WalletCards, tone: 'cyan', valueTone: 'cyan' },
        ]}
      />

      <AppPagePanel title="Hesap Bazlı Dağılım">
        <div className="space-y-2">
          {summary.accounts.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Hesap bulunamadı.</p>
          ) : summary.accounts.map((account) => (
            <Link
              key={account.id}
              to={`${CASH_BASE_PATH}/${account.id}`}
              className="flex items-center justify-between rounded-2xl border border-dark-500/40 bg-dark-800/55 px-4 py-3 transition-colors hover:border-blue-500/30 hover:bg-dark-800/80"
            >
              <div>
                <p className="text-sm font-bold text-white">{account.name}</p>
                <p className="text-xs text-gray-500">{account.type}</p>
              </div>
              <p className="text-sm font-black text-emerald-300">{formatTreasuryCurrency(account.balance)}</p>
            </Link>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
