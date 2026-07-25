import { useState } from 'react'
import { Building2, CreditCard, Landmark } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '../ui/Button'

export type PaymentMethod = 'card' | 'havale'

export type PaymentResult = {
  paymentId?: string
  amountTry?: number
  expectedAmountTry?: number
  iban?: string
  bank?: {
    iban?: string
    bankName?: string
    accountHolder?: string
    branch?: string
  }
  message?: string
  provider?: string
  iyzicoReady?: boolean
}

type PaymentPanelProps = {
  planName: string
  planPrice: number
  busy: boolean
  submitError: string
  amountWarning?: string
  onPay: (method: PaymentMethod) => void
  onBack: () => void
}

export default function PaymentPanel({
  planName,
  planPrice,
  busy,
  submitError,
  amountWarning,
  onPay,
  onBack,
}: PaymentPanelProps) {
  const [method, setMethod] = useState<PaymentMethod>('havale')

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[640px]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="relative rounded-[32px] border-[3px] border-[#2563EB] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
        <span className="absolute -top-3.5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#2563EB] px-4 py-1.5 text-[11px] font-bold tracking-[0.06em] text-white uppercase shadow-[0_8px_20px_rgba(37,99,235,0.35)]">
          Ödeme
        </span>

        <header className="mb-6 pt-1">
          <h2 className="text-[28px] font-extrabold tracking-tight text-[#2563EB]">
            Ödeme yöntemi
          </h2>
          <p className="mt-2 text-[14px] font-medium text-[#64748B]">
            {planName} paketi —{' '}
            <span className="font-bold text-[#0F172A]">
              ₺{planPrice.toLocaleString('tr-TR')}
              <span className="text-[13px] font-medium text-[#64748B]">/aylık</span>
            </span>
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#64748B]">
            Kart ödemeleri iyzico altyapısına hazırdır. Havale/EFT’de tutarın eksiksiz yatırılması
            gerekir; eksik tutarda uyarı alırsınız ve giriş açılmaz.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MethodCard
            active={method === 'card'}
            icon={<CreditCard className="h-5 w-5" />}
            title="Kredi kartı"
            subtitle="iyzico ile güvenli ödeme"
            onClick={() => setMethod('card')}
          />
          <MethodCard
            active={method === 'havale'}
            icon={<Landmark className="h-5 w-5" />}
            title="Havale / EFT"
            subtitle="Banka hesabımıza transfer"
            onClick={() => setMethod('havale')}
          />
        </div>

        {method === 'havale' ? (
          <div className="mt-5 rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-bold text-[#0F172A]">
              <Building2 className="h-4 w-4 text-[#2563EB]" />
              Banka bilgileri (ödeme sonrası gösterilir)
            </div>
            <p className="text-[13px] leading-relaxed text-[#64748B]">
              “Ödemeyi tamamla” dedikten sonra IBAN, alıcı unvanı ve referans kodunuz ekranda
              görünür. Açıklamaya referans kodunu yazmanız gerekir.
            </p>
          </div>
        ) : (
          <div className="mt-5 rounded-[18px] border border-[#DBEAFE] bg-[#EFF6FF] p-4 text-[13px] leading-relaxed text-[#1E40AF]">
            Kredi kartı tahsilatı iyzico üzerinden yapılacaktır. Anlaşma ve API anahtarları
            tanımlandığında 3D Secure yönlendirmesi otomatik açılır.
          </div>
        )}

        {amountWarning ? (
          <p className="mt-4 rounded-[18px] bg-[#FFFBEB] px-4 py-3 text-sm font-medium text-[#B45309]">
            {amountWarning}
          </p>
        ) : null}

        {submitError ? (
          <p className="mt-4 rounded-[18px] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#EF4444]">
            {submitError}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-[58px] flex-1 items-center justify-center rounded-[18px] border-2 border-[#E2E8F0] bg-white text-[16px] font-bold text-[#64748B] transition hover:bg-[#F8FAFC]"
          >
            Geri
          </button>
          <div className="flex-1">
            <Button type="button" fullWidth disabled={busy} onClick={() => onPay(method)}>
              {busy ? 'İşleniyor…' : 'Ödemeyi tamamla'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function MethodCard({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-start gap-3 rounded-[18px] border-2 p-4 text-left transition duration-300',
        active
          ? 'border-[#2563EB] bg-[#EFF6FF] shadow-[0_12px_30px_rgba(37,99,235,0.15)]'
          : 'border-[#E2E8F0] bg-white hover:border-[#BFDBFE]',
      ].join(' ')}
    >
      <span className={active ? 'text-[#2563EB]' : 'text-[#94A3B8]'}>{icon}</span>
      <span>
        <span className="block text-[15px] font-bold text-[#0F172A]">{title}</span>
        <span className="mt-0.5 block text-[12px] font-medium text-[#64748B]">{subtitle}</span>
      </span>
    </button>
  )
}
