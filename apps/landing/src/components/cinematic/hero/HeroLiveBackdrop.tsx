'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { HERO_POSTER, HERO_POSTER_FALLBACK, HERO_VIDEO_MP4 } from './heroMedia'
import { useIsCoarsePointer, usePrefersReducedMotion } from '../useCinematicMotion'

type Mode = 'video' | 'image'

/**
 * Tam ekran 4K loop video.
 * Poster yalnızca video hazır olana kadar; oynarken sabit ördek görseli kalmaz.
 */
export default function HeroLiveBackdrop() {
  const reduce = usePrefersReducedMotion()
  const coarse = useIsCoarsePointer()
  const shellRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mode, setMode] = useState<Mode>(reduce ? 'image' : 'video')
  const [videoReady, setVideoReady] = useState(false)

  const ensurePlay = useCallback(() => {
    const video = videoRef.current
    if (!video || reduce || mode !== 'video') return
    video.muted = true
    video.defaultMuted = true
    video.loop = true
    video.playsInline = true
    const attempt = () => {
      const p = video.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          /* autoplay policy — sonraki etkileşimde tekrar dene */
        })
      }
    }
    if (video.readyState >= 2) attempt()
    else video.addEventListener('canplay', attempt, { once: true })
  }, [mode, reduce])

  useEffect(() => {
    if (reduce) {
      setMode('image')
      return
    }
    let cancelled = false
    fetch(HERO_VIDEO_MP4, { method: 'HEAD' })
      .then((res) => {
        if (cancelled) return
        if (res.ok) setMode('video')
        else setMode('image')
      })
      .catch(() => {
        if (!cancelled) setMode('image')
      })
    return () => {
      cancelled = true
    }
  }, [reduce])

  useEffect(() => {
    if (reduce || mode !== 'video') return
    const video = videoRef.current
    if (!video) return

    ensurePlay()

    const markReady = () => {
      setVideoReady(true)
      ensurePlay()
    }

    video.addEventListener('playing', markReady)
    video.addEventListener('loadeddata', markReady)
    video.addEventListener('canplay', markReady)

    const onVisible = () => {
      if (document.visibilityState === 'visible') ensurePlay()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', ensurePlay)
    window.addEventListener('focus', ensurePlay)

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) ensurePlay()
      },
      { threshold: 0.02 },
    )
    obs.observe(video)

    const tick = window.setInterval(() => {
      if (document.visibilityState === 'visible' && video.paused) ensurePlay()
    }, 1600)

    return () => {
      video.removeEventListener('playing', markReady)
      video.removeEventListener('loadeddata', markReady)
      video.removeEventListener('canplay', markReady)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', ensurePlay)
      window.removeEventListener('focus', ensurePlay)
      obs.disconnect()
      window.clearInterval(tick)
    }
  }, [ensurePlay, mode, reduce])

  useEffect(() => {
    if (reduce || coarse) return
    const shell = shellRef.current
    if (!shell) return

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2
      const ny = (e.clientY / window.innerHeight - 0.5) * 2
      gsap.to(shell, {
        x: nx * 6,
        y: ny * 3,
        duration: 0.9,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [coarse, reduce])

  const showVideo = mode === 'video' && !reduce
  /* Poster yalnızca video yokken veya video henüz ilk karesini vermeden */
  const showPoster = !showVideo || !videoReady

  return (
    <div ref={shellRef} className="cine-live-backdrop" aria-hidden>
      <div className="cine-live-backdrop__scroll">
        <div
          className={`cine-live-backdrop__media${showPoster && !showVideo ? ' is-animated' : ''}`}
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
              /* poster attribute kullanma — sabit ördek görseli arkada kalmasın */
              onPlaying={() => setVideoReady(true)}
              onLoadedData={() => {
                setVideoReady(true)
                ensurePlay()
              }}
              onCanPlay={ensurePlay}
              onError={() => {
                setMode('image')
                setVideoReady(false)
              }}
            >
              <source src={HERO_VIDEO_MP4} type="video/mp4" />
            </video>
          ) : null}

          {showPoster ? (
            <img
              src={HERO_POSTER}
              alt=""
              className={`cine-live-backdrop__poster${showVideo ? ' is-pending' : ''}`}
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

      {/* Sabit sahne görseli video üstünde hayalet oluşturmasın */}
      {!showVideo ? <div className="cine-live-backdrop__grid-flow" /> : null}
      <div className="cine-live-backdrop__scan" />
      <div className="cine-live-backdrop__vignette" />
    </div>
  )
}
