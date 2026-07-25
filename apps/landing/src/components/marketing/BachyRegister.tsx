import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

type Gaze = 'user' | 'card'

type BachyRegisterProps = {
  className?: string
}

/**
 * Additive Bachy companion for the Register page.
 * Does not alter the register form — only sits beside / above it.
 */
export default function BachyRegister({ className = '' }: BachyRegisterProps) {
  const reduce = useReducedMotion()
  const [gaze, setGaze] = useState<Gaze>('user')
  const [blink, setBlink] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [smileBoost, setSmileBoost] = useState(false)

  // Gaze loop: user → card → user (~6s)
  useEffect(() => {
    if (reduce) return undefined
    let step = 0
    const id = window.setInterval(() => {
      step = (step + 1) % 3
      setGaze(step === 1 ? 'card' : 'user')
    }, 2000)
    return () => window.clearInterval(id)
  }, [reduce])

  // Idle blink
  useEffect(() => {
    if (reduce) return undefined
    let timeout: number | undefined
    const schedule = () => {
      timeout = window.setTimeout(
        () => {
          setBlink(true)
          window.setTimeout(() => setBlink(false), 140)
          schedule()
        },
        2800 + Math.random() * 3200,
      )
    }
    schedule()
    return () => {
      if (timeout) window.clearTimeout(timeout)
    }
  }, [reduce])

  // Occasional wider smile
  useEffect(() => {
    if (reduce) return undefined
    const id = window.setInterval(
      () => {
        setSmileBoost(true)
        window.setTimeout(() => setSmileBoost(false), 700)
      },
      5000 + Math.random() * 4000,
    )
    return () => window.clearInterval(id)
  }, [reduce])

  const onHoverStart = () => {
    if (reduce) return
    setHovered(true)
    setSmileBoost(true)
    setBlink(true)
    window.setTimeout(() => setBlink(false), 120)
    window.setTimeout(() => setBlink(true), 220)
    window.setTimeout(() => setBlink(false), 340)
  }

  const onHoverEnd = () => {
    setHovered(false)
    setSmileBoost(false)
  }

  const lookRotate = reduce ? 0 : gaze === 'card' ? 7 : -2
  const lookX = reduce ? 0 : gaze === 'card' ? 6 : 0

  return (
    <aside
      aria-hidden="true"
      className={`bachy-register pointer-events-none select-none lg:pointer-events-auto ${className}`}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div className="bachy-register-frame relative mx-auto h-[132px] w-[148px] overflow-hidden sm:h-[150px] sm:w-[168px] lg:mx-0 lg:h-[360px] lg:w-[260px] lg:overflow-visible xl:h-[400px] xl:w-[280px]">
        <motion.div
          className="bachy-register-stage absolute inset-0 will-change-transform lg:inset-auto lg:bottom-0 lg:left-0 lg:right-0 lg:top-auto lg:h-full"
          style={{ transformOrigin: '50% 85%' }}
          animate={
            reduce
              ? undefined
              : {
                  y: hovered ? [0, -6, 0] : [0, -5, 0],
                  rotate: hovered
                    ? [lookRotate - 2, lookRotate + 4, lookRotate - 1]
                    : [lookRotate - 1.2, lookRotate + 1.2, lookRotate - 1.2],
                  x: lookX,
                  scale: smileBoost || hovered ? 1.03 : [1, 1.015, 1],
                }
          }
          transition={
            reduce
              ? undefined
              : {
                  y: { duration: hovered ? 1.1 : 3.2, repeat: Infinity, ease: 'easeInOut' },
                  rotate: {
                    duration: hovered ? 0.55 : 3.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                  x: { duration: 0.55, ease: 'easeOut' },
                  scale: smileBoost
                    ? { duration: 0.35 }
                    : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
                }
          }
        >
          {/* Hair / body subtle sway layer */}
          <motion.div
            className="relative h-full w-full will-change-transform"
            animate={
              reduce
                ? undefined
                : {
                    rotate: hovered ? [0, -3, 3, 0] : [-0.8, 0.8, -0.8],
                    skewX: [-0.4, 0.4, -0.4],
                  }
            }
            transition={{
              duration: hovered ? 0.7 : 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <motion.img
              src="/bachy/bachy-register.png"
              alt=""
              draggable={false}
              className="bachy-register-img pointer-events-none absolute left-1/2 h-[220%] w-auto max-w-none -translate-x-1/2 object-contain object-top drop-shadow-[0_18px_28px_rgba(37,99,235,0.18)] lg:relative lg:left-0 lg:h-full lg:w-full lg:translate-x-0 lg:object-contain dark:drop-shadow-[0_16px_32px_rgba(37,99,235,0.35)]"
              animate={
                reduce
                  ? undefined
                  : {
                      scaleY: blink ? 0.94 : 1,
                      filter:
                        smileBoost || hovered ? 'brightness(1.06) saturate(1.08)' : 'brightness(1)',
                    }
              }
              transition={{ duration: blink ? 0.1 : 0.25 }}
            />

            {/* Soft blink lids */}
            <motion.div
              className="pointer-events-none absolute left-[28%] top-[18%] h-[9%] w-[44%] rounded-[40%] bg-[#f8fafc]/90 mix-blend-soft-light lg:left-[30%] lg:top-[16%] dark:bg-[#0f172a]/35"
              animate={{ opacity: blink ? 0.85 : 0, scaleY: blink ? 1 : 0.2 }}
              transition={{ duration: 0.1 }}
            />

            {/* Shoe neon glow — SVG + CSS flow every 4s (faster on hover) */}
            <div
              className={`bachy-shoe-glow pointer-events-none absolute bottom-[4%] left-[18%] h-[14%] w-[64%] lg:bottom-[3%] ${hovered ? 'is-fast' : ''}`}
              aria-hidden
            >
              <svg viewBox="0 0 200 40" className="h-full w-full overflow-visible" fill="none">
                <defs>
                  <linearGradient id="bachyShoeFlow" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0" />
                    <stop offset="40%" stopColor="#60A5FA" stopOpacity="0.85" />
                    <stop offset="70%" stopColor="#38BDF8" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                  </linearGradient>
                  <filter id="bachyShoeBlur" x="-40%" y="-80%" width="180%" height="260%">
                    <feGaussianBlur stdDeviation="2.2" />
                  </filter>
                </defs>
                <path
                  d="M12 26 C40 18, 70 14, 100 16 C130 18, 160 22, 188 28"
                  stroke="url(#bachyShoeFlow)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#bachyShoeBlur)"
                  className="bachy-shoe-stroke"
                />
                <ellipse
                  cx="48"
                  cy="30"
                  rx="22"
                  ry="5"
                  fill="#2563EB"
                  opacity="0.22"
                  className="bachy-shoe-pool"
                />
              </svg>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </aside>
  )
}
