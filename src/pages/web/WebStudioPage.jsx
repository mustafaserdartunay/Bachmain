import { useEffect } from 'react'

function resolveDropelyaAdminUrl() {
  const fromEnv = import.meta.env.VITE_DROPELYA_ADMIN_URL?.trim()
  const base = fromEnv?.replace(/\/$/, '') ||
    (import.meta.env.PROD ? 'https://dropelya.com' : 'http://localhost:3000')

  const backUrl = typeof window !== 'undefined' ? window.location.origin + '/' : '/'
  const params = new URLSearchParams({ from: 'bachmain', back: backUrl })
  return `${base}/yonetim?${params.toString()}`
}

export default function WebStudioPage() {
  useEffect(() => {
    const url = resolveDropelyaAdminUrl()
    window.location.href = url
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        background: 'var(--app-bg-soft, #e5eaf2)',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid rgba(32,51,117,0.15)',
          borderTopColor: '#203375',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--muted, #64748b)',
          letterSpacing: '0.04em',
        }}
      >
        Studio açılıyor…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
