import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import FeatureGroupList from './FeatureGroupList'
import PricingBadge from './PricingBadge'
import PricingMascot from './PricingMascot'
import { referencePricingPlans } from './pricingTokens'

const plan = referencePricingPlans[1]

export default function ProCard() {
  return (
    <motion.article
      className="relative z-[1] flex h-full min-h-0 flex-col pt-8 lg:-mt-2 lg:scale-[1.04] lg:pt-10"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3, delay: 0.06, ease: 'easeOut' }}
    >
      <PricingMascot src={plan.mascot} alt={plan.mascotAlt} variant="pro" />
      <div className="relative z-10 flex h-full flex-col rounded-[32px] border-[3px] border-[#2563EB] bg-white p-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_35px_90px_rgba(37,99,235,0.18)]">
        {plan.badge ? <PricingBadge>{plan.badge}</PricingBadge> : null}
        <h2 className="text-[28px] font-extrabold tracking-tight text-[#2563EB]">{plan.name}</h2>
        <p className="mt-2 text-[14px] leading-relaxed font-medium text-[#64748B]">
          {plan.description}
        </p>
        <div className="mt-6 flex items-end gap-1.5">
          <span className="text-[40px] leading-none font-extrabold tracking-tight text-[#2563EB] tabular-nums">
            ₺{plan.price.toLocaleString('tr-TR')}
          </span>
          <span className="pb-1 text-[14px] font-medium text-[#64748B]">{plan.period}</span>
        </div>
        <FeatureGroupList groups={plan.featureGroups} tone="blue" />
        <Link
          to={plan.to}
          className="mt-8 inline-flex h-[58px] items-center justify-center rounded-[18px] bg-[#2563EB] text-[16px] font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] transition duration-300 ease-out hover:scale-[1.02] hover:bg-[#1D4ED8]"
        >
          {plan.cta}
        </Link>
      </div>
    </motion.article>
  )
}
