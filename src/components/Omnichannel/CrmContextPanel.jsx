import { Link } from 'react-router-dom'
import { Building2, ExternalLink, Sparkles, User, UserPlus } from 'lucide-react'
import { DEPARTMENTS } from '../../omnichannel/schema'

const sentimentLabels = {
  positive: { label: 'Olumlu', className: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' },
  negative: { label: 'Olumsuz', className: 'text-red-300 bg-red-500/15 border-red-500/30' },
  neutral: { label: 'Nötr', className: 'text-gray-300 bg-gray-500/15 border-gray-500/30' },
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
      <aside className="flex h-full items-center justify-center border-l border-dark-500/45 bg-dark-800/40 p-6 text-center">
        <p className="text-xs text-gray-500">CRM kartı konuşma seçildiğinde görünür</p>
      </aside>
    )
  }

  const sentiment = sentimentLabels[conversation.sentiment] || sentimentLabels.neutral

  return (
    <aside className="flex h-full flex-col overflow-y-auto border-l border-dark-500/45 bg-dark-800/60">
      <div className="border-b border-dark-500/45 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">CRM Kartı</p>
        <h2 className="mt-1 text-lg font-black text-white">{conversation.contactName}</h2>
        <div className={`mt-2 inline-flex rounded-lg border px-2 py-1 text-[10px] font-black uppercase ${sentiment.className}`}>
          Duygu: {sentiment.label}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <section className="rounded-xl border border-dark-500/45 bg-dark-900/50 p-3">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <User className="h-3 w-3" /> Müşteri Eşleşmesi
          </p>
          {customer ? (
            <div>
              <p className="text-sm font-bold text-gray-200">{customer.contact || customer.company}</p>
              <p className="text-xs text-gray-500">{customer.company}</p>
              <p className="text-xs text-gray-500">{customer.phone || customer.email}</p>
              <Link
                to={`/musteriler/${customer.id}`}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-300 hover:text-blue-200"
              >
                Müşteri kartını aç <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          ) : lead ? (
            <div>
              <p className="flex items-center gap-1 text-sm font-bold text-amber-200">
                <Sparkles className="h-3.5 w-3.5" /> Otomatik Lead
              </p>
              <p className="text-xs text-gray-500">{lead.source} · {lead.status}</p>
              <button
                type="button"
                onClick={() => onLinkCustomer?.(lead)}
                className="mt-2 inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-200"
              >
                <UserPlus className="h-3 w-3" /> Müşteriye dönüştür
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Eşleşme yok</p>
          )}
        </section>

        <section className="rounded-xl border border-dark-500/45 bg-dark-900/50 p-3">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
            <Building2 className="h-3 w-3" /> Atama
          </p>
          <label className="mb-2 block text-[11px] font-semibold text-gray-500">Kullanıcı</label>
          <select
            value={conversation.assignedUserId || ''}
            onChange={(e) => onAssignUser(e.target.value)}
            className="form-input mb-3 w-full text-sm"
          >
            <option value="">Atanmadı</option>
            {ASSIGNEES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <label className="mb-2 block text-[11px] font-semibold text-gray-500">Departman</label>
          <select
            value={conversation.departmentId || ''}
            onChange={(e) => onAssignDepartment(e.target.value)}
            className="form-input w-full text-sm"
          >
            <option value="">Seçin</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </section>

        <section className="rounded-xl border border-dark-500/45 bg-dark-900/50 p-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-500">İletişim</p>
          <dl className="space-y-2 text-xs">
            {conversation.contactPhone && (
              <div>
                <dt className="text-gray-500">Telefon</dt>
                <dd className="font-semibold text-gray-300">{conversation.contactPhone}</dd>
              </div>
            )}
            {conversation.contactEmail && (
              <div>
                <dt className="text-gray-500">E-posta</dt>
                <dd className="font-semibold text-gray-300">{conversation.contactEmail}</dd>
              </div>
            )}
            {conversation.contactHandle && (
              <div>
                <dt className="text-gray-500">Kullanıcı adı</dt>
                <dd className="font-semibold text-gray-300">{conversation.contactHandle}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>
    </aside>
  )
}
