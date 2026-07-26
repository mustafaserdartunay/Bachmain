'use client'

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FAQ_CENTER, listFaqCategories } from '../../geo/faqCenter'
import RelatedTopics from './RelatedTopics'

export default function FaqCenterView() {
  const categories = ['Tümü', ...listFaqCategories()]
  const [cat, setCat] = useState('Tümü')
  const [q, setQ] = useState('')
  const items = useMemo(() => {
    const base = cat === 'Tümü' ? FAQ_CENTER : FAQ_CENTER.filter((f) => f.category === cat)
    const needle = q.trim().toLowerCase()
    if (!needle) return base
    return base.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(needle))
  }, [cat, q])

  return (
    <div className="page-mesh">
      <header className="page-hero text-center">
        <span className="pill">SSS Merkezi</span>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-900">Sık Sorulan Sorular</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-500">
          CRM, ERP, e-fatura, stok, WhatsApp CRM ve yapay zekâ hakkında {FAQ_CENTER.length}+ soru.
        </p>
        <form
          role="search"
          className="mx-auto mt-8 max-w-xl px-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <label htmlFor="sss-search" className="sr-only">
            SSS ara
          </label>
          <input
            id="sss-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Örn. CRM nedir, e-fatura zorunlu mu…"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-blue-500/30 focus:ring-2"
          />
        </form>
      </header>

      <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2 px-4 pb-4">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
              cat === c
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <section className="section-pad pt-4">
        <div className="mx-auto max-w-3xl space-y-3 px-4 lg:px-8">
          {items.map((item) => (
            <details key={item.q} className="saas-card group p-0">
              <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-slate-800 marker:content-none">
                <span className="mr-2 text-[10px] font-bold uppercase text-blue-600">
                  {item.category}
                </span>
                {item.q}
              </summary>
              <p className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-500">
                {item.a}
              </p>
            </details>
          ))}
          {!items.length ? <p className="text-center text-sm text-slate-500">Sonuç yok.</p> : null}
        </div>
      </section>

      <RelatedTopics
        items={[
          { label: 'Knowledge Base', path: '/knowledge' },
          { label: 'Yardım Merkezi', path: '/help-center' },
          { label: 'Klasik SSS', path: '/faq' },
          { label: 'Yardım', path: '/help' },
        ]}
      />
      <p className="pb-10 text-center text-sm text-slate-500">
        <Link to="/knowledge" className="font-semibold text-blue-600 hover:underline">
          Rehberleri oku
        </Link>
      </p>
    </div>
  )
}
