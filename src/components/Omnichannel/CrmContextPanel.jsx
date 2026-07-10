import { Link } from 'react-router-dom'
import { Building2, ExternalLink, Sparkles, User, UserPlus } from 'lucide-react'
import { DEPARTMENTS } from '../../omnichannel/schema'
import { AppPanelDot } from '../Layout/AppPageLayout'
import {
  APP_FILTER_LABEL_CLASS,
  APP_OMNI_COLUMN_CLASS,
  APP_OMNI_EMPTY_CLASS,
  APP_OMNI_SECTION_CLASS,
  APP_SUBLABEL_CLASS,
} from '../../utils/dashboardDesign'

const sentimentLabels = {
  positive: { label: 'Olumlu', className: 'badge badge-green' },
  negative: { label: 'Olumsuz', className: 'badge badge-red' },
  neutral: { label: 'Nötr', className: 'glass-pill !h-7 !px-2 !text-[12px]' },
}

const ASSIGNEES = ['Ahmet Y.', 'Elif K.', 'Mehmet D.', 'Ayşe S.']

export default function CrmContextPanel({
  conversation,
  customer,
  lead,
  onAssignUser,
  onAssignDepartment,
  onLinkCustomer,
}) {
  if (!conversation) {
    return (
      <aside className={`${APP_OMNI_COLUMN_CLASS} items-center justify-center p-6`}>
        <p className={APP_OMNI_EMPTY_CLASS}>CRM kartı konuşma seçildiğinde görünür</p>
      </aside>
    )
  }

  const sentiment = sentimentLabels[conversation.sentiment] || sentimentLabels.neutral

  return (
    <aside className={APP_OMNI_COLUMN_CLASS}>
      <div className="shrink-0 border-b border-white/40 px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          <AppPanelDot color="violet" />
          <p className={APP_FILTER_LABEL_CLASS}>CRM Kartı</p>
        </div>
        <h2 className="text-sm font-extrabold text-[var(--ink)]">{conversation.contactName}</h2>
        <span className={`mt-2 inline-flex ${sentiment.className}`}>
          Duygu: {sentiment.label}
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        <section className={APP_OMNI_SECTION_CLASS}>
          <p className={`mb-2 flex items-center gap-2 ${APP_FILTER_LABEL_CLASS}`}>
            <User className="h-3 w-3" /> Müşteri Eşleşmesi
          </p>
          {customer ? (
            <div>
              <p className="text-xs font-extrabold text-[var(--ink)]">{customer.contact || customer.company}</p>
              <p className={APP_SUBLABEL_CLASS}>{customer.company}</p>
              <p className={APP_SUBLABEL_CLASS}>{customer.phone || customer.email}</p>
              <Link
                to={`/musteriler/${customer.id}`}
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:text-blue-700"
              >
                Müşteri kartını aç <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          ) : lead ? (
            <div>
              <p className="flex items-center gap-1 text-xs font-extrabold text-amber-600">
                <Sparkles className="h-3.5 w-3.5" /> Otomatik Lead
              </p>
              <p className={APP_SUBLABEL_CLASS}>{lead.source} · {lead.status}</p>
              <button
                type="button"
                onClick={() => onLinkCustomer?.(lead)}
                className="btn-ghost mt-2 inline-flex items-center gap-1 !px-2 !py-1.5 text-[12px] font-bold text-amber-700"
              >
                <UserPlus className="h-3 w-3" /> Müşteriye dönüştür
              </button>
            </div>
          ) : (
            <p className={APP_SUBLABEL_CLASS}>Eşleşme yok</p>
          )}
        </section>

        <section className={APP_OMNI_SECTION_CLASS}>
          <p className={`mb-2 flex items-center gap-2 ${APP_FILTER_LABEL_CLASS}`}>
            <Building2 className="h-3 w-3" /> Atama
          </p>
          <label className={`mb-2 block ${APP_SUBLABEL_CLASS}`}>Kullanıcı</label>
          <select
            value={conversation.assignedUserId || ''}
            onChange={(e) => onAssignUser(e.target.value)}
            className="form-input mb-3 w-full text-xs"
          >
            <option value="">Atanmadı</option>
            {ASSIGNEES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <label className={`mb-2 block ${APP_SUBLABEL_CLASS}`}>Departman</label>
          <select
            value={conversation.departmentId || ''}
            onChange={(e) => onAssignDepartment(e.target.value)}
            className="form-input w-full text-xs"
          >
            <option value="">Seçin</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </section>

        <section className={APP_OMNI_SECTION_CLASS}>
          <p className={`mb-2 ${APP_FILTER_LABEL_CLASS}`}>İletişim</p>
          <dl className="space-y-2 text-xs">
            {conversation.contactPhone && (
              <div>
                <dt className={APP_SUBLABEL_CLASS}>Telefon</dt>
                <dd className="font-semibold text-[var(--ink)]">{conversation.contactPhone}</dd>
              </div>
            )}
            {conversation.contactEmail && (
              <div>
                <dt className={APP_SUBLABEL_CLASS}>E-posta</dt>
                <dd className="font-semibold text-[var(--ink)]">{conversation.contactEmail}</dd>
              </div>
            )}
            {conversation.contactHandle && (
              <div>
                <dt className={APP_SUBLABEL_CLASS}>Kullanıcı adı</dt>
                <dd className="font-semibold text-[var(--ink)]">{conversation.contactHandle}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>
    </aside>
  )
}
