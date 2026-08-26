import { Link } from 'react-router-dom'
import { APP_SURFACE_PANEL_CLASS } from '../../../utils/dashboardDesign'
import { TCC_MUTED, TCC_YFB } from './truckControlUi'

export default function TruckDocuments({ documents = [] }) {
  return (
    <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
      <p className={`${TCC_YFB} mb-3 uppercase`}>Evraklar</p>
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between gap-3">
            <div>
              <p className={`${TCC_YFB} text-[var(--ink)]`}>{doc.title || doc.type}</p>
              <p className={TCC_MUTED}>
                {doc.type} · {doc.language || ''} · {doc.status || ''}
              </p>
            </div>
            <Link to="/belge-merkezi" className="tcc-chip no-underline">
              Aç
            </Link>
          </li>
        ))}
      </ul>
      {!documents.length ? (
        <p className={`${TCC_MUTED} py-6 text-center`}>Bu sevkiyata bağlı evrak yok.</p>
      ) : null}
    </section>
  )
}
