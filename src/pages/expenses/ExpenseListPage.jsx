import { useCallback, useEffect, useMemo, useState } from 'react'
import { Receipt, Wallet } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import SplitCreateButton from '../../components/Common/SplitCreateButton'
import SearchInput from '../../components/Common/SearchInput'
import ListHeaderRow from '../../components/Common/ListHeaderRow'
import { formatTL } from '../../utils/productPricing'
import { BTN_SUCCESS } from '../../utils/buttonStyles'
import {
  createExpensePayment,
  getTreasuryAccounts,
  getTreasuryMovements,
} from '../../utils/treasuryStore'

const LIST_GRID = '120px minmax(180px,1.2fr) minmax(140px,1fr) minmax(120px,1fr)'

const EXPENSE_TYPES = [
  'Genel Gider',
  'Malzeme Ödemesi',
  'Kira',
  'Personel',
  'Nakliye',
  'Fatura / Abonelik',
  'Vergi / Resmi Ödeme',
  'Diğer',
]

function emptyForm(accounts) {
  return {
    vendorName: '',
    accountId: accounts[0]?.id || '',
    method: 'Banka',
    amount: '',
    category: EXPENSE_TYPES[0],
    description: '',
  }
}

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
  const [accounts] = useState(() => getTreasuryAccounts())
  const [movements, setMovements] = useState(() => getTreasuryMovements())
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('Tümü')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(() => emptyForm(getTreasuryAccounts()))

  const refresh = useCallback(() => setMovements(getTreasuryMovements()), [])

  useEffect(() => {
    window.addEventListener('erlenbox:treasury-updated', refresh)
    return () => window.removeEventListener('erlenbox:treasury-updated', refresh)
  }, [refresh])

  function openCreate() {
    setForm(emptyForm(accounts.length ? accounts : getTreasuryAccounts()))
    setCreateOpen(true)
  }

  function submitExpense(event) {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0) {
      window.alert('Gider tutarı girin.')
      return
    }

    createExpensePayment({
      vendorName: form.vendorName.trim(),
      accountId: form.accountId,
      method: form.method,
      amount,
      category: form.category,
      expenseCategory: form.category,
      description: form.description.trim() || form.category,
    })
    refresh()
    setForm(emptyForm(accounts))
    setCreateOpen(false)
  }

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return movements
      .filter((item) => item.direction === 'out')
      .filter((item) => !['Virman', 'Bakiye Sabitleme'].includes(item.type))
      .filter((item) => {
        if (typeFilter === 'Tümü') return true
        const category = item.expenseCategory || item.category || item.type || ''
        return category === typeFilter
      })
      .filter((item) => {
        if (!query) return true
        return [item.description, item.vendorName, item.customerName, item.type, item.expenseCategory, item.category, item.accountName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      })
      .sort((a, b) => parseDate(b.date).localeCompare(parseDate(a.date)))
  }, [movements, search, typeFilter])

  const total = rows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  return (
    <AppPageShell>
      <AppPageHeader
        title="Gider Listesi"
        actions={(
          <SplitCreateButton
            label="Yeni Gider Oluştur"
            onPrimaryClick={openCreate}
            menuAriaLabel="Gider seçenekleri"
            menuItems={[
              {
                id: 'create',
                label: 'Yeni Gider Oluştur',
                icon: Receipt,
                iconClassName: 'text-orange-300',
                onClick: openCreate,
              },
            ]}
          />
        )}
      />

      {createOpen ? (
        <AppPagePanel title="Yeni Gider Oluştur" description="Gider türünü seçip kaydı oluşturun." dotColor="orange">
          <form onSubmit={submitExpense} className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-[12px] font-black uppercase tracking-wider text-gray-500">Gider Türü</span>
              <select
                value={form.category}
                onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}
                className="form-input text-sm"
              >
                {EXPENSE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[12px] font-black uppercase tracking-wider text-gray-500">Tedarikçi / Gider Adı</span>
              <input
                value={form.vendorName}
                onChange={(e) => setForm((current) => ({ ...current, vendorName: e.target.value }))}
                className="form-input text-sm"
                placeholder="Örn: Ofis kira, kargo firması"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[12px] font-black uppercase tracking-wider text-gray-500">Tutar</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((current) => ({ ...current, amount: e.target.value }))}
                className="form-input text-sm"
                placeholder="0,00"
                required
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[12px] font-black uppercase tracking-wider text-gray-500">Kasa / Hesap</span>
              <select
                value={form.accountId}
                onChange={(e) => setForm((current) => ({ ...current, accountId: e.target.value }))}
                className="form-input text-sm"
              >
                {(accounts.length ? accounts : getTreasuryAccounts()).map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[12px] font-black uppercase tracking-wider text-gray-500">Ödeme Yöntemi</span>
              <select
                value={form.method}
                onChange={(e) => setForm((current) => ({ ...current, method: e.target.value }))}
                className="form-input text-sm"
              >
                <option>Banka</option>
                <option>Nakit</option>
                <option>Kredi Kartı</option>
              </select>
            </label>

            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-[12px] font-black uppercase tracking-wider text-gray-500">Açıklama</span>
              <input
                value={form.description}
                onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                className="form-input text-sm"
                placeholder="İsteğe bağlı açıklama"
              />
            </label>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="btn-cancel px-4 text-sm">
                Vazgeç
              </button>
              <button type="submit" className={`${BTN_SUCCESS} gap-1.5 px-4 text-sm`}>
                <Wallet className="h-4 w-4" /> Gideri Kaydet
              </button>
            </div>
          </form>
        </AppPagePanel>
      ) : null}

      <AppPagePanel
        title="Gider Hareketleri"
        action={(
          <span className="rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-black text-amber-300">
            {rows.length} kayıt · {formatTL(total)}
          </span>
        )}
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Gider ara..."
          />
          <label className="block space-y-1.5">
            <span className="sr-only">Gider türü filtresi</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-input h-10 text-sm"
            >
              <option value="Tümü">Tüm Gider Türleri</option>
              {EXPENSE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
        </div>

        <ListHeaderRow
          gridTemplate={LIST_GRID}
          columns={['Tarih', 'Açıklama', 'Gider Türü', { label: 'Tutar', align: 'right' }]}
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
                <p className="truncate text-[13px] text-gray-500">{row.vendorName || row.accountName || '—'}</p>
              </div>
              <p className="text-xs text-gray-400">{row.expenseCategory || row.category || row.type || '—'}</p>
              <p className="text-right text-sm font-black text-red-300">{formatTL(row.amount)}</p>
            </div>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
