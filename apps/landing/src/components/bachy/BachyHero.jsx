import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import BachyFigure from './BachyFigure'

export default function BachyHero() {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, -20])

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute bottom-0 left-2 z-[1] hidden w-[120px] sm:block md:left-6 md:w-[150px] lg:w-[180px]"
    >
      <motion.div style={{ y }} className="origin-bottom">
        <BachyFigure pose="idle" className="h-[160px] w-full md:h-[200px]" float={!reduce} />
      </motion.div>
    </div>
  )
}
