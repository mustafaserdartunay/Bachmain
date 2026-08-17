import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { captureAuthHandoff } from '@/lib/auth'
import './index.css'

captureAuthHandoff()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/website-os">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
