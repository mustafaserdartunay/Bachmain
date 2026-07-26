import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/Common/ErrorBoundary'
import './styles/ds-tokens.css'
import './index.css'
import './components/ProcessWorkspace/process-workspace.css'
import { initAppearanceOnBoot } from './utils/appearanceMode'
import { initSentry } from './utils/sentry'

initSentry('bachmain-crm')
initAppearanceOnBoot()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary name="root">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
