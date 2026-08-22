'use client'

import { useEffect } from 'react'

/** Fallback when the Vercel 301 for /Business is not applied (local static preview). */
export default function BusinessHomeRedirect() {
  useEffect(() => {
    window.location.replace('/')
  }, [])

  return (
    <p className="p-8 text-center text-sm text-slate-500">
      <a href="/">bachmain.com ana sayfasına yönlendiriliyorsunuz.</a>
    </p>
  )
}
