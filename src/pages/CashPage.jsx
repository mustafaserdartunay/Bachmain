import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Landmark,
  Plus,
  Search,
  X,
} from 'lucide-react'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import { customers } from '../data/mockData'
import {
  calculateAccountBalance,
  createCustomerCollection,
  createExpensePayment,
  formatTreasuryCurrency,
  getTreasuryAccounts,
  getTreasuryMovements,
  saveTreasuryAccounts,
} from '../utils/treasuryStore'
import { getCustomerDisplay } from '../utils/customerDisplay'
import { BTN_PRIMARY, BTN_SUCCESS } from '../utils/buttonStyles'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-dark-500/50 bg-dark-800 shadow-card">
        <div className="flex items-center justify-between border-b border-dark-500/45 px-4 py-3">
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-dark-700 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

function emptyAccount() {
  return { name: '', type: 'Nakit Kasa', openingBalance: '', iban: '' }
}

function emptyCollection(accounts) {
  return {
    customerName: customers.list[0]?.company || '',
    accountId: accounts[0]?.id || '',
    method: 'Nakit',
    amount: '',
    description: '',
    chequeNo: '',
    chequeBank: '',
    chequeBranch: '',
    chequeDueDate: '',
    chequeOwner: '',
  }
}

function emptyExpense(accounts) {
  return {
    vendorName: '',
    accountId: accounts[0]?.id || '',
    method: 'Banka',
    amount: '',
    category: 'Genel Gider',
    description: '',
  }
}

export default function CashPage() {
  const [accounts, setAccounts] = useState(() => getTreasuryAccounts())
  const [movements, setMovements] = useState(() => getTreasuryMovements())
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null)
  const [accountForm, setAccountForm] = useState(emptyAccount)
  const [collectionForm, setCollectionForm] = useState(() => emptyCollection(accounts))
  const [expenseForm, setExpenseForm] = useState(() => emptyExpense(accounts))

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) || accounts[0]

  const enrichedAccounts = useMemo(() => accounts.map((account) => ({
    ...account,
    balance: calculateAccountBalance(account, movements),
  })), [accounts, movements])

  const totals = useMemo(() => {
    const cashBalance = enrichedAccounts
      .filter((account) => account.type === 'Nakit Kasa')
      .reduce((sum, account) => sum + account.balance, 0)
    const bankBalance = enrichedAccounts
      .filter((account) => account.type === 'Banka Hesabı')
      .reduce((sum, account) => sum + account.balance, 0)
    return { cashBalance, bankBalance, total: cashBalance + bankBalance }
  }, [enrichedAccounts])

  const filteredMovements = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR')
    return movements
      .filter((movement) => !selectedAccount?.id || movement.accountId === selectedAccount.id)
      .filter((movement) => {
        if (!normalized) return true
        return [
          movement.customerName,
          movement.vendorName,
          movement.description,
          movement.method,
          movement.chequeNo,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase('tr-TR').includes(normalized))
      })
  }, [movements, query, selectedAccount])

  function refreshMovements() {
    setMovements(getTreasuryMovements())
  }

  function closeModal() {
    setModal(null)
  }

  function selectAccount(accountId) {
    setSelectedAccountId(accountId)
    setCollectionForm((current) => ({ ...current, accountId }))
    setExpenseForm((current) => ({ ...current, accountId }))
  }

  function addAccount(event) {
    event.preventDefault()
    const name = accountForm.name.trim()
    if (!name) {
      window.alert('Kasa veya banka adı girin.')
      return
    }

    const nextAccount = {
      id: `account-${Date.now()}`,
      name,
      type: accountForm.type,
      currency: 'TRY',
      openingBalance: Number(accountForm.openingBalance) || 0,
      iban: accountForm.iban.trim(),
      color: accountForm.type === 'Banka Hesabı' ? 'text-blue-300' : 'text-emerald-300',
    }

    const nextAccounts = [...accounts, nextAccount]
    setAccounts(nextAccounts)
    saveTreasuryAccounts(nextAccounts)
    selectAccount(nextAccount.id)
    setAccountForm(emptyAccount())
    closeModal()
  }

  function submitCollection(event) {
    event.preventDefault()
    const amount = Number(collectionForm.amount)
    if (!amount || amount <= 0) {
      window.alert('Tahsilat tutarı girin.')
      return
    }

    createCustomerCollection({
      ...collectionForm,
      amount,
      accountId: collectionForm.accountId || selectedAccount?.id,
      description: collectionForm.description || `${collectionForm.customerName} tahsilatı`,
    })
    refreshMovements()
    setCollectionForm(emptyCollection(accounts))
    closeModal()
  }

  function submitExpense(event) {
    event.preventDefault()
    const amount = Number(expenseForm.amount)
    if (!amount || amount <= 0) {
      window.alert('Ödeme tutarı girin.')
      return
    }

    createExpensePayment({
      ...expenseForm,
      amount,
      accountId: expenseForm.accountId || selectedAccount?.id,
      description: expenseForm.description || expenseForm.category,
    })
    refreshMovements()
    setExpenseForm(emptyExpense(accounts))
    closeModal()
  }

  return (
    <div className="space-y-5">
      <div className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
        <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">Kasa</h1>
        <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-2">
          <button
            type="button"
            onClick={() => setModal('collection')}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/20"
          >
            Tahsilat
          </button>
          <button
            type="button"
            onClick={() => setModal('expense')}
            className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-bold text-gray-300 transition-colors hover:bg-dark-700"
          >
            Ödeme
          </button>
          <button
            type="button"
            onClick={() => setModal('account')}
            className="btn-primary flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Kasa Ekle
          </button>
        </div>
      </div>

      <SummaryMetrics
        columns={3}
        items={[
          { title: 'Nakit', value: formatTreasuryCurrency(totals.cashBalance), icon: Banknote, tone: 'text-emerald-300' },
          { title: 'Banka', value: formatTreasuryCurrency(totals.bankBalance), icon: Landmark, tone: 'text-blue-300' },
          { title: 'Toplam Bakiye', value: formatTreasuryCurrency(totals.total), icon: Banknote, tone: 'text-cyan-300' },
        ]}
      />

      <section className="rounded-2xl border border-dark-500/45 bg-dark-800/55 p-4 shadow-card">
        <div className="mb-4 flex flex-wrap gap-2">
          {enrichedAccounts.map((account) => {
            const isActive = account.id === selectedAccount?.id
            const Icon = account.type === 'Banka Hesabı' ? Landmark : Banknote
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => selectAccount(account.id)}
                className={`flex min-w-[160px] flex-1 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? 'border-blue-500/35 bg-blue-500/10'
                    : 'border-dark-500/45 bg-dark-700/35 hover:border-dark-500/70'
                }`}
              >
                <span className={`rounded-lg bg-dark-800/80 p-1.5 ${account.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">{account.name}</p>
                  <p className="text-[11px] font-semibold text-gray-500">{account.type}</p>
                </div>
                <p className="shrink-0 text-xs font-black text-emerald-300">{formatTreasuryCurrency(account.balance)}</p>
              </button>
            )
          })}
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Hareket ara..."
              className="form-input pl-10 text-sm"
            />
          </div>
          <span className="shrink-0 text-xs text-gray-500">{filteredMovements.length} hareket</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-dark-500/40">
          <div className="grid grid-cols-[minmax(0,1fr)_100px_110px] gap-3 border-b border-dark-500/40 bg-dark-800/70 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            <span>Açıklama</span>
            <span>Tarih</span>
            <span className="text-right">Tutar</span>
          </div>
          <div className="divide-y divide-dark-500/30">
            {filteredMovements.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">Hareket bulunamadı.</p>
            ) : (
              filteredMovements.map((movement) => (
                <div key={movement.id} className="grid grid-cols-[minmax(0,1fr)_100px_110px] items-center gap-3 px-4 py-3 hover:bg-dark-700/30">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      movement.direction === 'in' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-dark-700 text-[#5a9ea8]'
                    }`}>
                      {movement.direction === 'in' ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-200">
                        {movement.customerName || movement.vendorName || movement.type}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {[movement.description, movement.method, movement.chequeNo && `Çek ${movement.chequeNo}`].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{movement.date?.split(' ')[0]}</p>
                  <p className={`text-right text-sm font-bold ${movement.direction === 'in' ? 'text-emerald-300/90' : 'text-[#5a9ea8]'}`}>
                    {movement.direction === 'in' ? '+' : '−'} {formatTreasuryCurrency(movement.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {modal === 'collection' && (
        <Modal title="Tahsilat" onClose={closeModal}>
          <form onSubmit={submitCollection} className="space-y-3">
            <select value={collectionForm.customerName} onChange={(e) => setCollectionForm((c) => ({ ...c, customerName: e.target.value }))} className="form-input text-sm">
              {customers.list.map((customer) => {
                const display = getCustomerDisplay(customer)
                return <option key={customer.company} value={customer.company}>{display.brandShortName}</option>
              })}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select value={collectionForm.accountId} onChange={(e) => setCollectionForm((c) => ({ ...c, accountId: e.target.value }))} className="form-input text-sm">
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
              <select value={collectionForm.method} onChange={(e) => setCollectionForm((c) => ({ ...c, method: e.target.value }))} className="form-input text-sm">
                <option>Nakit</option>
                <option>Banka</option>
                <option>Çek</option>
              </select>
            </div>
            <input value={collectionForm.amount} onChange={(e) => setCollectionForm((c) => ({ ...c, amount: e.target.value }))} type="number" placeholder="Tutar" className="form-input text-sm" />
            {collectionForm.method === 'Çek' && (
              <div className="grid grid-cols-2 gap-2">
                <input value={collectionForm.chequeNo} onChange={(e) => setCollectionForm((c) => ({ ...c, chequeNo: e.target.value }))} placeholder="Çek no" className="form-input text-sm" />
                <input value={collectionForm.chequeBank} onChange={(e) => setCollectionForm((c) => ({ ...c, chequeBank: e.target.value }))} placeholder="Banka" className="form-input text-sm" />
                <input value={collectionForm.chequeDueDate} onChange={(e) => setCollectionForm((c) => ({ ...c, chequeDueDate: e.target.value }))} type="date" className="form-input text-sm" />
                <input value={collectionForm.chequeOwner} onChange={(e) => setCollectionForm((c) => ({ ...c, chequeOwner: e.target.value }))} placeholder="Keşideci" className="form-input text-sm" />
              </div>
            )}
            <input value={collectionForm.description} onChange={(e) => setCollectionForm((c) => ({ ...c, description: e.target.value }))} placeholder="Açıklama (isteğe bağlı)" className="form-input text-sm" />
            <button type="submit" className={`${BTN_SUCCESS} w-full py-2.5 text-sm`}>Kaydet</button>
          </form>
        </Modal>
      )}

      {modal === 'expense' && (
        <Modal title="Ödeme" onClose={closeModal}>
          <form onSubmit={submitExpense} className="space-y-3">
            <input value={expenseForm.vendorName} onChange={(e) => setExpenseForm((c) => ({ ...c, vendorName: e.target.value }))} placeholder="Tedarikçi / gider adı" className="form-input text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <select value={expenseForm.accountId} onChange={(e) => setExpenseForm((c) => ({ ...c, accountId: e.target.value }))} className="form-input text-sm">
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
              <select value={expenseForm.category} onChange={(e) => setExpenseForm((c) => ({ ...c, category: e.target.value }))} className="form-input text-sm">
                <option>Genel Gider</option>
                <option>Malzeme Ödemesi</option>
                <option>Kira</option>
                <option>Personel</option>
                <option>Nakliye</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={expenseForm.method} onChange={(e) => setExpenseForm((c) => ({ ...c, method: e.target.value }))} className="form-input text-sm">
                <option>Banka</option>
                <option>Nakit</option>
                <option>Kredi Kartı</option>
              </select>
              <input value={expenseForm.amount} onChange={(e) => setExpenseForm((c) => ({ ...c, amount: e.target.value }))} type="number" placeholder="Tutar" className="form-input text-sm" />
            </div>
            <input value={expenseForm.description} onChange={(e) => setExpenseForm((c) => ({ ...c, description: e.target.value }))} placeholder="Açıklama (isteğe bağlı)" className="form-input text-sm" />
            <button type="submit" className={`${BTN_SUCCESS} w-full py-2.5 text-sm`}>Kaydet</button>
          </form>
        </Modal>
      )}

      {modal === 'account' && (
        <Modal title="Kasa / Banka Ekle" onClose={closeModal}>
          <form onSubmit={addAccount} className="space-y-3">
            <input value={accountForm.name} onChange={(e) => setAccountForm((c) => ({ ...c, name: e.target.value }))} placeholder="Ad" className="form-input text-sm" />
            <select value={accountForm.type} onChange={(e) => setAccountForm((c) => ({ ...c, type: e.target.value }))} className="form-input text-sm">
              <option>Nakit Kasa</option>
              <option>Banka Hesabı</option>
            </select>
            <input value={accountForm.openingBalance} onChange={(e) => setAccountForm((c) => ({ ...c, openingBalance: e.target.value }))} type="number" placeholder="Açılış bakiyesi" className="form-input text-sm" />
            {accountForm.type === 'Banka Hesabı' && (
              <input value={accountForm.iban} onChange={(e) => setAccountForm((c) => ({ ...c, iban: e.target.value }))} placeholder="IBAN" className="form-input text-sm" />
            )}
            <button type="submit" className={`${BTN_PRIMARY} w-full py-2.5 text-sm`}>Ekle</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
