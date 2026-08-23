import type { NextConfig } from 'next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Static export keeps bachmain.com deployable as HTML (Rich Results + crawlers
 * get unique meta per route).
 *
 * Permanent SEO redirects (old → short Turkish URLs) live in vercel.json —
 * `output: 'export'` does not apply next.config redirects at build time.
 * See SEO_PATH_REDIRECTS in src/seo/pages.ts for the mapping.
 *
 * Image Optimization API is unavailable with `output: 'export'`; we still use
 * next/image for CLS-safe dimensions + lazy loading (`unoptimized: true`).
 * Gzip/Brotli are provided by the CDN (Vercel).
 */
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'gsap', 'lenis'],
  },
  async rewrites() {
    if (process.env.NODE_ENV === 'production') return []
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5200/api/:path*',
      },
    ]
  },
  turbopack: {
    resolveAlias: {
      'react-router-dom': './src/compat/react-router-dom.tsx',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-router-dom': path.resolve(__dirname, 'src/compat/react-router-dom.tsx'),
    }
    return config
  },
}

export default nextConfig
