import { Link } from 'react-router-dom'
import { Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import PricingMascot from './PricingMascot'
import { referencePricingPlans, formatMoneyTry } from './pricingTokens'

const plan = referencePricingPlans[0]

export default function EnterpriseCard() {
  return (
    <motion.article
      className="relative flex h-full min-h-0 flex-col pt-16 sm:pt-20 lg:pt-24"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3, delay: 0.12, ease: 'easeOut' }}
    >
      <PricingMascot src={plan.mascot} alt={plan.mascotAlt} variant="enterprise" />
      <div className="relative z-10 flex h-full flex-col overflow-visible rounded-[32px] border-2 border-[#FFB000] bg-[#0F172A] p-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_35px_90px_rgba(255,176,0,0.22)]">
        <div className="mb-1 flex items-center gap-3">
          <Crown className="h-6 w-6 shrink-0 text-[#FFB000]" strokeWidth={2.2} aria-hidden />
          <h2 className="text-[28px] font-extrabold tracking-tight text-[#FFB000]">{plan.name}</h2>
        </div>
        <p className="mt-2 text-[14px] leading-relaxed font-medium text-[#E2E8F0]">
          {plan.description}
        </p>
        <div className="mt-6 flex items-end gap-1.5">
          <span className="text-[36px] leading-none font-extrabold tracking-tight text-[#FFB000] tabular-nums">
            {formatMoneyTry(plan.price)}
          </span>
          <span className="pb-1 text-[14px] font-medium text-[#94A3B8]">{plan.period}</span>
        </div>
        <Link
          to={plan.to}
          className="mt-8 inline-flex h-[58px] items-center justify-center rounded-[18px] bg-gradient-to-r from-[#FFB000] to-[#FDBA74] text-[16px] font-bold text-[#0F172A] transition duration-300 ease-out hover:scale-[1.02]"
        >
          {plan.cta}
        </Link>
      </div>
    </motion.article>
  )
}
