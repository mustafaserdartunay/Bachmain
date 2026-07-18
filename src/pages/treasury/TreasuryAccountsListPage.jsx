import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Banknote, Landmark, ScrollText } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { CASH_BASE_PATH } from '../../data/treasuryMenu'
import { formatTL } from '../../utils/productPricing'
import {
  calculateAccountBalance,
  formatTreasuryCurrency,
  getTreasuryAccounts,
  getTreasuryMovements,
} from '../../utils/treasuryStore'

const TYPE_META = {
  'Nakit Kasa': { icon: Banknote, tone: 'emerald' },
  'Banka Hesabı': { icon: Landmark, tone: 'blue' },
  'Çek Kasası': { icon: ScrollText, tone: 'purple' },
  'Senet Kasası': { icon: ScrollText, tone: 'amber' },
}

export default function TreasuryAccountsListPage({
  accountType = 'Nakit Kasa',
  title = 'Nakit Kasa',
}) {
  const [accounts, setAccounts] = useState(() => getTreasuryAccounts())
  const [movements, setMovements] = useState(() => getTreasuryMovements())

  const refresh = useCallback(() => {
    setAccounts(getTreasuryAccounts())
    setMovements(getTreasuryMovements())
  }, [])

  useEffect(() => {
    window.addEventListener('erlenbox:treasury-updated', refresh)
    return () => window.removeEventListener('erlenbox:treasury-updated', refresh)
  }, [refresh])

  const rows = useMemo(() => (
    accounts
      .filter((account) => account.type === accountType)
      .map((account) => ({
        ...account,
        balance: calculateAccountBalance(account, movements),
      }))
  ), [accountType, accounts, movements])

  const total = rows.reduce((sum, account) => sum + account.balance, 0)
  const meta = TYPE_META[accountType] || TYPE_META['Nakit Kasa']
  const Icon = meta.icon

  return (
    <AppPageShell>
      <AppPageHeader title={title} />

      <SummaryMetrics
        columns={2}
        items={[
          { title: 'Hesap', value: rows.length, icon: Icon, tone: meta.tone, valueTone: meta.tone },
          {
            title: 'Toplam Bakiye',
            value: formatTL(total),
            icon: Icon,
            tone: meta.tone,
            valueTone: total < 0 ? 'red' : meta.tone,
          },
        ]}
      />

      <AppPagePanel title={`${title} Listesi`}>
        <div className="space-y-2">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Bu türde hesap bulunamadı.</p>
          ) : rows.map((account) => (
            <Link
              key={account.id}
              to={`${CASH_BASE_PATH}/${account.id}`}
              className="flex items-center justify-between rounded-2xl border border-dark-500/40 bg-dark-800/55 px-4 py-3 transition-colors hover:border-blue-500/30 hover:bg-dark-800/80"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{account.name}</p>
                <p className="text-xs text-gray-500">{account.type}</p>
              </div>
              <p className={`shrink-0 text-sm font-black ${Number(account.balance) < 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                {formatTreasuryCurrency(account.balance)}
              </p>
            </Link>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
