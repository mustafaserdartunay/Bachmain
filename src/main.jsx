import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/ds-tokens.css'
import './components/ProcessWorkspace/process-workspace.css'
import { initAppearanceOnBoot } from './utils/appearanceMode'
import { initSentry } from './utils/sentry'
import AppErrorBoundary, { installChunkLoadRecovery } from './components/Common/AppErrorBoundary'

initSentry('bachmain-crm')
initAppearanceOnBoot()
installChunkLoadRecovery()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
