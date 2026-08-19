import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  Eye,
  Handshake,
  Inbox,
  ReceiptText,
  Rocket,
  UserPlus,
  Wallet,
} from 'lucide-react'
import { CASH_BASE_PATH } from '../../data/treasuryMenu'
import { isStudioFullscreenRoute } from '../../data/webMenu'
import { dispatchStudioCommand } from '../../utils/dropelyaStudio'
import { getTreasuryAccounts } from '../../utils/treasuryStore'
import { YF_TEXT_ON_COLOR_CLASS } from '../../utils/dashboardDesign'

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

/**
 * Renkli header aksiyon gradientleri — hızlı aksiyon şeridi ile form/sayfa CTA'ları
 * aynı tonları paylaşır. Yeni bir renkli buton gerektiğinde buradan seç, elle yazma.
 */
export const HEADER_ACTION_GRADIENTS = {
  /** Kasa — sky → blue */
  cash: 'from-[#8ad9ff] via-[#60a5fa] to-[#3b82f6]',
  /** Gelir Ekle — mint → emerald (kaydet / onayla) */
  success: 'from-[#7cf2c6] via-[#34d399] to-[#10b981]',
  /** Gider Ekle — amber → coral */
  expense: 'from-[#ffb25e] via-[#ff8a65] to-[#ff5e62]',
  /** Yeni Müşteri — blue */
  primary: 'from-[#93c5fd] via-[#3b82f6] to-[#2563eb]',
  /** Yeni Tedarikçi — amber → orange */
  amber: 'from-[#ffd27f] via-[#f59e0b] to-[#ea580c]',
  /** Yeni Fatura — violet */
  violet: 'from-[#c7b6ff] via-[#a78bfa] to-[#8b5cf6]',
  /** Gelen E-Faturalar — rose → red (vazgeç / sil) */
  danger: 'from-[#fda4af] via-[#f43f5e] to-[#e11d48]',
}

export const HEADER_QUICK_ACTIONS = [
  {
    id: 'cash',
    to: () => CASH_BASE_PATH,
    title: 'Kasa',
    icon: Wallet,
    gradient: HEADER_ACTION_GRADIENTS.cash,
  },
  {
    id: 'income',
    to: () => getDefaultCashAccountPath('gelir'),
    title: 'Gelir Ekle',
    icon: ArrowDownToLine,
    gradient: HEADER_ACTION_GRADIENTS.success,
  },
  {
    id: 'expense',
    to: () => getDefaultCashAccountPath('gider'),
    title: 'Gider Ekle',
    icon: ArrowUpFromLine,
    gradient: HEADER_ACTION_GRADIENTS.expense,
  },
  {
    id: 'customer',
    to: () => '/musteriler/yeni',
    title: 'Yeni Müşteri Oluştur',
    icon: UserPlus,
    gradient: HEADER_ACTION_GRADIENTS.primary,
  },
  {
    id: 'supplier',
    to: () => '/musteriler/yeni?kind=supplier',
    title: 'Yeni Tedarikçi',
    icon: Handshake,
    gradient: HEADER_ACTION_GRADIENTS.amber,
  },
  {
    id: 'sales-invoice',
    to: () => '/musteriler/faturalar?yeni=1',
    title: 'Yeni Fatura',
    icon: ReceiptText,
    gradient: HEADER_ACTION_GRADIENTS.violet,
  },
  {
    id: 'incoming-e-invoices',
    to: () => '/giderler/gelen-e-faturalar',
    title: 'Gelen E-Faturalar',
    icon: Inbox,
    gradient: HEADER_ACTION_GRADIENTS.danger,
  },
]

/** Banner + page-header chip shell (52px). Banner adds flex-1; page headers use fixed. */
export const HEADER_QUICK_ACTION_CHIP_CLASS =
  'group flex h-[52px] min-w-[8.5rem] items-center gap-2.5 rounded-xl bg-gradient-to-br px-3 shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] transition-transform hover:-translate-y-0.5'

export const HEADER_QUICK_ACTION_CHIP_ICON_CLASS =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-transparent text-[#ffffff] ring-1 ring-[rgba(255,255,255,0.55)]'

export const HEADER_QUICK_ACTION_CHIP_FIXED_CLASS = `${HEADER_QUICK_ACTION_CHIP_CLASS} w-auto shrink-0`

/**
 * Renkli form/sayfa CTA kabuğu — hızlı aksiyon çipiyle aynı yüzey (52px, gradient,
 * gölge, hover kalkış) ama sabit min genişlik yok. Gradient ayrı verilir.
 * `header-action-cta` kancası gradientin menü içi hover kurallarıyla silinmesini önler.
 */
export const HEADER_ACTION_CTA_SHELL_CLASS =
  'header-action-cta group inline-flex h-[52px] shrink-0 items-center rounded-xl bg-gradient-to-br shadow-[0_8px_20px_-12px_rgba(30,35,60,0.55)] transition-transform hover:-translate-y-0.5'

export const HEADER_ACTION_CTA_CLASS = `${HEADER_ACTION_CTA_SHELL_CLASS} gap-2.5 px-3`

/** CTA içi ikon çerçevesi (ring, dolgu yok) ve beyaz ikon. */
export const HEADER_ACTION_CTA_ICON_WRAP_CLASS = HEADER_QUICK_ACTION_CHIP_ICON_CLASS
export const HEADER_ACTION_CTA_ICON_CLASS = 'h-4 w-4 shrink-0 text-[#ffffff]'

/** Split CTA ortasındaki tam yükseklik beyaz ayraç. */
export const HEADER_ACTION_CTA_DIVIDER_CLASS =
  'w-px shrink-0 self-stretch bg-[rgba(255,255,255,0.55)]'

export function HeaderQuickActionCard({ action, fixed = false, className = '' }) {
  const Icon = action.icon
  return (
    <Link
      to={typeof action.to === 'function' ? action.to() : action.to}
      title={action.title}
      className={`${
        fixed
          ? HEADER_QUICK_ACTION_CHIP_FIXED_CLASS
          : `${HEADER_QUICK_ACTION_CHIP_CLASS} flex-1 sm:min-w-0`
      } ${action.gradient} ${className}`.trim()}
    >
      <span className={HEADER_QUICK_ACTION_CHIP_ICON_CLASS}>
        <Icon className="h-4 w-4 shrink-0 text-[#ffffff]" strokeWidth={2.25} aria-hidden />
      </span>
      <span className={YF_TEXT_ON_COLOR_CLASS}>{action.title}</span>
    </Link>
  )
}

export default function HeaderCashActionsPanel() {
  const { pathname } = useLocation()
  const isStudio = isStudioFullscreenRoute(pathname)
  const [liveUrl, setLiveUrl] = useState('https://dropelya.com')
  const [userName, setUserName] = useState('Yönetici')
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    if (!isStudio) return undefined
    function onStatus(event) {
      const data = event.detail || {}
      if (data.liveUrl) setLiveUrl(data.liveUrl)
      if (data.userName) setUserName(data.userName)
      if (data.action === 'publish-start') setPublishing(true)
      if (data.action === 'publish-end') setPublishing(false)
    }
    window.addEventListener('bach:studio-status', onStatus)
    return () => window.removeEventListener('bach:studio-status', onStatus)
  }, [isStudio])

  if (isStudio) {
    const studioActions = [
      {
        id: 'preview',
        title: 'Ön izleme',
        icon: Eye,
        gradient: HEADER_ACTION_GRADIENTS.primary,
        onClick: () => dispatchStudioCommand('preview'),
      },
      {
        id: 'live',
        title: 'Canlı vitrine git',
        icon: ExternalLink,
        gradient: HEADER_ACTION_GRADIENTS.success,
        href: liveUrl,
      },
      {
        id: 'publish',
        title: publishing ? 'Taşınıyor…' : 'Kaydet ve canlıya taşı',
        icon: Rocket,
        gradient: HEADER_ACTION_GRADIENTS.amber,
        onClick: () => dispatchStudioCommand('publish'),
      },
    ]

    return (
      <section className="app-header-banner flex h-[var(--ds-header-h,4.75rem)] min-h-[var(--ds-header-h,4.75rem)] shrink-0 items-center px-4 py-2 sm:px-6">
        <div className="flex w-full items-center gap-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {studioActions.map((action) => {
            const Icon = action.icon
            const className = `${HEADER_QUICK_ACTION_CHIP_FIXED_CLASS} ${action.gradient}`
            const inner = (
              <>
                <span className={HEADER_QUICK_ACTION_CHIP_ICON_CLASS}>
                  <Icon className="h-4 w-4 shrink-0 text-[#ffffff]" strokeWidth={2.25} aria-hidden />
                </span>
                <span className={YF_TEXT_ON_COLOR_CLASS}>{action.title}</span>
              </>
            )
            if (action.href) {
              return (
                <a key={action.id} href={action.href} target="_blank" rel="noopener noreferrer" title={action.title} className={className}>
                  {inner}
                </a>
              )
            }
            return (
              <button key={action.id} type="button" title={action.title} onClick={action.onClick} className={className}>
                {inner}
              </button>
            )
          })}
          <div className={`${HEADER_QUICK_ACTION_CHIP_FIXED_CLASS} ${HEADER_ACTION_GRADIENTS.violet} ml-auto`}>
            <span className={HEADER_QUICK_ACTION_CHIP_ICON_CLASS}>
              <span className="text-xs font-black text-white">{(userName || 'Y').slice(0, 1)}</span>
            </span>
            <span className={YF_TEXT_ON_COLOR_CLASS}>{userName || 'Studio Yönetici'}</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="app-header-banner flex h-[var(--ds-header-h,4.75rem)] min-h-[var(--ds-header-h,4.75rem)] shrink-0 items-center px-4 py-2 sm:px-6">
      <div className="flex w-full gap-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-7 lg:gap-2 lg:overflow-visible">
        {HEADER_QUICK_ACTIONS.map((action) => (
          <HeaderQuickActionCard key={action.id} action={action} />
        ))}
      </div>
    </section>
  )
}
