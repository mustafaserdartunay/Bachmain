import CrmHome from '../components/Crm/CrmHome'

export default function CrmPage({ view = 'all' }) {
  return <CrmHome view={view} />
}
