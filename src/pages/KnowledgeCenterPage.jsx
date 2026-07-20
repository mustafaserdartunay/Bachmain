import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Archive,
  BookOpen,
  FileText,
  HelpCircle,
  Library,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { knowledgeSubMenus } from '../data/knowledgeMenu'
import {
  addFaqLocal,
  createKnowledgeDoc,
  ensureKnowledgeSeed,
  listFaqLocal,
  listKnowledgeDocs,
  overviewLocal,
  ragLocal,
  searchLocalKnowledge,
} from '../knowledge/localStore'

const TABS = knowledgeSubMenus.map((m) => ({ id: m.id, label: m.label }))

export default function KnowledgeCenterPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'dashboard'
  const [docs, setDocs] = useState([])
  const [faq, setFaq] = useState([])
  const [overview, setOverview] = useState(() => overviewLocal())
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState([])
  const [rag, setRag] = useState(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('general')
  const [faqQ, setFaqQ] = useState('')
  const [faqA, setFaqA] = useState('')
  const [msg, setMsg] = useState('')

  function refresh() {
    setDocs(listKnowledgeDocs())
    setFaq(listFaqLocal())
    setOverview(overviewLocal())
  }

  useEffect(() => {
    ensureKnowledgeSeed()
    refresh()
    function onUp() {
      refresh()
    }
    window.addEventListener('bach:knowledge-updated', onUp)
    return () => window.removeEventListener('bach:knowledge-updated', onUp)
  }, [])

  const filteredDocs = useMemo(() => {
    if (tab === 'archive') return docs.filter((d) => d.status === 'archived')
    if (tab === 'sop') return docs.filter((d) => d.category === 'sop')
    if (tab === 'procedures') return docs.filter((d) => d.category === 'procedures')
    if (tab === 'policies') return docs.filter((d) => d.category === 'policies')
    if (tab === 'wiki') return docs.filter((d) => d.category === 'wiki')
    if (tab === 'videos') return docs.filter((d) => d.docType === 'video')
    if (tab === 'bank' || tab === 'documents') return docs
    return docs
  }, [docs, tab])

  function setTab(id) {
    const next = new URLSearchParams(params)
    if (id === 'dashboard') next.delete('tab')
    else next.set('tab', id)
    setParams(next, { replace: true })
  }

  function handleIngest(e) {
    e.preventDefault()
    if (!title.trim()) return
    createKnowledgeDoc({
      title: title.trim(),
      contentText: body,
      category,
      tags: [],
    })
    setTitle('')
    setBody('')
    setMsg('Belge indekslendi')
    setTimeout(() => setMsg(''), 2000)
    refresh()
  }

  function handleSearch(e) {
    e?.preventDefault()
    if (!query.trim()) return
    setHits(searchLocalKnowledge(query.trim()))
    setRag(ragLocal(query.trim()))
    setOverview(overviewLocal())
  }

  function handleFaq(e) {
    e.preventDefault()
    if (!faqQ.trim() || !faqA.trim()) return
    addFaqLocal(faqQ.trim(), faqA.trim())
    setFaqQ('')
    setFaqA('')
    refresh()
  }

  return (
    <div className="w-full space-y-5 pb-8">
      <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-300">
              <Library className="h-5 w-5" />
              <h1 className="text-xl font-black uppercase tracking-wide">Knowledge Center</h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Şirket belgelerinin tek indeks katmanı. AI cevapları önce burada arar (RAG). Belge
              Merkezi şablon/yazdırma içindir; Knowledge indeks ve arama içindir.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/aios"
              className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-black uppercase tracking-wide text-violet-200"
            >
              <Sparkles className="h-4 w-4" />
              AIOS
            </Link>
            <Link
              to="/belge-merkezi"
              className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 py-2 text-xs font-black uppercase tracking-wide text-gray-300"
            >
              <FileText className="h-4 w-4" />
              Belge Merkezi
            </Link>
          </div>
        </div>
        {msg ? <p className="mt-2 text-xs font-bold text-emerald-300">{msg}</p> : null}
      </section>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wide ${
              tab === t.id
                ? 'bg-sky-500/20 text-sky-200'
                : 'bg-dark-800/80 text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Toplam Belge', value: overview.totalDocuments, icon: BookOpen },
            { label: 'OCR Bekleyen', value: overview.ocrPending, icon: Upload },
            { label: 'Eksik Etiket', value: overview.missingTags, icon: Archive },
            { label: 'İndeks Hazır', value: overview.indexedReady, icon: Library },
          ].map((m) => (
            <div key={m.label} className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
              <div className="flex items-center gap-2 text-gray-400">
                <m.icon className="h-4 w-4" />
                <span className="text-[11px] font-black uppercase">{m.label}</span>
              </div>
              <div className="mt-2 text-3xl font-black text-white">{m.value}</div>
            </div>
          ))}
          <div className={`${APP_SURFACE_PANEL_CLASS} p-4 sm:col-span-2 lg:col-span-4`}>
            <h2 className="text-xs font-black uppercase text-gray-400">En çok aranan</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {(overview.topQueries || []).length === 0 ? (
                <li className="text-xs text-gray-500">Henüz arama yok</li>
              ) : (
                overview.topQueries.map((q) => (
                  <li
                    key={q.query}
                    className="rounded-full border border-dark-500/50 px-3 py-1 text-xs text-gray-300"
                  >
                    {q.query} · {q.count}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {(tab === 'documents' ||
        tab === 'bank' ||
        tab === 'sop' ||
        tab === 'procedures' ||
        tab === 'policies' ||
        tab === 'wiki' ||
        tab === 'videos' ||
        tab === 'archive' ||
        tab === 'versions' ||
        tab === 'memory') && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
            <h2 className="text-sm font-black uppercase text-gray-300">Belge yükle / indeksle</h2>
            <p className="mt-1 text-xs text-gray-500">
              KP-0: metin ingest + yerel indeks. OCR/embedding API sonraki faz.
            </p>
            <form onSubmit={handleIngest} className="mt-3 space-y-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Başlık"
                className="w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2 text-sm text-white outline-none"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2 text-sm text-white"
              >
                <option value="general">Genel</option>
                <option value="sop">İş Talimatı</option>
                <option value="procedures">Prosedür</option>
                <option value="policies">Politika</option>
                <option value="wiki">Wiki</option>
                <option value="faq">FAQ</option>
              </select>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder="İçerik (PDF/DOCX metin çıkarımı KP-1)"
                className="w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2 text-sm text-white outline-none"
              />
              <button
                type="submit"
                className="rounded-xl border border-sky-500/40 bg-sky-500/15 px-4 py-2 text-xs font-black uppercase text-sky-200"
              >
                İndeksle
              </button>
            </form>
          </section>
          <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
            <h2 className="text-sm font-black uppercase text-gray-300">
              Belgeler · {filteredDocs.length}
            </h2>
            <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto">
              {filteredDocs.map((d) => (
                <li
                  key={d.id}
                  className="rounded-xl border border-dark-500/40 bg-dark-800/50 px-3 py-2.5"
                >
                  <div className="text-sm font-bold text-white">{d.title}</div>
                  <div className="text-[11px] text-gray-500">
                    {d.category} · v{d.currentVersion} · {d.indexStatus} · {d.docType}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-400">{d.summary}</p>
                  {tab === 'versions' && d.versions?.length ? (
                    <ul className="mt-1 text-[10px] text-gray-500">
                      {d.versions.map((v) => (
                        <li key={v.version}>
                          v{v.version} · {v.changelog}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {(tab === 'search' || tab === 'dashboard') && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <div className="flex items-center gap-2 text-gray-300">
            <Search className="h-4 w-4" />
            <h2 className="text-sm font-black uppercase">Doğal dil arama + RAG</h2>
          </div>
          <form onSubmit={handleSearch} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Örn: Geçen yıl Almanya’ya gönderilen kırmızı çikolata kutuları"
              className="min-w-0 flex-1 rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2.5 text-sm text-white outline-none"
            />
            <button
              type="submit"
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-black uppercase text-emerald-200"
            >
              Ara
            </button>
          </form>
          {hits.length > 0 && (
            <ul className="mt-4 space-y-2">
              {hits.map((h) => (
                <li key={h.documentId} className="rounded-xl border border-dark-500/40 px-3 py-2">
                  <div className="flex justify-between gap-2">
                    <span className="text-sm font-bold text-white">{h.title}</span>
                    <span className="text-[10px] text-gray-500">{Math.round(h.score * 100)}%</span>
                  </div>
                  <p className="text-xs text-gray-400">{h.snippet}</p>
                </li>
              ))}
            </ul>
          )}
          {rag?.prompt ? (
            <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-dark-900/80 p-3 text-[11px] text-gray-400">
              {rag.prompt}
            </pre>
          ) : null}
        </section>
      )}

      {tab === 'faq' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
            <div className="flex items-center gap-2 text-gray-300">
              <HelpCircle className="h-4 w-4" />
              <h2 className="text-sm font-black uppercase">FAQ ekle</h2>
            </div>
            <form onSubmit={handleFaq} className="mt-3 space-y-2">
              <input
                value={faqQ}
                onChange={(e) => setFaqQ(e.target.value)}
                placeholder="Soru"
                className="w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2 text-sm text-white"
              />
              <textarea
                value={faqA}
                onChange={(e) => setFaqA(e.target.value)}
                rows={4}
                placeholder="Cevap"
                className="w-full rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2 text-sm text-white"
              />
              <button
                type="submit"
                className="rounded-xl border border-sky-500/40 bg-sky-500/15 px-4 py-2 text-xs font-black uppercase text-sky-200"
              >
                Kaydet
              </button>
            </form>
          </section>
          <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
            <ul className="space-y-2">
              {faq.map((f) => (
                <li key={f.id} className="rounded-xl border border-dark-500/40 px-3 py-2">
                  <div className="text-sm font-bold text-white">{f.question}</div>
                  <p className="text-xs text-gray-400">{f.answer}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}
