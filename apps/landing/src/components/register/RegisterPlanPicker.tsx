'use client'

import { useState } from 'react'
import { Check, Coins, Sparkles } from 'lucide-react'
import PricingBadge from '../pricing/PricingBadge'
import FeatureGroupList from '../pricing/FeatureGroupList'
import {
  type BillingPeriod,
  formatMoneyTry,
  kontorPackages,
  planCheckoutAmount,
  planDisplayPrice,
  referencePricingPlans,
} from '../pricing/pricingTokens'

export type PlanId = (typeof referencePricingPlans)[number]['id']
export type KontorPackageId = (typeof kontorPackages)[number]['id']

type RegisterPlanPickerProps = {
  onSelect: (planId: PlanId, period: BillingPeriod, kontorId?: KontorPackageId | null) => void
}

const plan = referencePricingPlans[0]

export default function RegisterPlanPicker({ onSelect }: RegisterPlanPickerProps) {
  const [period, setPeriod] = useState<BillingPeriod>('year')
  const [selectedKontorId, setSelectedKontorId] = useState<KontorPackageId | null>(null)
  const pricing = planDisplayPrice(plan, period)
  const selectedKontor = kontorPackages.find((p) => p.id === selectedKontorId) ?? null
  const planTotal = planCheckoutAmount(plan, period)
  const combinedTotal = planTotal + (selectedKontor?.price ?? 0)

  const buyPlan = () => onSelect(plan.id, period, selectedKontorId)
  const buyWithKontor = () => {
    if (!selectedKontorId) return
    onSelect(plan.id, period, selectedKontorId)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-3">
        <BillingPeriodToggle period={period} onChange={setPeriod} />
        {period === 'year' ? (
          <p className="text-center text-[13px] font-semibold text-[#2563EB]">
            Yıllık ödemede %{pricing.discountPercent} indirim · {plan.kontorGift} kontör hediye
          </p>
        ) : (
          <p className="text-center text-[13px] font-medium text-[#64748B]">
            Yıllık plana geçerek %{plan.yearlyDiscountPercent} tasarruf edebilirsiniz
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Sol — tek full paket */}
        <article className="relative flex h-full lg:col-span-7">
          <div className="relative flex h-full w-full flex-col overflow-visible rounded-[32px] border-[3px] border-[#2563EB] bg-white p-7 shadow-[0_24px_60px_rgba(37,99,235,0.12)] sm:p-9">
            <KontorRibbon amount={plan.kontorGift} />
            {plan.badge ? <PricingBadge>{plan.badge}</PricingBadge> : null}

            <div className="flex items-start gap-3 pr-28">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-[28px] font-bold tracking-tight text-[#2563EB] sm:text-[32px]">
                  {plan.name}
                </h2>
                <p className="mt-1.5 text-[14px] leading-relaxed font-medium text-[#64748B]">
                  {plan.description}
                </p>
              </div>
            </div>

            <div className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-[#FFF7ED] px-3 py-2 text-[12px] font-bold text-[#C2410C]">
              <Coins className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {plan.kontorGift.toLocaleString('tr-TR')} kontör hediye
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
              {period === 'year' && pricing.listDisplay != null ? (
                <span className="pb-1 text-[18px] font-bold text-[#94A3B8] line-through tabular-nums">
                  {formatMoneyTry(pricing.listDisplay)}
                </span>
              ) : null}
              <span className="text-[40px] leading-none font-extrabold tracking-tight text-[#2563EB] tabular-nums sm:text-[44px]">
                {formatMoneyTry(pricing.display)}
              </span>
              <span className="pb-1 text-[14px] font-medium text-[#64748B]">
                {pricing.suffix}
                {period === 'year' ? ' *' : ''}
              </span>
            </div>

            {period === 'year' && pricing.yearlyTotal != null ? (
              <div className="mt-3 space-y-1.5 text-[#475569]">
                <p className="text-[13px] font-semibold">
                  Yıllık toplam:{' '}
                  <span className="text-[#0F172A]">{formatMoneyTry(pricing.yearlyTotal)}</span>
                  <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700">
                    %{pricing.discountPercent} indirim
                  </span>
                </p>
                <p className="inline-flex items-start gap-1.5 text-[12px] font-medium text-[#047857]">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  Aylık aboneliğe göre daha ekonomik
                </p>
              </div>
            ) : (
              <p className="mt-3 text-[12px] font-medium text-[#64748B]">
                İstediğiniz zaman yıllık plana geçebilirsiniz
              </p>
            )}

            {selectedKontor ? (
              <div className="mt-4 rounded-[16px] border border-[#FFB000]/40 bg-[#FFFBEB] px-4 py-3">
                <p className="text-[12px] font-bold text-[#92400E]">
                  + {selectedKontor.amount.toLocaleString('tr-TR')} kontör eklendi
                </p>
                <p className="mt-0.5 text-[13px] font-semibold text-[#0F172A]">
                  Ödenecek toplam:{' '}
                  <span className="tabular-nums text-[#2563EB]">
                    {formatMoneyTry(combinedTotal)}
                  </span>
                </p>
              </div>
            ) : null}

            <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
              <FeatureGroupList groups={plan.featureGroups} tone="blue" compact />
            </div>

            <button
              type="button"
              onClick={buyPlan}
              className="mt-7 inline-flex h-[56px] w-full shrink-0 items-center justify-center rounded-[18px] bg-[#2563EB] text-[16px] font-bold text-white shadow-[0_14px_32px_rgba(37,99,235,0.35)] transition-colors hover:bg-[#1D4ED8]"
            >
              {selectedKontor ? `Satın Al · ${formatMoneyTry(combinedTotal)}` : 'Satın Al'}
            </button>
          </div>
        </article>

        {/* Sağ — kontör paketleri (seçilebilir) */}
        <aside className="flex h-full lg:col-span-5">
          <div className="flex h-full w-full flex-col rounded-[32px] border border-[#E2E8F0] bg-gradient-to-b from-white to-[#F8FAFC] p-6 shadow-[0_16px_48px_rgba(15,23,42,0.06)] sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF7ED] text-[#C2410C]">
                <Coins className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-[#0F172A]">
                  Kontör paketleri
                </h3>
                <p className="mt-0.5 text-[12px] font-medium text-[#64748B]">
                  E-belge, mesaj ve API kullanımı için
                </p>
              </div>
            </div>

            <p className="mt-4 text-[13px] leading-relaxed font-medium text-[#64748B]">
              Full paketle birlikte ek kontör seçebilirsiniz. Hediye kontör bitince bakiyeniz
              buradan devam eder; süre sınırı yoktur.
            </p>

            <div
              className="mt-5 flex flex-1 flex-col gap-2.5"
              role="radiogroup"
              aria-label="Kontör paketi seçin"
            >
              {kontorPackages.map((pack) => {
                const selected = selectedKontorId === pack.id
                return (
                  <button
                    key={pack.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() =>
                      setSelectedKontorId((current) => (current === pack.id ? null : pack.id))
                    }
                    className={[
                      'relative flex w-full items-center justify-between gap-3 rounded-[18px] border px-4 py-3.5 text-left transition-colors',
                      selected
                        ? 'border-[#2563EB] bg-[#EFF6FF] ring-2 ring-[#2563EB]/25'
                        : pack.popular
                          ? 'border-[#2563EB]/50 bg-white hover:border-[#2563EB] hover:bg-[#F8FAFC]'
                          : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#F8FAFC]',
                    ].join(' ')}
                  >
                    {pack.popular ? (
                      <span className="absolute -top-2 left-4 rounded-full bg-[#2563EB] px-2 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase">
                        Popüler
                      </span>
                    ) : null}

                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={[
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                          selected
                            ? 'border-[#2563EB] bg-[#2563EB] text-white'
                            : 'border-[#CBD5E1] bg-white',
                        ].join(' ')}
                        aria-hidden
                      >
                        {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-[#64748B]">{pack.tagline}</p>
                        <p className="text-[16px] font-black tracking-tight text-[#0F172A] tabular-nums">
                          {pack.amount.toLocaleString('tr-TR')}{' '}
                          <span className="text-[12px] font-bold text-[#64748B]">kontör</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[16px] font-extrabold text-[#2563EB] tabular-nums">
                        {formatMoneyTry(pack.price)}
                      </p>
                      <p className="text-[10px] font-medium text-[#94A3B8]">KDV hariç</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div
              className={[
                'mt-5 rounded-[18px] border px-4 py-4',
                selectedKontor
                  ? 'border-[#2563EB]/30 bg-[#EFF6FF]'
                  : 'border-dashed border-[#CBD5E1] bg-white/70',
              ].join(' ')}
            >
              {selectedKontor ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-bold tracking-wide text-[#64748B] uppercase">
                      Seçilen kontör
                    </p>
                    <p className="mt-1 text-[15px] font-extrabold text-[#0F172A]">
                      {selectedKontor.amount.toLocaleString('tr-TR')} kontör ·{' '}
                      <span className="tabular-nums text-[#2563EB]">
                        {formatMoneyTry(selectedKontor.price)}
                      </span>
                    </p>
                    <p className="mt-1 text-[12px] font-medium text-[#64748B]">
                      Full paket + kontör toplamı{' '}
                      <span className="font-bold text-[#0F172A] tabular-nums">
                        {formatMoneyTry(combinedTotal)}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={buyWithKontor}
                    className="inline-flex h-[52px] w-full items-center justify-center rounded-[16px] bg-[#2563EB] text-[15px] font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.3)] transition-colors hover:bg-[#1D4ED8]"
                  >
                    Satın Al
                  </button>
                </div>
              ) : (
                <p className="text-center text-[13px] font-medium text-[#94A3B8]">
                  Satın almak için bir kontör paketi seçin
                </p>
              )}
            </div>

            <ul className="mt-4 space-y-2 text-[12px] font-medium text-[#475569]">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563EB]" aria-hidden />
                Paket hediyesi + ek kontör aynı bakiyede
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563EB]" aria-hidden />
                Üyelik sonrası panelden de yüklenebilir
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

function BillingPeriodToggle({
  period,
  onChange,
}: {
  period: BillingPeriod
  onChange: (next: BillingPeriod) => void
}) {
  return (
    <div
      className="inline-flex rounded-full border border-[#E2E8F0] bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
      role="group"
      aria-label="Ödeme dönemi"
    >
      {(
        [
          { id: 'month' as const, label: 'Aylık' },
          { id: 'year' as const, label: 'Yıllık' },
        ] as const
      ).map((option) => {
        const active = period === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={[
              'relative rounded-full px-5 py-2 text-[13px] font-bold transition-colors',
              active
                ? 'bg-[#2563EB] text-white shadow-[0_8px_18px_rgba(37,99,235,0.28)]'
                : 'text-[#64748B] hover:text-[#0F172A]',
            ].join(' ')}
          >
            {option.label}
            {option.id === 'year' ? (
              <span
                className={[
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide',
                  active ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-700',
                ].join(' ')}
              >
                %{plan.yearlyDiscountPercent}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

function KontorRibbon({ amount }: { amount: number }) {
  return (
    <div
      className="absolute -right-1 top-5 z-20 max-w-[9.5rem] rounded-l-xl bg-[#FFB000] px-3 py-2 text-right text-[#0F172A] shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
      aria-label={`${amount} kontör hediye`}
    >
      <p className="text-[11px] leading-tight font-black tracking-tight">
        {amount.toLocaleString('tr-TR')} kontör
        <br />
        hediye!
      </p>
    </div>
  )
}
