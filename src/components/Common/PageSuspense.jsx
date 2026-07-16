import { Suspense, lazy } from 'react'
import { LoadingState } from '@bachmain/ui'

export function lazyPage(importer) {
  return lazy(importer)
}

export function PageSuspense({ children }) {
  return (
    <Suspense fallback={<LoadingState rows={6} className="p-6" />}>
      {children}
    </Suspense>
  )
}

export default PageSuspense
