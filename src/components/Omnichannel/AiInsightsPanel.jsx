import { FileText, MessageSquare, Package, Sparkles } from 'lucide-react'

export default function AiInsightsPanel({ insights, onApplySuggestion }) {
  if (!insights) {
    return (
      <div className="border-t border-dark-500/45 bg-dark-900/80 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">AI Asistan</p>
        <p className="mt-2 text-xs text-gray-500">Konuşma seçildiğinde özet ve öneriler burada görünür.</p>
      </div>
    )
  }

  return (
    <div className="border-t border-dark-500/45 bg-dark-900/80 p-4">
      <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-300">
        <Sparkles className="h-3.5 w-3.5" /> AI Asistan
      </p>

      <div className="mb-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
        <p className="text-[10px] font-black uppercase text-gray-500">Özet</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-300">{insights.summary}</p>
      </div>

      <div className="mb-3">
        <p className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase text-gray-500">
          <MessageSquare className="h-3 w-3" /> Cevap Önerileri
        </p>
        <div className="space-y-2">
          {insights.replySuggestions?.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onApplySuggestion(suggestion)}
              className="w-full rounded-xl border border-dark-500/45 bg-dark-800/80 px-3 py-2 text-left text-xs text-gray-300 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/5"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {insights.actions?.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-black uppercase text-gray-500">Aksiyon Önerileri</p>
          <div className="space-y-2">
            {insights.actions.map((action) => (
              <div
                key={action.type}
                className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2"
              >
                {action.type === 'quote' ? (
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                ) : (
                  <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                )}
                <div>
                  <p className="text-xs font-bold text-amber-200">{action.label}</p>
                  {action.path && <p className="text-[11px] text-gray-500">{action.path}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
