import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PricingMascot from './PricingMascot'
import { referencePricingPlans, formatMoneyTry } from './pricingTokens'

const plan = referencePricingPlans[0]

export default function StarterCard() {
  return (
    <motion.article
      className="relative flex h-full min-h-0 flex-col pt-8 lg:pt-10"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <PricingMascot src={plan.mascot} alt={plan.mascotAlt} variant="starter" />
      <div className="relative z-10 flex h-full flex-col rounded-[32px] border border-[#E2E8F0] bg-white p-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_35px_90px_rgba(37,99,235,0.18)]">
        <h2 className="text-[28px] font-extrabold tracking-tight text-[#2563EB]">{plan.name}</h2>
        <p className="mt-2 text-[14px] leading-relaxed font-medium text-[#64748B]">
          {plan.description}
        </p>
        <div className="mt-6 flex items-end gap-1.5">
          <span className="text-[36px] leading-none font-extrabold tracking-tight text-[#2563EB] tabular-nums">
            {formatMoneyTry(plan.price)}
          </span>
          <span className="pb-1 text-[14px] font-medium text-[#64748B]">{plan.period}</span>
        </div>
        <Link
          to={plan.to}
          className="mt-8 inline-flex h-[58px] items-center justify-center rounded-[18px] border-2 border-[#2563EB] bg-white text-[16px] font-bold text-[#2563EB] transition duration-300 ease-out hover:scale-[1.02] hover:bg-[#EFF6FF]"
        >
          {plan.cta}
        </Link>
      </div>
    </motion.article>
  )
}
