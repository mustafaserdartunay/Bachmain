import { CheckCircle2, Clock3, Loader2, Mail, MailOpen, Radio, Send, Server } from 'lucide-react'
import {
  EMAIL_STATUS_LABELS,
  formatStatusTime,
  GIB_STATUS_LABELS,
  INVOICE_KIND_LABELS,
} from '../../utils/salesInvoicesStore'
import { FormSectionPanel } from '../Common/FormSectionPanel'
import { APP_SURFACE_PANEL_CLASS } from '../../utils/dashboardDesign'

const GIB_STEPS = ['sending', 'pending', 'sent']
const EMAIL_STEPS = ['queued', 'in_transit', 'delivered', 'opened']

function stepState(steps, current) {
  const index = steps.indexOf(current)
  return steps.map((step, stepIndex) => {
    if (current === 'failed') return 'failed'
    if (index < 0) return stepIndex === 0 && current === 'idle' ? 'waiting' : 'waiting'
    if (stepIndex < index) return 'done'
    if (stepIndex === index) return 'active'
    return 'waiting'
  })
}

function StepIcon({ state, Icon, ActiveIcon }) {
  if (state === 'done') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
  if (state === 'active') {
    const Comp = ActiveIcon || Loader2
    return (
      <Comp
        className={`h-4 w-4 text-blue-300 ${ActiveIcon === Loader2 || !ActiveIcon ? 'animate-spin' : ''}`}
      />
    )
  }
  return <Icon className="h-4 w-4 text-gray-500" />
}

function stepTone(state) {
  if (state === 'done') return 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
  if (state === 'active')
    return 'border-blue-500/40 bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/30'
  return 'border-dark-500/40 bg-dark-900/40 text-gray-500'
}

/**
 * GİB + e-posta canlı teslimat durumu.
 */
export default function InvoiceDeliveryStatusPanel({ invoice }) {
  if (!invoice) return null

  const gibStates = stepState(GIB_STEPS, invoice.gibStatus)
  const emailStates = stepState(EMAIL_STEPS, invoice.emailStatus)
  const kindLabel = INVOICE_KIND_LABELS[invoice.invoiceKind] || invoice.invoiceKind

  return (
    <FormSectionPanel icon={Radio} title="Canlı Gönderim Durumu" dotColor="sky">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 font-black tracking-wide text-blue-300">
          {kindLabel}
        </span>
        {invoice.gibUuid ? (
          <span className="font-mono text-[11px] text-gray-500">UUID {invoice.gibUuid}</span>
        ) : null}
        {invoice.customerEmail ? (
          <span className="text-gray-400">{invoice.customerEmail}</span>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-4`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-300" />
              <h4 className="text-xs font-black uppercase tracking-wide text-gray-300">GİB API</h4>
            </div>
            <span className="text-[11px] font-bold text-blue-300">
              {GIB_STATUS_LABELS[invoice.gibStatus] || invoice.gibStatus}
            </span>
          </div>
          <div className="space-y-2">
            {[
              { id: 'sending', label: 'Gönderiliyor', Icon: Send, ActiveIcon: Loader2 },
              { id: 'pending', label: 'Beklemede', Icon: Clock3, ActiveIcon: Clock3 },
              { id: 'sent', label: 'Gönderildi', Icon: CheckCircle2, ActiveIcon: CheckCircle2 },
            ].map((step, index) => {
              const state = gibStates[index]
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${stepTone(state)}`}
                >
                  <StepIcon state={state} Icon={step.Icon} ActiveIcon={step.ActiveIcon} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black">{step.label}</p>
                    {state === 'active' && invoice.gibMessage ? (
                      <p className="mt-0.5 truncate text-[11px] opacity-80">{invoice.gibMessage}</p>
                    ) : null}
                  </div>
                  {state === 'active' || state === 'done' ? (
                    <span className="shrink-0 text-[10px] font-semibold opacity-70">
                      {formatStatusTime(invoice.gibStatusAt)}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <div className={`${APP_SURFACE_PANEL_CLASS} space-y-3 p-4`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-violet-300" />
              <h4 className="text-xs font-black uppercase tracking-wide text-gray-300">
                Müşteri E-postası
              </h4>
            </div>
            <span className="text-[11px] font-bold text-violet-300">
              {EMAIL_STATUS_LABELS[invoice.emailStatus] || invoice.emailStatus}
            </span>
          </div>
          <div className="space-y-2">
            {[
              { id: 'queued', label: 'Kuyrukta', Icon: Mail, ActiveIcon: Loader2 },
              { id: 'in_transit', label: 'Yolda', Icon: Send, ActiveIcon: Send },
              { id: 'delivered', label: 'Ulaştı', Icon: CheckCircle2, ActiveIcon: CheckCircle2 },
              { id: 'opened', label: 'Açıldı', Icon: MailOpen, ActiveIcon: MailOpen },
            ].map((step, index) => {
              const state = emailStates[index]
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${stepTone(state)}`}
                >
                  <StepIcon state={state} Icon={step.Icon} ActiveIcon={step.ActiveIcon} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black">{step.label}</p>
                    {state === 'active' && invoice.emailMessage ? (
                      <p className="mt-0.5 truncate text-[11px] opacity-80">
                        {invoice.emailMessage}
                      </p>
                    ) : null}
                  </div>
                  {state === 'active' || state === 'done' ? (
                    <span className="shrink-0 text-[10px] font-semibold opacity-70">
                      {formatStatusTime(invoice.emailStatusAt)}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </FormSectionPanel>
  )
}
