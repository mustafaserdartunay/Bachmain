'use client'

import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import '../../views/studio-landing.css'

type Props = {
  kicker: string
  title: string
  lead: string
  wide?: boolean
  children: ReactNode
}

export default function StudioAuthShell({ kicker, title, lead, wide, children }: Props) {
  return (
    <div className="spl spl-simple spl-paket">
      <section className={`spl-paket-wrap ${wide ? 'spl-auth-wide' : ''}`}>
        <Link to="/" className="spl-home-btn">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Bachmain ana sayfa
        </Link>
        <img
          src="/assets/bachmain-studio-logo.png"
          alt="Bachmain Studio"
          width={200}
          height={40}
          className="spl-logo-mark"
          draggable={false}
        />
        <p className="spl-paket-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="spl-paket-lead">{lead}</p>
        <div className={`spl-pack-card ${wide ? 'spl-auth-card' : ''}`}>{children}</div>
      </section>
    </div>
  )
}
