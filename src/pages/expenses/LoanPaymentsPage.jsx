import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, CalendarDays, Landmark, ListOrdered, Save, WalletCards } from 'lucide-react'
import SearchInput from '../../components/Common/SearchInput'
import SplitCreateButton from '../../components/Common/SplitCreateButton'
import { AppPageHeader, AppPagePanel, AppPageShell, AppPanelDot } from '../../components/Layout/AppPageLayout'
import { FormFieldCompact, FORM_SECTION_PANEL_CLASS } from '../../components/Common/FormSectionPanel'
import ListHeaderRow from '../../components/Common/ListHeaderRow'
import { DeleteTrashButton } from '../../components/Common/ListDeleteConfirmPanel'
import NumericInput from '../../components/Products/NumericInput'
import { formatTL } from '../../utils/productPricing'
import { BTN_SUCCESS } from '../../utils/buttonStyles'
import {
  APP_ICON_SM_CLASS,
  APP_ICON_WRAP_CLASS,
  APP_METRIC_ROW_CLASS,
  APP_PANEL_TITLE_CLASS,
  APP_SUBLABEL_CLASS,
} from '../../utils/dashboardDesign'
import {
  buildInstallments,
  createEmptyLoan,
  loadLoanPayments,
  LOAN_PAYMENTS_EVENT,
  LOAN_TYPE_OPTIONS,
  saveLoanPayments,
  summarizeLoan,
} from '../../utils/loanPaymentsStore'

const LOAN_GRID = 'minmax(130px,1fr) minmax(150px,1.2fr) 120px 100px 140px'
const INSTALLMENT_GRID = '56px minmax(120px,1fr) 120px 88px minmax(120px,1fr) 40px'

const LOAN_SUMMARY_GRID = 'minmax(0,1.4fr) 110px 88px 110px 110px 120px 72px 40px'

function LoanCard({ loan, expanded, onToggle, onChange, onDelete }) {
  const [pendingDelete, setPendingDelete] = useState(false)
  const summary = summarizeLoan(loan)
  const installmentTotal = (loan.installments || []).reduce(
    (sum, installment) => sum + (Number(installment.amount) || 0),
    0,
  )
  const title = `${loan.bankName || 'Yeni Kredi'} · ${loan.loanType}`
  const installmentMismatch = Math.abs(installmentTotal - (Number(loan.totalAmount) || 0)) > 0.01

  function patchLoan(patch) {
    const next = { ...loan, ...patch }
    if ('totalAmount' in patch || 'installmentCount' in patch || 'startDate' in patch) {
      next.installments = buildInstallments({
        totalAmount: next.totalAmount,
        installmentCount: next.installmentCount,
        startDate: next.startDate,
        existing: loan.installments,
      })
    }
    onChange(next)
  }

  function patchInstallment(index, patch) {
    const installments = loan.installments.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...patch } : item
    ))
    onChange({ ...loan, installments })
  }

  return (
    <section className={`${FORM_SECTION_PANEL_CLASS} !space-y-0 !p-0 overflow-hidden`}>
      <div
        className={`${APP_METRIC_ROW_CLASS} !min-h-[3.25rem] grid cursor-pointer items-center gap-2 !px-3 !py-2`}
        style={{ gridTemplateColumns: LOAN_SUMMARY_GRID }}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggle()
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-2">
          <AppPanelDot color="orange" />
          <span className={`${APP_ICON_WRAP_CLASS} text-orange-600`}>
            <Landmark className={APP_ICON_SM_CLASS} />
          </span>
          <div className="min-w-0">
            <p className={`${APP_PANEL_TITLE_CLASS} uppercase tracking-wide`}>{title}</p>
            <p className={APP_SUBLABEL_CLASS}>İlk vade: {loan.startDate || '—'}</p>
          </div>
        </div>
        <span className="text-xs font-extrabold tabular-nums text-[var(--ink)]">{formatTL(loan.totalAmount)}</span>
        <span className="text-center text-xs font-bold text-[var(--muted)]">{loan.installmentCount}</span>
        <span className="text-xs font-extrabold tabular-nums text-emerald-600">{formatTL(summary.paidAmount)}</span>
        <span className="text-xs font-extrabold tabular-nums text-rose-600">{formatTL(summary.remainingAmount)}</span>
        <span className={`truncate text-[12px] font-bold ${installmentMismatch ? 'text-amber-600' : 'text-[var(--muted)]'}`}>
          {installmentMismatch ? 'Taksit farkı' : (summary.nextDue?.dueDate || 'Tamamlandı')}
        </span>
        <span className="flex justify-center text-[var(--muted)]">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <div onClick={(event) => event.stopPropagation()}>
          <DeleteTrashButton
            pending={pendingDelete}
            onClick={() => setPendingDelete(true)}
            onConfirm={() => {
              onDelete(loan.id)
              setPendingDelete(false)
            }}
            onCancel={() => setPendingDelete(false)}
            title="Kredi silinsin mi?"
            description="Kredi kaydı ve tüm taksitler kaldırılacak."
            buttonTitle="Kredi kaydını sil"
          />
        </div>
      </div>

      {expanded ? (
        <div
          className="space-y-4 border-t border-white/40 p-4"
          onClick={(event) => event.stopPropagation()}
        >
      <div className="grid w-full gap-2" style={{ gridTemplateColumns: LOAN_GRID }}>
        <FormFieldCompact icon={ListOrdered} label="Kredi Türü" as="label">
          <select
            value={loan.loanType}
            onChange={(e) => patchLoan({ loanType: e.target.value })}
            className="form-input !h-8 !min-h-8 text-xs"
          >
            {LOAN_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </FormFieldCompact>
        <FormFieldCompact icon={Landmark} label="Banka Adı" as="label">
          <input
            value={loan.bankName}
            onChange={(e) => patchLoan({ bankName: e.target.value })}
            placeholder="Banka adı"
            className="form-input !h-8 !min-h-8 text-xs"
          />
        </FormFieldCompact>
        <FormFieldCompact icon={WalletCards} label="Tutar" as="label">
          <NumericInput
            value={loan.totalAmount}
            onChange={(value) => patchLoan({ totalAmount: value })}
            suffix="₺"
            formatMode="price"
            className="text-xs"
          />
        </FormFieldCompact>
        <FormFieldCompact icon={ListOrdered} label="Taksit" as="label">
          <input
            type="number"
            min={1}
            max={360}
            value={loan.installmentCount}
            onChange={(e) => patchLoan({ installmentCount: Number(e.target.value) || 1 })}
            className="form-input !h-8 !min-h-8 text-xs"
          />
        </FormFieldCompact>
        <FormFieldCompact icon={CalendarDays} label="İlk Vade" as="label">
          <input
            type="date"
            value={loan.startDate}
            onChange={(e) => patchLoan({ startDate: e.target.value })}
            className="form-input !h-8 !min-h-8 text-xs"
          />
        </FormFieldCompact>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="glass-pill !h-8 !px-3 !text-[12px] !font-bold text-[var(--ink)]">
          Ödenen: {formatTL(summary.paidAmount)}
        </span>
        <span className="glass-pill !h-8 !px-3 !text-[12px] !font-bold text-rose-600">
          Kalan: {formatTL(summary.remainingAmount)}
        </span>
        <span className="glass-pill !h-8 !px-3 !text-[12px] !font-bold text-[var(--muted)]">
          {summary.paidCount}/{summary.totalCount} taksit ödendi
        </span>
        {summary.nextDue ? (
          <span className="glass-pill !h-8 !px-3 !text-[12px] !font-bold text-amber-700">
            Sıradaki: {summary.nextDue.dueDate}
          </span>
        ) : null}
      </div>

      <ListHeaderRow
        gridTemplate={INSTALLMENT_GRID}
        columns={['#', 'Vade Tarihi', 'Tutar', 'Ödendi', 'Ödeme Tarihi / Not', '']}
      />

      <div className="mt-1 space-y-1">
        {loan.installments.map((installment, index) => (
          <div
            key={installment.id}
            className={`${APP_METRIC_ROW_CLASS} !min-h-[2.75rem] grid items-center gap-2`}
            style={{ gridTemplateColumns: INSTALLMENT_GRID }}
          >
            <span className="text-center text-xs font-extrabold text-[var(--ink)]">{installment.number}</span>
            <input
              type="date"
              value={installment.dueDate}
              onChange={(e) => patchInstallment(index, { dueDate: e.target.value })}
              className="form-input text-xs"
            />
            <NumericInput
              value={installment.amount}
              onChange={(value) => patchInstallment(index, { amount: value })}
              suffix="₺"
              formatMode="price"
              className="text-xs"
            />
            <label className="flex items-center justify-center gap-1 text-xs font-semibold text-[var(--ink)]">
              <input
                type="checkbox"
                checked={Boolean(installment.isPaid)}
                onChange={(e) => patchInstallment(index, {
                  isPaid: e.target.checked,
                  paidDate: e.target.checked ? (installment.paidDate || new Date().toISOString().slice(0, 10)) : '',
                })}
              />
              Evet
            </label>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              <input
                type="date"
                value={installment.paidDate || ''}
                disabled={!installment.isPaid}
                onChange={(e) => patchInstallment(index, { paidDate: e.target.value })}
                className="form-input text-xs disabled:opacity-50"
              />
              <input
                value={installment.note || ''}
                onChange={(e) => patchInstallment(index, { note: e.target.value })}
                placeholder="Not"
                className="form-input text-xs"
              />
            </div>
            <span />
          </div>
        ))}
        </div>
        </div>
      ) : null}
    </section>
  )
}

export default function LoanPaymentsPage() {
  const [loans, setLoans] = useState(() => loadLoanPayments())
  const [search, setSearch] = useState('')
  const [saveNotice, setSaveNotice] = useState(false)
  const [expandedLoanIds, setExpandedLoanIds] = useState(() => new Set())

  const refresh = useCallback(() => setLoans(loadLoanPayments()), [])

  useEffect(() => {
    window.addEventListener(LOAN_PAYMENTS_EVENT, refresh)
    return () => window.removeEventListener(LOAN_PAYMENTS_EVENT, refresh)
  }, [refresh])

  const filteredLoans = useMemo(() => {
    const query = search.trim().toLowerCase()
    return loans.filter((loan) => {
      if (!query) return true
      return [loan.loanType, loan.bankName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [loans, search])

  const totals = useMemo(() => {
    return filteredLoans.reduce((acc, loan) => {
      const summary = summarizeLoan(loan)
      acc.total += Number(loan.totalAmount) || 0
      acc.paid += summary.paidAmount
      acc.remaining += summary.remainingAmount
      acc.installmentTotal += (loan.installments || []).reduce(
        (sum, installment) => sum + (Number(installment.amount) || 0),
        0,
      )
      return acc
    }, { total: 0, paid: 0, remaining: 0, installmentTotal: 0 })
  }, [filteredLoans])

  const installmentTotalMismatch = Math.abs(totals.installmentTotal - totals.total) > 0.01

  function handleSave() {
    saveLoanPayments(loans)
    setExpandedLoanIds(new Set())
    setSaveNotice(true)
    window.setTimeout(() => setSaveNotice(false), 2000)
  }

  function toggleLoanExpanded(id) {
    setExpandedLoanIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleLoanChange(nextLoan) {
    setLoans((current) => current.map((item) => (item.id === nextLoan.id ? nextLoan : item)))
  }

  function handleAddLoan(loanType) {
    const newLoan = createEmptyLoan(loanType)
    setLoans((current) => [newLoan, ...current])
    setExpandedLoanIds((current) => new Set([...current, newLoan.id]))
  }

  function handleDeleteLoan(id) {
    setLoans((current) => current.filter((item) => item.id !== id))
    setExpandedLoanIds((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Kredi Ödemeleri"
        actions={(
          <SplitCreateButton
            label="Yeni Kredi / Borç Oluştur"
            onPrimaryClick={() => handleAddLoan()}
            menuAriaLabel="Kredi / borç seçenekleri"
            menuItems={[
              {
                id: 'create',
                label: 'Yeni Kredi / Borç Oluştur',
                icon: WalletCards,
                iconClassName: 'text-orange-300',
                onClick: () => handleAddLoan(),
              },
              ...LOAN_TYPE_OPTIONS.map((type) => ({
                id: type,
                label: type,
                icon: Landmark,
                iconClassName: 'text-blue-300',
                onClick: () => handleAddLoan(type),
              })),
            ]}
          />
        )}
      />

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Toplam Kredi', value: formatTL(totals.total), tone: 'text-[var(--ink)]' },
          {
            label: 'Taksit Toplamı',
            value: formatTL(totals.installmentTotal),
            tone: installmentTotalMismatch ? 'text-amber-600' : 'text-emerald-600',
            hint: installmentTotalMismatch ? 'Toplam kredi ile eşleşmiyor' : 'Toplam kredi ile uyumlu',
          },
          { label: 'Ödenen', value: formatTL(totals.paid), tone: 'text-emerald-600' },
          { label: 'Kalan Borç', value: formatTL(totals.remaining), tone: 'text-rose-600' },
        ].map((item) => (
          <div key={item.label} className={`${APP_METRIC_ROW_CLASS} flex-col !items-start !gap-0.5 !py-2.5`}>
            <span className={APP_SUBLABEL_CLASS}>{item.label}</span>
            <span className={`text-sm font-extrabold tabular-nums ${item.tone}`}>{item.value}</span>
            {item.hint ? (
              <span className={`text-[11px] font-bold ${installmentTotalMismatch ? 'text-amber-600' : 'text-emerald-600'}`}>
                {item.hint}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <AppPagePanel
        title="Kredi Kayıtları"
        dotColor="orange"
        action={(
          <div className="flex items-center gap-2">
            {saveNotice ? (
              <span className="text-[12px] font-bold text-emerald-600">Kaydedildi</span>
            ) : null}
            <button
              type="button"
              onClick={handleSave}
              className={`${BTN_SUCCESS} inline-flex items-center gap-2 px-4 py-2 text-xs`}
            >
              <Save className="h-3.5 w-3.5" /> Kaydet
            </button>
          </div>
        )}
      >
        <SearchInput
          wrapperClassName="mb-4 w-full max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kredi türü veya banka ara..."
        />

        <div className="space-y-2">
          {filteredLoans.length > 0 ? (
            <ListHeaderRow
              gridTemplate={LOAN_SUMMARY_GRID}
              columns={['Kredi', 'Tutar', { label: 'Taksit', align: 'center' }, 'Ödenen', 'Kalan', 'Durum', '', '']}
              className="!mb-0"
            />
          ) : null}
          {filteredLoans.length === 0 ? (
            <p className="py-10 text-center text-sm font-semibold text-[var(--muted)]">
              Henüz kredi kaydı yok. Yeni Kredi / Borç Oluştur ile ekleyin.
            </p>
          ) : filteredLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              expanded={expandedLoanIds.has(loan.id)}
              onToggle={() => toggleLoanExpanded(loan.id)}
              onChange={handleLoanChange}
              onDelete={handleDeleteLoan}
            />
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
