'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const hidden = {
  up: { opacity: 0, y: 48 },
  down: { opacity: 0, y: -48 },
  left: { opacity: 0, x: -64 },
  right: { opacity: 0, x: 64 },
  scale: { opacity: 0, scale: 0.88 },
}

const visible = {
  up: { opacity: 1, y: 0 },
  down: { opacity: 1, y: 0 },
  left: { opacity: 1, x: 0 },
  right: { opacity: 1, x: 0 },
  scale: { opacity: 1, scale: 1 },
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 0.65,
}) {
  const ref = useRef(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShow(true)
          obs.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <motion.div
      ref={ref}
      initial={hidden[direction] ?? hidden.up}
      animate={show ? (visible[direction] ?? visible.up) : {}}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Yükselen sayı — prefix/suffix ve ondalık destekler.
 * örn: end=10000, suffix="+", decimals=0 → 10.000+
 *      end=99.9, suffix="%", decimals=1 → 99,9%
 */
export function Counter({ end, prefix = '', suffix = '', decimals = 0, duration = 1800 }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now) => {
            const p = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            const next = end * eased
            setVal(decimals > 0 ? Number(next.toFixed(decimals)) : Math.floor(next))
            if (p < 1) requestAnimationFrame(tick)
            else setVal(end)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.35 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration, decimals])

  const formatted =
    decimals > 0
      ? val.toLocaleString('tr-TR', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : val.toLocaleString('tr-TR')

  return (
    <span ref={ref} className="stats-counter">
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
