import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Bachy from './Bachy'

/**
 * Hero companion — sits beside headline area; does not change hero layout structure.
 */
export default function BachyHero() {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [36, -16])

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute bottom-2 left-1 z-[1] hidden h-[140px] w-[110px] sm:block md:left-4 md:h-[180px] md:w-[140px] lg:left-6 lg:h-[200px] lg:w-[160px]"
    >
      <motion.div style={{ y }} className="h-full w-full origin-bottom">
        <Bachy pose="idle" mood="curious" compact className="h-full w-full" aria-label="Bachy" />
      </motion.div>
    </div>
  )
}
