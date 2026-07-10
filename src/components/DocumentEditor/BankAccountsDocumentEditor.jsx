import { useEffect, useRef, useState } from 'react'
import { Landmark, Pencil, Plus, X } from 'lucide-react'
import InlineDeleteConfirm from '../Common/InlineDeleteConfirm'
import { BTN_PRIMARY } from '../../utils/buttonStyles'

function displaySummary(account) {
  const parts = [account.bankName, account.label].filter(Boolean)
  if (parts.length > 0) return parts.join(' · ')
  return 'Yeni Hesap'
}

export function SelectedBankAccountsPreview({ accounts, compact = false, inline = false }) {
  if (accounts.length === 0) {
    return null
  }

  return (
    <div className={`space-y-1.5 ${inline ? '' : compact ? 'px-2 pb-2' : 'px-3 pb-3'}`}>
      {accounts.map((account) => (
        <div
          key={account.id}
          className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-2 py-2"
        >
          <Landmark className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">{displaySummary(account)}</p>
            {account.iban ? (
              <p className="truncate text-[12px] font-semibold text-gray-400">{account.iban}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function BankAccountsDocumentEditor({
  accounts,
  selectedAccountIds = [],
  onToggleSelect,
  onUpdateAccount,
  onAddAccount,
  onRemoveAccount,
  pendingDeleteId,
  setPendingDeleteId,
  emptyMessage = 'Henüz banka hesabı eklenmedi.',
  addPlaceholder = 'Banka adı...',
}) {
  const listRef = useRef(null)
  const previousCountRef = useRef(accounts.length)
  const [newBankName, setNewBankName] = useState('')
  const [editingAccountId, setEditingAccountId] = useState(null)
  const newBankInputRef = useRef(null)

  useEffect(() => {
    if (accounts.length <= previousCountRef.current) {
      previousCountRef.current = accounts.length
      return
    }
    previousCountRef.current = accounts.length
    const list = listRef.current
    if (!list) return
    list.scrollTop = list.scrollHeight
  }, [accounts.length, accounts.map((account) => account.id).join('|')])

  useEffect(() => {
    if (editingAccountId && !accounts.some((account) => account.id === editingAccountId)) {
      setEditingAccountId(null)
    }
  }, [accounts, editingAccountId])

  function handleAddAccount() {
    const bankName = (newBankInputRef.current?.value ?? newBankName).trim()
    if (!bankName) return
    onAddAccount(bankName)
    setNewBankName('')
    if (newBankInputRef.current) newBankInputRef.current.value = ''
  }

  function handleSelectAccount(account) {
    onToggleSelect(account)
    setEditingAccountId(account.id)
  }

  return (
    <div>
      {accounts.length > 0 ? (
        <div ref={listRef} className="max-h-64 space-y-1.5 overflow-y-auto pr-0.5">
          {accounts.map((account) => {
            const isSelected = selectedAccountIds.includes(account.id)
            const isEditing = editingAccountId === account.id
            return (
              <div key={account.id}>
                {pendingDeleteId === account.id ? (
                  <div className="flex w-full items-center rounded-xl border border-dark-500/50 bg-dark-700/70">
                    <span className="px-2 py-2 text-emerald-400 opacity-60">
                      <Landmark className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate px-1 py-2 text-xs font-bold text-gray-400">
                      {displaySummary(account)}
                    </span>
                    <InlineDeleteConfirm
                      onConfirm={() => onRemoveAccount(account)}
                      onCancel={() => setPendingDeleteId(null)}
                    />
                  </div>
                ) : (
                  <div
                    className={`group rounded-xl border transition-colors ${
                      isSelected
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-dark-500/50 bg-dark-700/70 hover:bg-dark-700/80'
                    }`}
                  >
                    <div className="flex w-full items-center">
                      <span className="px-2 py-2 text-emerald-400">
                        <Landmark className="h-3.5 w-3.5" />
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectAccount(account)}
                        className={`min-w-0 flex-1 truncate px-1 py-2 text-left text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-gray-300'
                        }`}
                      >
                        {displaySummary(account)}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setEditingAccountId(isEditing ? null : account.id)
                          if (!isSelected) onToggleSelect(account)
                        }}
                        className={`rounded-md p-2 text-gray-500 transition-all hover:bg-emerald-500/15 hover:text-emerald-300 ${
                          isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title="Hesap bilgilerini düzenle"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setPendingDeleteId(account.id)
                        }}
                        className="rounded-md p-2 text-gray-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/15 hover:text-red-300"
                        title="Hesabı sil"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>

                    {isEditing && (
                      <div className="grid gap-2 border-t border-dark-500/35 p-2 sm:grid-cols-2">
                        <label className="block space-y-1">
                          <span className="text-[12px] font-black uppercase tracking-wider text-gray-500">Banka</span>
                          <input
                            value={account.bankName}
                            onChange={(event) => onUpdateAccount(account.id, { bankName: event.target.value })}
                            className="form-input h-8 text-xs"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-[12px] font-black uppercase tracking-wider text-gray-500">Hesap Etiketi</span>
                          <input
                            value={account.label}
                            onChange={(event) => onUpdateAccount(account.id, { label: event.target.value })}
                            className="form-input h-8 text-xs"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-[12px] font-black uppercase tracking-wider text-gray-500">Şube</span>
                          <input
                            value={account.branch}
                            onChange={(event) => onUpdateAccount(account.id, { branch: event.target.value })}
                            className="form-input h-8 text-xs"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-[12px] font-black uppercase tracking-wider text-gray-500">IBAN</span>
                          <input
                            value={account.iban}
                            onChange={(event) => onUpdateAccount(account.id, { iban: event.target.value })}
                            className="form-input h-8 text-xs"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <p className="py-6 text-center text-xs font-semibold text-gray-500">{emptyMessage}</p>
      )}

      <div className="mt-3 flex gap-2 border-t border-dark-500/35 pt-3">
        <input
          ref={newBankInputRef}
          value={newBankName}
          onChange={(event) => setNewBankName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault()
              handleAddAccount()
            }
          }}
          placeholder={addPlaceholder}
          className="form-input h-9 min-w-0 flex-1"
        />
        <button type="button" onClick={handleAddAccount} className={`${BTN_PRIMARY} h-9 shrink-0 gap-1.5 px-3 text-xs`}>
          <Plus className="h-3.5 w-3.5" /> Ekle
        </button>
      </div>
    </div>
  )
}
