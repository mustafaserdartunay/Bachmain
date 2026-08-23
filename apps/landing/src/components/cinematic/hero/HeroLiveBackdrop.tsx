'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { HERO_POSTER, HERO_POSTER_FALLBACK, HERO_VIDEO_MP4, HERO_VIDEO_WEBM } from './heroMedia'
import { useIsCoarsePointer, usePrefersReducedMotion } from '../useCinematicMotion'

type Mode = 'checking' | 'video' | 'image'

/**
 * Tam ekran sinematik arka zemin.
 * 1) bachy-hero-loop.mp4 varsa → sessiz loop video (canlı)
 * 2) yoksa → referans görsel + Ken Burns + parallax (video hissi)
 */
export default function HeroLiveBackdrop() {
  const reduce = usePrefersReducedMotion()
  const coarse = useIsCoarsePointer()
  const shellRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mode, setMode] = useState<Mode>('checking')

  useEffect(() => {
    let cancelled = false
    fetch(HERO_VIDEO_MP4, { method: 'HEAD' })
      .then((res) => {
        if (cancelled) return
        setMode(res.ok ? 'video' : 'image')
      })
      .catch(() => {
        if (!cancelled) setMode('image')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (reduce || coarse || mode !== 'video') return
    const video = videoRef.current
    if (!video) return

    const play = () => {
      video.play().catch(() => setMode('image'))
    }
    play()

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!video) return
        if (entry.isIntersecting) play()
        else video.pause()
      },
      { threshold: 0.12 },
    )
    obs.observe(video)
    return () => obs.disconnect()
  }, [coarse, mode, reduce])

  useEffect(() => {
    if (reduce || coarse) return
    const shell = shellRef.current
    if (!shell) return

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2
      const ny = (e.clientY / window.innerHeight - 0.5) * 2
      gsap.to(shell, {
        x: nx * 12,
        y: ny * 7,
        duration: 0.9,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [coarse, reduce])

  const showVideo = mode === 'video' && !reduce
  const showImage = mode === 'image' || reduce || mode === 'checking'
  const animateImage = showImage && !reduce

  return (
    <div ref={shellRef} className="cine-live-backdrop" aria-hidden>
      <div className="cine-live-backdrop__scroll">
        <div
          ref={mediaRef}
          className={`cine-live-backdrop__media${animateImage ? ' is-animated' : ''}`}
        >
          {showVideo ? (
            <video
              ref={videoRef}
              className="cine-live-backdrop__video"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={HERO_POSTER}
              onError={() => setMode('image')}
            >
              <source src={HERO_VIDEO_WEBM} type="video/webm" />
              <source src={HERO_VIDEO_MP4} type="video/mp4" />
            </video>
          ) : null}

          {showImage ? (
            <img
              src={HERO_POSTER}
              alt=""
              className="cine-live-backdrop__poster"
              decoding="async"
              draggable={false}
              onError={(e) => {
                const img = e.currentTarget
                if (img.src.includes(HERO_POSTER_FALLBACK)) return
                img.src = HERO_POSTER_FALLBACK
              }}
            />
          ) : null}
        </div>
      </div>

      <div className="cine-live-backdrop__grid-flow" />
      <div className="cine-live-backdrop__scan" />
      <div className="cine-live-backdrop__vignette" />
    </div>
  )
}
