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
        width={1466}
        height={2200}
        draggable={false}
        decoding="async"
        className="bachy-mascot-img mx-auto h-auto w-[240px] max-w-none object-contain drop-shadow-[0_20px_44px_rgba(37,99,235,0.18)] sm:w-[280px] lg:w-[340px] xl:w-[380px]"
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
