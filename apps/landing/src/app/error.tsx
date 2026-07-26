'use client'

import { useEffect } from 'react'
import Link from 'next/link'

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/** Route-level error UI (App Router). Design-safe, SEO-neutral. */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Keep production silent; digest available for support
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error(error)
    }
  }, [error])

  return (
    <div className="page-mesh">
      <section className="page-hero text-center" aria-labelledby="error-heading">
        <p className="pill">500</p>
        <h1
          id="error-heading"
          className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 lg:text-5xl"
        >
          Bir şeyler ters gitti
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
          Beklenmeyen bir hata oluştu. Sayfayı yenileyebilir veya ana sayfaya dönebilirsiniz.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => reset()}>
            Tekrar dene
          </button>
          <Link href="/" className="btn-secondary">
            Ana sayfa
          </Link>
        </div>
      </section>
    </div>
  )
}
