'use client'

import { MousePointer2 } from 'lucide-react'

export default function StudioLiveCanvas() {
  return (
    <div className="spl-canvas spl-canvas-live" aria-hidden>
      <div className="spl-canvas-glow" />
      <div className="spl-canvas-chrome">
        <span className="spl-canvas-dots">
          <i />
          <i />
          <i />
        </span>
        <img
          src="/assets/bachmain-studio-logo.png"
          alt=""
          width={140}
          height={28}
          className="spl-canvas-wordmark"
          draggable={false}
        />
        <span className="spl-canvas-chip spl-canvas-chip-live">Canlı düzenleme</span>
      </div>
      <div className="spl-canvas-stage">
        <div className="spl-canvas-rail">
          <em className="is-on" />
          <em className="is-pulse" />
          <em />
          <em />
          <em />
        </div>
        <div className="spl-canvas-board">
          <nav className="spl-live-nav">
            <b>Atelier</b>
            <span>Vitrin</span>
            <span>Koleksiyon</span>
            <span>İletişim</span>
          </nav>
          <div className="spl-block spl-block-hero">
            <strong>Hero</strong>
            <b>Vitrin sahnesi</b>
            <p>Başlığı seçin, görseli kaydırın, yayına alın.</p>
          </div>
          <div className="spl-block-row">
            <article className="spl-tile spl-tile-a">
              <i />
              Hizmetler
            </article>
            <article className="spl-tile spl-tile-b">
              <i />
              Galeri
            </article>
            <article className="spl-tile spl-tile-c">
              <i />
              İletişim
            </article>
          </div>
          <div className="spl-live-bar">
            <span>SEO 98</span>
            <span>Domain bağlı</span>
            <span className="is-pub">Yayında</span>
          </div>
          <div className="spl-cursor">
            <MousePointer2 className="h-6 w-6" />
            <span>Sürükle</span>
          </div>
          <div className="spl-float-card">Blok eklendi</div>
        </div>
      </div>
    </div>
  )
}
