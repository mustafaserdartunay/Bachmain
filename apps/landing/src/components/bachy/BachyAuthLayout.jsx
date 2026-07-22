import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import BachyFigure from './BachyFigure'

/**
 * Login / Register scene: Bachy beside the card, never covering fields.
 */
export default function BachyAuthLayout({
  pose = 'login',
  title,
  subtitle,
  children,
  mood = 'curious',
  celebrate = false,
  message,
  dark = false,
}) {
  const reduce = useReducedMotion()
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    if (reduce) return undefined
    const tick = () => {
      setBlink(true)
      setTimeout(() => setBlink(false), 160)
    }
    const id = setInterval(tick, 15000 + Math.random() * 15000)
    return () => clearInterval(id)
  }, [reduce])

  return (
    <div
      className={`bachy-auth relative min-h-[85vh] overflow-hidden pt-24 pb-16 ${dark ? 'bachy-auth-dark' : 'page-mesh'}`}
    >
      <div className="relative mx-auto grid max-w-5xl items-end gap-6 px-4 lg:grid-cols-[minmax(220px,0.9fr)_minmax(320px,1fr)] lg:items-center lg:gap-10 lg:px-8">
        <div className="pointer-events-none relative order-2 mx-auto w-full max-w-[280px] lg:order-1 lg:mx-0 lg:max-w-none lg:self-end">
          <motion.div
            animate={
              reduce
                ? undefined
                : mood === 'shy'
                  ? { x: -8, rotate: -3 }
                  : mood === 'focus'
                    ? { x: 4, rotate: 1 }
                    : celebrate
                      ? { y: [0, -14, 0], rotate: [0, -4, 4, 0] }
                      : blink
                        ? { scaleY: 0.92 }
                        : { x: 0, rotate: 0 }
            }
            transition={{ duration: celebrate ? 0.7 : 0.35 }}
            className="relative"
          >
            <BachyFigure
              pose={pose}
              className="h-[260px] w-full sm:h-[320px] lg:h-[380px]"
              float={!celebrate && !reduce}
              glow={dark}
            />
          </motion.div>
          <AnimatePresence>
            {message ? (
              <motion.div
                key={message}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute -top-2 left-1/2 z-10 w-max max-w-[14rem] -translate-x-1/2 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2 text-center text-xs font-semibold text-slate-700 shadow-lg backdrop-blur"
              >
                {message}
              </motion.div>
            ) : null}
          </AnimatePresence>
          {celebrate ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="bachy-confetti absolute top-0 h-2 w-2 rounded-sm"
                  style={{
                    left: `${(i * 17) % 100}%`,
                    background: ['#2563eb', '#f59e0b', '#22c55e', '#ec4899'][i % 4],
                    animationDelay: `${(i % 7) * 0.08}s`,
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative order-1 z-10 lg:order-2">
          {title ? (
            <h1
              className={`text-center text-3xl font-extrabold tracking-tight lg:text-left ${dark ? 'text-white' : 'text-slate-900'}`}
            >
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p
              className={`mt-2 text-center lg:text-left ${dark ? 'text-slate-300' : 'text-slate-500'}`}
            >
              {subtitle}
            </p>
          ) : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
