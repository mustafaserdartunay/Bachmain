'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * Gerçek uygulama ekran görüntüsü — hafif canlı hareket.
 */
export default function LiveAppPanel({
  src,
  srcSet,
  alt,
  caption,
  className = '',
  compact = false,
  cinematic = false,
  width = 1536,
  height = 1024,
}) {
  const reduce = useReducedMotion()

  return (
    <div
      className={`live-app-panel ${compact ? 'live-app-panel--compact' : ''} ${
        cinematic ? 'live-app-panel--cinematic' : ''
      } ${className}`}
    >
      <motion.div
        className="live-app-panel-frame"
        animate={
          reduce
            ? undefined
            : cinematic
              ? { y: [0, -10, 0], rotateX: [0, 0.6, 0] }
              : { y: [0, -4, 0] }
        }
        transition={{ duration: cinematic ? 8 : 6.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img
          src={src}
          srcSet={srcSet}
          sizes={cinematic ? '(min-width: 1280px) 1240px, 100vw' : '100vw'}
          alt={alt}
          className="live-app-panel-img"
          width={width}
          height={height}
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
