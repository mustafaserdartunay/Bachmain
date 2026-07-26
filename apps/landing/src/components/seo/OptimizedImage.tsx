'use client'

import Image, { type ImageProps } from 'next/image'

type OptimizedImageProps = Omit<ImageProps, 'alt'> & {
  alt: string
  /** Above-the-fold / LCP candidate */
  priority?: boolean
}

/**
 * Static-export safe next/image wrapper.
 * Optimization pipeline is off (`images.unoptimized`), but we still get:
 * correct dimensions (CLS), lazy loading, priority, sizes, and blur placeholders.
 */
export default function OptimizedImage({
  alt,
  priority = false,
  loading,
  decoding = 'async',
  ...props
}: OptimizedImageProps) {
  return (
    <Image
      alt={alt}
      priority={priority}
      loading={priority ? undefined : loading || 'lazy'}
      decoding={decoding}
      {...props}
    />
  )
}
