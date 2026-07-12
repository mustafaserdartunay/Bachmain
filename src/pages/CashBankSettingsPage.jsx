import { useEffect, useState } from 'react'
import { Banknote, Landmark, Save, WalletCards } from 'lucide-react'
import BankAccountsSettingsEditor from '../components/Settings/BankAccountsSettingsEditor'
import NumericInput from '../components/Products/NumericInput'
import {
  createBankAccount,
  readCompanySettings,
  saveCompanySettings,
} from '../utils/companySettings'
import {
  getTreasuryAccounts,
  saveTreasuryAccounts,
} from '../utils/treasuryStore'
import { BTN_SUCCESS } from '../utils/buttonStyles'

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-[13px] font-black uppercase tracking-wider text-gray-500">{label}</span>
      {children}
    </label>
  )
}

export default function CashBankSettingsPage() {
  const [bankAccounts, setBankAccounts] = useState(() => readCompanySettings().bankAccounts)
  const [treasuryAccounts, setTreasuryAccounts] = useState(() => getTreasuryAccounts())
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [pendingTreasuryDeleteId, setPendingTreasuryDeleteId] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    function syncCompany() {
      setBankAccounts(readCompanySettings().bankAccounts)
    }
    function syncTreasury() {
      setTreasuryAccounts(getTreasuryAccounts())
    }
    window.addEventListener('erlenbox:company-settings-updated', syncCompany)
    window.addEventListener('erlenbox:treasury-updated', syncTreasury)
    return () => {
      window.removeEventListener('erlenbox:company-settings-updated', syncCompany)
      window.removeEventListener('erlenbox:treasury-updated', syncTreasury)
    }
  }, [])

  function saveBankAccounts(nextAccounts) {
    const settings = readCompanySettings()
    saveCompanySettings({ ...settings, bankAccounts: nextAccounts })
    setBankAccounts(nextAccounts)
  }

  function saveTreasury(nextAccounts) {
    saveTreasuryAccounts(nextAccounts)
    setTreasuryAccounts(nextAccounts)
  }

  function updateBankAccount(accountId, partial) {
    saveBankAccounts(
      bankAccounts.map((account) => (
        account.id === accountId ? { ...account, ...partial } : account
      )),
    )
  }

  function addBankAccount(bankName) {
    saveBankAccounts([
      ...bankAccounts,
      createBankAccount({ bankName, label: 'Ticari Hesap' }),
    ])
  }

  function removeBankAccount(account) {
    saveBankAccounts(bankAccounts.filter((item) => item.id !== account.id))
    setPendingDeleteId(null)
  }

  function updateTreasuryAccount(accountId, field, value) {
    saveTreasury(
      treasuryAccounts.map((account) => (
        account.id === accountId ? { ...account, [field]: value } : account
      )),
    )
  }

  function addTreasuryAccount(type) {
    const isBank = type === 'Banka Hesabı'
    saveTreasury([
      ...treasuryAccounts,
      {
        id: `account-${Date.now()}`,
        name: isBank ? 'Yeni Banka Hesabı' : 'Yeni Nakit Kasa',
        type,
        currency: 'TRY',
        openingBalance: 0,
        iban: '',
        color: isBank ? 'text-blue-300' : 'text-emerald-300',
      },
    ])
  }

  function removeTreasuryAccount(account) {
    saveTreasury(treasuryAccounts.filter((item) => item.id !== account.id))
    setPendingTreasuryDeleteId(null)
  }

  function handleSave(event) {
    event.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const cashAccounts = treasuryAccounts.filter((account) => account.type === 'Nakit Kasa')
  const treasuryBankAccounts = treasuryAccounts.filter((account) => account.type === 'Banka Hesabı')

  return (
    <div className="w-full space-y-5">
      <section className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-emerald-300">
            <WalletCards className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide text-emerald-300">Kasa ve Banka Ayarları</h1>
            <p className="mt-1 text-xs font-semibold text-gray-500">
              Teklif, ekstre ve kasa modülünde kullanılan hesapları buradan yönetin.
            </p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-4">
        <section className="card space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-emerald-300">
              <Landmark className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-white">Teklif Banka Hesapları</h2>
              <p className="text-xs font-semibold text-gray-500">
                Teklif PDF ve müşteri belgelerinde gösterilecek IBAN bilgileri.
              </p>
            </div>
          </div>

          <BankAccountsSettingsEditor
            key={bankAccounts.map((account) => account.id).join('-')}
            accounts={bankAccounts}
            onUpdateAccount={updateBankAccount}
            onAddAccount={addBankAccount}
            onRemoveAccount={removeBankAccount}
            pendingDeleteId={pendingDeleteId}
            setPendingDeleteId={setPendingDeleteId}
          />
        </section>

        <section className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-emerald-300">
                <Banknote className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-black text-white">Nakit Kasalar</h2>
                <p className="text-xs font-semibold text-gray-500">Kasa modülünde kullanılan nakit hesapları.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => addTreasuryAccount('Nakit Kasa')}
              className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-black text-gray-300 hover:text-white"
            >
              Kasa Ekle
            </button>
          </div>

          <div className="space-y-3">
            {cashAccounts.length === 0 ? (
              <p className="py-4 text-center text-xs font-semibold text-gray-500">Henüz nakit kasa tanımlanmadı.</p>
            ) : cashAccounts.map((account) => (
              <TreasuryAccountRow
                key={account.id}
                account={account}
                pendingDeleteId={pendingTreasuryDeleteId}
                onDeleteRequest={setPendingTreasuryDeleteId}
                onRemove={removeTreasuryAccount}
                onUpdate={updateTreasuryAccount}
                showIban={false}
              />
            ))}
          </div>
        </section>

        <section className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-blue-300">
                <Landmark className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-black text-white">Kasa Banka Hesapları</h2>
                <p className="text-xs font-semibold text-gray-500">Tahsilat ve ödeme işlemlerinde kullanılan banka hesapları.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => addTreasuryAccount('Banka Hesabı')}
              className="rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-black text-gray-300 hover:text-white"
            >
              Hesap Ekle
            </button>
          </div>

          <div className="space-y-3">
            {treasuryBankAccounts.length === 0 ? (
              <p className="py-4 text-center text-xs font-semibold text-gray-500">Henüz banka hesabı tanımlanmadı.</p>
            ) : treasuryBankAccounts.map((account) => (
              <TreasuryAccountRow
                key={account.id}
                account={account}
                pendingDeleteId={pendingTreasuryDeleteId}
                onDeleteRequest={setPendingTreasuryDeleteId}
                onRemove={removeTreasuryAccount}
                onUpdate={updateTreasuryAccount}
                showIban
              />
            ))}
          </div>
        </section>

        <section className="card flex justify-end">
          <button type="submit" className={`${BTN_SUCCESS} gap-2 px-4 py-3 text-xs uppercase tracking-wide`}>
            <Save className="h-4 w-4" />
            {saved ? 'Kaydedildi' : 'Kaydet'}
          </button>
        </section>
      </form>
    </div>
  )
}

function TreasuryAccountRow({
  account,
  pendingDeleteId,
  onDeleteRequest,
  onRemove,
  onUpdate,
  showIban,
}) {
  if (pendingDeleteId === account.id) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-red-500/35 bg-red-500/10 p-4">
        <span className="text-xs font-black text-white">Bu hesap silinsin mi?</span>
        <button type="button" onClick={() => onRemove(account)} className="rounded-md bg-red-500 px-2 py-1 text-[12px] font-black text-white">
          Evet
        </button>
        <button type="button" onClick={() => onDeleteRequest(null)} className="rounded-md bg-dark-600 px-2 py-1 text-[12px] font-bold text-gray-200">
          Hayır
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-dark-500/40 bg-dark-700/30 p-4 sm:grid-cols-2">
      <Field label="Hesap Adı">
        <input
          value={account.name}
          onChange={(event) => onUpdate(account.id, 'name', event.target.value)}
          className="form-input"
        />
      </Field>
      <Field label="Açılış Bakiyesi">
        <NumericInput
          value={account.openingBalance}
          onChange={(value) => onUpdate(account.id, 'openingBalance', value)}
          suffix="₺"
          formatMode="price"
        />
      </Field>
      {showIban ? (
        <Field label="IBAN">
          <input
            value={account.iban || ''}
            onChange={(event) => onUpdate(account.id, 'iban', event.target.value)}
            className="form-input sm:col-span-2"
          />
        </Field>
      ) : null}
      <div className="flex items-end sm:col-span-2">
        <button
          type="button"
          onClick={() => onDeleteRequest(account.id)}
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 hover:bg-red-500/20"
        >
          Hesabı Sil
        </button>
      </div>
    </div>
  )
}
