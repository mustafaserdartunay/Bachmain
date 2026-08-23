'use client'

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { STORY_MODULES } from '../../../data/cinematicStory'
import ModuleStoryAct from './ModuleStoryAct'

/** Otomatik kayan, büyük modül slider — scroll pin yok. */
export default function ScrollStory() {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const total = STORY_MODULES.length

  useEffect(() => {
    if (reduce || total < 2) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % total)
    }, 4200)
    return () => window.clearInterval(id)
  }, [reduce, total])

  const go = (dir: number) => setIndex((i) => (i + dir + total) % total)

  return (
    <section
      className="cine-story cine-story--dynamic cine-story--slider"
      aria-label="Modül hikâyesi"
    >
      <div className="cine-story-shell cine-story-shell--wide">
        <div className="cine-story-head">
          <p className="cine-kicker">Modül geçişleri</p>
          <h2 className="cine-story-heading">Tüm modüller tek hikâyede</h2>
          <p className="cine-story-sub">
            CRM’den finansa, üretimden Studio’ya — her modül aynı ekosistemde, otomatik akışla.
          </p>
        </div>

        <div className="cine-story-slider-frame">
          <button
            type="button"
            className="cine-story-nav cine-story-nav--prev"
            onClick={() => go(-1)}
            aria-label="Önceki modül"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="cine-story-stage cine-story-stage--slider" aria-live="polite">
            {STORY_MODULES.map((mod, i) => (
              <div
                key={mod.id}
                className={`cine-story-slide${i === index ? ' is-active' : ''}`}
                aria-hidden={i !== index}
              >
                <ModuleStoryAct mod={mod} active={i === index} />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="cine-story-nav cine-story-nav--next"
            onClick={() => go(1)}
            aria-label="Sonraki modül"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="cine-story-progress" role="tablist" aria-label="Modül seçimi">
          {STORY_MODULES.map((m, i) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`cine-story-dot${i === index ? ' is-active' : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>

        <div className="cine-story-cta-row">
          <Link to={STORY_MODULES[index]?.href || '/crm'} className="cine-btn cine-btn-primary">
            {STORY_MODULES[index]?.title} modülünü incele <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
