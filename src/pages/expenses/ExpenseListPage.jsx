import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import ListHeaderRow from '../../components/Common/ListHeaderRow'
import { formatTL } from '../../utils/productPricing'
import { getTreasuryMovements } from '../../utils/treasuryStore'

const LIST_GRID = '120px minmax(180px,1.2fr) minmax(140px,1fr) minmax(120px,1fr)'

function parseDate(value) {
  const raw = String(value || '')
  const trMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})/)
  if (trMatch) return `${trMatch[3]}-${trMatch[2]}-${trMatch[1]}`
  return raw.slice(0, 10)
}

function formatDate(value) {
  const iso = parseDate(value)
  const date = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value || '—'
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ExpenseListPage() {
  const [movements, setMovements] = useState(() => getTreasuryMovements())
  const [search, setSearch] = useState('')

  const refresh = useCallback(() => setMovements(getTreasuryMovements()), [])

  useEffect(() => {
    window.addEventListener('erlenbox:treasury-updated', refresh)
    return () => window.removeEventListener('erlenbox:treasury-updated', refresh)
  }, [refresh])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return movements
      .filter((item) => item.direction === 'out')
      .filter((item) => !['Virman', 'Bakiye Sabitleme'].includes(item.type))
      .filter((item) => {
        if (!query) return true
        return [item.description, item.vendorName, item.customerName, item.type, item.expenseCategory, item.accountName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      })
      .sort((a, b) => parseDate(b.date).localeCompare(parseDate(a.date)))
  }, [movements, search])

  const total = rows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  return (
    <AppPageShell>
      <AppPageHeader title="Gider Listesi" />

      <AppPagePanel
        title="Gider Hareketleri"
        action={(
          <span className="rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-black text-amber-300">
            {rows.length} kayıt · {formatTL(total)}
          </span>
        )}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Gider ara..."
          className="form-input mb-4 w-full max-w-md text-sm"
        />

        <ListHeaderRow
          gridTemplate={LIST_GRID}
          columns={['Tarih', 'Açıklama', 'Kategori', { label: 'Tutar', align: 'right' }]}
        />

        <div className="mt-2 space-y-2">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">Gider kaydı bulunamadı.</p>
          ) : rows.map((row) => (
            <div
              key={row.id}
              className="grid items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3"
              style={{ gridTemplateColumns: LIST_GRID }}
            >
              <p className="text-xs font-semibold text-gray-300">{formatDate(row.date)}</p>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{row.description || row.type}</p>
                <p className="truncate text-[11px] text-gray-500">{row.vendorName || row.accountName || '—'}</p>
              </div>
              <p className="text-xs text-gray-400">{row.expenseCategory || row.type || '—'}</p>
              <p className="text-right text-sm font-black text-red-300">{formatTL(row.amount)}</p>
            </div>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
