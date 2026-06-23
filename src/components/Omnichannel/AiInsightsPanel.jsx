import {
  Bot,
  FileText,
  Loader2,
  MessageSquare,
  Package,
  RefreshCw,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Zap,
} from 'lucide-react'

const SOURCE_LABELS = {
  openai: 'OpenAI',
  local: 'Yerel',
}

const SENTIMENT_LABELS = {
  positive: 'Olumlu',
  neutral: 'Nötr',
  negative: 'Olumsuz',
}

export default function AiInsightsPanel({
  insights,
  loading = false,
  aiSettings,
  learningStats,
  onApplySuggestion,
  onSendPrimary,
  onRegenerate,
  onFeedback,
  onToggleAutoReply,
}) {
  if (!insights && !loading) {
    return (
      <div className="border-t border-dark-500/45 bg-dark-900/80 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">AI Asistan</p>
        <p className="mt-2 text-xs text-gray-500">Konuşma seçildiğinde özet ve öneriler burada görünür.</p>
      </div>
    )
  }

  return (
    <div className="border-t border-dark-500/45 bg-dark-900/80 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-300">
          <Sparkles className="h-3.5 w-3.5" /> AI Asistan
          {insights?.source && (
            <span className="rounded-md border border-violet-500/25 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold normal-case tracking-normal text-violet-200">
              {SOURCE_LABELS[insights.source] || insights.source}
            </span>
          )}
        </p>

        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dark-500/45 px-2 py-1 text-[10px] font-bold text-gray-400 transition-colors hover:border-emerald-500/30 hover:text-emerald-300">
            <input
              type="checkbox"
              checked={Boolean(aiSettings?.autoReply)}
              onChange={(e) => onToggleAutoReply?.(e.target.checked)}
              className="rounded"
            />
            <Zap className="h-3 w-3" />
            Otomatik yanıt
          </label>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-dark-500/45 px-2 py-1 text-[10px] font-bold text-gray-400 transition-colors hover:border-violet-500/30 hover:text-violet-200 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Yenile
          </button>
        </div>
      </div>

      {loading && !insights?.summary && (
        <div className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-xs text-violet-200">
          <Loader2 className="h-4 w-4 animate-spin" />
          OpenAI konuşmayı analiz ediyor...
        </div>
      )}

      {insights?.error && (
        <p className="mb-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
          {insights.error} — yerel öneriler kullanılıyor.
        </p>
      )}

      {insights?.summary && (
        <div className="mb-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase text-gray-500">Özet</p>
            {insights.sentiment && (
              <span className={`text-[10px] font-bold ${
                insights.sentiment === 'negative' ? 'text-red-300'
                  : insights.sentiment === 'positive' ? 'text-emerald-300'
                    : 'text-gray-400'
              }`}
              >
                {SENTIMENT_LABELS[insights.sentiment] || insights.sentiment}
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed text-gray-300">{insights.summary}</p>
          {typeof insights.confidence === 'number' && insights.source === 'openai' && (
            <p className="mt-2 text-[10px] text-gray-500">
              Güven: {Math.round(insights.confidence * 100)}%
              {learningStats?.exampleCount > 0 && ` · ${learningStats.exampleCount} öğrenilmiş örnek`}
            </p>
          )}
        </div>
      )}

      {insights?.primaryReply && (
        <div className="mb-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3">
          <p className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase text-emerald-300">
            <Bot className="h-3 w-3" /> Önerilen yanıt
          </p>
          <p className="mb-2 text-xs leading-relaxed text-gray-200">{insights.primaryReply}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onApplySuggestion?.(insights.primaryReply)}
              className="rounded-lg border border-dark-500/45 px-2.5 py-1.5 text-[10px] font-bold text-gray-300 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/10"
            >
              Düzenle
            </button>
            <button
              type="button"
              onClick={() => onSendPrimary?.(insights.primaryReply)}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/80 px-2.5 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-emerald-500"
            >
              <Send className="h-3 w-3" /> Hemen gönder
            </button>
            <button
              type="button"
              onClick={() => onFeedback?.({ suggestion: insights.primaryReply, rating: 'up' })}
              className="rounded-lg border border-dark-500/45 p-1.5 text-gray-400 hover:border-emerald-500/30 hover:text-emerald-300"
              title="İyi yanıt"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onFeedback?.({ suggestion: insights.primaryReply, rating: 'down' })}
              className="rounded-lg border border-dark-500/45 p-1.5 text-gray-400 hover:border-red-500/30 hover:text-red-300"
              title="Kötü yanıt"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {insights?.replySuggestions?.length > 1 && (
        <div className="mb-3">
          <p className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase text-gray-500">
            <MessageSquare className="h-3 w-3" /> Alternatif cevaplar
          </p>
          <div className="space-y-2">
            {insights.replySuggestions
              .filter((s) => s !== insights.primaryReply)
              .map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onApplySuggestion?.(suggestion)}
                  className="w-full rounded-xl border border-dark-500/45 bg-dark-800/80 px-3 py-2 text-left text-xs text-gray-300 transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/5"
                >
                  {suggestion}
                </button>
              ))}
          </div>
        </div>
      )}

      {insights?.actions?.length > 0 && (
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
