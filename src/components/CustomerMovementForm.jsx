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
const METHOD_IDLE_CLASS =
  'flex w-full items-center gap-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 text-left transition-[background-color,border-color,color] hover:bg-white/45'
const METHOD_ACTIVE_CLASS =
  'flex w-full items-center gap-2.5 rounded-xl border border-[rgba(37,99,235,0.32)] bg-[rgba(37,99,235,0.12)] px-3 py-2.5 text-left transition-[background-color,border-color,color]'

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
}) {
  const isPayment = variant === 'odeme'
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
      className="space-y-3 rounded-[16px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.48)]"
    >
      {title || subtitle ? (
        <div>
          {title ? <p className={`${LABEL_CLASS} !font-bold`}>{title}</p> : null}
          {subtitle ? <p className={`mt-1 ${LABEL_CLASS}`}>{subtitle}</p> : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {methodTiles.map(({ method, icon: Icon }) => {
          const active = form.method === method
          return (
            <button
              key={method}
              type="button"
              onClick={() => onUpdate('method', method)}
              className={active ? METHOD_ACTIVE_CLASS : METHOD_IDLE_CLASS}
            >
              <span
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  active
                    ? 'bg-[rgba(37,99,235,0.16)] text-blue-600'
                    : 'bg-white/35 text-[var(--muted)]'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <span
                className={`${LABEL_CLASS} ${active ? '!font-bold !text-blue-700' : ''}`}
              >
                {method}
              </span>
            </button>
          )
        })}
      </div>

      {form.method === 'Çek' ? (
        <div className="space-y-2 rounded-xl border border-[var(--glass-border)] bg-white/25 p-2.5">
          <p className={`${LABEL_CLASS} !font-bold`}>Çek Bilgileri</p>
          <div className="grid grid-cols-1 gap-2">
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
            <label className="flex flex-col gap-1">
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
          className="form-input !h-9 !min-h-9 !py-1"
        />
      </div>

      <div className={FIELD_SHELL_CLASS}>
        <label className={LABEL_CLASS}>İşlem Tarihi</label>
        <input
          value={form.transactionDate}
          onChange={(event) => onUpdate('transactionDate', event.target.value)}
          type="date"
          className="form-input !h-9 !min-h-9 !py-1"
        />
      </div>

      <div className={FIELD_SHELL_CLASS}>
        <label className={LABEL_CLASS}>Açıklama</label>
        <textarea
          value={form.description}
          onChange={(event) => onUpdate('description', event.target.value)}
          className="form-input min-h-[72px] resize-none !py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 pt-0.5">
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
