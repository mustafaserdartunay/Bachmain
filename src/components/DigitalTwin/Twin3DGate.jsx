import { lazy, Suspense } from 'react'

const TwinFloor3D = lazy(() => import('./TwinFloor3D'))

/** Optional 3D floor — only mount when enable3d */
export default function Twin3DGate({ enabled }) {
  if (!enabled) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-dark-500/50 text-xs text-gray-500">
        3D kapalı · Performans için izometrik görünüm kullanılıyor
      </div>
    )
  }
  return (
    <Suspense
      fallback={
        <div className="flex h-56 items-center justify-center text-xs text-gray-500">
          3D yükleniyor…
        </div>
      }
    >
      <TwinFloor3D />
    </Suspense>
  )
}
