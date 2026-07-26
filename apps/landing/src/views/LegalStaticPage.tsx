'use client'

import LegalDocumentView from '../components/legal/LegalDocumentView'
import { getStaticLegalDoc } from '../legal/staticDocs'

export default function LegalStaticPage({ slug }: { slug: string }) {
  const doc = getStaticLegalDoc(slug)
  if (!doc) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-600">
        Sözleşme bulunamadı.
      </div>
    )
  }
  return (
    <LegalDocumentView
      title={doc.title}
      version={doc.version}
      publishedAt={doc.publishedAt}
      revisionAt={doc.revisionAt}
      bodyHtml={doc.bodyHtml}
      companyName={doc.companyName}
    />
  )
}
