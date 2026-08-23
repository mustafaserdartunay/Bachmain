'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { STORY_MODULES } from '../../../data/cinematicStory'
import { useIsCoarsePointer } from '../useCinematicMotion'
import CinematicModules from './CinematicModules'
import ModuleStoryAct from './ModuleStoryAct'

export default function ScrollStory() {
  const reduce = useReducedMotion()
  const coarse = useIsCoarsePointer()
  const pinRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const simple = reduce || coarse

  useEffect(() => {
    if (simple) return
    const pin = pinRef.current
    const stage = stageRef.current
    if (!pin || !stage) return

    gsap.registerPlugin(ScrollTrigger)
    const cards = gsap.utils.toArray<HTMLElement>('.cine-act', stage)
    if (!cards.length) return

    gsap.set(cards, { autoAlpha: 0, y: 56, scale: 0.94, filter: 'blur(8px)' })
    gsap.set(cards[0], { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)' })
    cards[0]?.classList.add('is-active')

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => `+=${cards.length * 620}`,
          pin: true,
          scrub: 0.85,
          anticipatePin: 1,
        },
      })

      cards.forEach((card, i) => {
        if (i === 0) return
        const prev = cards[i - 1]
        tl.to(
          prev,
          {
            autoAlpha: 0,
            y: -72,
            x: -80,
            scale: 0.88,
            filter: 'blur(10px)',
            duration: 1,
            ease: 'none',
            onComplete: () => prev.classList.remove('is-active'),
          },
          i,
        ).fromTo(
          card,
          { autoAlpha: 0, y: 72, x: 80, scale: 0.9, filter: 'blur(10px)' },
          {
            autoAlpha: 1,
            y: 0,
            x: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 1,
            ease: 'none',
            onStart: () => card.classList.add('is-active'),
          },
          i,
        )
      })
    }, pin)

    ScrollTrigger.refresh()
    return () => ctx.revert()
  }, [simple])

  if (simple) {
    return (
      <section className="cine-modules-fallback" aria-label="Bachmain modülleri">
        <div className="cine-modules-fallback-head">
          <p className="cine-kicker">Modüller</p>
          <h2 className="cine-problem-title">Tüm süreçler tek ekosistemde.</h2>
        </div>
        <CinematicModules />
      </section>
    )
  }

  return (
    <section className="cine-story" aria-label="Modül hikâyesi">
      <div ref={pinRef} className="cine-story-pin">
        <div className="cine-story-shell">
          <p className="cine-kicker">Modül geçişleri</p>
          <h2 className="cine-story-heading">Tüm modüller tek hikâyede</h2>
          <div ref={stageRef} className="cine-story-stage">
            {STORY_MODULES.map((mod, i) => (
              <ModuleStoryAct key={mod.id} mod={mod} active={i === 0} />
            ))}
          </div>
          <div className="cine-story-progress" aria-hidden>
            {STORY_MODULES.map((m) => (
              <span key={m.id} className="cine-story-dot" data-module={m.id} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
