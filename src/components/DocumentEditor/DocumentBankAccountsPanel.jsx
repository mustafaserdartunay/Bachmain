import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import BankAccountsDocumentEditor, { SelectedBankAccountsPreview } from './BankAccountsDocumentEditor'
import { createBankAccount, readCompanySettings, updateCompanySettings } from '../../utils/companySettings'

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
  }

  function removeAccount(account) {
    saveBankAccounts(bankAccounts.filter((item) => item.id !== account.id))
    onPatch({
      selectedBankAccountIds: selectedAccountIds.filter((id) => id !== account.id),
    })
    setPendingDeleteId(null)
  }

  const paddingClass = compact ? 'p-2' : 'p-3'
  const editButtonClass = `inline-flex shrink-0 items-center gap-1 rounded-lg border border-dark-500/50 bg-dark-800/90 px-2 py-1 text-[10px] font-bold text-gray-400 transition-colors hover:text-white ${
    compact ? 'mt-0.5' : 'mt-1'
  }`

  return (
    <div className="overflow-hidden rounded-lg border border-dark-500/50 transition-colors focus-within:border-accent-blue/50">
      {!isOpen ? (
        <div className={`flex items-start gap-2 ${paddingClass}`}>
          {selectedAccounts.length > 0 ? (
            <div className="min-w-0 flex-1">
              <SelectedBankAccountsPreview accounts={selectedAccounts} compact={compact} inline />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="min-w-0 flex-1 rounded-xl border border-dashed border-dark-500/50 bg-dark-700/30 py-3 text-center text-xs font-semibold text-gray-500 transition-colors hover:border-blue-500/35 hover:text-gray-300"
            >
              Banka hesabı seçin veya ekleyin
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={editButtonClass}
          >
            Düzenle
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <>
          <div className={`flex items-center justify-end border-b border-dark-500/50 ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 transition-colors hover:text-white"
            >
              Gizle
              <ChevronDown className="h-3.5 w-3.5 rotate-180" />
            </button>
          </div>
          <div
            className={`max-h-[min(28rem,70vh)] overflow-y-auto ${paddingClass}`}
            onClick={(event) => event.stopPropagation()}
          >
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
        </>
      )}
    </div>
  )
}
