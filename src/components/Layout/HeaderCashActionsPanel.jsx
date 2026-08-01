import { Link } from 'react-router-dom'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Handshake,
  Inbox,
  ReceiptText,
  UserPlus,
  Wallet,
} from 'lucide-react'
import { CASH_BASE_PATH } from '../../data/treasuryMenu'
import { getTreasuryAccounts } from '../../utils/treasuryStore'

function getDefaultCashAccountPath(action) {
  const accounts = getTreasuryAccounts()
  const preferred =
    accounts.find((account) => account.type === 'Nakit Kasa') ||
    accounts.find((account) => account.type === 'Banka Hesabı') ||
    accounts.find((account) => account.type !== 'Çek Kasası') ||
    accounts[0]
  const accountId = preferred?.id || 'cash-main'
  return `${CASH_BASE_PATH}/${accountId}?hareket=${action}`
}

const actions = [
  {
    id: 'income',
    to: () => getDefaultCashAccountPath('gelir'),
    title: 'Gelir Ekle',
    icon: ArrowDownToLine,
    gradient: 'from-[#7cf2c6] via-[#34d399] to-[#10b981]',
  },
  {
    id: 'expense',
    to: () => getDefaultCashAccountPath('gider'),
    title: 'Gider Ekle',
    icon: ArrowUpFromLine,
    gradient: 'from-[#ffb25e] via-[#ff8a65] to-[#ff5e62]',
  },
  {
    id: 'cash',
    to: () => CASH_BASE_PATH,
    title: 'Kasa',
    icon: Wallet,
    gradient: 'from-[#8ad9ff] via-[#60a5fa] to-[#3b82f6]',
  },
  {
    id: 'customer',
    to: () => '/musteriler/yeni',
    title: 'Yeni Müşteri',
    icon: UserPlus,
    gradient: 'from-[#93c5fd] via-[#3b82f6] to-[#2563eb]',
  },
  {
    id: 'supplier',
    to: () => '/musteriler/yeni?kind=supplier',
    title: 'Yeni Tedarikçi',
    icon: Handshake,
    gradient: 'from-[#ffd27f] via-[#f59e0b] to-[#ea580c]',
  },
  {
    id: 'sales-invoice',
    to: () => '/musteriler/faturalar?yeni=1',
    title: 'Yeni Fatura',
    icon: ReceiptText,
    gradient: 'from-[#c7b6ff] via-[#a78bfa] to-[#8b5cf6]',
  },
  {
    id: 'incoming-e-invoices',
    to: () => '/giderler/gelen-e-faturalar',
    title: 'Gelen E-Faturalar',
    icon: Inbox,
    gradient: 'from-[#fda4af] via-[#f43f5e] to-[#e11d48]',
  },
]

function QuickActionCard({ action }) {
  const Icon = action.icon
  return (
    <Link
      to={action.to()}
      title={action.title}
      className={`group flex h-[52px] min-w-[8.5rem] flex-1 items-center gap-2.5 rounded-xl bg-gradient-to-br ${action.gradient} px-3 shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] transition-transform hover:-translate-y-0.5 sm:min-w-0`}
    >
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/22 text-[#ffffff] ring-1 ring-white/25">
        <Icon className="h-4 w-4 text-[#ffffff]" strokeWidth={2.25} />
      </span>
      <span className="truncate text-xs font-extrabold leading-none text-[#ffffff]">
        {action.title}
      </span>
    </Link>
  )
}

export default function HeaderCashActionsPanel() {
  return (
    <section className="app-header-banner flex min-h-[4.75rem] shrink-0 items-center px-4 py-3 sm:px-6">
      <div className="flex w-full gap-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-7 lg:gap-2 lg:overflow-visible">
        {actions.map((action) => (
          <QuickActionCard key={action.id} action={action} />
        ))}
      </div>
    </section>
  )
}
