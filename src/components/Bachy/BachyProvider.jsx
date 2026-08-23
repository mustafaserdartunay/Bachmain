import { lazy, Suspense } from 'react'
import { isIdeWebview } from '../../utils/ideWebview'

const BachyFloating = lazy(() => import('./BachyFloating'))

/** Lazy global mount — keeps idle CPU low until first paint chunk loads */
export default function BachyProvider({ enabled = true }) {
  if (!enabled || isIdeWebview()) return null
  return (
    <Suspense fallback={null}>
      <BachyFloating />
    </Suspense>
  )
}
