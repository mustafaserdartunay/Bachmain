import { useState } from 'react'
import { CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { DeleteConfirmPopover } from '../Common/ListDeleteConfirmPanel'
import { BTN_PRIMARY } from '../../utils/buttonStyles'
import { loadSavedDocumentTerms, saveSavedDocumentTerms } from '../../utils/documentTermsStorage'

export default function DocumentTermsEditor({
  record,
  onPatch,
  compact = false,
  title = 'Koşullar',
  savedTermsTitle = 'Hazır Koşullar',
  descriptionPlaceholder = 'Ödeme, teslimat, üretim veya özel açıklamalarını buraya yazın...',
  field = 'termsDescription',
}) {
  const [customTerm, setCustomTerm] = useState('')
  const [savedTerms, setSavedTerms] = useState(loadSavedDocumentTerms)
  const [pendingDeleteTerm, setPendingDeleteTerm] = useState(null)
  const value = record?.[field] || ''

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

  return (
    <div className={compact ? '' : 'col-span-2 rounded-3xl border border-dark-500/45 bg-dark-900/35 p-4'}>
      {!compact && (
        <div className="mb-4 text-center">
          <h3 className="text-base font-bold text-white">{title}</h3>
        </div>
      )}
      {compact && (
        <p className="mb-4 text-base font-bold text-white">{title}</p>
      )}
      <div className={compact
        ? 'grid grid-cols-2 items-stretch gap-3'
        : 'grid grid-cols-[minmax(0,1fr)_390px] items-stretch gap-4'}>
        <div className={`flex flex-col rounded-2xl border border-dark-500/45 bg-dark-800/70 p-3 ${compact ? 'min-h-[180px]' : 'h-[332px]'}`}>
          <div className="mb-3">
            <h4 className="text-base font-bold text-white">Açıklama</h4>
          </div>
          <textarea
            value={value}
            onChange={(event) => onPatch({ [field]: event.target.value })}
            placeholder={descriptionPlaceholder}
            className="min-h-0 flex-1 resize-none rounded-2xl border border-dark-500/50 bg-dark-700/70 px-4 py-3 text-sm text-gray-200 placeholder-gray-500 outline-none transition-colors focus:border-blue-500/35 focus:bg-dark-700/80"
          />
        </div>

        <div className={`flex flex-col rounded-2xl border border-dark-500/45 bg-dark-800/70 p-3 ${compact ? 'min-h-[220px]' : 'h-[332px]'}`}>
          <div className="mb-3">
            <h3 className="text-base font-bold text-white">{savedTermsTitle}</h3>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {savedTerms.map((term) => (
              <div key={term} className="relative rounded-xl bg-dark-700/70">
                {pendingDeleteTerm === term ? (
                  <DeleteConfirmPopover
                    description="Hazır koşul listeden kaldırılacak."
                    onConfirm={() => deleteSavedTerm(term)}
                    onCancel={() => setPendingDeleteTerm(null)}
                    className="w-full"
                  />
                ) : (
                  <div className="flex items-start gap-2 rounded-xl transition-colors hover:bg-blue-500/15">
                    <button
                      type="button"
                      onClick={() => appendTermToDescription(term)}
                      className="flex min-w-0 flex-1 items-start gap-2 px-3 py-2 text-left text-xs font-semibold text-gray-300"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" />
                      <span>{term}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteTerm(term)}
                      className="mr-2 mt-2 shrink-0 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/15 hover:text-red-300"
                      title="Hazır koşulu sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {savedTerms.length === 0 && (
              <div className="rounded-xl border border-dashed border-dark-500/70 px-3 py-4 text-center text-xs font-semibold text-gray-500">
                Henüz kayıtlı hazır koşul yok.
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={customTerm}
              onChange={(event) => setCustomTerm(event.target.value)}
              placeholder="Hazır koşul kaydet..."
              className="h-10 min-w-0 flex-1 rounded-xl border border-dark-500/50 bg-dark-700/70 px-3 text-xs font-semibold text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/35"
            />
            <button
              type="button"
              onClick={() => saveTerm(customTerm)}
              className={`${BTN_PRIMARY} h-10 gap-1.5 px-3 text-xs`}
            >
              <Plus className="h-3.5 w-3.5" /> Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
