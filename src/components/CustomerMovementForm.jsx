import { Banknote, Landmark, WalletCards } from 'lucide-react'
import EditableDropdownPill from './EditableDropdownPill'

const MOVEMENT_PILL_CLASS =
  'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-dark-500/50 bg-dark-700 px-3 text-xs font-bold transition-colors hover:bg-dark-700/80'

const SUBMIT_BTN =
  'flex w-full items-center justify-center gap-2 rounded-xl border border-dark-500/50 bg-gradient-to-b from-dark-700/95 to-dark-800 px-3 py-2.5 text-sm font-black text-gray-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-dark-400/70 hover:text-white'

export default function CustomerMovementForm({
  variant,
  form,
  onUpdate,
  onSubmit,
  onCancel,
  cashAccountOptions,
  bankAccountOptions,
  onCashOptionsChange,
  onBankOptionsChange,
  activeMenu,
  setActiveMenu,
  title,
  subtitle,
  submitLabel,
  preserveTimeHint = false,
}) {
  const isPayment = variant === 'odeme'
  const accent = isPayment ? 'text-[#5a9ea8]' : 'text-emerald-300/90'
  const borderClass = isPayment ? 'border-teal-800/30' : 'border-emerald-500/20'
  const submitClass = `${SUBMIT_BTN} ${isPayment ? 'hover:border-teal-700/30' : 'hover:border-emerald-500/25'}`
  const resolvedTitle = title || (isPayment ? 'Ödeme Menüsü' : 'Tahsilat Menüsü')
  const resolvedSubtitle = subtitle || (isPayment
    ? 'İşlem tipini, kasa/banka yerini ve tutarı seçin. Tutar cariden ödeme olarak düşülür.'
    : 'Önce işlem tipini, sonra kasa/banka yerini ve tutarı seçin.')
  const amountLabel = isPayment ? 'Ödeme Tutarı' : 'Tahsilat Tutarı'
  const resolvedSubmitLabel = submitLabel || (isPayment ? 'Ödeme Ekle' : 'Tahsilat Ekle')
  const isCashMethod = form.method === 'Nakit'
  const activeAccountOptions = isCashMethod ? cashAccountOptions : bankAccountOptions
  const accountLabel = isCashMethod ? 'Kasa Yeri' : form.method === 'Çek' ? 'Banka Yeri (Çek)' : 'Banka Yeri'
  const accountOpenKey = `${variant}-${isCashMethod ? 'cash' : 'bank'}-account`
  const onAccountOptionsChange = isCashMethod ? onCashOptionsChange : onBankOptionsChange

  const methodTiles = [
    {
      method: 'Nakit',
      icon: Banknote,
      iconClass: 'text-emerald-300',
      idle: 'border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-dark-800/80',
      active: 'border-emerald-400/60 bg-gradient-to-br from-emerald-500/20 to-emerald-950/30 shadow-lg shadow-emerald-950/20',
    },
    {
      method: 'Banka',
      icon: Landmark,
      iconClass: 'text-blue-300',
      idle: 'border-blue-500/25 bg-gradient-to-br from-blue-500/10 to-dark-800/80',
      active: 'border-blue-400/60 bg-gradient-to-br from-blue-500/20 to-blue-950/30 shadow-lg shadow-blue-950/20',
    },
    {
      method: 'Çek',
      icon: WalletCards,
      iconClass: 'text-purple-300',
      idle: 'border-purple-500/25 bg-gradient-to-br from-purple-500/10 to-dark-800/80',
      active: 'border-purple-400/60 bg-gradient-to-br from-purple-500/20 to-purple-950/30 shadow-lg shadow-purple-950/20',
    },
  ]

  return (
    <form onSubmit={onSubmit} className={`space-y-3 rounded-3xl border ${borderClass} bg-gradient-to-br from-dark-700/60 to-dark-800/90 p-4 shadow-inner`}>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${accent}`}>{resolvedTitle}</p>
        <p className="mt-1 text-xs font-semibold text-gray-500">{resolvedSubtitle}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {methodTiles.map(({ method, icon: Icon, iconClass, idle, active }) => (
          <button
            key={method}
            type="button"
            onClick={() => onUpdate('method', method)}
            className={`rounded-xl border-2 p-3 text-left transition-all ${
              form.method === method ? active : `${idle} hover:opacity-95`
            }`}
          >
            <Icon className={`mb-3 h-5 w-5 ${iconClass}`} />
            <span className="text-xs font-black uppercase tracking-wide text-white">{method}</span>
          </button>
        ))}
      </div>

      {form.method === 'Çek' && (
        <div className="rounded-2xl border border-purple-500/25 bg-purple-500/10 p-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-purple-300">Çek Bilgileri</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.chequeNo} onChange={(event) => onUpdate('chequeNo', event.target.value)} placeholder="Çek no" className="form-input" />
            <input value={form.chequeOwner} onChange={(event) => onUpdate('chequeOwner', event.target.value)} placeholder="Çek sahibi" className="form-input" />
            <input value={form.chequeBank} onChange={(event) => onUpdate('chequeBank', event.target.value)} placeholder="Banka" className="form-input" />
            <input value={form.chequeBranch} onChange={(event) => onUpdate('chequeBranch', event.target.value)} placeholder="Şube" className="form-input" />
            <label className="col-span-2 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Vade Tarihi</span>
              <input value={form.chequeDueDate} onChange={(event) => onUpdate('chequeDueDate', event.target.value)} type="date" className="form-input" />
            </label>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-dark-500/45 bg-dark-700/30 p-3">
        <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500">{accountLabel}</label>
        <EditableDropdownPill
          value={form.accountName}
          options={activeAccountOptions}
          onOptionsChange={onAccountOptionsChange}
          openKey={accountOpenKey}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          onChange={(value) => onUpdate('accountName', value)}
          buttonClassName={MOVEMENT_PILL_CLASS}
        />
      </div>

      <div className="rounded-2xl border border-dark-500/45 bg-dark-700/30 p-3">
        <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500">{amountLabel}</label>
        <input value={form.amount} onChange={(event) => onUpdate('amount', event.target.value)} type="number" className="form-input" />
      </div>

      <div className="rounded-2xl border border-dark-500/45 bg-dark-700/30 p-3">
        <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500">İşlem Tarihi</label>
        <input value={form.transactionDate} onChange={(event) => onUpdate('transactionDate', event.target.value)} type="date" className="form-input" />
        <p className="mt-2 text-[10px] font-semibold text-gray-500">
          {preserveTimeHint ? 'Mevcut saat korunur.' : 'Saat otomatik olarak kaydedilir.'}
        </p>
      </div>

      <div className="rounded-2xl border border-dark-500/45 bg-dark-700/30 p-3">
        <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-500">Açıklama</label>
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
          className="flex w-full items-center justify-center rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2.5 text-sm font-black text-gray-300 transition-colors hover:bg-dark-700 hover:text-white"
        >
          Vazgeç
        </button>
        <button type="submit" className={submitClass}>
          {resolvedSubmitLabel}
        </button>
      </div>
    </form>
  )
}
