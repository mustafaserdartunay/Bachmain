'use client'

import { Link } from 'react-router-dom'
import OptimizedImage from './seo/OptimizedImage'
import { BLUR_LOGO } from '../seo/imageBlur'

/** BACHMAIN resmi logo — 5173 referansıyla aynı boyut (1.65rem yükseklik, oran korunur) */
const LOGO_SRC = '/assets/bachmain-logo.png'

export default function Logo({ className = '', collapsed = false }) {
  return (
    <Link to="/" className={`brand-logo ${className}`} aria-label="BACHMAIN ana sayfa">
      <OptimizedImage
        src={LOGO_SRC}
        alt="BACHMAIN — Tüm Süreçler Tek Platform"
        width={180}
        height={40}
        className={collapsed ? 'brand-logo-img brand-logo-img-collapsed' : 'brand-logo-img'}
        priority
        placeholder="blur"
        blurDataURL={BLUR_LOGO}
        draggable={false}
      />
    </Link>
  )
}
