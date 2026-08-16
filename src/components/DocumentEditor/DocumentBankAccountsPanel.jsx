import { useEffect, useState } from 'react'
import { ChevronDown, Landmark, Plus } from 'lucide-react'
import BankAccountsDocumentEditor from './BankAccountsDocumentEditor'
import { AppPanelDot } from '../Layout/AppPageLayout'
import { createBankAccount, readCompanySettings, updateCompanySettings } from '../../utils/companySettings'
import { APP_PANEL_TITLE_CLASS } from '../../utils/dashboardDesign'

export default function DocumentBankAccountsPanel({
  quote,
  onPatch,
  compact = false,
}) {
  const [bankAccounts, setBankAccounts] = useState(() => readCompanySettings().bankAccounts)
  const [isOpen, setIsOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

  useEffect(() => {
    function sync() {
      setBankAccounts(readCompanySettings().bankAccounts)
    }
    window.addEventListener('erlenbox:company-settings-updated', sync)
    return () => window.removeEventListener('erlenbox:company-settings-updated', sync)
  }, [])

  const selectedAccountIds = Array.isArray(quote.selectedBankAccountIds)
    ? quote.selectedBankAccountIds
    : []
  const selectedAccounts = selectedAccountIds
    .map((accountId) => bankAccounts.find((account) => account.id === accountId))
    .filter(Boolean)

  function saveBankAccounts(nextAccounts) {
    updateCompanySettings({ bankAccounts: nextAccounts })
    setBankAccounts(nextAccounts)
  }

  function toggleSelect(account) {
    const isSelected = selectedAccountIds.includes(account.id)
    const nextIds = isSelected
      ? selectedAccountIds.filter((id) => id !== account.id)
      : [...selectedAccountIds, account.id]
    onPatch({ selectedBankAccountIds: nextIds })
  }

  function updateAccount(accountId, partial) {
    saveBankAccounts(
      bankAccounts.map((account) => (
        account.id === accountId ? { ...account, ...partial } : account
      )),
    )
  }

  function addAccount(bankName) {
    const account = createBankAccount({ bankName, label: 'Ticari Hesap' })
    saveBankAccounts([...bankAccounts, account])
    onPatch({ selectedBankAccountIds: [...selectedAccountIds, account.id] })
    setIsOpen(true)
  }

  function removeAccount(account) {
    saveBankAccounts(bankAccounts.filter((item) => item.id !== account.id))
    onPatch({
      selectedBankAccountIds: selectedAccountIds.filter((id) => id !== account.id),
    })
    setPendingDeleteId(null)
  }

  const paddingClass = compact ? 'p-2' : 'p-3'

  return (
    <div className="w-full min-w-0">
      <div className="mb-1 flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <AppPanelDot color="blue" />
          <span className={APP_PANEL_TITLE_CLASS}>Banka Hesapları :</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-[var(--muted)] transition-colors hover:text-white"
        >
          {isOpen ? 'Gizle' : selectedAccounts.length > 0 ? 'Düzenle' : 'Seç / Ekle'}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-dark-500/50 transition-colors focus-within:border-accent-blue/50">
        {!isOpen ? (
          <div className={`flex w-full min-w-0 items-stretch gap-3 ${paddingClass}`}>
            {selectedAccounts.length > 0 ? (
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                {selectedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2"
                  >
                    <Landmark className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white">
                        {[account.bankName, account.label].filter(Boolean).join(' · ') || 'Hesap'}
                      </p>
                      {account.iban ? (
                        <p className="truncate text-[12px] font-semibold text-gray-400">{account.iban}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex min-h-[3.25rem] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-dark-500/50 bg-dark-700/30 px-4 text-center text-xs font-semibold text-gray-500 transition-colors hover:border-blue-500/35 hover:text-gray-300"
              >
                <Landmark className="h-3.5 w-3.5 shrink-0" />
                Banka hesabı seçin veya ekleyin — teklifte birden fazla hesap seçilebilir
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="glass-sidebar-toggle flex h-8 w-8 shrink-0 self-center items-center justify-center rounded-xl"
              title="Banka hesabı ekle / seç"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
        ) : (
          <div
            className={`max-h-[min(28rem,70vh)] overflow-y-auto ${paddingClass}`}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-3 text-[12px] font-medium text-[var(--muted)]">
              İstediğiniz kadar banka seçebilirsiniz. Yeni hesap eklediğinizde teklife otomatik eklenir.
            </p>
            <BankAccountsDocumentEditor
              key={bankAccounts.map((account) => account.id).join('-')}
              accounts={bankAccounts}
              selectedAccountIds={selectedAccountIds}
              onToggleSelect={toggleSelect}
              onUpdateAccount={updateAccount}
              onAddAccount={addAccount}
              onRemoveAccount={removeAccount}
              pendingDeleteId={pendingDeleteId}
              setPendingDeleteId={setPendingDeleteId}
            />
          </div>
        )}
      </div>
    </div>
  )
}
