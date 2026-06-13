import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, CheckSquare } from 'lucide-react'
import { getCrmSummary, getUpcomingItems } from '../../utils/crmStore'
import { getCustomerDisplay } from '../../utils/customerDisplay'

export default function CrmTracker() {
  const summary = getCrmSummary()
  const upcoming = getUpcomingItems(4)

  return (
    <div className="rounded-2xl border border-dark-500/50 bg-dark-800/70 p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">CRM Takip</h3>
          <p className="text-xs text-gray-500">Görev ve randevular</p>
        </div>
        <Link to="/crm" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300">
          CRM <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-dark-500/40 bg-dark-700/30 px-3 py-2">
          <p className="text-[10px] text-gray-500">Bugün randevu</p>
          <p className="text-lg font-black text-blue-300">{summary.appointmentsToday}</p>
        </div>
        <div className="rounded-xl border border-dark-500/40 bg-dark-700/30 px-3 py-2">
          <p className="text-[10px] text-gray-500">Açık görev</p>
          <p className="text-lg font-black text-emerald-300">{summary.tasksPending}</p>
        </div>
      </div>

      <div className="space-y-2">
        {upcoming.map((item) => (
          <div key={`${item.kind}-${item.id}`} className="flex items-center gap-2 rounded-xl border border-dark-500/40 bg-dark-700/25 px-3 py-2">
            {item.kind === 'task' ? (
              <CheckSquare className="h-3.5 w-3.5 shrink-0 text-orange-400" />
            ) : (
              <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-200">{item.title}</p>
              <p className="truncate text-[10px] text-gray-500">
                {getCustomerDisplay(item.customer).brandShortName} · {item.date}{item.time ? ` ${item.time}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      {summary.tasksOverdue > 0 && (
        <p className="mt-3 text-[10px] font-bold text-red-400">{summary.tasksOverdue} geciken görev</p>
      )}
    </div>
  )
}
