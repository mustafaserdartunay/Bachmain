export const ANALYTICS_BASE = '/analitik'

export const analyticsSubMenus = [
  { id: 'executive', label: 'Executive Dashboard' },
  { id: 'builder', label: 'Dashboard Builder' },
  { id: 'reports', label: 'Reports' },
  { id: 'kpi', label: 'KPI Center' },
  { id: 'ai', label: 'AI Insights' },
  { id: 'explorer', label: 'Data Explorer' },
  { id: 'forecast', label: 'Forecast Center' },
  { id: 'maps', label: 'Maps' },
  { id: 'charts', label: 'Charts' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'goals', label: 'Goals' },
  { id: 'okr', label: 'OKR' },
  { id: 'scorecards', label: 'Scorecards' },
  { id: 'benchmark', label: 'Benchmark' },
  { id: 'exports', label: 'Exports' },
  { id: 'cockpit', label: 'Executive Cockpit' },
  { id: 'board', label: 'AI Board Report' },
  { id: 'settings', label: 'Settings' },
]

export function isAnalyticsRoute(pathname) {
  return (
    pathname === ANALYTICS_BASE ||
    pathname === '/raporlar' ||
    pathname.startsWith(`${ANALYTICS_BASE}/`)
  )
}
