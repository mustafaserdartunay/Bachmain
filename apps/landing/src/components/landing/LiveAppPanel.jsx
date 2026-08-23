'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * Gerçek uygulama ekran görüntüsü — hafif canlı hareket (parallax / glow).
 */
export default function LiveAppPanel({ src, alt, caption, className = '', compact = false }) {
  const reduce = useReducedMotion()

  return (
    <div className={`live-app-panel ${compact ? 'live-app-panel--compact' : ''} ${className}`}>
      <motion.div
        className="live-app-panel-frame"
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img
          src={src}
          alt={alt}
          className="live-app-panel-img"
          width={1024}
          height={compact ? 546 : 550}
          loading="lazy"
          decoding="async"
        />
        <div className="live-app-panel-shine" aria-hidden />
        <div className="live-app-panel-live">
          <span className="live-app-panel-dot" />
          Canlı önizleme
        </div>
      </motion.div>
      {caption ? <p className="live-app-panel-caption">{caption}</p> : null}
    </div>
  )
}
