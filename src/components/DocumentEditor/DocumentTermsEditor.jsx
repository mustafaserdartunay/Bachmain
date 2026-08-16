import { useState } from 'react'
import { CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { DeleteConfirmPopover } from '../Common/ListDeleteConfirmPanel'
import { AppPanelDot } from '../Layout/AppPageLayout'
import { APP_PANEL_TITLE_CLASS } from '../../utils/dashboardDesign'
import { loadSavedDocumentTerms, saveSavedDocumentTerms } from '../../utils/documentTermsStorage'

export default function DocumentTermsEditor({
  record,
  onPatch,
  compact = false,
  title = 'Koşullar',
  savedTermsTitle = 'Hazır Koşullar',
  descriptionPlaceholder = 'Ödeme, teslimat, üretim veya özel açıklamalarını buraya yazın...',
  field = 'termsDescription',
  hideTitle = false,
  alignDescriptionHeader = false,
  panelTitle = '',
}) {
  const [customTerm, setCustomTerm] = useState('')
  const [savedTerms, setSavedTerms] = useState(loadSavedDocumentTerms)
  const [pendingDeleteTerm, setPendingDeleteTerm] = useState(null)
  const value = record?.[field] || ''
  const showTitle = Boolean(title) && !hideTitle
  const leftHeader = panelTitle || savedTermsTitle

  function saveTerm(term) {
    const cleanTerm = term.trim()
    if (!cleanTerm || savedTerms.includes(cleanTerm)) return
    const nextTerms = [cleanTerm, ...savedTerms]
    setSavedTerms(nextTerms)
    saveSavedDocumentTerms(nextTerms)
    setCustomTerm('')
  }

  function appendTermToDescription(term) {
    const currentText = value
    const nextText = currentText.trim()
      ? `${currentText.trimEnd()}\n- ${term}`
      : `- ${term}`
    onPatch({ [field]: nextText })
  }

  function deleteSavedTerm(term) {
    const nextTerms = savedTerms.filter((item) => item !== term)
    setSavedTerms(nextTerms)
    saveSavedDocumentTerms(nextTerms)
    setPendingDeleteTerm(null)
  }

  if (compact && alignDescriptionHeader) {
    return (
      <div className="grid grid-cols-2 items-stretch gap-3">
        <div className={`flex flex-col ${compact ? 'min-h-[220px]' : ''}`}>
          <div className="mb-2.5 flex shrink-0 items-center gap-2">
            <AppPanelDot color="blue" />
            <h2 className={APP_PANEL_TITLE_CLASS}>{leftHeader}</h2>
          </div>
          <div className="document-frame-only flex min-h-0 flex-1 flex-col rounded-[16px] border border-[var(--search-border)] bg-transparent p-3">
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {savedTerms.map((term) => (
                <div key={term} className="relative flex items-center gap-2">
                  {pendingDeleteTerm === term ? (
                    <div className="document-frame-only min-w-0 flex-1 rounded-xl border border-[var(--search-border)] bg-transparent">
                      <DeleteConfirmPopover
                        description="Hazır koşul listeden kaldırılacak."
                        confirmLabel="Evet"
                        cancelLabel="Hayır"
                        compact
                        inline
                        onConfirm={() => deleteSavedTerm(term)}
                        onCancel={() => setPendingDeleteTerm(null)}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => appendTermToDescription(term)}
                        className="document-frame-only flex min-w-0 flex-1 items-start gap-2 rounded-xl border border-[var(--search-border)] bg-transparent px-3 py-2 text-left transition-opacity hover:opacity-90"
                        data-tone="primary"
                      >
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--muted)]" strokeWidth={2.25} />
                        <span className={APP_PANEL_TITLE_CLASS}>{term}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteTerm(term)}
                        className="glass-sidebar-toggle flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[var(--muted)] transition-colors"
                        data-tone="danger"
                        title="Hazır koşulu sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                      </button>
                    </>
                  )}
                </div>
              ))}
              {savedTerms.length === 0 && (
                <div className="rounded-xl border border-dashed border-[var(--search-border)] px-3 py-4 text-center text-[14px] font-normal text-[var(--muted)]">
                  Henüz kayıtlı hazır koşul yok.
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                value={customTerm}
                onChange={(event) => setCustomTerm(event.target.value)}
                placeholder="Hazır koşul kaydet..."
                className="form-input h-10 min-w-0 flex-1 !text-[14px] !font-normal !text-[var(--muted)]"
              />
              <button
                type="button"
                onClick={() => saveTerm(customTerm)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--search-border)] bg-transparent px-3 text-[14px] font-normal text-[#2563eb] transition-all hover:scale-[1.03] hover:font-bold hover:text-[#2563eb]"
              >
                <Plus className="h-4 w-4 text-[#2563eb]" strokeWidth={2.25} />
                Ekle
              </button>
            </div>
          </div>
        </div>

        <div className="flex min-h-[180px] flex-col">
          <div className="mb-2.5 flex shrink-0 items-center gap-2">
            <AppPanelDot color="blue" />
            <h2 className={APP_PANEL_TITLE_CLASS}>Açıklama :</h2>
          </div>
          <textarea
            value={value}
            onChange={(event) => onPatch({ [field]: event.target.value })}
            placeholder={descriptionPlaceholder}
            className="document-frame-only min-h-0 flex-1 resize-none rounded-[16px] border border-[var(--search-border)] bg-transparent px-4 py-3 text-[14px] font-normal leading-tight tracking-normal text-[var(--muted)] placeholder-[var(--muted)] outline-none"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={compact ? '' : 'glass-inset col-span-2 rounded-[20px] p-4'}>
      {showTitle && !compact ? (
        <div className="mb-4 text-center">
          <h3 className={APP_PANEL_TITLE_CLASS}>{title}</h3>
        </div>
      ) : null}
      {showTitle && compact ? <p className={`mb-4 ${APP_PANEL_TITLE_CLASS}`}>{title}</p> : null}
      <div
        className={
          compact
            ? 'grid grid-cols-2 items-stretch gap-3'
            : 'grid grid-cols-[390px_minmax(0,1fr)] items-stretch gap-4'
        }
      >
        <div
          className={`glass-inset flex flex-col rounded-[16px] p-3 ${compact ? 'min-h-[220px]' : 'h-[332px]'}`}
        >
          <div className="mb-3 flex items-center gap-2">
            <AppPanelDot color="blue" />
            <h3 className={APP_PANEL_TITLE_CLASS}>{savedTermsTitle}</h3>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {savedTerms.map((term) => (
              <div key={term} className="relative flex items-center gap-2">
                {pendingDeleteTerm === term ? (
                  <div className="document-frame-only min-w-0 flex-1 rounded-xl border border-[var(--search-border)] bg-transparent">
                    <DeleteConfirmPopover
                      description="Hazır koşul listeden kaldırılacak."
                      confirmLabel="Evet"
                      cancelLabel="Hayır"
                      compact
                      inline
                      onConfirm={() => deleteSavedTerm(term)}
                      onCancel={() => setPendingDeleteTerm(null)}
                      className="w-full"
                    />
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => appendTermToDescription(term)}
                      className="document-frame-only flex min-w-0 flex-1 items-start gap-2 rounded-xl border border-[var(--search-border)] bg-transparent px-3 py-2 text-left text-[13px] font-medium text-[var(--muted)] transition-opacity hover:opacity-90"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--muted)]" strokeWidth={2.25} />
                      <span>{term}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteTerm(term)}
                      className="glass-sidebar-toggle flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[var(--muted)] transition-colors hover:!border-[#e11d48] hover:!text-[#e11d48]"
                      title="Hazır koşulu sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </button>
                  </>
                )}
              </div>
            ))}
            {savedTerms.length === 0 && (
              <div className="rounded-xl border border-dashed border-dark-500/70 px-3 py-4 text-center text-[13px] font-medium text-[var(--muted)]">
                Henüz kayıtlı hazır koşul yok.
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              value={customTerm}
              onChange={(event) => setCustomTerm(event.target.value)}
              placeholder="Hazır koşul kaydet..."
              className="form-input h-10 min-w-0 flex-1"
            />
            <button
              type="button"
              onClick={() => saveTerm(customTerm)}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--search-border)] bg-transparent px-3 text-[14px] font-normal text-[#2563eb] transition-all hover:scale-[1.03] hover:font-bold hover:text-[#2563eb]"
            >
              <Plus className="h-4 w-4 text-[#2563eb]" strokeWidth={2.25} />
              Ekle
            </button>
          </div>
        </div>

        <div className={`flex flex-col ${compact ? 'min-h-[180px]' : 'h-[332px]'}`}>
          <div className="mb-2 flex items-center gap-2">
            <AppPanelDot color="blue" />
            <h4 className={APP_PANEL_TITLE_CLASS}>Açıklama :</h4>
          </div>
          <div className="glass-inset flex min-h-0 flex-1 flex-col rounded-[16px] p-3">
            <textarea
              value={value}
              onChange={(event) => onPatch({ [field]: event.target.value })}
              placeholder={descriptionPlaceholder}
              className="document-frame-only min-h-0 flex-1 resize-none rounded-2xl border border-dark-500/50 bg-transparent px-4 py-3 text-[14px] font-normal text-[var(--ink)] placeholder-[var(--muted)] outline-none transition-colors focus:border-blue-500/35"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
