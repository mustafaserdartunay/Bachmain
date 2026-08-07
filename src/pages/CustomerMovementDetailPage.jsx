import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
  CalendarDays,
  CircleDot,
  FileText,
  Landmark,
  Pencil,
  Printer,
  Trash2,
  Wallet,
} from 'lucide-react'
import CustomerMovementForm from '../components/CustomerMovementForm'
import { DeleteConfirmOverlay } from '../components/Common/ListDeleteConfirmPanel'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
} from '../components/Layout/AppPageLayout'
import {
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../components/Layout/HeaderCashActionsPanel'
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
  PAGE_BALANCE_AMOUNT_CLASS,
  PAGE_CENTER_TITLE_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  YF_TEXT_CLASS,
  YF_TEXT_ON_COLOR_CLASS,
} from '../utils/dashboardDesign'
import { downloadMovementReceiptPdf } from '../utils/movementReceiptPdf'
import {
  deleteTreasuryMovement,
  formatCustomerStatementAmount,
  formatTreasuryCurrency,
  getCustomerLedgerBalance,
  getCustomerStatementAmountTone,
  getTreasuryAccounts,
  getTreasuryMovementById,
  resolveTreasuryAccountForMovement,
  syncCustomerOpeningBalanceMovement,
  updateTreasuryMovement,
} from '../utils/treasuryStore'

/** Kalan — yfb + bakiye tonu: alacak yeşil, borç kırmızı, sıfır muted */
function balanceTone(balance) {
  if (balance > 0) return 'customer-balance-positive'
  if (balance < 0) return 'customer-balance-negative'
  return 'customer-balance-zero'
}

const LABEL_CLASS = `${YF_TEXT_CLASS} uppercase`
const VALUE_CLASS =
  'min-w-0 truncate text-[14px] font-normal leading-tight tracking-normal text-[var(--ink)]'
const FIELD_ROW_CLASS = 'grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2'
const INPUT_CLASS = 'form-input !h-9 !min-h-9 !w-full !py-1 !text-[13px]'
const META_ROW_CLASS =
  'grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)] items-center gap-3 border-b border-[var(--glass-border)] py-3.5 last:border-b-0'

function movementTypeLabel(movement) {
  if (!movement) return '—'
  if (movement.type === 'Satış Faturası') return 'Satış Faturası'
  const isPayment = movement.type === 'Müşteri Ödemesi'
  const baseType = isPayment ? 'Ödeme' : 'Tahsilat'
  return movement.method === 'Çek' ? `Çek ${baseType}` : `${movement.method} ${baseType}`
}

function cardTitle({ isOpening, isPayment, isInvoice }) {
  if (isOpening) return 'Açılış Bakiyesi'
  if (isInvoice) return 'Satış Faturası'
  if (isPayment) return 'Müşteriye Ödeme'
  return 'Müşteriden Tahsilat'
}

function amountLabel({ isOpening, isPayment, isInvoice }) {
  if (isOpening) return 'Açılış Bakiyesi'
  if (isInvoice) return 'Fatura Tutarı'
  if (isPayment) return 'Ödenen Meblağ'
  return 'Tahsil Edilen Meblağ'
}

function OpeningBalanceForm({ form, onUpdate, onSubmit, onCancel }) {
  return (
    <form
      onSubmit={onSubmit}
      className="overflow-hidden rounded-[16px] border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.48)]"
    >
      <div className="border-b border-[var(--glass-border)] px-3 py-2.5">
        <p className={`${YF_TEXT_CLASS} !font-bold !text-[var(--ink)]`}>Açılış Bakiyesi Düzenle</p>
      </div>
      <div className="space-y-3 px-3 py-3">
        <div className={FIELD_ROW_CLASS}>
          <label className={LABEL_CLASS} htmlFor="opening-amount">
            Tutar <span className="text-rose-500">*</span>
          </label>
          <div className="relative min-w-0">
            <input
              id="opening-amount"
              value={form.amount}
              onChange={(event) => onUpdate('amount', event.target.value)}
              type="number"
              className={`${INPUT_CLASS} !pr-7`}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[13px] text-[var(--muted)]">
              ₺
            </span>
          </div>
        </div>
        <div className={FIELD_ROW_CLASS}>
          <label className={LABEL_CLASS} htmlFor="opening-date">
            Tarih <span className="text-rose-500">*</span>
          </label>
          <input
            id="opening-date"
            value={form.transactionDate}
            onChange={(event) => onUpdate('transactionDate', event.target.value)}
            type="date"
            className={INPUT_CLASS}
          />
        </div>
        <div className={FIELD_ROW_CLASS}>
          <label className={LABEL_CLASS} htmlFor="opening-desc">
            Açıklama
          </label>
          <input
            id="opening-desc"
            value={form.description}
            onChange={(event) => onUpdate('description', event.target.value)}
            type="text"
            className={INPUT_CLASS}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-transparent px-2 transition-colors hover:bg-white/35"
          >
            <span className={`${YF_TEXT_CLASS} uppercase`}>Vazgeç</span>
          </button>
          <button
            type="submit"
            className={`${HEADER_ACTION_CTA_CLASS} !h-9 w-full justify-center ${HEADER_ACTION_GRADIENTS.primary}`}
          >
            <span className={`${YF_TEXT_ON_COLOR_CLASS} uppercase`}>Kaydet</span>
          </button>
        </div>
      </div>
    </form>
  )
}

function MetaRow({ icon: Icon, label, children }) {
  return (
    <div className={META_ROW_CLASS}>
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="h-4 w-4 shrink-0 text-[var(--muted)]" strokeWidth={2.25} />
        <span className={LABEL_CLASS}>{label}</span>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
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
  const [form, setForm] = useState(() =>
    isOpening ? openingBalanceToForm(customer) : movementToForm(movement),
  )
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

  const isValidMovement =
    Boolean(customer) && (isOpening || (movement && movement.customerName === customer.company))
  const isInvoice = !isOpening && movement?.type === 'Satış Faturası'
  const isPayment = !isOpening && movement?.type === 'Müşteri Ödemesi'
  const variant = isPayment ? 'odeme' : 'tahsilat'
  const TitleIcon = isPayment ? ArrowUpFromLine : isOpening ? Wallet : ArrowDownToLine
  const resolvedCardTitle = cardTitle({ isOpening, isPayment, isInvoice })
  const resolvedAmountLabel = amountLabel({ isOpening, isPayment, isInvoice })
  const printLabel = isPayment
    ? 'Ödeme Makbuzunu Yazdır'
    : isOpening
      ? 'Açılış Belgesini Yazdır'
      : 'Tahsilat Makbuzunu Yazdır'

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
      <AppPageShell className="customers-page-type w-full space-y-5">
        <AppPageHeader
          showBack={false}
          title={<AppPageBackLink to="/musteriler" label="Müşteriler" />}
          centerTitle={String('Cari Hareket Detayı').toLocaleUpperCase('tr-TR')}
          centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
          titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
        />
        <AppPagePanel className="w-full">
          <p className={`${YF_TEXT_CLASS} text-center`}>
            Hareket bulunamadı.{' '}
            <Link
              to={customerId ? `/musteriler/${customerId}` : '/musteriler'}
              className="text-blue-600 hover:underline"
            >
              Geri dön
            </Link>
          </p>
        </AppPagePanel>
      </AppPageShell>
    )
  }

  const customerName =
    customerDisplay.company || customerDisplay.brandShortName || customer.company || '—'
  const transactionDate = isOpening
    ? customer.openingBalanceDate || '—'
    : movement.date || '—'
  const accountName = isOpening ? '—' : movement.accountName || '—'
  const statusLabel = isOpening ? 'Açılış' : movement.status || 'İşlendi'
  const amountDisplay = isOpening
    ? formatTreasuryCurrency(customer.balance || 0)
    : formatCustomerStatementAmount(movement)
  /** Meblağ / Toplam / İşlenen — müşteri ekstresi Meblağ sütunu ile aynı ton */
  const amountToneClass = isOpening
    ? getCustomerStatementAmountTone({ isOpening: true })
    : getCustomerStatementAmountTone(movement)
  const description = isOpening
    ? customer.openingBalanceDescription || `${customer.company} cari açılış bakiyesi`
    : movement.description || '—'
  const remainingSigned = getCustomerLedgerBalance(customer)
  const remainingBalance = formatTreasuryCurrency(remainingSigned)
  const remainingToneClass = balanceTone(remainingSigned)

  const chequeRows =
    !isOpening && movement?.method === 'Çek'
      ? [
          ['Çek No', movement.chequeNo],
          ['Çek Sahibi', movement.chequeOwner],
          ['Banka', movement.chequeBank],
          ['Şube', movement.chequeBranch],
          ['Vade', movement.chequeDueDate],
        ].filter(([, value]) => value)
      : []

  const relatedRows = isInvoice
    ? [
        {
          title: movement.docNo || 'Satış Faturası',
          status: movement.status || 'İşlendi',
          total: formatCustomerStatementAmount(movement),
          applied: formatCustomerStatementAmount(movement),
        },
      ]
    : description && description !== '—'
      ? [
          {
            title: description,
            status: statusLabel,
            total: amountDisplay,
            applied: amountDisplay,
          },
        ]
      : []

  function handlePrint() {
    downloadMovementReceiptPdf({
      kind: isOpening ? 'opening' : isPayment ? 'odeme' : 'tahsilat',
      customer,
      customerDisplay,
      movement: isOpening ? { id: `opening-${customer.id}` } : movement,
      title: resolvedCardTitle,
      amountLabel: resolvedAmountLabel,
      amountDisplay,
      transactionDate,
      accountName,
      statusLabel,
      description,
      remainingBalance,
      chequeRows,
      relatedRows,
    })
  }

  return (
    <AppPageShell className="customers-page-type customer-movement-detail-page flex w-full flex-col space-y-5">
      <AppPageHeader
        showBack={false}
        title={
          <AppPageBackLink to={`/musteriler/${customer.id}`} label="Müşteri Detayı" />
        }
        centerTitle={String('Cari Hareket Detayı').toLocaleUpperCase('tr-TR')}
        centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
      />

      <AppPagePanel className="customer-movement-detail-card flex min-h-0 w-full flex-1 flex-col overflow-visible print:shadow-none">
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
              submitLabel="Kaydet"
            />
          )
        ) : (
          <div className="space-y-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--glass-border)] pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-white/35 text-blue-600">
                  <TitleIcon className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <h2 className="min-w-0 truncate text-[18px] font-bold leading-tight tracking-normal text-[var(--ink)]">
                  {resolvedCardTitle}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.success}`}
                >
                  <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                    <Printer className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} />
                  </span>
                  <span className={YF_TEXT_ON_COLOR_CLASS}>{printLabel}</span>
                </button>
                {!isInvoice ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.primary}`}
                    title="Düzenle"
                  >
                    <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                      <Pencil className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} />
                    </span>
                    <span className={YF_TEXT_ON_COLOR_CLASS}>Düzenle</span>
                  </button>
                ) : null}
                {!isInvoice ? (
                  <button
                    type="button"
                    onClick={() => setPendingDelete(true)}
                    className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.danger}`}
                    title="Sil"
                    aria-label="Hareketi sil"
                  >
                    <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
                      <Trash2 className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} />
                    </span>
                    <span className={YF_TEXT_ON_COLOR_CLASS}>Sil</span>
                  </button>
                ) : null}
              </div>
            </div>

            <div className="pt-1">
              <MetaRow icon={Building2} label="Müşteri">
                <p className={VALUE_CLASS}>{customerName}</p>
              </MetaRow>
              <MetaRow icon={CalendarDays} label="İşlem Tarihi">
                <p className={VALUE_CLASS}>{transactionDate}</p>
              </MetaRow>
              {!isOpening ? (
                <MetaRow icon={Landmark} label="İşlendiği Hesap">
                  <div className="flex min-w-0 items-center gap-2">
                    <Landmark className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" strokeWidth={2.25} />
                    <p className={VALUE_CLASS}>{accountName}</p>
                  </div>
                </MetaRow>
              ) : null}
              <MetaRow icon={FileText} label="İşlem Türü">
                <p className={VALUE_CLASS}>
                  {isOpening ? 'Açılış Bakiyesi' : movementTypeLabel(movement)}
                </p>
              </MetaRow>
              <MetaRow icon={CircleDot} label="Durum">
                <p className={VALUE_CLASS}>{statusLabel}</p>
              </MetaRow>
              {chequeRows.map(([label, value]) => (
                <MetaRow key={label} icon={Wallet} label={label}>
                  <p className={VALUE_CLASS}>{value}</p>
                </MetaRow>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[var(--glass-border)] py-5">
              <p className={LABEL_CLASS}>{resolvedAmountLabel}</p>
              <p className={`${PAGE_BALANCE_AMOUNT_CLASS} ${amountToneClass}`}>
                {amountDisplay}
              </p>
            </div>

            <div className="pt-4">
              <div className="mb-2 grid grid-cols-[minmax(0,1.6fr)_7rem_7.5rem_7.5rem] items-center gap-2 px-1">
                <span className={LABEL_CLASS}>
                  {isInvoice ? 'İşlendiği Faturalar' : 'İlgili Kayıt'}
                </span>
                <span className={LABEL_CLASS}>Durumu</span>
                <span className={`${LABEL_CLASS} text-right`}>Toplam</span>
                <span className={`${LABEL_CLASS} text-right`}>İşlenen</span>
              </div>
              {relatedRows.length === 0 ? (
                <p className={`${YF_TEXT_CLASS} px-1 py-4`}>İlgili kayıt yok.</p>
              ) : (
                <div className="divide-y divide-[var(--glass-border)] border-t border-[var(--glass-border)]">
                  {relatedRows.map((row) => (
                    <div
                      key={`${row.title}-${row.status}`}
                      className="grid grid-cols-[minmax(0,1.6fr)_7rem_7.5rem_7.5rem] items-center gap-2 px-1 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <CircleDot className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" strokeWidth={2.25} />
                        <p className={VALUE_CLASS}>{row.title}</p>
                      </div>
                      <p className={VALUE_CLASS}>{row.status}</p>
                      <p
                        className={`${PAGE_BALANCE_AMOUNT_CLASS} text-right ${amountToneClass}`}
                      >
                        {row.total}
                      </p>
                      <p
                        className={`${PAGE_BALANCE_AMOUNT_CLASS} text-right ${amountToneClass}`}
                      >
                        {row.applied}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2 flex items-center justify-end gap-6 border-t border-[var(--glass-border)] pt-3">
                <span className={LABEL_CLASS}>Kalan</span>
                <span className={`${PAGE_BALANCE_AMOUNT_CLASS} ${remainingToneClass}`}>
                  {remainingBalance}
                </span>
              </div>
            </div>
          </div>
        )}
      </AppPagePanel>

      <DeleteConfirmOverlay
        open={pendingDelete}
        title="Hareket silinsin mi?"
        description="Bu işlem geri alınamaz."
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgeç"
        onCancel={() => setPendingDelete(false)}
        onConfirm={handleDelete}
      />
    </AppPageShell>
  )
}
