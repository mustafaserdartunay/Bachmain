import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import SearchInput from '../../components/Common/SearchInput'
import ListHeaderRow from '../../components/Common/ListHeaderRow'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { CASH_BASE_PATH } from '../../data/treasuryMenu'
import { formatTL } from '../../utils/productPricing'
import { collectAllChequeRows, formatChequeDate } from '../../utils/treasuryReportUtils'
import { CHEQUE_STATUS, resolveChequeStatus } from '../../utils/chequeLifecycle'
import { getTreasuryAccounts } from '../../utils/treasuryStore'
import { Landmark, ScrollText } from 'lucide-react'

const LIST_GRID = 'minmax(140px,1fr) 100px minmax(120px,1fr) minmax(120px,1fr) minmax(120px,1fr)'

export default function ChequesPage() {
  const [accounts, setAccounts] = useState(() => getTreasuryAccounts())
  const [search, setSearch] = useState('')

  const refresh = useCallback(() => setAccounts(getTreasuryAccounts()), [])

  useEffect(() => {
    window.addEventListener('erlenbox:treasury-updated', refresh)
    return () => window.removeEventListener('erlenbox:treasury-updated', refresh)
  }, [refresh])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return collectAllChequeRows().filter((row) => {
      if (resolveChequeStatus(row) !== CHEQUE_STATUS.PORTFOLIO) return false
      if (!query) return true
      return [row.chequeNo, row.chequeBank, row.chequeOwner, row.accountName]
        .some((value) => String(value || '').toLowerCase().includes(query))
    })
  }, [accounts, search])

  const portfolioTotal = rows.reduce((sum, row) => sum + Math.abs(Number(row.amount) || 0), 0)

  return (
    <AppPageShell>
      <AppPageHeader title="Çekler" />

      <SummaryMetrics
        columns={3}
        items={[
          { title: 'Portföydeki Çek', value: rows.length, icon: ScrollText, tone: 'purple', valueTone: 'purple' },
          { title: 'Toplam Tutar', value: formatTL(portfolioTotal), icon: Landmark, tone: 'blue', valueTone: 'blue' },
          {
            title: 'Çek Kasası',
            value: accounts.filter((item) => item.type === 'Çek Kasası').length,
            icon: ScrollText,
            tone: 'emerald',
            valueTone: 'emerald',
          },
        ]}
      />

      <AppPagePanel title="Çek Portföyü">
        <SearchInput
          wrapperClassName="mb-4 w-full max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Çek no, banka veya cari ara..."
        />

        <ListHeaderRow
          gridTemplate={LIST_GRID}
          columns={['Banka', 'Çek No', 'Vade', 'Cari', { label: 'Tutar', align: 'right' }]}
        />

        <div className="mt-2 space-y-2">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">Çek kaydı bulunamadı.</p>
          ) : rows.map((row) => (
            <Link
              key={row.id}
              to={`${CASH_BASE_PATH}/${row.accountId}`}
              className="grid items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3 transition-colors hover:border-purple-500/30 hover:bg-dark-800/80"
              style={{ gridTemplateColumns: LIST_GRID }}
            >
              <div>
                <p className="text-sm font-bold text-white">{row.chequeBank}</p>
                <p className="text-[12px] text-gray-500">{row.accountName}</p>
              </div>
              <p className="text-xs font-semibold text-gray-300">{row.chequeNo}</p>
              <p className="text-xs text-gray-400">{formatChequeDate(row.chequeDueDate)}</p>
              <p className="truncate text-xs text-gray-400">{row.chequeOwner}</p>
              <p className="text-right text-sm font-black text-purple-300">{formatTL(row.amount)}</p>
            </Link>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
