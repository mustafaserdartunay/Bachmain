import { ArrowDownToLine, ArrowUpFromLine, Banknote, Landmark, WalletCards } from 'lucide-react'
import EditableDropdownPill from './EditableDropdownPill'
import {
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_GRADIENTS,
} from './Layout/HeaderCashActionsPanel'
import {
  PAGE_FILTER_MENU_CLASS,
  PAGE_FILTER_PILL_CLASS,
  YF_TEXT_CLASS,
  YF_TEXT_ON_COLOR_CLASS,
} from '../utils/dashboardDesign'

const LABEL_CLASS = `${YF_TEXT_CLASS} uppercase`
const VALUE_INPUT_CLASS =
  'form-input !h-10 !min-h-10 !w-full !rounded-xl !py-2 !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--ink)]'
const FIELD_STACK_CLASS = 'flex min-w-0 flex-col gap-1.5'
const CANCEL_BTN_CLASS =
  'inline-flex h-[52px] shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-white/25 px-4 transition-colors hover:bg-white/45'

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
  /** `page` = hareket detay düzenleme; `aside` = müşteri detay yan panel */
  layout = 'aside',
}) {
  const isPayment = variant === 'odeme'
  const isPage = layout === 'page'
  const HeaderIcon = isPayment ? ArrowUpFromLine : ArrowDownToLine
  const resolvedTitle = title || (isPayment ? 'Ödeme Ekle' : 'Tahsilat Ekle')
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
      className={
        isPage
          ? 'flex w-full flex-col gap-5'
          : 'overflow-hidden rounded-[16px] border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.48)]'
      }
    >
      <div
        className={
          isPage
            ? 'flex items-center gap-3 border-b border-[var(--glass-border)] pb-4'
            : 'flex items-center gap-2 border-b border-[var(--glass-border)] px-3 py-2.5'
        }
      >
        <span
          className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-[var(--glass-border)] bg-white/35 ${
            isPage ? 'h-10 w-10' : 'h-8 w-8'
          } ${isPayment ? 'text-[#ea580c]' : 'text-[#10b981]'}`}
        >
          <HeaderIcon className={isPage ? 'h-5 w-5' : 'h-4 w-4'} strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`min-w-0 truncate text-[14px] font-bold leading-tight tracking-normal text-[var(--ink)] ${
              isPage ? 'sm:text-[16px]' : ''
            }`}
          >
            {resolvedTitle}
          </p>
          {subtitle ? <p className={`${YF_TEXT_CLASS} mt-0.5`}>{subtitle}</p> : null}
        </div>
      </div>

      <div className={isPage ? 'space-y-5' : 'space-y-3 px-3 py-3'}>
        <div>
          <p className={`${LABEL_CLASS} mb-2`}>Ödeme Yöntemi</p>
          <div className="grid grid-cols-3 gap-2">
            {methodTiles.map(({ method, icon: Icon }) => {
              const active = form.method === method
              const label = `${method} ${methodSuffix}`.toLocaleUpperCase('tr-TR')
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => onUpdate('method', method)}
                  aria-pressed={active}
                  className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 transition-[background-color,border-color,color] ${
                    active
                      ? 'border-blue-500/45 bg-blue-500/10 text-blue-700'
                      : 'border-[var(--glass-border)] bg-white/25 text-[var(--muted)] hover:bg-white/40'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                  <span
                    className={`max-w-full truncate text-center text-[11px] font-bold leading-tight tracking-normal sm:text-[12px] ${
                      active ? 'text-blue-700' : 'text-[var(--muted)]'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {form.method === 'Çek' ? (
          <div className="space-y-3 rounded-[16px] border border-[var(--glass-border)] bg-white/30 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.48)]">
            <p className={`${LABEL_CLASS} !font-bold !text-[var(--ink)]`}>Çek Bilgileri</p>
            <div className={`grid gap-3 ${isPage ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
              <div className={FIELD_STACK_CLASS}>
                <label className={LABEL_CLASS} htmlFor={`${variant}-cheque-no`}>
                  Çek No
                </label>
                <input
                  id={`${variant}-cheque-no`}
                  value={form.chequeNo}
                  onChange={(event) => onUpdate('chequeNo', event.target.value)}
                  placeholder="Çek no"
                  className={VALUE_INPUT_CLASS}
                />
              </div>
              <div className={FIELD_STACK_CLASS}>
                <label className={LABEL_CLASS} htmlFor={`${variant}-cheque-owner`}>
                  Çek Sahibi
                </label>
                <input
                  id={`${variant}-cheque-owner`}
                  value={form.chequeOwner}
                  onChange={(event) => onUpdate('chequeOwner', event.target.value)}
                  placeholder="Çek sahibi"
                  className={VALUE_INPUT_CLASS}
                />
              </div>
              <div className={FIELD_STACK_CLASS}>
                <label className={LABEL_CLASS} htmlFor={`${variant}-cheque-bank`}>
                  Banka
                </label>
                <input
                  id={`${variant}-cheque-bank`}
                  value={form.chequeBank}
                  onChange={(event) => onUpdate('chequeBank', event.target.value)}
                  placeholder="Banka"
                  className={VALUE_INPUT_CLASS}
                />
              </div>
              <div className={FIELD_STACK_CLASS}>
                <label className={LABEL_CLASS} htmlFor={`${variant}-cheque-branch`}>
                  Şube
                </label>
                <input
                  id={`${variant}-cheque-branch`}
                  value={form.chequeBranch}
                  onChange={(event) => onUpdate('chequeBranch', event.target.value)}
                  placeholder="Şube"
                  className={VALUE_INPUT_CLASS}
                />
              </div>
              <div className={`${FIELD_STACK_CLASS} ${isPage ? 'sm:col-span-2 sm:max-w-xs' : ''}`}>
                <label className={LABEL_CLASS} htmlFor={`${variant}-cheque-due`}>
                  Vade
                </label>
                <input
                  id={`${variant}-cheque-due`}
                  value={form.chequeDueDate}
                  onChange={(event) => onUpdate('chequeDueDate', event.target.value)}
                  type="date"
                  className={VALUE_INPUT_CLASS}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className={`grid gap-3 ${isPage ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          <div className={FIELD_STACK_CLASS}>
            <label className={LABEL_CLASS} htmlFor={`${variant}-date`}>
              Tarih <span className="text-rose-500">*</span>
            </label>
            <input
              id={`${variant}-date`}
              value={form.transactionDate}
              onChange={(event) => onUpdate('transactionDate', event.target.value)}
              type="date"
              required
              className={VALUE_INPUT_CLASS}
            />
          </div>

          <div className={FIELD_STACK_CLASS}>
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
              buttonClassName={`${PAGE_FILTER_PILL_CLASS} customer-movement-account-pill !h-10 !min-h-10 w-full !justify-between`}
              menuClassName={PAGE_FILTER_MENU_CLASS}
            />
          </div>

          <div className={`${FIELD_STACK_CLASS} ${isPage ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
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
                inputMode="decimal"
                className={`${VALUE_INPUT_CLASS} !pr-8 tabular-nums`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[14px] font-normal leading-tight text-[var(--muted)]">
                ₺
              </span>
            </div>
          </div>
        </div>

        <div className={FIELD_STACK_CLASS}>
          <label className={LABEL_CLASS} htmlFor={`${variant}-desc`}>
            Açıklama
          </label>
          <input
            id={`${variant}-desc`}
            value={form.description}
            onChange={(event) => onUpdate('description', event.target.value)}
            type="text"
            placeholder="Opsiyonel açıklama"
            className={VALUE_INPUT_CLASS}
          />
        </div>

        <div
          className={`flex flex-wrap items-center gap-2 ${
            isPage ? 'justify-end border-t border-[var(--glass-border)] pt-4' : 'grid grid-cols-2 pt-1'
          }`}
        >
          <button type="button" onClick={onCancel} className={`${CANCEL_BTN_CLASS} ${isPage ? 'min-w-[8rem]' : 'w-full'}`}>
            <span className={`${YF_TEXT_CLASS} uppercase`}>Vazgeç</span>
          </button>
          <button
            type="submit"
            className={`${HEADER_ACTION_CTA_CLASS} ${submitGradient} ${isPage ? 'min-w-[10rem] justify-center' : '!h-[52px] w-full justify-center'}`}
          >
            <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
              <HeaderIcon className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} />
            </span>
            <span className={`${YF_TEXT_ON_COLOR_CLASS} uppercase`}>{resolvedSubmitLabel}</span>
          </button>
        </div>
      </div>
    </form>
  )
}
