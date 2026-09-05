'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Globe2, MousePointer2, Rocket, ShieldCheck } from 'lucide-react'
import ParticleField from '../components/cinematic/hero/ParticleField'
import './studio-landing.css'

const ease = [0.22, 1, 0.36, 1] as const

export default function StudioPage() {
  const reduceMotion = useReducedMotion()
  const enter = (delay = 0) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease },
        }

  return (
    <div className="spl spl-simple">
      <section className="spl-hero" aria-labelledby="studio-hero-heading">
        <div className="spl-hero-veil" aria-hidden />
        {reduceMotion ? null : <ParticleField />}
        <div className="spl-hero-layout">
          <motion.div {...enter(0.06)}>
            <h1 id="studio-hero-heading" className="spl-title">
              Sitenizi <em>sürükleyip</em> kurun.
            </h1>
            <p className="spl-lead">
              Canlı tuval, şablonlar, SEO ve yayın — tek Studio panelinde. Kod yok. Taslağı
              kaydedin, tek tıkla canlıya alın.
            </p>
            <ul className="spl-notes">
              <li>
                <MousePointer2 className="h-3.5 w-3.5" aria-hidden /> Sürükle-bırak düzenleme
              </li>
              <li>
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Size özel çalışma alanı
              </li>
              <li>
                <Globe2 className="h-3.5 w-3.5" aria-hidden /> Domain ve yayın aynı yerde
              </li>
            </ul>
          </motion.div>

          <motion.div
            className="spl-canvas"
            {...(reduceMotion
              ? { initial: false, animate: { opacity: 1 } }
              : {
                  initial: { opacity: 0, y: 22 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.7, delay: 0.12, ease },
                })}
            aria-hidden
          >
            <div className="spl-canvas-chrome">
              <img
                src="/assets/bachmain-studio-logo.png"
                alt=""
                width={140}
                height={28}
                style={{ height: '1.15rem', width: 'auto' }}
                draggable={false}
              />
              <span className="spl-canvas-chip">Canlı düzenleme</span>
            </div>
            <div className="spl-canvas-stage">
              <div className="spl-canvas-rail">
                <em className="is-on" />
                <em />
                <em />
                <em />
              </div>
              <div className="spl-canvas-board">
                <div className="spl-block spl-block-hero">
                  <strong>Hero</strong>
                  <b>Vitrin sahnesi</b>
                </div>
                <div className="spl-block-row">
                  <article>Hizmetler</article>
                  <article>Galeri</article>
                  <article>İletişim</article>
                </div>
                <div className="spl-cursor">
                  <MousePointer2 className="h-5 w-5" />
                  <span>Sürükle</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="spl-pack" id="ozellikler">
        <div className="spl-pack-card">
          <img
            src="/assets/bachmain-studio-logo.png"
            alt="Bachmain Studio"
            width={200}
            height={40}
            className="spl-logo-mark"
            draggable={false}
          />
          <h2>Bachmain Studio</h2>
          <p>Sürükle-bırak web sitesi, şablonlar ve yayın paneli. Tek paket, tek fiyat.</p>
          <strong className="spl-price">990,00₺</strong>
          <span className="spl-price-note">aylık</span>
          <a href="/studio/paket" className="spl-btn spl-btn-buy">
            <Rocket className="h-4 w-4" aria-hidden />
            Modül Seç
          </a>
        </div>
      </section>
    </div>
  )
}
