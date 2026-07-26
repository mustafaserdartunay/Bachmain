'use client'

import { Link } from 'react-router-dom'
import { Check, Coins, Sparkles } from 'lucide-react'
import PricingBadge from './PricingBadge'
import { formatMoneyTry, referencePricingPlans } from './pricingTokens'

const plan = referencePricingPlans[0]

export default function PricingSection() {
  return (
    <section className="relative overflow-x-clip bg-[#F8FAFC] pt-[120px] pb-[120px]">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#E2E8F0]/55 via-[#F1F5F9]/35 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-3xl lg:max-w-4xl">
          <article className="relative overflow-visible rounded-[32px] border-[3px] border-[#2563EB] bg-white p-8 shadow-[0_24px_60px_rgba(37,99,235,0.12)] sm:p-10">
            {plan.badge ? <PricingBadge>{plan.badge}</PricingBadge> : null}
            <div className="absolute -right-1 top-5 z-20 max-w-[9.5rem] rounded-l-xl bg-[#FFB000] px-3 py-2 text-right text-[#0F172A] shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
              <p className="text-[11px] leading-tight font-black tracking-tight">
                {plan.kontorGift.toLocaleString('tr-TR')} kontör
                <br />
                hediye!
              </p>
            </div>

            <div className="flex items-start gap-3 pr-28">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h1 className="text-[28px] font-bold tracking-tight text-[#2563EB] sm:text-[32px]">
                  {plan.name}
                </h1>
                <p className="mt-1.5 text-[14px] leading-relaxed font-medium text-[#64748B]">
                  {plan.description}
                </p>
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FFF7ED] px-3 py-2 text-[12px] font-bold text-[#C2410C]">
              <Coins className="h-3.5 w-3.5" aria-hidden />
              {plan.kontorGift.toLocaleString('tr-TR')} kontör hediye · yıllıkta %
              {plan.yearlyDiscountPercent} indirim
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="text-[40px] leading-none font-extrabold text-[#2563EB] tabular-nums">
                {formatMoneyTry(plan.price)}
              </span>
              <span className="pb-1 text-[14px] font-medium text-[#64748B]">/aylık</span>
            </div>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#047857]">
              <Check className="h-3.5 w-3.5" aria-hidden />
              Yıllık ödemede %{plan.yearlyDiscountPercent} indirim (
              {formatMoneyTry(plan.yearlyTotal)} / yıl)
            </p>

            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {plan.featureGroups[0].items.slice(0, 10).map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-[13px] font-medium text-[#334155]"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563EB]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              to={`${plan.to}&period=year`}
              className="mt-8 inline-flex h-[56px] w-full items-center justify-center rounded-[18px] bg-[#2563EB] text-[16px] font-bold text-white shadow-[0_14px_32px_rgba(37,99,235,0.35)] transition-colors hover:bg-[#1D4ED8]"
            >
              Satın Al
            </Link>
          </article>
        </div>
      </div>
    </section>
  )
}
