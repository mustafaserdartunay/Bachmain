import { motion, useReducedMotion } from 'framer-motion'

const POSES = {
  login: '/bachy/bachy-login.png',
  register: '/bachy/bachy-register.png',
  starter: '/bachy/bachy-starter.png',
  pro: '/bachy/bachy-pro.png',
  enterprise: '/bachy/bachy-enterprise.png',
  idle: '/bachy/bachy-idle.png',
}

/**
 * Premium Bachy figure — official renders + subtle motion.
 */
export default function BachyFigure({
  pose = 'idle',
  className = '',
  alt = 'Bachy',
  float = true,
  glow = false,
  onClick,
}) {
  const reduce = useReducedMotion()
  const src = POSES[pose] || POSES.idle

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={alt}
      className={`bachy-figure relative inline-flex select-none border-0 bg-transparent p-0 ${glow ? 'bachy-glow' : ''} ${className}`}
      initial={reduce ? false : { opacity: 0, y: 28, scale: 0.96 }}
      animate={
        reduce
          ? { opacity: 1 }
          : float
            ? { opacity: 1, y: [0, -6, 0], scale: 1 }
            : { opacity: 1, y: 0, scale: 1 }
      }
      transition={
        reduce
          ? { duration: 0.2 }
          : float
            ? {
                opacity: { duration: 0.55 },
                y: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
                scale: { duration: 0.55 },
              }
            : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
      }
      whileHover={reduce ? undefined : { scale: 1.03, rotate: [-0.5, 0.5, 0] }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="pointer-events-none h-full w-full object-contain drop-shadow-[0_18px_40px_rgba(15,40,90,0.22)]"
      />
    </motion.button>
  )
}

export { POSES }
