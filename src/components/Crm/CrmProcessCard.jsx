import { useEffect, useState } from 'react'
import { Calendar, CheckSquare, User } from 'lucide-react'
import {
  CRM_ASSIGNEE_ICON_CLASS,
  CRM_ASSIGNEE_TEXT_CLASS,
  CRM_BADGE_APPOINTMENT,
  CRM_BADGE_TASK,
  getCrmTemplateBadgeClass,
} from '../../utils/bachBrand'
import { readOptionLists } from '../../utils/customerMeta'
import { getCustomerDisplay } from '../../utils/customerDisplay'
import {
  getCrmProcessCountdownWindow,
  getCrmProcessEndLabel,
  getCrmProcessStartLabel,
  getCrmProcessSteps,
  isCrmProcessCompleted,
} from '../../utils/crmProcessHelpers'
import { getLoggedInUserDisplayName } from '../../utils/userProfile'
import CrmProcessCountdownRing from './CrmProcessCountdownRing'
import CrmProcessRail from './CrmProcessRail'
import { CrmDeleteAction, CrmEditAction } from './CrmListActions'
import { PhotoLightbox } from '../Production/ProductionLineItemStagePhotos'

function kindMeta(kind) {
  if (kind === 'task') {
    return { label: 'Görev', icon: CheckSquare, shell: CRM_BADGE_TASK }
  }
  return { label: 'Randevu', icon: Calendar, shell: CRM_BADGE_APPOINTMENT }
}

const META_ROW_BASE_CLASS = 'text-[12px] font-black leading-tight tracking-wider uppercase'
const META_ROW_LABEL_CLASS = `${META_ROW_BASE_CLASS} shrink-0 whitespace-nowrap text-gray-500`
const META_ROW_VALUE_CLASS = `${META_ROW_BASE_CLASS} min-w-0 text-left text-black`

function resolvePriorityOptionColor(priorityLabel) {
  const option = readOptionLists().priority.find((item) => item.label === priorityLabel)
  return option?.color || null
}

function MetaField({ label, value, className = '', clamp = false, row = false }) {
  if (!value) return null

  if (row) {
    return (
      <div className={`flex min-w-0 ${clamp ? 'items-start' : 'items-center'} gap-1 ${className}`.trim()}>
        <p className={META_ROW_LABEL_CLASS}>{label}:</p>
        <p
          className={`${META_ROW_VALUE_CLASS} ${clamp ? 'line-clamp-3' : 'truncate'}`}
          title={value}
        >
          {value}
        </p>
      </div>
    )
  }

  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-600">{label}</p>
      <p
        className={`mt-0.5 text-left text-[12px] font-black leading-tight text-white ${clamp ? 'line-clamp-3' : 'truncate'}`}
        title={value}
      >
        {value}
      </p>
    </div>
  )
}


function ProcessDatesColumn({ creator, startLabel, endLabel, endTitle, countdownWindow, completed }) {
  const [creatorName, setCreatorName] = useState(creator)

  useEffect(() => {
    setCreatorName(creator)
  }, [creator])

  useEffect(() => {
    function syncProfile() {
      setCreatorName((current) => current || getLoggedInUserDisplayName())
    }
    window.addEventListener('erlenbox:user-profile-updated', syncProfile)
    return () => window.removeEventListener('erlenbox:user-profile-updated', syncProfile)
  }, [])

  return (
    <div className="flex shrink-0 items-center gap-3">
      <CrmProcessCountdownRing window={countdownWindow} completed={completed} />

      <div className="flex items-stretch gap-3">
        <div className="flex min-w-[96px] flex-col justify-center gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-600">Oluşturan</p>
            <div
              className="mt-0.5 flex min-w-0 items-center justify-start gap-1 truncate"
              title={creatorName}
            >
              <User className={`h-3 w-3 shrink-0 ${CRM_ASSIGNEE_ICON_CLASS}`} strokeWidth={2.5} />
              <span className={`truncate text-[11px] font-black ${CRM_ASSIGNEE_TEXT_CLASS}`}>{creatorName}</span>
            </div>
          </div>
          <div className="h-px bg-dark-500/35" aria-hidden />

          <MetaField label="Başlangıç" value={startLabel} />

          <div className="h-px bg-dark-500/35" aria-hidden />

          <MetaField label={endTitle} value={endLabel} />
        </div>

        <div className="hidden w-px shrink-0 self-stretch bg-dark-500/35 sm:block" aria-hidden />
      </div>
    </div>
  )
}

export default function CrmProcessCard({
  entry,
  onStageClick,
  onStagePhotosChange,
  onMailClick,
  onWhatsAppClick,
  onEdit,
  onDelete,
}) {
  const [previewPhoto, setPreviewPhoto] = useState(null)
  const { kind, record, template } = entry
  const meta = kindMeta(kind)
  const Icon = meta.icon
  const steps = getCrmProcessSteps(record, kind)
  const startLabel = getCrmProcessStartLabel(record, kind)
  const endLabel = getCrmProcessEndLabel(record, kind)
  const completed = isCrmProcessCompleted(record, kind)
  const countdownWindow = getCrmProcessCountdownWindow(record, kind)
  const customer = getCustomerDisplay(record.customer)
  const creatorName = record.createdBy || getLoggedInUserDisplayName()
  const description = kind === 'task' ? record.description : record.notes
  const priority = kind === 'task' ? record.priority : null
  const templateBadgeClass = getCrmTemplateBadgeClass(template.id)
  const priorityColor = priority ? resolvePriorityOptionColor(priority) : null
  const titleLabel = kind === 'task' ? 'Görev başlığı' : 'Randevu başlığı'
  const customerName = customer.brandShortName || customer.companyTitle

  return (
    <article
      className="group relative flex w-full items-stretch gap-3 overflow-hidden rounded-xl border border-dark-500/40 bg-dark-800/55 px-3 py-3 transition-all hover:border-dark-500/60 hover:bg-dark-700/50 hover:shadow-[0_8px_24px_rgba(15,23,42,0.18)]"
    >
      <ProcessDatesColumn
        creator={creatorName}
        startLabel={startLabel}
        endLabel={endLabel}
        endTitle={completed ? 'Bitiş' : 'Planlanan bitiş'}
        countdownWindow={countdownWindow}
        completed={completed}
      />

      <div className="relative flex min-w-0 flex-1 flex-col self-stretch">
        <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 pb-2 pt-2">
          <span className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[12px] font-black uppercase ${meta.shell}`}>
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
          <span className={`inline-flex h-9 shrink-0 items-center rounded-lg px-2.5 text-[12px] font-black ${templateBadgeClass}`}>
            {template.label}
          </span>
          <div
            className="flex min-w-[200px] flex-1 items-center gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            {priority ? (
              <span
                className={`inline-flex h-9 shrink-0 items-center rounded-lg px-2.5 text-[12px] font-black ${
                  priorityColor ? `${priorityColor} text-white` : templateBadgeClass
                }`}
              >
                {priority}
              </span>
            ) : null}
            <CrmProcessRail
              className="min-w-0 flex-1"
              steps={steps}
              stagePhotos={record.stagePhotos}
              onStageClick={(stageId) => onStageClick?.(entry, stageId)}
              onStagePhotosChange={(photos) => onStagePhotosChange?.(entry, photos)}
              onPhotoPreview={setPreviewPhoto}
              onMailClick={(step) => onMailClick?.(entry, step)}
              onWhatsAppClick={(step) => onWhatsAppClick?.(entry, step)}
            />

            <div className="hidden h-9 w-px shrink-0 bg-dark-500/35 sm:block" aria-hidden />

            <CrmEditAction brand onEdit={onEdit} />
            <CrmDeleteAction brand onDelete={onDelete} />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center gap-1 border-t border-dark-500/35 py-2 pt-3">
          <div className="flex min-w-0 items-stretch py-0.5">
            <div className="flex min-w-0 flex-1 items-center justify-start pr-3">
              <MetaField className="min-w-0" label={titleLabel} value={record.title} row />
            </div>
            <div className="w-px shrink-0 self-stretch bg-dark-500/35" aria-hidden />
            <div className="flex min-w-0 flex-1 items-center justify-center px-3">
              <MetaField className="min-w-0" label="Müşteri" value={customerName} row />
            </div>
            <div className="w-px shrink-0 self-stretch bg-dark-500/35" aria-hidden />
            <div className="flex min-w-0 flex-1 items-center justify-end pl-3">
              <MetaField className="min-w-0" label="Müşteri temsilcisi" value={record.assignee} row />
            </div>
          </div>
          <div className="my-1 h-px bg-dark-500/35" aria-hidden />
          <MetaField className="w-full" label="Açıklama" value={description} row clamp />
        </div>
      </div>

      <PhotoLightbox photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />
    </article>
  )
}
