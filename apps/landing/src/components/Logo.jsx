'use client'

import { Link } from 'react-router-dom'
import OptimizedImage from './seo/OptimizedImage'
import { BLUR_LOGO } from '../seo/imageBlur'

/** Açık zeminler — mavi wordmark + turuncu nokta */
const LOGO_SRC = '/assets/bachmain-logo.png'
/** Koyu zeminler — beyaz wordmark + turuncu nokta */
const LOGO_ON_DARK_SRC = '/assets/bachmain-logo-on-dark.png'

export default function Logo({ className = '', collapsed = false, onDark = false }) {
  return (
    <Link to="/" className={`brand-logo ${className}`} aria-label="BACHMAIN ana sayfa">
      <OptimizedImage
        src={onDark ? LOGO_ON_DARK_SRC : LOGO_SRC}
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
