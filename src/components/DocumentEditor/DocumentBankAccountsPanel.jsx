import { useEffect, useState } from 'react'
import { ChevronDown, Landmark } from 'lucide-react'
import BankAccountsDocumentEditor from './BankAccountsDocumentEditor'
import { AppPanelDot } from '../Layout/AppPageLayout'
import { createBankAccount, readCompanySettings, updateCompanySettings } from '../../utils/companySettings'
import { APP_PANEL_TITLE_CLASS, YF_TEXT_CLASS } from '../../utils/dashboardDesign'

const MS_CTA_CLASS =
  'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--search-border)] bg-transparent text-[14px] font-normal text-[#2563eb] transition-all hover:scale-[1.03] hover:font-bold hover:text-[#2563eb]'

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

  function addAccount(partial = {}) {
    const payload = typeof partial === 'string' ? { bankName: partial } : partial || {}
    const bankName = String(payload.bankName || '').trim()
    if (!bankName) return
    const account = createBankAccount({
      bankName,
      branch: String(payload.branch || '').trim(),
      iban: String(payload.iban || '').trim(),
      label: payload.label || 'Ticari Hesap',
    })
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
  const toggleLabel = isOpen ? 'Gizle' : selectedAccounts.length > 0 ? 'Düzenle' : 'Seç / Ekle'

  return (
    <div className="w-full min-w-0">
      <div className="mb-2.5 flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <AppPanelDot color="blue" />
          <span className={APP_PANEL_TITLE_CLASS}>Banka Hesapları :</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className={`${MS_CTA_CLASS} h-auto min-h-0 shrink-0 gap-1.5 px-3 py-1.5`}
        >
          {toggleLabel}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="document-frame-only overflow-hidden rounded-xl border border-[var(--search-border)] bg-transparent">
        {!isOpen ? (
          <div className={`flex w-full min-w-0 items-stretch gap-3 ${paddingClass}`}>
            {bankAccounts.length > 0 ? (
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                {bankAccounts.map((account) => {
                  const isSelected = selectedAccountIds.includes(account.id)
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => toggleSelect(account)}
                      aria-pressed={isSelected}
                      className={`document-frame-only flex min-w-0 max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
                        isSelected
                          ? 'border-[#10b981]/55 bg-[#10b981]/10'
                          : 'border-[var(--search-border)] bg-transparent hover:border-[#10b981]/35'
                      }`}
                    >
                      <Landmark
                        className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-[#10b981]' : 'text-[var(--muted)]'}`}
                        strokeWidth={2.25}
                      />
                      <div className="min-w-0">
                        <p
                          className={`customer-name-primary truncate ${
                            isSelected ? '!text-[#10b981]' : ''
                          }`}
                        >
                          {[account.bankName, account.label].filter(Boolean).join(' · ') || 'Hesap'}
                        </p>
                        {account.iban ? (
                          <p className="customer-name-secondary truncate">{account.iban}</p>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="document-frame-only flex min-h-[3.25rem] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--search-border)] bg-transparent px-4 text-center text-[14px] font-normal text-[var(--muted)] transition-opacity hover:opacity-80"
              >
                <Landmark className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                Banka hesabı seçin veya ekleyin — teklifte birden fazla hesap seçilebilir
              </button>
            )}
          </div>
        ) : (
          <div
            className={`max-h-[min(28rem,70vh)] overflow-y-auto ${paddingClass}`}
            onClick={(event) => event.stopPropagation()}
          >
            <p className={`mb-3 ${YF_TEXT_CLASS}`}>
              İstediğiniz kadar banka seçebilirsiniz. Seçilenler teklife ve yazdırma çıktısına eklenir.
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
