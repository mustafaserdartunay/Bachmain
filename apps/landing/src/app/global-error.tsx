'use client'

import { useEffect } from 'react'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

/** Root layout failure fallback — must include html/body. */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error(error)
    }
  }, [error])

  return (
    <html lang="tr">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f4f7fb' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <p style={{ fontWeight: 700, color: '#2563eb', letterSpacing: '0.06em' }}>500</p>
          <h1 style={{ marginTop: '0.75rem', fontSize: '1.75rem', color: '#0f172a' }}>
            Kritik bir hata oluştu
          </h1>
          <p style={{ marginTop: '0.75rem', maxWidth: 420, color: '#64748b' }}>
            BACHMAIN geçici olarak yüklenemedi. Lütfen sayfayı yenileyin.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: '1.5rem',
              border: 0,
              borderRadius: 999,
              background: '#2563eb',
              color: '#fff',
              fontWeight: 700,
              padding: '0.75rem 1.25rem',
              cursor: 'pointer',
            }}
          >
            Tekrar dene
          </button>
        </main>
      </body>
    </html>
  )
}
