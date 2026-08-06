import { Banknote, Landmark, WalletCards } from 'lucide-react'
import EditableDropdownPill from './EditableDropdownPill'
import { HEADER_ACTION_CTA_CLASS, HEADER_ACTION_GRADIENTS } from './Layout/HeaderCashActionsPanel'
import {
  PAGE_FILTER_MENU_CLASS,
  PAGE_FILTER_PILL_CLASS,
  YF_TEXT_CLASS,
  YF_TEXT_ON_COLOR_CLASS,
} from '../utils/dashboardDesign'

const FIELD_SHELL_CLASS = 'space-y-1.5'
const LABEL_CLASS = YF_TEXT_CLASS
const HINT_CLASS = YF_TEXT_CLASS
const METHOD_IDLE_CLASS =
  'rounded-xl border border-[var(--glass-border)] bg-white/25 px-2 py-2.5 text-left transition-colors hover:bg-white/40'
const METHOD_ACTIVE_CLASS =
  'rounded-xl border border-[rgba(37,99,235,0.28)] bg-[rgba(37,99,235,0.08)] px-2 py-2.5 text-left'

export default function CustomerMovementForm({
  variant,
  form,
  onUpdate,
  onSubmit,
  onCancel,
  cashAccountOptions,
  bankAccountOptions,
  chequeAccountOptions = [],
  onCashOptionsChange,
  onBankOptionsChange,
  onChequeOptionsChange,
  activeMenu,
  setActiveMenu,
  title,
  subtitle,
  submitLabel,
  preserveTimeHint = false,
}) {
  const isPayment = variant === 'odeme'
  const resolvedTitle = title || (isPayment ? 'Ödeme Menüsü' : 'Tahsilat Menüsü')
  const resolvedSubtitle =
    subtitle ||
    (isPayment
      ? 'İşlem tipini, kasa/banka yerini ve tutarı seçin.'
      : 'Önce işlem tipini, sonra kasa/banka yerini ve tutarı seçin.')
  const amountLabel = isPayment ? 'Ödeme Tutarı' : 'Tahsilat Tutarı'
  const resolvedSubmitLabel = submitLabel || (isPayment ? 'Ödeme Ekle' : 'Tahsilat Ekle')
  const submitGradient = isPayment
    ? HEADER_ACTION_GRADIENTS.expense
    : HEADER_ACTION_GRADIENTS.success
  const isCashMethod = form.method === 'Nakit'
  const isChequeMethod = form.method === 'Çek'
  const activeAccountOptions = isCashMethod
    ? cashAccountOptions
    : isChequeMethod
      ? chequeAccountOptions
      : bankAccountOptions
  const accountLabel = isCashMethod ? 'Kasa Yeri' : isChequeMethod ? 'Çek Kasası' : 'Banka Yeri'
  const accountOpenKey = `${variant}-${isCashMethod ? 'cash' : isChequeMethod ? 'cheque' : 'bank'}-account`
  const onAccountOptionsChange = isCashMethod
    ? onCashOptionsChange
    : isChequeMethod
      ? onChequeOptionsChange
      : onBankOptionsChange

  const methodTiles = [
    { method: 'Nakit', icon: Banknote },
    { method: 'Banka', icon: Landmark },
    { method: 'Çek', icon: WalletCards },
  ]

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-2xl border border-[var(--glass-border)] bg-white/30 p-3"
    >
      <div>
        <p className={`${LABEL_CLASS} !font-bold`}>{resolvedTitle}</p>
        <p className={`mt-1 ${HINT_CLASS}`}>{resolvedSubtitle}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {methodTiles.map(({ method, icon: Icon }) => {
          const active = form.method === method
          return (
            <button
              key={method}
              type="button"
              onClick={() => onUpdate('method', method)}
              className={active ? METHOD_ACTIVE_CLASS : METHOD_IDLE_CLASS}
            >
              <Icon
                className={`mb-1.5 h-4 w-4 ${active ? 'text-blue-600' : 'text-[var(--muted)]'}`}
                strokeWidth={2.25}
              />
              <span className={LABEL_CLASS}>{method}</span>
            </button>
          )
        })}
      </div>

      {form.method === 'Çek' ? (
        <div className="space-y-2 rounded-xl border border-[var(--glass-border)] bg-white/25 p-2.5">
          <p className={`${LABEL_CLASS} !font-bold`}>Çek Bilgileri</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.chequeNo}
              onChange={(event) => onUpdate('chequeNo', event.target.value)}
              placeholder="Çek no"
              className="form-input !h-8 !min-h-8 !py-1"
            />
            <input
              value={form.chequeOwner}
              onChange={(event) => onUpdate('chequeOwner', event.target.value)}
              placeholder="Çek sahibi"
              className="form-input !h-8 !min-h-8 !py-1"
            />
            <input
              value={form.chequeBank}
              onChange={(event) => onUpdate('chequeBank', event.target.value)}
              placeholder="Banka"
              className="form-input !h-8 !min-h-8 !py-1"
            />
            <input
              value={form.chequeBranch}
              onChange={(event) => onUpdate('chequeBranch', event.target.value)}
              placeholder="Şube"
              className="form-input !h-8 !min-h-8 !py-1"
            />
            <label className="col-span-2 flex flex-col gap-1">
              <span className={LABEL_CLASS}>Vade Tarihi</span>
              <input
                value={form.chequeDueDate}
                onChange={(event) => onUpdate('chequeDueDate', event.target.value)}
                type="date"
                className="form-input !h-8 !min-h-8 !py-1"
              />
            </label>
          </div>
        </div>
      ) : null}

      <div className={FIELD_SHELL_CLASS}>
        <label className={LABEL_CLASS}>{accountLabel}</label>
        <EditableDropdownPill
          value={form.accountName}
          options={activeAccountOptions}
          onOptionsChange={onAccountOptionsChange}
          openKey={accountOpenKey}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          onChange={(value) => onUpdate('accountName', value)}
          buttonClassName={PAGE_FILTER_PILL_CLASS}
          menuClassName={PAGE_FILTER_MENU_CLASS}
        />
      </div>

      <div className={FIELD_SHELL_CLASS}>
        <label className={LABEL_CLASS}>{amountLabel}</label>
        <input
          value={form.amount}
          onChange={(event) => onUpdate('amount', event.target.value)}
          type="number"
          className="form-input !h-8 !min-h-8 !py-1"
        />
      </div>

      <div className={FIELD_SHELL_CLASS}>
        <label className={LABEL_CLASS}>İşlem Tarihi</label>
        <input
          value={form.transactionDate}
          onChange={(event) => onUpdate('transactionDate', event.target.value)}
          type="date"
          className="form-input !h-8 !min-h-8 !py-1"
        />
        <p className={HINT_CLASS}>
          {preserveTimeHint ? 'Mevcut saat korunur.' : 'Saat otomatik olarak kaydedilir.'}
        </p>
      </div>

      <div className={FIELD_SHELL_CLASS}>
        <label className={LABEL_CLASS}>Açıklama</label>
        <textarea
          value={form.description}
          onChange={(event) => onUpdate('description', event.target.value)}
          className="form-input min-h-[64px] resize-none !py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          className={`${HEADER_ACTION_CTA_CLASS} w-full justify-center ${HEADER_ACTION_GRADIENTS.danger}`}
        >
          <span className={YF_TEXT_ON_COLOR_CLASS}>Vazgeç</span>
        </button>
        <button
          type="submit"
          className={`${HEADER_ACTION_CTA_CLASS} w-full justify-center ${submitGradient}`}
        >
          <span className={YF_TEXT_ON_COLOR_CLASS}>{resolvedSubmitLabel}</span>
        </button>
      </div>
    </form>
  )
}
