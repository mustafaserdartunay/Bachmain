import { Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import FeatureItem from '../pricing/FeatureItem'
import PricingBadge from '../pricing/PricingBadge'
import { referencePricingPlans } from '../pricing/pricingTokens'

export type PlanId = (typeof referencePricingPlans)[number]['id']

type RegisterPlanPickerProps = {
  onSelect: (planId: PlanId) => void
}

export default function RegisterPlanPicker({ onSelect }: RegisterPlanPickerProps) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 lg:grid-cols-3">
      {referencePricingPlans.map((plan, i) => (
        <PlanSelectCard
          key={plan.id}
          plan={plan}
          delay={i * 0.06}
          onSelect={() => onSelect(plan.id)}
        />
      ))}
    </div>
  )
}

function PlanSelectCard({
  plan,
  delay,
  onSelect,
}: {
  plan: (typeof referencePricingPlans)[number]
  delay: number
  onSelect: () => void
}) {
  const isDark = plan.theme === 'dark'
  const isFeatured = plan.theme === 'featured'

  return (
    <motion.article
      className={`relative flex h-full flex-col ${isFeatured ? 'lg:-mt-2 lg:scale-[1.03]' : ''}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
    >
      <div
        className={[
          'relative flex h-full flex-col rounded-[32px] p-8 sm:p-10',
          'shadow-[0_20px_60px_rgba(15,23,42,0.08)]',
          'transition-[box-shadow,transform] duration-300 ease-out',
          'hover:-translate-y-0.5',
          isDark
            ? 'border-2 border-[#FFB000] bg-[#0F172A] hover:shadow-[0_35px_90px_rgba(255,176,0,0.22)]'
            : isFeatured
              ? 'border-[3px] border-[#2563EB] bg-white hover:shadow-[0_35px_90px_rgba(37,99,235,0.18)]'
              : 'border border-[#E2E8F0] bg-white hover:shadow-[0_35px_90px_rgba(37,99,235,0.18)]',
        ].join(' ')}
      >
        {'badge' in plan && plan.badge ? <PricingBadge>{plan.badge}</PricingBadge> : null}

        {isDark ? (
          <div className="mb-1 flex items-center gap-3">
            <Crown className="h-6 w-6 shrink-0 text-[#FFB000]" strokeWidth={2.2} aria-hidden />
            <h2 className="text-[28px] font-extrabold tracking-tight text-[#FFB000]">
              {plan.name}
            </h2>
          </div>
        ) : (
          <h2 className="text-[28px] font-extrabold tracking-tight text-[#2563EB]">{plan.name}</h2>
        )}

        <p
          className={`mt-2 text-[14px] leading-relaxed font-medium ${
            isDark ? 'text-[#E2E8F0]' : 'text-[#64748B]'
          }`}
        >
          {plan.description}
        </p>

        <div className="mt-6 flex items-end gap-1.5">
          <span
            className={`leading-none font-extrabold tracking-tight tabular-nums ${
              isFeatured ? 'text-[40px]' : 'text-[36px]'
            } ${isDark ? 'text-[#FFB000]' : 'text-[#2563EB]'}`}
          >
            ₺{plan.price.toLocaleString('tr-TR')}
          </span>
          <span
            className={`pb-1 text-[14px] font-medium ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}
          >
            {plan.period}
          </span>
        </div>

        <ul className="mt-7 flex flex-1 flex-col gap-3.5">
          {plan.features.map((f) => (
            <FeatureItem key={f} label={f} tone={isDark ? 'gold' : 'blue'} />
          ))}
        </ul>

        <button
          type="button"
          onClick={onSelect}
          className={[
            'mt-8 inline-flex h-[58px] w-full items-center justify-center rounded-[18px] text-[16px] font-bold transition duration-300 ease-out hover:scale-[1.02]',
            isDark
              ? 'bg-gradient-to-r from-[#FFB000] to-[#FDBA74] text-[#0F172A]'
              : isFeatured
                ? 'bg-[#2563EB] text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] hover:bg-[#1D4ED8]'
                : 'border-2 border-[#2563EB] bg-white text-[#2563EB] hover:bg-[#EFF6FF]',
          ].join(' ')}
        >
          {plan.id === 'enterprise' ? 'Bu paketi seç' : plan.cta}
        </button>
      </div>
    </motion.article>
  )
}
