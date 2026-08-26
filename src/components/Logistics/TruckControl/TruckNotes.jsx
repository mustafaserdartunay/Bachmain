import { useState } from 'react'
import { formatClock } from '../../../utils/truckControlCenter'
import { APP_SURFACE_PANEL_CLASS } from '../../../utils/dashboardDesign'
import { TCC_INPUT, TCC_MUTED, TCC_YF, TCC_YFB } from './truckControlUi'

export default function TruckNotes({ notes, onAdd }) {
  const [text, setText] = useState('')

  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
      <p className={`${TCC_YFB} uppercase`}>Notlar</p>
      <div className="mt-3 space-y-3">
        {notes.map((note) => (
          <article key={note.id} className="rounded-xl border border-[var(--glass-border)] p-3">
            <p className={TCC_MUTED}>
              {note.author} · {formatClock(note.at)}
            </p>
            <p className={`${TCC_YF} mt-1`}>{note.text}</p>
          </article>
        ))}
        {!notes.length ? <p className={TCC_MUTED}>Kayıtlı lojistik notu yok.</p> : null}
      </div>
      <form
        className="mt-4 grid gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (!text.trim()) return
          onAdd?.(text.trim())
          setText('')
        }}
      >
        <textarea
          className={`${TCC_INPUT} h-24 py-2`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Lojistik sorumlusu notu"
        />
        <button type="submit" className="btn-primary w-fit">
          Not ekle
        </button>
      </form>
    </section>
  )
}
