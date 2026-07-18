import {
  Archive,
  Banknote,
  FileSpreadsheet,
  ImagePlus,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Scale,
  Send,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { MoreMenu } from '@bachmain/ui'
import SearchInput from '../Common/SearchInput'
import { DeleteTrashButton } from '../Common/ListDeleteConfirmPanel'
import { DropdownMenuItem } from '../Common/DropdownMenu'
import EditableDropdownPill from '../EditableDropdownPill'
import CashFlowEntryPanel from './CashFlowEntryPanel'
import CashTransferPanel from './CashTransferPanel'
import CashBalanceFixPanel from './CashBalanceFixPanel'
import {
  CashSidebarActionButton,
  CashSidebarPrimaryButton,
} from './CashAccountDetailLayout'
import { CASH_SIDEBAR_INNER_FORM_CLASS } from './CashSidebarPanelParts'
import {
  BTN_PRIMARY,
  BTN_SUCCESS,
  DUZENLEME_KALEMI_BUTTON_CLASS,
  TEKLIFLER_COP_KUTUSU_BUTTON_CLASS,
} from '../../utils/buttonStyles'
import { formatTreasuryCurrency } from '../../utils/treasuryStore'
import { downloadExcelCsv, sanitizeExportFilename } from '../../utils/spreadsheetExport'
import { isChequeActionAllowed } from '../../utils/chequeLifecycle'

export const MOVEMENT_TABLE_GRID = 'grid-cols-[1.1fr_0.95fr_1fr_1.35fr_0.85fr_0.85fr]'
const MOVEMENT_PAGE_SIZE = 10

function TablePagerExportFooter({
  page,
  totalPages,
  onPageChange,
  onExport,
  showPager,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] bg-white/80 px-4 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {showPager ? Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2.5 text-xs font-black transition-colors ${
              pageNumber === page
                ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]'
                : 'border-[rgba(140,145,165,0.22)] bg-white text-[var(--muted)] hover:bg-[rgba(248,250,252,1)] hover:text-[var(--ink)]'
            }`}
          >
            {pageNumber}
          </button>
        )) : (
          <span className="text-[13px] font-semibold text-gray-500">Tüm kayıtlar listeleniyor</span>
        )}
      </div>
      <button
        type="button"
        onClick={onExport}
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[13px] font-black uppercase tracking-wide text-emerald-300 transition-colors hover:border-emerald-500/45 hover:bg-emerald-500/15"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Dışa Aktar
      </button>
    </div>
  )
}

export function CashMovementHistoryTable({
  rows,
  accountName = 'kasa-hesabi',
  onEdit,
  onRemove,
  pendingDeleteId,
  onPendingDelete,
  onCancelDelete,
}) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(rows.length / MOVEMENT_PAGE_SIZE))
  const showPager = rows.length > MOVEMENT_PAGE_SIZE

  useEffect(() => {
    setPage(1)
  }, [rows])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pagedRows = useMemo(
    () => rows.slice((page - 1) * MOVEMENT_PAGE_SIZE, page * MOVEMENT_PAGE_SIZE),
    [rows, page],
  )

  function handleExport() {
    downloadExcelCsv(
      `${sanitizeExportFilename(accountName)}-hareketler.csv`,
      ['İşlem Türü', 'İşlem Tarihi', 'İlgili Hesap', 'Açıklama', 'Meblağ', 'Bakiye'],
      rows.map((movement) => [
        movement.type || '',
        movement.displayDate || movement.date || '',
        movement.relatedAccount || '',
        movement.description || '',
        `${movement.direction === 'out' ? '-' : ''}${formatTreasuryCurrency(movement.amount)}`,
        formatTreasuryCurrency(movement.runningBalance),
      ]),
    )
  }

  return (
    <div className="flex min-h-[32rem] flex-col overflow-visible rounded-xl border border-[var(--border)]">
      <div className={`grid shrink-0 ${MOVEMENT_TABLE_GRID} gap-3 border-b border-[var(--border)] bg-white/80 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-[var(--muted)]`}>
        <span>İşlem Türü</span>
        <span>İşlem Tarihi</span>
        <span>İlgili Hesap</span>
        <span>Açıklama</span>
        <span className="text-right">Meblağ</span>
        <span className="text-right">Bakiye</span>
      </div>
      <div className="min-h-[24rem] flex-1 divide-y divide-[var(--border)]">
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">Hareket bilgisi bulunamadı.</p>
        ) : (
          pagedRows.map((movement) => {
            const isOut = movement.direction === 'out'
            return (
              <div key={movement.id} className={`grid ${MOVEMENT_TABLE_GRID} items-center gap-3 px-4 py-3 text-sm`}>
                <span className="truncate font-semibold text-gray-200">{movement.type || '—'}</span>
                <span className="truncate text-gray-500">{movement.displayDate || movement.date || '—'}</span>
                <span className="truncate text-gray-500">{movement.relatedAccount || '—'}</span>
                <span className="truncate text-gray-500">{movement.description || '—'}</span>
                <span className={`text-right font-black ${isOut ? 'text-red-300' : 'text-emerald-300'}`}>
                  {isOut ? '-' : ''}{formatTreasuryCurrency(movement.amount)}
                </span>
                <span className="flex items-center justify-end gap-1.5">
                  <span className={`font-black ${Number(movement.runningBalance) < 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                    {formatTreasuryCurrency(movement.runningBalance)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEdit(movement)}
                    className={`${DUZENLEME_KALEMI_BUTTON_CLASS} inline-flex h-8 w-8 items-center justify-center rounded-lg p-0`}
                    title="Düzenle"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <DeleteTrashButton
                    pending={pendingDeleteId === `movement-${movement.id}`}
                    onClick={() => onPendingDelete(`movement-${movement.id}`)}
                    onConfirm={() => onRemove(movement.id)}
                    onCancel={onCancelDelete}
                    title="Silinsin mi?"
                    description="Kasa hareketi kaldırılacak."
                    buttonClassName={`${TEKLIFLER_COP_KUTUSU_BUTTON_CLASS} inline-flex h-8 w-8 items-center justify-center rounded-lg p-0`}
                    wrapperClassName="relative inline-flex"
                    popoverClassName="absolute right-10 top-1/2 z-[90] w-72 -translate-y-1/2"
                  />
                </span>
              </div>
            )
          })
        )}
      </div>
      <TablePagerExportFooter
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onExport={handleExport}
        showPager={showPager}
      />
    </div>
  )
}

export function CashChequeHistoryTable({
  rows,
  gridClass,
  onPhotoPreview,
  onSettlement,
  onSend,
  onReturn,
  onRestore,
  onEdit,
  onRemove,
  pendingDeleteId,
  onPendingDelete,
  onCancelDelete,
  formatTransactionDate,
  formatTransactionTime,
  formatDateTr,
}) {
  return (
    <div className="overflow-visible rounded-xl border border-[var(--border)]">
      <div className={`grid ${gridClass} gap-3 border-b border-[var(--border)] bg-white/80 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-[var(--muted)]`}>
        <span>Banka</span>
        <span>Şube</span>
        <span>Çek No</span>
        <span>Vade</span>
        <span>İşlem Tarihi</span>
        <span>İşlem Saati</span>
        <span>Cari</span>
        <span>Durum</span>
        <span className="text-right">Tutar</span>
        <span className="text-right">İşlem</span>
      </div>
      <div className="divide-y divide-dark-500/30">
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">Bu sekmede çek kaydı yok.</p>
        ) : (
          rows.map((row) => {
            const transactionAt = row.transactionAt
            if (row.rowType === 'expense') {
              return (
                <div key={row.id} className={`grid ${gridClass} items-center gap-3 bg-orange-500/5 px-4 py-2.5 text-sm`}>
                  <span className="truncate pl-4 text-xs font-semibold text-orange-300">↳ Masraf</span>
                  <span className="truncate text-gray-500">{row.expenseCategory || '-'}</span>
                  <span className="truncate text-gray-500">{row.chequeNo || '-'}</span>
                  <span className="truncate text-gray-500">—</span>
                  <span className="truncate text-xs text-gray-500">{formatTransactionDate(transactionAt)}</span>
                  <span className="truncate text-xs text-gray-500">{formatTransactionTime(transactionAt)}</span>
                  <span className="truncate text-gray-500">{row.expenseDescription || 'Masraf kalemi'}</span>
                  <span className="truncate text-[11px] font-bold text-orange-400">Masraf</span>
                  <span className="text-right text-xs font-black text-orange-300">
                    -{formatTreasuryCurrency(Math.abs(Number(row.amount) || 0))}
                  </span>
                  <span />
                </div>
              )
            }

            const detail = row
            const isChequeOut = detail.direction === 'out' || Number(detail.amount) < 0
            const menuItems = [
              isChequeActionAllowed(detail, 'collection') ? {
                id: 'collection',
                label: 'Tahsilat Yap',
                icon: Banknote,
                onClick: () => onSettlement?.(detail, 'collection'),
              } : null,
              isChequeActionAllowed(detail, 'payment') ? {
                id: 'payment',
                label: 'Ödeme Yap',
                icon: Banknote,
                onClick: () => onSettlement?.(detail, 'payment'),
              } : null,
              isChequeActionAllowed(detail, 'send') ? {
                id: 'send',
                label: 'Gönder',
                icon: Send,
                onClick: () => onSend?.(detail),
              } : null,
              isChequeActionAllowed(detail, 'return') ? {
                id: 'return',
                label: 'İade Et',
                icon: RotateCcw,
                onClick: () => onReturn?.(detail),
              } : null,
              isChequeActionAllowed(detail, 'edit') ? {
                id: 'edit',
                label: 'Düzenle',
                icon: Pencil,
                onClick: () => onEdit?.(detail),
              } : null,
              isChequeActionAllowed(detail, 'restore') ? {
                id: 'restore',
                label: detail.deleted ? 'Geri Al' : 'Portföye Al',
                icon: Undo2,
                onClick: () => onRestore?.(detail),
              } : null,
              isChequeActionAllowed(detail, 'delete') ? {
                id: 'delete',
                label: 'Sil',
                icon: Trash2,
                tone: 'danger',
                onClick: () => onPendingDelete?.(`cheque-${detail.id}`),
              } : null,
            ].filter(Boolean)

            return (
              <div key={detail.id} className={`grid ${gridClass} items-center gap-3 px-4 py-3 text-sm ${detail.deleted ? 'opacity-70' : ''}`}>
                <span className="truncate font-semibold text-gray-200">{detail.chequeBank || '-'}</span>
                <span className="truncate text-gray-500">{detail.chequeBranch || '-'}</span>
                <span className="truncate text-gray-500">{detail.chequeNo || '-'}</span>
                <span className="truncate text-gray-500">{formatDateTr(detail.chequeDueDate)}</span>
                <span className="truncate text-xs text-gray-500">{formatTransactionDate(transactionAt)}</span>
                <span className="truncate text-xs text-gray-500">{formatTransactionTime(transactionAt)}</span>
                <span className="truncate text-gray-500">{detail.partyName || detail.chequeOwner || '-'}</span>
                <span className={`inline-flex w-fit ${detail.statusBadgeClass || 'badge-gray'}`}>
                  {detail.statusLabel || 'Portföy'}
                </span>
                <span className={`text-right font-black ${isChequeOut ? 'text-red-300' : 'text-emerald-300'}`}>
                  {isChequeOut ? '-' : ''}{formatTreasuryCurrency(Math.abs(Number(detail.amount) || 0))}
                </span>
                <span className="flex items-center justify-end gap-1.5">
                  {detail.photo ? (
                    <button
                      type="button"
                      onClick={() => onPhotoPreview(detail.photo)}
                      className="inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-blue-500/25 bg-blue-500/10 transition-colors hover:border-blue-500/40 hover:bg-blue-500/15"
                      title="Çek fotoğrafını büyüt"
                    >
                      <img src={detail.photo} alt="" className="h-full w-full object-cover" />
                    </button>
                  ) : null}
                  {menuItems.length ? <MoreMenu items={menuItems} /> : null}
                  {pendingDeleteId === `cheque-${detail.id}` ? (
                    <DeleteTrashButton
                      pending
                      onClick={() => onPendingDelete(`cheque-${detail.id}`)}
                      onConfirm={() => onRemove(detail)}
                      onCancel={onCancelDelete}
                      title="Silinsin mi?"
                      description="Çek silinenler listesine taşınacak."
                      buttonClassName={`${TEKLIFLER_COP_KUTUSU_BUTTON_CLASS} inline-flex h-8 w-8 items-center justify-center rounded-lg p-0`}
                      wrapperClassName="relative inline-flex"
                      popoverClassName="absolute right-10 top-1/2 z-[90] w-72 -translate-y-1/2"
                    />
                  ) : null}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function CashAccountOpsConfirm({ type, accountName, onConfirm, onCancel }) {
  const isArchive = type === 'archive'
  return (
    <div className={`glass-inset rounded-2xl p-3 shadow-card ${isArchive ? 'ring-1 ring-amber-500/20' : 'ring-1 ring-red-500/20'}`}>
      <p className="text-xs font-black text-white">{isArchive ? 'Arşivlensin mi?' : 'Silinsin mi?'}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
        <span className="font-semibold text-gray-300">{accountName}</span>
        {isArchive ? ' arşive taşınacak. Hareketler korunur.' : ' kalıcı olarak kaldırılacak.'}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className={`flex-1 rounded-xl px-3 py-2 text-[13px] font-black ${isArchive ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30' : 'bg-red-500 text-white hover:bg-red-400'}`}
        >
          Evet
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-cancel flex-1 px-3 text-[13px] font-bold"
        >
          Vazgeç
        </button>
      </div>
    </div>
  )
}

export function CashDetailSidebar({
  account,
  isChequeAccount,
  transferPanelOpen,
  onOpenTransfer,
  cashFlowMenuOpen,
  onToggleCashFlow,
  onCloseCashFlow,
  otherOpsMenuOpen,
  onToggleOtherOps,
  onCloseOtherOps,
  onOpenMovement,
  onOpenBalanceFix,
  onRequestArchive,
  onRequestDelete,
  accountOpsConfirm,
  onConfirmAccountOps,
  onCancelAccountOps,
  balanceFixPanelOpen,
  balanceFixForm,
  onBalanceFixFormChange,
  onSubmitBalanceFix,
  onCloseBalanceFix,
  onOpenChequeEntry,
  transferForm,
  onTransferFormChange,
  onSubmitTransfer,
  onCloseTransfer,
  parseCurrencyText,
  transferTargetAccountOptions,
  activeMenu,
  setActiveMenu,
  editAccountPanelOpen,
  editAccountForm,
  onEditAccountFormChange,
  onSaveAccountEdit,
  onCloseEditAccount,
  accountMovementPanelOpen,
  accountMovementForm,
  onAccountMovementFormChange,
  onSubmitAccountMovement,
  onCloseAccountMovement,
  editingMovementId,
  DateTextPicker,
  CurrencyTextInput,
  chequePanelOpen,
  chequeSettlementDetailId,
  activeChequeSettlementDetail,
  chequeSettlementMode,
  chequeSettlementForm,
  onChequeSettlementFormChange,
  onSubmitChequeSettlement,
  onCloseChequePanel,
  onEditChequeDetail,
  settlementPartyMenuOpen,
  onToggleSettlementPartyMenu,
  chequePartySearch,
  onChequePartySearchChange,
  chequePartyOptions,
  onSelectSettlementParty,
  collectionTargetAccountOptions,
  EXPENSE_CATEGORY_OPTIONS,
  chequeForm,
  onChequeFormChange,
  onChequePhotoChange,
  onSaveChequeDetail,
  editingChequeId,
  chequePartyMenuOpen,
  onToggleChequePartyMenu,
  onSelectChequeParty,
  onPhotoPreview,
  bankOptions,
  onBankOptionsChange,
  balance,
}) {
  const showActionButtons = !accountMovementPanelOpen
    && !transferPanelOpen
    && !balanceFixPanelOpen
    && !editAccountPanelOpen
    && !chequePanelOpen
    && !accountOpsConfirm

  const accountOpsMenuItems = (
    <>
      <DropdownMenuItem label="Bakiye Sabitle" icon={Scale} iconTone="text-purple-300" onClick={onOpenBalanceFix} />
      <DropdownMenuItem label="Hesabı Arşivle" icon={Archive} iconTone="text-amber-300" onClick={onRequestArchive} />
      <DropdownMenuItem label="Hesabı Sil" icon={Trash2} iconTone="text-red-300" onClick={onRequestDelete} />
    </>
  )

  return (
    <>
      {accountOpsConfirm ? (
        <CashAccountOpsConfirm
          type={accountOpsConfirm}
          accountName={account.name}
          onConfirm={onConfirmAccountOps}
          onCancel={onCancelAccountOps}
        />
      ) : null}
      {showActionButtons ? (
      <div className="space-y-2">
        {!isChequeAccount ? (
          <>
            <CashSidebarPrimaryButton label="Diğer Hesaba Transfer Yap" onClick={onOpenTransfer} />
            <CashSidebarActionButton
              label="Para Giriş Çıkışı Ekle"
              open={cashFlowMenuOpen}
              onClick={onToggleCashFlow}
              onClose={onCloseCashFlow}
            >
              <DropdownMenuItem label="Para Girişi" icon={Plus} iconTone="text-emerald-300" onClick={() => onOpenMovement('in')} />
              <DropdownMenuItem label="Para Çıkışı" icon={Minus} iconTone="text-red-300" onClick={() => onOpenMovement('out')} />
            </CashSidebarActionButton>
            <CashSidebarActionButton
              label="Diğer Hesap İşlemleri"
              open={otherOpsMenuOpen}
              onClick={onToggleOtherOps}
              onClose={onCloseOtherOps}
            >
              {accountOpsMenuItems}
            </CashSidebarActionButton>
          </>
        ) : (
          <>
            <CashSidebarPrimaryButton label="Çek Bilgisi Ekle" onClick={onOpenChequeEntry} />
            <CashSidebarActionButton
              label="Diğer Hesap İşlemleri"
              open={otherOpsMenuOpen}
              onClick={onToggleOtherOps}
              onClose={onCloseOtherOps}
            >
              {accountOpsMenuItems}
            </CashSidebarActionButton>
          </>
        )}
      </div>
      ) : null}

      <div className={`${((accountMovementPanelOpen || transferPanelOpen) && !isChequeAccount) || balanceFixPanelOpen ? 'flex min-h-0 flex-1 flex-col' : 'mt-3 flex-1 space-y-3 overflow-y-auto pr-1'}`}>
        {transferPanelOpen && !isChequeAccount ? (
          <CashTransferPanel
            account={account}
            form={transferForm}
            onChange={onTransferFormChange}
            onSubmit={onSubmitTransfer}
            onCancel={onCloseTransfer}
            transferTargetAccountOptions={transferTargetAccountOptions}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            DateTextPicker={DateTextPicker}
            CurrencyTextInput={CurrencyTextInput}
            parseCurrencyText={parseCurrencyText}
          />
        ) : null}

        {balanceFixPanelOpen ? (
          <CashBalanceFixPanel
            account={account}
            balance={balance}
            form={balanceFixForm}
            onChange={onBalanceFixFormChange}
            onSubmit={onSubmitBalanceFix}
            onCancel={onCloseBalanceFix}
            CurrencyTextInput={CurrencyTextInput}
            parseCurrencyText={parseCurrencyText}
          />
        ) : null}

        {accountMovementPanelOpen && !isChequeAccount ? (
          <CashFlowEntryPanel
            direction={accountMovementForm.direction || 'in'}
            account={account}
            balance={balance}
            form={accountMovementForm}
            onChange={onAccountMovementFormChange}
            onSubmit={onSubmitAccountMovement}
            onCancel={onCloseAccountMovement}
            editingMovementId={editingMovementId}
            DateTextPicker={DateTextPicker}
            CurrencyTextInput={CurrencyTextInput}
          />
        ) : null}

        {!accountMovementPanelOpen && !transferPanelOpen && editAccountPanelOpen ? (
          <form onSubmit={onSaveAccountEdit} className={CASH_SIDEBAR_INNER_FORM_CLASS}>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xs font-black uppercase tracking-wide text-blue-600">Hesap Düzenle</h2>
              <button type="button" onClick={onCloseEditAccount} className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[rgba(248,250,252,1)] hover:text-[var(--ink)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input value={editAccountForm.name} onChange={(event) => onEditAccountFormChange({ ...editAccountForm, name: event.target.value })} className="form-input h-9 text-xs" placeholder="Hesap adı" />
            {account.type === 'Banka Hesabı' ? (
              <input value={editAccountForm.iban} onChange={(event) => onEditAccountFormChange({ ...editAccountForm, iban: event.target.value })} className="form-input h-9 text-xs" placeholder="IBAN" />
            ) : null}
            <button type="submit" className={`${BTN_PRIMARY} w-full justify-center py-2.5 text-xs`}>Kaydet</button>
          </form>
        ) : null}

        {!accountMovementPanelOpen && !transferPanelOpen && isChequeAccount && chequePanelOpen && chequeSettlementDetailId && activeChequeSettlementDetail && chequeSettlementMode ? (
          <form onSubmit={onSubmitChequeSettlement} className={CASH_SIDEBAR_INNER_FORM_CLASS}>
            <div className="flex items-start justify-between gap-2">
              <h2 className={`text-xs font-black uppercase tracking-wide ${chequeSettlementMode === 'collection' ? 'text-emerald-600' : 'text-blue-600'}`}>
                {chequeSettlementMode === 'collection' ? 'Tahsilat Ekle' : 'Ödeme Ekle'}
              </h2>
              <button type="button" onClick={onCloseChequePanel} className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[rgba(248,250,252,1)] hover:text-[var(--ink)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            {chequeSettlementMode === 'payment' ? (
              <>
                {chequeSettlementForm.partyName ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-[12px] font-black uppercase tracking-wide text-blue-300">Seçili Cari</p>
                      <p className="truncate text-xs font-black text-gray-100">{chequeSettlementForm.partyName}</p>
                    </div>
                    <button type="button" onClick={onToggleSettlementPartyMenu} className="text-[12px] font-black text-blue-300">Değiştir</button>
                  </div>
                ) : (
                  <button type="button" onClick={onToggleSettlementPartyMenu} className="flex h-9 w-full items-center justify-center rounded-xl border border-dashed border-blue-500/30 bg-blue-500/5 text-xs font-black text-blue-300">
                    Müşteri veya tedarikçi seç
                  </button>
                )}
                {settlementPartyMenuOpen ? (
                  <div className="glass-inset rounded-xl p-2">
                    <SearchInput size="sm" value={chequePartySearch} onChange={(event) => onChequePartySearchChange(event.target.value)} placeholder="Ara..." autoFocus />
                    <div className="mt-2 max-h-44 space-y-1 overflow-y-auto">
                      {chequePartyOptions.map((option) => (
                        <button key={option.id} type="button" onClick={() => onSelectSettlementParty(option)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-black text-gray-100 hover:bg-blue-500/10">
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <CurrencyTextInput value={chequeSettlementForm.amount} onChange={(value) => onChequeSettlementFormChange({ ...chequeSettlementForm, amount: value })} />
              </>
            ) : (
              <>
                <EditableDropdownPill
                  value={chequeSettlementForm.targetAccountName}
                  onChange={(value) => onChequeSettlementFormChange({ ...chequeSettlementForm, targetAccountName: value || '' })}
                  options={collectionTargetAccountOptions}
                  openKey="cheque-settlement-account"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  placeholder="Nakit kasa veya banka seçin"
                  includePlaceholderOption={false}
                  editable={false}
                  buttonClassName="flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-[rgba(140,145,165,0.22)] bg-white px-3 text-xs font-semibold text-[var(--ink)] transition-colors hover:bg-[rgba(248,250,252,1)]"
                />
                <CurrencyTextInput value={chequeSettlementForm.amount} onChange={(value) => onChequeSettlementFormChange({ ...chequeSettlementForm, amount: value })} />
                <input value={chequeSettlementForm.expenseDescription} onChange={(event) => onChequeSettlementFormChange({ ...chequeSettlementForm, expenseDescription: event.target.value })} className="form-input h-9 text-xs" placeholder="Masraf açıklaması" />
                <EditableDropdownPill
                  value={chequeSettlementForm.expenseCategory}
                  onChange={(value) => onChequeSettlementFormChange({ ...chequeSettlementForm, expenseCategory: value || 'Genel Gider' })}
                  options={EXPENSE_CATEGORY_OPTIONS}
                  openKey="cheque-settlement-expense-category"
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  placeholder="Gider türü"
                  includePlaceholderOption={false}
                  editable={false}
                  buttonClassName="flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-[rgba(140,145,165,0.22)] bg-white px-3 text-xs font-semibold text-[var(--ink)] transition-colors hover:bg-[rgba(248,250,252,1)]"
                />
                <CurrencyTextInput value={chequeSettlementForm.expenseAmount} onChange={(value) => onChequeSettlementFormChange({ ...chequeSettlementForm, expenseAmount: value })} />
              </>
            )}
            <button type="submit" className={chequeSettlementMode === 'collection' ? `${BTN_SUCCESS} w-full py-2.5 text-xs` : 'w-full rounded-xl border border-blue-500/25 bg-blue-500/10 py-2.5 text-xs font-black text-blue-300'}>
              {chequeSettlementMode === 'collection' ? 'Tahsilat Ekle' : 'Ödeme Ekle'}
            </button>
            <button type="button" onClick={() => onEditChequeDetail(activeChequeSettlementDetail)} className="w-full rounded-xl border border-[rgba(140,145,165,0.22)] bg-white py-2 text-xs font-black text-[var(--ink)] transition-colors hover:bg-[rgba(248,250,252,1)]">
              Çek Bilgisine Dön
            </button>
          </form>
        ) : null}

        {isChequeAccount && chequePanelOpen && !chequeSettlementDetailId ? (
          <form onSubmit={(event) => event.preventDefault()} className={CASH_SIDEBAR_INNER_FORM_CLASS}>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xs font-black uppercase tracking-wide text-blue-600">
                {editingChequeId ? 'Çek Bilgisi Düzenle' : 'Çek Bilgisi Ekle'}
              </h2>
              <button type="button" onClick={onCloseChequePanel} className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[rgba(248,250,252,1)] hover:text-[var(--ink)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <EditableDropdownPill
              value={chequeForm.chequeBank}
              onChange={(value) => onChequeFormChange({ ...chequeForm, chequeBank: value })}
              options={bankOptions}
              onOptionsChange={onBankOptionsChange}
              openKey="cheque-side-bank"
              activeMenu={activeMenu}
              setActiveMenu={setActiveMenu}
              placeholder="Banka seçin"
              buttonClassName="flex h-9 w-full items-center justify-between gap-2 rounded-xl border border-[rgba(140,145,165,0.22)] bg-white px-3 text-xs font-semibold text-[var(--ink)] transition-colors hover:bg-[rgba(248,250,252,1)]"
              searchable
              searchPlaceholder="Banka ara..."
            />
            <input value={chequeForm.chequeBranch} onChange={(event) => onChequeFormChange({ ...chequeForm, chequeBranch: event.target.value })} className="form-input h-9 text-xs" placeholder="Şube" />
            <input value={chequeForm.chequeNo} onChange={(event) => onChequeFormChange({ ...chequeForm, chequeNo: event.target.value })} className="form-input h-9 text-xs" placeholder="Çek No" />
            <DateTextPicker value={chequeForm.chequeDueDate} onChange={(value) => onChequeFormChange({ ...chequeForm, chequeDueDate: value })} />
            <CurrencyTextInput value={chequeForm.amount} onChange={(value) => onChequeFormChange({ ...chequeForm, amount: value })} />
            <input value={chequeForm.chequeOwner} onChange={(event) => onChequeFormChange({ ...chequeForm, chequeOwner: event.target.value })} className="form-input h-9 text-xs" placeholder="Keşideci" />
            {chequeForm.partyName ? (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-black text-gray-100">{chequeForm.partyName}</div>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onSaveChequeDetail('in')} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/15 text-xs font-black text-emerald-200">
                <Plus className="h-3.5 w-3.5" /> Çek Girişi
              </button>
              <button type="button" onClick={() => onSaveChequeDetail('out')} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-500/25 bg-red-500/15 text-xs font-black text-red-200">
                <Minus className="h-3.5 w-3.5" /> Çek Çıkışı
              </button>
            </div>
            {chequePartyMenuOpen ? (
              <div className="glass-inset rounded-xl p-2">
                <SearchInput size="sm" value={chequePartySearch} onChange={(event) => onChequePartySearchChange(event.target.value)} placeholder="Cari ara..." autoFocus />
                <div className="mt-2 max-h-44 space-y-1 overflow-y-auto">
                  {chequePartyOptions.map((option) => (
                    <button key={option.id} type="button" onClick={() => onSelectChequeParty(option)} className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs font-black text-gray-100 hover:bg-blue-500/10">
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button type="button" onClick={onToggleChequePartyMenu} className="w-full rounded-xl border border-dashed border-blue-500/30 py-2 text-xs font-black text-blue-300">
                Cari seç
              </button>
            )}
            {chequeForm.photo ? (
              <button type="button" onClick={() => onPhotoPreview(chequeForm.photo)} className="inline-flex h-10 w-10 overflow-hidden rounded-xl border border-blue-500/25">
                <img src={chequeForm.photo} alt="" className="h-full w-full object-cover" />
              </button>
            ) : (
              <label className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10 text-blue-300">
                <ImagePlus className="h-4 w-4" />
                <input type="file" accept="image/*" onChange={onChequePhotoChange} className="hidden" />
              </label>
            )}
          </form>
        ) : null}
      </div>
    </>
  )
}
