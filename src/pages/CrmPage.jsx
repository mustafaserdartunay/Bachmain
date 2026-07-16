import CrmHome from '../components/Crm/CrmHome'

const VIEW_BY_PATH = {
  '/crm': 'all',
  '/crm/notlar': 'note',
  '/crm/gorevler': 'task',
  '/crm/randevular': 'appointment',
}

export default function CrmPage({ view }) {
  return <CrmHome view={view || 'all'} />
}

export function crmViewFromPath(pathname) {
  return VIEW_BY_PATH[pathname] || 'all'
}
