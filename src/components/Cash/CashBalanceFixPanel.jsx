import { Scale } from 'lucide-react'
import {
  BalanceFooter,
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
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-dark-500/35 bg-dark-800/60 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      <SidebarPanelHeader
        icon={Scale}
        title="Bakiye Sabitle"
        subtitle={account.name}
        accent="purple"
      />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <SidebarInfoNote>
          Mevcut bakiye ile hedef bakiye arasındaki fark otomatik düzeltme hareketi olarak kaydedilir.
        </SidebarInfoNote>

        <SidebarFormCard>
          <FormRowStacked label="Mevcut Bakiye" className="first:pt-3.5">
            <div className="flex h-10 items-center rounded-xl border border-dark-500/45 bg-dark-900/70 px-3 text-sm font-black text-emerald-300">
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
