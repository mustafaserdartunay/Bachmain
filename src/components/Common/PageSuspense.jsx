import { Suspense, lazy } from 'react'
import { LoadingState } from '@bachmain/ui'

export function lazyPage(importer) {
  return lazy(importer)
}

/** Named-export pages (SocialMediaPages, OrgStructurePages, …). */
export function lazyNamed(importer, exportName) {
  return lazy(() =>
    importer().then((mod) => {
      const Comp = mod[exportName]
      if (!Comp) throw new Error(`lazyNamed: ${exportName} bulunamadı`)
      return { default: Comp }
    }),
  )
}

export function PageSuspense({ children }) {
  return <Suspense fallback={<LoadingState rows={6} className="p-6" />}>{children}</Suspense>
}

export default PageSuspense
