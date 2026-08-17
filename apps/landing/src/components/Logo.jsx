'use client'

import { Link } from 'react-router-dom'
import OptimizedImage from './seo/OptimizedImage'
import BachMainMascot from './BachMainMascot'
import { BLUR_LOGO } from '../seo/imageBlur'

/** BACHMAIN resmi logo — 5173 referansıyla aynı boyut (1.65rem yükseklik, oran korunur) */
const LOGO_SRC = '/assets/bachmain-logo.png'
/** Footer / koyu zemin: beyaz yazı + turuncu nokta */
const LOGO_ON_DARK_SRC = '/assets/bachmain-logo-on-dark.png'

export default function Logo({ className = '', collapsed = false, onDark = false }) {
  return (
    <Link
      to="/Business"
      className={`brand-logo brand-logo-with-mascot ${className}`}
      aria-label="BACHMAIN Business"
    >
      {!collapsed ? <BachMainMascot /> : null}
      <OptimizedImage
        src={onDark ? LOGO_ON_DARK_SRC : LOGO_SRC}
        alt="BACHMAIN Business — Tüm Süreçler Tek Platform"
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
