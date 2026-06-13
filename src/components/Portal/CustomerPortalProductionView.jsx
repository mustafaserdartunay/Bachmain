import { useState } from 'react'
import { ChevronDown, Factory, FileText, ShoppingCart } from 'lucide-react'
import { ProductionLineItemStageTrack, ProductionLineItemStageTrackInline } from '../Production/ProductionStageFlow'
import { formatQty } from '../../utils/productionQuantityMetrics'

const fulfillmentTone = {
  'Devam Ediyor': 'text-blue-300 bg-blue-500/10 border-blue-500/30',
  Bekliyor: 'text-gray-400 bg-dark-700/60 border-dark-500/40',
  'Kısmi Üretim Bitti': 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  'Kısmi Teslimat': 'text-orange-300 bg-orange-500/10 border-orange-500/30',
  Tamamlandı: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
}

function StatusPill({ label }) {
  const tone = fulfillmentTone[label] || fulfillmentTone['Devam Ediyor']
  return (
    <span className={`inline-flex h-7 items-center rounded-lg border px-2.5 text-[10px] font-black uppercase tracking-wide ${tone}`}>
      {label}
    </span>
  )
}

function LinkageCard({ quoteId, quoteTitle, quoteDateLabel, orderId, orderTitle, orderDateLabel }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="rounded-xl border border-purple-500/25 bg-purple-500/10 px-3 py-2.5">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-purple-300">
          <FileText className="h-3.5 w-3.5" />
          Kaynak Teklif
        </div>
        {quoteId ? (
          <>
            <p className="text-sm font-black text-white">{quoteTitle || quoteId}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-gray-500">Kod: {quoteId} · {quoteDateLabel}</p>
          </>
        ) : (
          <p className="text-xs font-semibold text-gray-500">Bu sipariş için teklif bağlantısı yok</p>
        )}
      </div>
      <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2.5">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-blue-300">
          <ShoppingCart className="h-3.5 w-3.5" />
          Sipariş
        </div>
        <p className="text-sm font-black text-white">{orderTitle || 'Sipariş'}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-gray-500">Kod: {orderId} · Sipariş tarihi: {orderDateLabel}</p>
      </div>
    </div>
  )
}

function LineItemAccordion({ line, isExpanded, onToggle }) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border transition-all ${
        isExpanded
          ? 'border-blue-500/35 bg-dark-800/70 shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
          : 'border-dark-500/45 bg-dark-800/55 hover:border-blue-500/25'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">
            Kalem #{line.index + 1}
          </p>
          <p className="mt-0.5 truncate text-sm font-black text-white">{line.productName}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-gray-500">{line.metricsLabel}</p>
        </div>
        <div className="hidden min-w-[120px] sm:block">
          <ProductionLineItemStageTrackInline steps={line.steps} theme="dark" showLabels={false} />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill label={line.fulfillmentStatus} />
          <span
            className={`rounded-lg border p-1.5 transition-colors ${
              isExpanded
                ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
                : 'border-dark-500/50 bg-dark-700/70 text-gray-400'
            }`}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-dark-500/40 px-4 pb-4 pt-3">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {line.productionClosed && (
              <span className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-black uppercase text-red-300">
                Üretim kapalı
              </span>
            )}
            {line.depoLabel && (
              <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] font-black text-cyan-300">
                {line.depoLabel}
              </span>
            )}
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2">
            {[
              ['Sipariş', formatQty(line.quantity), 'text-white'],
              ['Üretim', formatQty(line.producedQuantity), 'text-blue-300'],
              ['Teslim', formatQty(line.deliveredQuantity), 'text-emerald-300'],
            ].map(([label, value, tone]) => (
              <div key={label} className="rounded-lg border border-dark-500/40 bg-dark-900/35 px-3 py-2 text-center">
                <p className="text-[9px] font-black uppercase text-gray-600">{label}</p>
                <p className={`text-sm font-black tabular-nums ${tone}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-dark-500/40 bg-dark-900/30 p-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Üretim süreci</p>
            <ProductionLineItemStageTrack
              steps={line.steps}
              stagePhotos={line.stagePhotos}
              readOnly
              theme="dark"
            />
            <p className="mt-2 text-[10px] font-semibold text-gray-600">
              Bu görünüm yalnızca takip içindir · aşamalara müdahale edilemez
            </p>
          </div>
        </div>
      )}
    </article>
  )
}

function JobAccordion({ job, isExpanded, onToggle, expandedLineId, onToggleLine }) {
  const primaryLine = job.lineItems[0]
  const summaryProducts = job.lineItems.length === 1
    ? primaryLine?.productName
    : `${job.lineItems.length} kalem`

  return (
    <article
      className={`overflow-hidden rounded-2xl border transition-all ${
        isExpanded
          ? 'border-blue-500/40 bg-dark-800/60 shadow-[0_8px_24px_rgba(0,0,0,0.15)]'
          : 'border-dark-500/45 bg-dark-800/50 hover:border-blue-500/30'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Factory className="h-4 w-4 shrink-0 text-amber-300" />
            <p className="text-sm font-black text-white">Sipariş {job.orderId}</p>
            <StatusPill label={job.jobStatus} />
          </div>
          <p className="truncate text-xs font-semibold text-gray-400">{summaryProducts}</p>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-semibold text-gray-500">
            <span>Sipariş: {job.orderDateLabel}</span>
            {job.quoteId && <span>Teklif: {job.quoteId}</span>}
            {job.jobStage && <span>Aşama: {job.jobStage}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          <span className="hidden rounded-lg border border-dark-500/45 bg-dark-700/50 px-2 py-1 text-[10px] font-black uppercase text-gray-500 sm:inline-flex">
            Salt okunur
          </span>
          <span
            className={`rounded-lg border p-2 transition-colors ${
              isExpanded
                ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
                : 'border-dark-500/50 bg-dark-700/70 text-gray-400'
            }`}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-3 border-t border-dark-500/40 px-4 pb-4 pt-3">
          <LinkageCard
            quoteId={job.quoteId}
            quoteTitle={job.quoteTitle}
            quoteDateLabel={job.quoteDateLabel}
            orderId={job.orderId}
            orderTitle={job.orderTitle}
            orderDateLabel={job.orderDateLabel}
          />

          {job.deliveryDateLabel && job.deliveryDateLabel !== '—' && (
            <p className="text-xs font-semibold text-gray-500">Termin tarihi: {job.deliveryDateLabel}</p>
          )}

          <div className="space-y-2">
            {job.lineItems.map((line) => (
              <LineItemAccordion
                key={line.id}
                line={line}
                isExpanded={expandedLineId === line.id}
                onToggle={() => onToggleLine(line.id)}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

export default function CustomerPortalProductionView({ jobs = [] }) {
  const [expandedJobId, setExpandedJobId] = useState(() => jobs[0]?.id || null)
  const [expandedLineId, setExpandedLineId] = useState(null)

  function toggleJob(jobId) {
    setExpandedJobId((current) => {
      const next = current === jobId ? null : jobId
      if (next !== jobId) setExpandedLineId(null)
      else {
        const job = jobs.find((entry) => entry.id === jobId)
        setExpandedLineId(job?.lineItems[0]?.id || null)
      }
      return next
    })
  }

  function toggleLine(lineId) {
    setExpandedLineId((current) => (current === lineId ? null : lineId))
  }

  if (jobs.length === 0) {
    return (
      <section className="card py-12 text-center">
        <Factory className="mx-auto mb-3 h-10 w-10 text-gray-600" />
        <p className="text-sm font-bold text-white">Aktif üretim takibi bulunmuyor</p>
        <p className="mt-1 text-xs text-gray-500">Siparişiniz üretime alındığında süreçler burada görüntülenecek.</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="card border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-dark-800/80">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-300">Üretim Takibi</p>
            <h2 className="mt-1 text-lg font-black text-white">Siparişlerinizin canlı üretim durumu</h2>
            <p className="mt-1 max-w-2xl text-xs text-gray-500">
              Kayıtları açarak teklif, sipariş ve kalem süreçlerini görüntüleyin. Tüm bilgiler salt okunurdur.
            </p>
          </div>
          <span className="rounded-xl border border-dark-500/45 bg-dark-700/60 px-3 py-2 text-xs font-black text-gray-300">
            {jobs.length} üretim kaydı
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {jobs.map((job) => (
          <JobAccordion
            key={job.id}
            job={job}
            isExpanded={expandedJobId === job.id}
            onToggle={() => toggleJob(job.id)}
            expandedLineId={expandedJobId === job.id ? expandedLineId : null}
            onToggleLine={toggleLine}
          />
        ))}
      </div>
    </section>
  )
}
