import { motion, useReducedMotion } from 'framer-motion'

type BachyMascotProps = {
  className?: string
}

/**
 * Bachy from register reference — lean + point pose.
 * Additive visual only; does not cover form controls.
 */
export default function BachyMascot({ className = '' }: BachyMascotProps) {
  const reduce = useReducedMotion()

  return (
    <div aria-hidden="true" className={`pointer-events-none relative select-none ${className}`}>
      <motion.img
        src="/bachy/bachy-register.png"
        alt=""
        draggable={false}
        className="bachy-mascot-img mx-auto h-auto w-[220px] max-w-none drop-shadow-[0_18px_40px_rgba(37,99,235,0.16)] sm:w-[260px] lg:w-[320px] xl:w-[360px]"
        animate={
          reduce
            ? undefined
            : {
                y: [0, -6, 0],
                rotate: [-0.6, 0.6, -0.6],
              }
        }
        transition={{
          duration: 3.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {/* Soft shoe glow pool (reference) */}
      <div
        className="pointer-events-none absolute bottom-[2%] left-1/2 h-4 w-[55%] -translate-x-1/2 rounded-full bg-[#2563EB]/20 blur-md"
        aria-hidden
      />
    </div>
  )
}
