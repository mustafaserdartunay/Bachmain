export const CXC_BASE = '/musteri-deneyimi'

export const cxcSubMenus = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'customers', label: 'Customers' },
  { id: 'companies', label: 'Companies' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'leads', label: 'Lead Center' },
  { id: 'pipeline', label: 'Sales Pipeline' },
  { id: 'activities', label: 'Activities' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'calls', label: 'Calls' },
  { id: 'emails', label: 'Emails' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'support', label: 'Support Center' },
  { id: 'projects', label: 'Projects' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'documents', label: 'Documents' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'orders', label: 'Orders' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'ai', label: 'AI Insights' },
  { id: 'loyalty', label: 'Loyalty' },
  { id: 'executive', label: 'Executive' },
  { id: 'map', label: 'Map' },
  { id: '360', label: 'Customer 360' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
]

export function isCxcRoute(pathname) {
  return pathname === CXC_BASE || pathname.startsWith(`${CXC_BASE}/`)
}
