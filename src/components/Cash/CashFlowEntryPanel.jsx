import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import {
  BalanceFooter,
  CASH_SIDEBAR_BODY_CLASS,
  CASH_SIDEBAR_FORM_SHELL,
  CurrencyField,
  FormRowStacked,
  SidebarFormCard,
  SidebarInfoNote,
  SidebarPanelActions,
  SidebarPanelHeader,
  sidebarInputClass,
} from './CashSidebarPanelParts'

export default function CashFlowEntryPanel({
  direction = 'in',
  account,
  form,
  onChange,
  onSubmit,
  onCancel,
  editingMovementId,
  DateTextPicker,
  CurrencyTextInput,
}) {
  const isIn = direction === 'in'
  const title = isIn ? 'Para Girişi' : 'Para Çıkışı'
  const Icon = isIn ? ArrowDownToLine : ArrowUpFromLine
  const infoText = isIn
    ? (
      <>
        Sadece <span className="font-semibold text-[var(--ink)]">satışlar</span> sayfasında{' '}
        <span className="font-semibold text-[var(--ink)]">kaydedemediğiniz</span> para girişlerini ekleyin. Bu işlem müşteri/tedarikçi bakiyelerini değiştirmez.
      </>
    )
    : (
      <>
        Sadece <span className="font-semibold text-[var(--ink)]">kaydedemediğiniz</span> para çıkışlarını ekleyin. Bu işlem müşteri/tedarikçi bakiyelerini değiştirmez.
      </>
    )

  return (
    <form onSubmit={onSubmit} className={CASH_SIDEBAR_FORM_SHELL}>
      <SidebarPanelHeader
        icon={Icon}
        title={title}
        subtitle={isIn ? 'Kasaya giriş' : 'Kasadan çıkış'}
        accent={isIn ? 'emerald' : 'blue'}
      />

      <div className={CASH_SIDEBAR_BODY_CLASS}>
        <SidebarInfoNote>{infoText}</SidebarInfoNote>

        <SidebarFormCard>
          <FormRowStacked label="Tarih" required className="first:pt-3.5">
            <DateTextPicker
              value={form.date}
              onChange={(value) => onChange({ ...form, date: value })}
            />
          </FormRowStacked>
          <FormRowStacked label="Meblağ" required>
            <CurrencyField
              value={form.amount}
              onChange={(value) => onChange({ ...form, amount: value })}
              CurrencyTextInput={CurrencyTextInput}
            />
          </FormRowStacked>
          <FormRowStacked label="Açıklama">
            <input
              value={form.description}
              onChange={(event) => onChange({ ...form, description: event.target.value })}
              className={sidebarInputClass}
              placeholder="İsteğe bağlı"
            />
          </FormRowStacked>
          {account.type === 'Banka Hesabı' ? (
            <FormRowStacked label="İşlem No" className="last:pb-3.5">
              <input
                value={form.referenceNo}
                onChange={(event) => onChange({ ...form, referenceNo: event.target.value })}
                className={sidebarInputClass}
                placeholder=""
              />
            </FormRowStacked>
          ) : (
            <div className="pb-3.5" />
          )}
        </SidebarFormCard>
      </div>

      <SidebarPanelActions
        onCancel={onCancel}
        submitLabel={editingMovementId ? 'Kaydet' : 'Ekle'}
      />

      <BalanceFooter rawBalance={account.balance} />
    </form>
  )
}
