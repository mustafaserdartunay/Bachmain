'use client'

import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { StoryModule } from '../../../data/cinematicStory'

type Props = {
  mod: StoryModule
  active?: boolean
}

export default function ModuleStoryAct({ mod, active = false }: Props) {
  return (
    <article
      className={`cine-act cine-act-${mod.tone}${active ? ' is-active' : ''}`}
      data-module={mod.id}
      style={{ ['--cine-act-glow' as string]: mod.glow }}
    >
      <span className="cine-act-tag">{mod.title}</span>
      <h2 className="cine-act-title">{mod.headline}</h2>
      <p className="cine-act-body">{mod.body}</p>
      <Link to={mod.href} className="cine-act-link">
        Keşfet <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  )
}
