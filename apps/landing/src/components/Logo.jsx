'use client'

import { Link } from 'react-router-dom'
import OptimizedImage from './seo/OptimizedImage'
import { BLUR_LOGO } from '../seo/imageBlur'

/** Açık zeminler — mavi wordmark + turuncu nokta */
const LOGO_SRC = '/assets/bachmain-logo.png'
/** Koyu zeminler — beyaz wordmark + turuncu nokta */
const LOGO_ON_DARK_SRC = '/assets/bachmain-logo-on-dark.png'
const STUDIO_LOGO_SRC = '/assets/bachmain-studio-logo.png'

export default function Logo({
  className = '',
  collapsed = false,
  onDark = false,
  studio = false,
}) {
  const src = studio ? STUDIO_LOGO_SRC : onDark ? LOGO_ON_DARK_SRC : LOGO_SRC
  return (
    <Link
      to={studio ? '/studio' : '/'}
      className={`brand-logo ${className}`}
      aria-label={studio ? 'Bachmain Studio' : 'BACHMAIN ana sayfa'}
    >
      <OptimizedImage
        src={src}
        alt={studio ? 'Bachmain Studio' : 'BACHMAIN — Tüm Süreçler Tek Platform'}
        width={studio ? 220 : 180}
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
