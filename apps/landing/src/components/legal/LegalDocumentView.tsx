'use client'

import { Download, Printer } from 'lucide-react'
import { LAWYER_NOTICE } from '../../legal/catalog'

type Props = {
  title: string
  version?: string
  publishedAt?: string | null
  revisionAt?: string | null
  bodyHtml: string
  companyName?: string
}

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso.slice(0, 10)
  }
}

export default function LegalDocumentView({
  title,
  version = '1.0.0',
  publishedAt,
  revisionAt,
  bodyHtml,
  companyName = 'BachMain Yazılım Teknoloji ve Bilişim Hizmetleri A.Ş.',
}: Props) {
  const onPrint = () => window.print()

  const onPdf = () => {
    // Browser print-to-PDF keeps design without extra deps
    window.print()
  }

  return (
    <div className="page-mesh legal-doc-page">
      <section className="mx-auto max-w-3xl px-4 pb-6 pt-10 sm:px-6 print:max-w-none print:px-0 print:pt-0">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm sm:p-8 print:border-0 print:bg-white print:p-0 print:shadow-none">
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium leading-relaxed text-amber-950 print:border print:text-xs">
            {LAWYER_NOTICE}
          </p>

          <header className="border-b border-slate-100 pb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {companyName}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <span>
                Versiyon: <strong className="tabular-nums text-slate-900">{version}</strong>
              </span>
              <span>
                Yayın: <strong className="text-slate-900">{formatDate(publishedAt)}</strong>
              </span>
              <span>
                Son güncelleme:{' '}
                <strong className="text-slate-900">{formatDate(revisionAt || publishedAt)}</strong>
              </span>
            </div>
          </header>

          <div className="mt-5 flex flex-wrap gap-3 print:hidden">
            <button
              type="button"
              onClick={onPrint}
              className="btn-primary inline-flex h-[52px] items-center gap-2 rounded-xl px-5 text-sm font-bold text-white"
            >
              <Printer className="h-4 w-4" aria-hidden />
              Yazdır
            </button>
            <button
              type="button"
              onClick={onPdf}
              className="inline-flex h-[52px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4" aria-hidden />
              PDF İndir
            </button>
          </div>

          <article
            className="legal-prose mt-8 space-y-4 text-base leading-relaxed text-slate-700 [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:text-slate-900 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </div>
      </section>
    </div>
  )
}
