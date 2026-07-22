import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Bachy from './Bachy'
import { planToPose } from './BachyAnimations'

const COPY = {
  starter: 'Güzel başlangıç.',
  professional: 'En sevdiğim 💙',
  pro: 'En sevdiğim 💙',
  enterprise: 'VIP rahatlığı',
}

/**
 * Per-plan companion — does not alter pricing card markup.
 */
export default function BachyPricing({ planId }) {
  const reduce = useReducedMotion()
  const [hover, setHover] = useState(false)
  const pose = planToPose(planId)
  const tip = COPY[planId] || COPY.professional

  return (
    <div
      className="bachy-pricing-buddy pointer-events-none absolute -left-2 top-[-5rem] z-[2] h-[130px] w-[120px] sm:-left-5 sm:top-[-5.5rem] sm:h-[150px] sm:w-[150px] lg:-left-9 lg:h-[170px] lg:w-[170px]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ pointerEvents: 'auto' }}
    >
      <Bachy
        pose={pose}
        hover={hover}
        compact
        className="h-full w-full"
        aria-label={`Bachy — ${planId}`}
      />
      {!reduce ? (
        <motion.p
          className="mx-auto mt-0.5 w-max max-w-[9rem] rounded-full bg-white/90 px-2.5 py-1 text-center text-[10px] font-bold text-slate-600 shadow"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {tip}
        </motion.p>
      ) : null}
    </div>
  )
}
