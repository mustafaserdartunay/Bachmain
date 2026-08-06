import { ArrowDownToLine, ArrowUpFromLine, Banknote, Landmark, WalletCards } from 'lucide-react'
import EditableDropdownPill from './EditableDropdownPill'
import { HEADER_ACTION_CTA_CLASS, HEADER_ACTION_GRADIENTS } from './Layout/HeaderCashActionsPanel'
import {
  PAGE_FILTER_MENU_CLASS,
  PAGE_FILTER_PILL_CLASS,
  YF_TEXT_CLASS,
  YF_TEXT_ON_COLOR_CLASS,
} from '../utils/dashboardDesign'

const LABEL_CLASS = `${YF_TEXT_CLASS} uppercase`
const FIELD_ROW_CLASS = 'grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-2'
const INPUT_CLASS = 'form-input !h-8 !min-h-8 !w-full !py-1 !text-[13px]'

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
  const HeaderIcon = isPayment ? ArrowUpFromLine : ArrowDownToLine
  const resolvedTitle =
    title || (isPayment ? 'Ödeme Ekle' : 'Tahsilat Ekle')
  const resolvedSubmitLabel = submitLabel || (isPayment ? 'Ödeme Ekle' : 'Tahsilat Ekle')
  const submitGradient = isPayment
    ? HEADER_ACTION_GRADIENTS.expense
    : HEADER_ACTION_GRADIENTS.success
  const methodSuffix = isPayment ? 'Ödeme' : 'Tahsilat'
  const isCashMethod = form.method === 'Nakit'
  const isChequeMethod = form.method === 'Çek'
  const activeAccountOptions = isCashMethod
    ? cashAccountOptions
    : isChequeMethod
      ? chequeAccountOptions
      : bankAccountOptions
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
      className="overflow-hidden rounded-[16px] border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.48)]"
    >
      <div className="flex items-center gap-2 border-b border-[var(--glass-border)] px-3 py-2.5">
        <HeaderIcon className="h-4 w-4 shrink-0 text-[var(--muted)]" strokeWidth={2.25} />
        <p className={`${YF_TEXT_CLASS} min-w-0 flex-1 truncate !font-bold !text-[var(--ink)]`}>
          {resolvedTitle}
        </p>
      </div>

      <div className="space-y-3 px-3 py-3">
        {subtitle ? <p className={YF_TEXT_CLASS}>{subtitle}</p> : null}

        <div className="space-y-2">
          {methodTiles.map(({ method, icon: Icon }) => {
            const active = form.method === method
            const label = `${method} ${methodSuffix}`.toLocaleUpperCase('tr-TR')
            return (
              <button
                key={method}
                type="button"
                onClick={() => onUpdate('method', method)}
                className="flex w-full items-center gap-2 text-left"
              >
                <span
                  className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    active
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-[var(--muted)] bg-transparent'
                  }`}
                  aria-hidden
                >
                  {active ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                </span>
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-blue-600' : 'text-[var(--muted)]'}`}
                  strokeWidth={2.25}
                />
                <span className={`${LABEL_CLASS} ${active ? '!font-bold !text-[var(--ink)]' : ''}`}>
                  {label}
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
                className={INPUT_CLASS}
              />
              <input
                value={form.chequeOwner}
                onChange={(event) => onUpdate('chequeOwner', event.target.value)}
                placeholder="Çek sahibi"
                className={INPUT_CLASS}
              />
              <input
                value={form.chequeBank}
                onChange={(event) => onUpdate('chequeBank', event.target.value)}
                placeholder="Banka"
                className={INPUT_CLASS}
              />
              <input
                value={form.chequeBranch}
                onChange={(event) => onUpdate('chequeBranch', event.target.value)}
                placeholder="Şube"
                className={INPUT_CLASS}
              />
              <div className={FIELD_ROW_CLASS}>
                <span className={LABEL_CLASS}>Vade</span>
                <input
                  value={form.chequeDueDate}
                  onChange={(event) => onUpdate('chequeDueDate', event.target.value)}
                  type="date"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className={FIELD_ROW_CLASS}>
          <label className={LABEL_CLASS} htmlFor={`${variant}-date`}>
            Tarih <span className="text-rose-500">*</span>
          </label>
          <input
            id={`${variant}-date`}
            value={form.transactionDate}
            onChange={(event) => onUpdate('transactionDate', event.target.value)}
            type="date"
            required
            className={INPUT_CLASS}
          />
        </div>

        <div className={FIELD_ROW_CLASS}>
          <span className={LABEL_CLASS}>
            Hesap <span className="text-rose-500">*</span>
          </span>
          <EditableDropdownPill
            value={form.accountName}
            options={activeAccountOptions}
            onOptionsChange={onAccountOptionsChange}
            openKey={accountOpenKey}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            onChange={(value) => onUpdate('accountName', value)}
            buttonClassName={`${PAGE_FILTER_PILL_CLASS} !h-8 !min-h-8 w-full`}
            menuClassName={PAGE_FILTER_MENU_CLASS}
          />
        </div>

        <div className={FIELD_ROW_CLASS}>
          <label className={LABEL_CLASS} htmlFor={`${variant}-amount`}>
            Meblağ <span className="text-rose-500">*</span>
          </label>
          <div className="relative min-w-0">
            <input
              id={`${variant}-amount`}
              value={form.amount}
              onChange={(event) => onUpdate('amount', event.target.value)}
              type="number"
              required
              className={`${INPUT_CLASS} !pr-7`}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[13px] font-normal text-[var(--muted)]">
              ₺
            </span>
          </div>
        </div>

        <div className={FIELD_ROW_CLASS}>
          <label className={LABEL_CLASS} htmlFor={`${variant}-desc`}>
            Açıklama
          </label>
          <input
            id={`${variant}-desc`}
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
            className={`${HEADER_ACTION_CTA_CLASS} !h-9 w-full justify-center ${submitGradient}`}
          >
            <span className={`${YF_TEXT_ON_COLOR_CLASS} uppercase`}>{resolvedSubmitLabel}</span>
          </button>
        </div>
      </div>
    </form>
  )
}
