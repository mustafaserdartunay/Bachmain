import { ArrowLeftRight } from 'lucide-react'
import EditableDropdownPill from '../EditableDropdownPill'
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
  sidebarDropdownClass,
  sidebarInputClass,
} from './CashSidebarPanelParts'

export default function CashTransferPanel({
  account,
  form,
  onChange,
  onSubmit,
  onCancel,
  transferTargetAccountOptions,
  activeMenu,
  setActiveMenu,
  DateTextPicker,
  CurrencyTextInput,
  parseCurrencyText,
}) {
  const amount = parseCurrencyText(form.amount)
  const canSubmit = Boolean(form.targetAccountName) && amount > 0

  return (
    <form onSubmit={onSubmit} className={CASH_SIDEBAR_FORM_SHELL}>
      <SidebarPanelHeader
        icon={ArrowLeftRight}
        title="Hesaba Transfer"
        subtitle="Hesaplar arası"
        accent="blue"
      />

      <div className={CASH_SIDEBAR_BODY_CLASS}>
        <SidebarInfoNote>
          Bu hesaptan diğer hesaplarınıza para transfer edebilirsiniz.
        </SidebarInfoNote>

        <SidebarFormCard>
          <FormRowStacked label="Diğer Hesap" required className="first:pt-3.5 last:pb-3.5">
            <EditableDropdownPill
              value={form.targetAccountName}
              onChange={(value) => onChange({ ...form, targetAccountName: value || '' })}
              options={transferTargetAccountOptions}
              openKey="cash-transfer-account"
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              placeholder="Hesap seçin"
              includePlaceholderOption={false}
              editable={false}
              buttonClassName={sidebarDropdownClass}
            />
          </FormRowStacked>
          <FormRowStacked label="Tarih" required>
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
          <FormRowStacked label="Açıklama" className="last:pb-3.5">
            <input
              value={form.description}
              onChange={(event) => onChange({ ...form, description: event.target.value })}
              className={sidebarInputClass}
              placeholder="İsteğe bağlı"
            />
          </FormRowStacked>
        </SidebarFormCard>
      </div>

      <SidebarPanelActions
        onCancel={onCancel}
        submitLabel="Transfer Et"
        submitDisabled={!canSubmit}
      />

      <BalanceFooter rawBalance={account.balance} />
    </form>
  )
}
