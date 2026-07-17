import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import CustomerMovementForm from '../components/CustomerMovementForm'
import {
  deleteCustomerOpeningBalance,
  findCustomerProfile,
  updateCustomerOpeningBalance,
} from '../data/customerProfiles'
import { getCustomerDisplay } from '../utils/customerDisplay'
import { appendActivity } from '../utils/customerActivity'
import {
  formatCollectionDatePreserveTime,
  formatOpeningDisplayDate,
  movementAccountOptions,
  movementToForm,
  openingBalanceToForm,
  patchMovementForm,
} from '../utils/customerMovementForm'
import { readOptionLists, saveOptionList } from '../utils/customerMeta'
import {
  deleteTreasuryMovement,
  formatCustomerStatementAmount,
  getCustomerStatementAmountTone,
  formatTreasuryCurrency,
  getTreasuryAccounts,
  getTreasuryMovementById,
  resolveTreasuryAccountForMovement,
  syncCustomerOpeningBalanceMovement,
  updateTreasuryMovement,
} from '../utils/treasuryStore'

function movementTypeLabel(movement) {
  if (movement.type === 'Satış Faturası') return 'Satış Faturası'
  const isPayment = movement.type === 'Müşteri Ödemesi'
  const baseType = isPayment ? 'Ödeme' : 'Tahsilat'
  return movement.method === 'Çek' ? `Çek ${baseType}` : `${movement.method} ${baseType}`
}

function amountClass(movement, isOpening = false) {
  if (isOpening) return 'text-orange-300'
  return getCustomerStatementAmountTone(movement)
}

function OpeningBalanceForm({ form, onUpdate, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-dark-700/60 to-dark-800/90 p-4 shadow-inner">
      <div>
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-orange-300">Açılış Bakiyesi Düzenle</p>
        <p className="mt-1 text-xs font-semibold text-gray-500">Müşterinin cari açılış bakiyesini güncelleyin.</p>
      </div>
      <div className="rounded-2xl border border-dark-500/45 bg-dark-700/30 p-3">
        <label className="mb-2 block text-[12px] font-black uppercase tracking-wider text-gray-500">Açılış Tutarı</label>
        <input value={form.amount} onChange={(event) => onUpdate('amount', event.target.value)} type="number" className="form-input" />
      </div>
      <div className="rounded-2xl border border-dark-500/45 bg-dark-700/30 p-3">
        <label className="mb-2 block text-[12px] font-black uppercase tracking-wider text-gray-500">İşlem Tarihi</label>
        <input value={form.transactionDate} onChange={(event) => onUpdate('transactionDate', event.target.value)} type="date" className="form-input" />
      </div>
      <div className="rounded-2xl border border-dark-500/45 bg-dark-700/30 p-3">
        <label className="mb-2 block text-[12px] font-black uppercase tracking-wider text-gray-500">Açıklama</label>
        <textarea
          value={form.description}
          onChange={(event) => onUpdate('description', event.target.value)}
          className="form-input min-h-[76px] resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-cancel flex w-full items-center justify-center px-3 text-sm font-black"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-xl border border-orange-500/25 bg-orange-500/15 px-3 py-2.5 text-sm font-black text-orange-200 transition-colors hover:bg-orange-500/25"
        >
          Kaydet
        </button>
      </div>
    </form>
  )
}

export default function CustomerMovementDetailPage() {
  const { customerId, movementId } = useParams()
  const navigate = useNavigate()
  const isOpening = movementId === 'opening'
  const [customer, setCustomer] = useState(() => findCustomerProfile(customerId))
  const customerDisplay = getCustomerDisplay(customer)
  const accounts = useMemo(() => getTreasuryAccounts(), [])
  const [movement, setMovement] = useState(() => (isOpening ? null : getTreasuryMovementById(movementId)))
  const [isEditing, setIsEditing] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [form, setForm] = useState(() => (
    isOpening ? openingBalanceToForm(customer) : movementToForm(movement)
  ))
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [activeMenu, setActiveMenu] = useState(null)

  useEffect(() => {
    const nextCustomer = findCustomerProfile(customerId)
    setCustomer(nextCustomer)
    if (isOpening) {
      setMovement(null)
      setForm(openingBalanceToForm(nextCustomer))
      return
    }
    const nextMovement = getTreasuryMovementById(movementId)
    setMovement(nextMovement)
    setForm(movementToForm(nextMovement))
  }, [customerId, isOpening, movementId])

  useEffect(() => {
    if (!activeMenu) return undefined

    function closeActiveMenu() {
      setActiveMenu(null)
    }

    document.addEventListener('click', closeActiveMenu)
    return () => document.removeEventListener('click', closeActiveMenu)
  }, [activeMenu])

  const isValidMovement = isOpening || (movement && movement.customerName === customer.company)
  const isInvoice = !isOpening && movement?.type === 'Satış Faturası'
  const isPayment = !isOpening && movement?.type === 'Müşteri Ödemesi'
  const variant = isPayment ? 'odeme' : 'tahsilat'
  const headerLabel = isOpening ? 'Açılış Bakiyesi' : movementTypeLabel(movement)

  function updateOptionList(field, nextOptions) {
    setOptionLists((current) => ({ ...current, [field]: nextOptions }))
    saveOptionList(field, nextOptions)
  }

  useEffect(() => {
    function refreshOptionLists() {
      setOptionLists(readOptionLists())
    }
    window.addEventListener('bach:option-lists-updated', refreshOptionLists)
    return () => window.removeEventListener('bach:option-lists-updated', refreshOptionLists)
  }, [])

  const movementAccounts = useMemo(
    () => movementAccountOptions(accounts, optionLists),
    [accounts, optionLists],
  )

  function updateForm(field, value) {
    if (isOpening) {
      setForm((current) => ({ ...current, [field]: value }))
      return
    }
    patchMovementForm(setForm, field, value, {
      cashAccount: movementAccounts.cash,
      bankAccount: movementAccounts.bank,
      chequeAccount: movementAccounts.cheque,
    })
  }

  function handleOpeningSave(event) {
    event.preventDefault()
    const amount = Number(form.amount)
    if (Number.isNaN(amount) || amount < 0) {
      window.alert('Geçerli bir açılış tutarı girin.')
      return
    }

    const displayDate = formatOpeningDisplayDate(form.transactionDate)
    const description = form.description || `${customer.company} cari açılış bakiyesi`
    const updatedCustomer = updateCustomerOpeningBalance(customer.id, {
      balance: amount,
      date: displayDate,
      description,
    })

    if (!updatedCustomer) return

    syncCustomerOpeningBalanceMovement(
      customer.id,
      customer.company,
      amount,
      displayDate,
      description,
    )

    setCustomer(updatedCustomer)
    setForm(openingBalanceToForm(updatedCustomer))
    setIsEditing(false)
    appendActivity(
      customer.id,
      'Açılış Bakiyesi Güncellendi',
      `${formatTreasuryCurrency(amount)} · ${displayDate}`,
    )
  }

  function handleMovementSave(event) {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0) {
      window.alert('Geçerli bir tutar girin.')
      return
    }

    const account = resolveTreasuryAccountForMovement(form.method, form.accountName, accounts)
    const updated = updateTreasuryMovement(movement.id, {
      method: form.method,
      accountId: account?.id || movement.accountId,
      accountName: account?.name || form.accountName,
      amount,
      date: formatCollectionDatePreserveTime(form.transactionDate, movement.date),
      description: form.description || `${customer.company} ${isPayment ? 'ödemesi' : 'tahsilatı'}`,
      chequeNo: form.chequeNo,
      chequeBank: form.chequeBank,
      chequeBranch: form.chequeBranch,
      chequeDueDate: form.chequeDueDate,
      chequeOwner: form.chequeOwner,
    })

    if (!updated) return
    setMovement(updated)
    setForm(movementToForm(updated))
    setIsEditing(false)
    appendActivity(
      customer.id,
      'Hareket Güncellendi',
      `${movementTypeLabel(updated)} · ${formatTreasuryCurrency(amount)}`,
    )
  }

  function handleDelete() {
    if (isOpening) {
      deleteCustomerOpeningBalance(customer.id)
      syncCustomerOpeningBalanceMovement(customer.id, customer.company, 0)
      appendActivity(
        customer.id,
        'Açılış Bakiyesi Silindi',
        formatTreasuryCurrency(Number(customer.balance) || 0),
      )
      navigate(`/musteriler/${customer.id}`)
      return
    }

    deleteTreasuryMovement(movement.id)
    appendActivity(
      customer.id,
      'Hareket Silindi',
      `${movementTypeLabel(movement)} · ${formatTreasuryCurrency(movement.amount)}`,
    )
    navigate(`/musteriler/${customer.id}`)
  }

  if (!isValidMovement) {
    return (
      <div className="space-y-5">
        <section className="card p-6 text-center text-sm font-semibold text-gray-400">
          Hareket bulunamadı.
          <Link to={`/musteriler/${customer.id}`} className="ml-2 text-blue-300 hover:underline">
            Müşteri detayına dön
          </Link>
        </section>
      </div>
    )
  }

  const detailRows = isOpening
    ? [
      ['İşlem Türü', 'Açılış Bakiyesi'],
      ['İşlem Tarihi', customer.openingBalanceDate || '01.06.2026'],
      ['Tutar', formatTreasuryCurrency(customer.balance || 0)],
      ['Açıklama', customer.openingBalanceDescription || `${customer.company} cari açılış bakiyesi`],
    ]
    : isInvoice
      ? [
        ['İşlem Türü', 'Satış Faturası'],
        ['Fatura No', movement.docNo || '—'],
        ['İşlem Tarihi', movement.date || '—'],
        ['Vade Tarihi', movement.dueDate || '—'],
        ['Durum', movement.status || 'İşlendi'],
        ['Tutar', formatCustomerStatementAmount(movement)],
        ['Açıklama', movement.description || '—'],
      ]
      : [
        ['İşlem Türü', movementTypeLabel(movement)],
        ['İşlem Yeri', movement.accountName || '—'],
        ['İşlem Tarihi', movement.date || '—'],
        ['Durum', movement.status || 'İşlendi'],
        ['Tutar', formatCustomerStatementAmount(movement)],
        ['Açıklama', movement.description || '—'],
      ]

  return (
    <div className="space-y-5">
      <section className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
        <Link
          to={`/musteriler/${customer.id}`}
          className="absolute left-5 top-1/2 inline-flex -translate-y-1/2 items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-bold text-gray-300 transition-colors hover:bg-dark-700 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Müşteri Detayı
        </Link>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">
            {isOpening ? 'Açılış Bakiyesi Detayı' : 'Cari Hareket Detayı'}
          </h1>
          <p className="mt-1 text-xs font-semibold text-gray-500">
            {customerDisplay.brandShortName} · {headerLabel}
          </p>
        </div>
        {!isEditing && !isInvoice && (
          <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-500/25 bg-blue-500/10 px-4 text-xs font-black uppercase tracking-wide text-blue-300 transition-colors hover:bg-blue-500/20"
            >
              <Pencil className="h-3.5 w-3.5" /> Düzenle
            </button>
            {pendingDelete ? (
              <div className="flex items-center gap-2 rounded-2xl border border-red-500/35 bg-dark-900 px-3 py-2 shadow-2xl ring-1 ring-red-500/15">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="whitespace-nowrap text-xs font-black text-white">Silinsin mi?</p>
                  <p className="whitespace-nowrap text-[12px] font-medium text-gray-500">Bu işlem geri alınamaz.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white hover:bg-red-400"
                >
                  Evet
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(false)}
                  className="btn-cancel px-3 text-xs"
                >
                  Vazgeç
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPendingDelete(true)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 text-xs font-black uppercase tracking-wide text-red-300 transition-colors hover:bg-red-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" /> Sil
              </button>
            )}
          </div>
        )}
      </section>

      <section className="card p-5">
        {isEditing ? (
          isOpening ? (
            <OpeningBalanceForm
              form={form}
              onUpdate={updateForm}
              onSubmit={handleOpeningSave}
              onCancel={() => {
                setForm(openingBalanceToForm(customer))
                setIsEditing(false)
              }}
            />
          ) : (
            <CustomerMovementForm
              variant={variant}
              form={form}
              onUpdate={updateForm}
              onSubmit={handleMovementSave}
              onCancel={() => {
                setForm(movementToForm(movement))
                setIsEditing(false)
              }}
              cashAccountOptions={movementAccounts.cash}
              bankAccountOptions={movementAccounts.bank}
              chequeAccountOptions={movementAccounts.cheque}
              onCashOptionsChange={(next) => updateOptionList('cashAccount', next)}
              onBankOptionsChange={(next) => updateOptionList('bankAccount', next)}
              onChequeOptionsChange={(next) => updateOptionList('chequeAccount', next)}
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              title="Hareket Düzenle"
              subtitle="İşlem bilgilerini güncelleyin. Değişiklikler cari hareket kaydına yansır."
              submitLabel="Kaydet"
              preserveTimeHint
            />
          )
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {detailRows.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-dark-500/40 bg-dark-800/70 px-4 py-3">
                <p className="text-[12px] font-black uppercase tracking-wider text-gray-500">{label}</p>
                <p className={`mt-1 text-sm font-bold ${label === 'Tutar' ? amountClass(movement, isOpening) : 'text-white'}`}>{value}</p>
              </div>
            ))}
            {!isOpening && movement.method === 'Çek' && (
              <>
                {[
                  ['Çek No', movement.chequeNo],
                  ['Çek Sahibi', movement.chequeOwner],
                  ['Banka', movement.chequeBank],
                  ['Şube', movement.chequeBranch],
                  ['Vade Tarihi', movement.chequeDueDate],
                ].filter(([, value]) => value).map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-purple-500/20 bg-purple-500/5 px-4 py-3">
                    <p className="text-[12px] font-black uppercase tracking-wider text-purple-300">{label}</p>
                    <p className="mt-1 text-sm font-bold text-white">{value}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
