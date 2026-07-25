import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { SectionDragHandle } from './SortableProcessList'

/**
 * Süreçler Yönetimi bölüm kabuğu — Müşteriler paneli ile aynı açılır tasarım.
 */
export default function CollapsibleProcessSection({
  title,
  summary = '',
  defaultOpen = false,
  children,
  className = '',
  dragHandleProps = null,
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className={`card card-no-frame space-y-4 ${className}`.trim()}>
      <div className="flex w-full items-start gap-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex min-w-0 flex-1 items-start justify-between gap-3 text-left"
          aria-expanded={open}
        >
          <div className="min-w-0">
            <h2 className="text-base font-black text-white">{title}</h2>
            {summary ? <p className="mt-1 text-xs font-semibold text-gray-500">{summary}</p> : null}
          </div>
          <div className="mt-0.5 flex shrink-0 items-center gap-1.5 text-gray-400">
            <span className="text-xs font-bold">{open ? 'Gizle' : 'Aç'}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
        <SectionDragHandle dragHandleProps={dragHandleProps} />
      </div>
      {open ? children : null}
    </section>
  )
}
