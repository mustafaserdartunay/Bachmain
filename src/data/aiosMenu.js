export const AIOS_BASE = '/aios'

export const aiosSubMenus = [
  { id: 'home', label: 'AI Home' },
  { id: 'organization', label: 'Enterprise Org' },
  { id: 'agents', label: 'AI Agents' },
  { id: 'orchestrator', label: 'Orchestrator' },
  { id: 'memory', label: 'AI Memory' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'prompts', label: 'Prompt Studio' },
  { id: 'automation', label: 'Automation AI' },
  { id: 'tasks', label: 'AI Tasks' },
  { id: 'documents', label: 'AI Documents' },
  { id: 'analytics', label: 'AI Analytics' },
  { id: 'forecast', label: 'AI Forecast' },
  { id: 'vision', label: 'AI Vision' },
  { id: 'voice', label: 'AI Voice' },
  { id: 'translate', label: 'AI Translation' },
  { id: 'models', label: 'Model Center' },
  { id: 'usage', label: 'Usage' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'audit', label: 'AI Monitoring' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'settings', label: 'Settings' },
]

export function isAiosRoute(pathname) {
  return pathname === AIOS_BASE || pathname === '/ai-beyin' || pathname.startsWith(`${AIOS_BASE}/`)
}
