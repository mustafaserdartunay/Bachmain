import { Scale } from 'lucide-react'
import { FORM_FIELD_SURFACE_CLASS } from '../Common/FormSectionPanel'
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

export default function CashBalanceFixPanel({
  account,
  balance,
  form,
  onChange,
  onSubmit,
  onCancel,
  CurrencyTextInput,
  parseCurrencyText,
}) {
  const targetAmount = parseCurrencyText(form.targetAmount)
  const canSubmit = targetAmount >= 0

  return (
    <form onSubmit={onSubmit} className={CASH_SIDEBAR_FORM_SHELL}>
      <SidebarPanelHeader
        icon={Scale}
        title="Bakiye Sabitle"
        subtitle={account.name}
        accent="purple"
      />

      <div className={CASH_SIDEBAR_BODY_CLASS}>
        <SidebarInfoNote>
          Mevcut bakiye ile hedef bakiye arasındaki fark otomatik düzeltme hareketi olarak kaydedilir.
        </SidebarInfoNote>

        <SidebarFormCard>
          <FormRowStacked label="Mevcut Bakiye" className="first:pt-3.5">
            <div className={`flex h-10 items-center px-3 text-sm font-black text-emerald-600 ${FORM_FIELD_SURFACE_CLASS}`}>
              {balance}
            </div>
          </FormRowStacked>
          <FormRowStacked label="Hedef Bakiye" required>
            <CurrencyField
              value={form.targetAmount}
              onChange={(value) => onChange({ ...form, targetAmount: value })}
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
        submitLabel="Bakiyeyi Sabitle"
        disabled={!canSubmit}
      />
      <BalanceFooter balance={balance} />
    </form>
  )
}
