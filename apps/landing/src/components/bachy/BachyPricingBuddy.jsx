import { motion, useReducedMotion } from 'framer-motion'
import BachyFigure from './BachyFigure'

const COPY = {
  starter: 'Güzel başlangıç.',
  professional: 'En sevdiğim 💙',
  pro: 'En sevdiğim 💙',
  enterprise: 'VIP rahatlığı',
}

export default function BachyPricingBuddy({ planId }) {
  const reduce = useReducedMotion()
  const pose = planId === 'enterprise' ? 'enterprise' : planId === 'starter' ? 'starter' : 'pro'
  const tip = COPY[planId] || COPY.professional

  return (
    <div className="bachy-pricing-buddy pointer-events-none absolute -left-3 top-[-4.5rem] z-[2] w-[140px] sm:-left-6 sm:top-[-5.5rem] sm:w-[170px] lg:-left-10 lg:w-[190px]">
      <BachyFigure pose={pose} className="h-[150px] w-full sm:h-[170px]" float={!reduce} />
      <motion.p
        className="mx-auto mt-1 w-max max-w-[9rem] rounded-full bg-white/90 px-2.5 py-1 text-center text-[10px] font-bold text-slate-600 shadow"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {tip}
      </motion.p>
    </div>
  )
}
