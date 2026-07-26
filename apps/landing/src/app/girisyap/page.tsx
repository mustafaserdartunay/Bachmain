'use client'

import { useEffect } from 'react'

/** Alias for /giris — “Giriş Yap” share URL (static export; Vercel also redirects). */
export default function Page() {
  useEffect(() => {
    window.location.replace('/giris')
  }, [])

  return (
    <p className="flex min-h-[40vh] items-center justify-center text-sm text-slate-600">
      Giriş sayfasına yönlendiriliyorsunuz…
    </p>
  )
}
