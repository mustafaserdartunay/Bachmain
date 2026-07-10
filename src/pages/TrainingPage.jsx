import { ExternalLink, GraduationCap, PlayCircle } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import FormSectionPanel from '../components/Common/FormSectionPanel'
import { APP_METRIC_ROW_CLASS, APP_SUBLABEL_CLASS } from '../utils/dashboardDesign'
import { openTrainingVideo, TRAINING_SECTIONS } from '../data/trainingMenu'

function TrainingVideoRow({ item }) {
  return (
    <button
      type="button"
      onClick={() => openTrainingVideo(item)}
      className={`${APP_METRIC_ROW_CLASS} glass-inset-hover !min-h-[2.75rem] w-full cursor-pointer !justify-between gap-3 !px-3 !py-2 text-left`}
    >
      <div className="min-w-0">
        <p className="truncate text-xs font-extrabold text-[var(--ink)]">{item.label}</p>
        <p className="truncate text-[12px] font-semibold text-[var(--muted)]">YouTube eğitim videosu</p>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-bold text-[var(--purple2)]">
        <PlayCircle className="h-4 w-4" />
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </span>
    </button>
  )
}

export default function TrainingPage() {
  return (
    <AppPageShell>
      <AppPageHeader title="Eğitim" />

      <AppPagePanel
        title="Modül Eğitimleri"
        description="Sol menüdeki başlıklar altında ilgili sayfa eğitimlerini bulun. Bir başlığa tıklayınca YouTube'da eğitim videosu açılır."
        dotColor="violet"
      >
        <div className="space-y-4">
          {TRAINING_SECTIONS.map((section) => (
            <FormSectionPanel key={section.id} icon={GraduationCap} title={section.title} dotColor="blue">
              <p className={APP_SUBLABEL_CLASS}>
                {section.items.length} eğitim videosu
              </p>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <TrainingVideoRow key={`${section.id}-${item.path}-${item.label}`} item={item} />
                ))}
              </div>
            </FormSectionPanel>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
