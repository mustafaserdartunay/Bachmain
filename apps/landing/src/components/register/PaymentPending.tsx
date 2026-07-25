import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { PaymentResult } from './PaymentPanel'
import Button from '../ui/Button'

type PaymentPendingProps = {
  planName: string
  result: PaymentResult
  method: 'card' | 'havale'
}

export default function PaymentPending({ planName, result, method }: PaymentPendingProps) {
  const bank = result.bank || {}
  const iban = bank.iban || result.iban || '—'
  const amount = Number(result.amountTry || result.expectedAmountTry || 0)
  const expected = Number(result.expectedAmountTry || result.amountTry || 0)
  const short = expected > 0 && amount > 0 && amount + 0.01 < expected

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[640px]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="relative rounded-[32px] border-[3px] border-[#2563EB] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
        <span className="absolute -top-3.5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#2563EB] px-4 py-1.5 text-[11px] font-bold tracking-[0.06em] text-white uppercase">
          Talep alındı
        </span>

        <h2 className="pt-1 text-[28px] font-extrabold tracking-tight text-[#2563EB]">
          {method === 'havale' ? 'Havale / EFT bilgileri' : 'Kart ödeme talebi'}
        </h2>
        <p className="mt-2 text-[14px] font-medium text-[#64748B]">
          {planName} — Yönetim ödemeyi onaylayınca girişiniz açılır ve e-posta gönderilir.
        </p>

        {short ? (
          <p className="mt-4 rounded-[18px] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#EF4444]">
            Ödeme tutarı beklenen tutardan düşük görünüyor. Eksik ödemelerde lisans açılmaz; lütfen
            tam tutarı yatırın.
          </p>
        ) : null}

        <div className="mt-5 space-y-3 rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-5 text-[14px]">
          <Row label="Tutar" value={`₺${amount.toLocaleString('tr-TR')}`} />
          <Row label="Referans" value={result.paymentId || '—'} />
          {method === 'havale' ? (
            <>
              <Row label="Alıcı" value={bank.accountHolder || 'BACHMAIN'} />
              <Row label="Banka" value={bank.bankName || '—'} />
              {bank.branch ? <Row label="Şube" value={bank.branch} /> : null}
              <Row label="IBAN" value={iban} mono />
              <p className="pt-1 text-[12px] leading-relaxed text-[#64748B]">
                Havale açıklamasına mutlaka <strong>referans kodunu</strong> yazın. Yönetim hesabı
                kontrol edip onayladığında giriş yetkiniz otomatik açılır.
              </p>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed text-[#64748B]">
              {result.message ||
                'Kart ödemesi iyzico hazırlığı tamamlandığında 3D Secure ile tahsil edilir. Şimdilik talebiniz yönetime düştü.'}
            </p>
          )}
        </div>

        <div className="mt-6">
          <Link to="/login">
            <Button type="button" fullWidth>
              Giriş sayfasına git
            </Button>
          </Link>
          <p className="mt-3 text-center text-[13px] font-medium text-[#64748B]">
            Onay e-postasını aldıktan sonra giriş yapabilirsiniz.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="text-[12px] font-semibold tracking-wide text-[#64748B] uppercase">
        {label}
      </span>
      <span
        className={`font-bold text-[#0F172A] ${mono ? 'font-mono text-[13px] break-all' : 'text-[15px]'}`}
      >
        {value}
      </span>
    </div>
  )
}
