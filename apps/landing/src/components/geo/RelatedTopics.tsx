'use client'

import { Link } from 'react-router-dom'

type Item = { label: string; path: string }

export default function RelatedTopics({
  title = 'İlgili konular',
  items,
}: {
  title?: string
  items: Item[]
}) {
  if (!items?.length) return null
  return (
    <section
      className="section-pad border-t border-slate-100/80"
      aria-labelledby="related-topics-heading"
    >
      <div className="mx-auto max-w-3xl px-4 lg:px-8">
        <h2 id="related-topics-heading" className="text-xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        <ul className="mt-5 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.path + item.label}>
              <Link
                to={item.path}
                className="inline-flex rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
