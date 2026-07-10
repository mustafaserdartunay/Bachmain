import {
  Bot,
  FileText,
  Loader2,
  MessageSquare,
  Package,
  RefreshCw,
  Send,
  ThumbsDown,
  ThumbsUp,
  Zap,
} from 'lucide-react'
import { AppPanelDot } from '../Layout/AppPageLayout'
import {
  APP_FILTER_LABEL_CLASS,
  APP_OMNI_SECTION_CLASS,
  APP_PANEL_TITLE_CLASS,
  APP_SUBLABEL_CLASS,
} from '../../utils/dashboardDesign'
import { BTN_SUCCESS } from '../../utils/buttonStyles'

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
      <div className="shrink-0 border-t border-white/40 px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          <AppPanelDot color="violet" />
          <p className={APP_PANEL_TITLE_CLASS}>AI Asistan</p>
        </div>
        <p className={APP_SUBLABEL_CLASS}>Konuşma seçildiğinde özet ve öneriler burada görünür.</p>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-white/40 px-4 py-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2">
          <AppPanelDot color="violet" />
          <span className={APP_PANEL_TITLE_CLASS}>AI Asistan</span>
          {insights?.source && (
            <span className="glass-pill !h-6 !px-2 !text-[11px] !font-bold text-violet-600">
              {SOURCE_LABELS[insights.source] || insights.source}
            </span>
          )}
        </p>

        <div className="flex items-center gap-2">
          <label className="glass-pill flex !h-8 cursor-pointer items-center gap-1.5 !px-2 !text-[12px] !font-bold text-[var(--muted)]">
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
            className="btn-ghost inline-flex items-center gap-1 !px-2 !py-1.5 text-[12px] font-bold disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Yenile
          </button>
        </div>
      </div>

      {loading && !insights?.summary && (
        <div className={`${APP_OMNI_SECTION_CLASS} flex items-center gap-2 text-xs font-semibold text-violet-600`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          OpenAI konuşmayı analiz ediyor...
        </div>
      )}

      {insights?.error && (
        <p className="mb-3 glass-inset rounded-[12px] px-3 py-2 text-[13px] font-semibold text-amber-700">
          {insights.error} — yerel öneriler kullanılıyor.
        </p>
      )}

      {insights?.summary && (
        <div className={`${APP_OMNI_SECTION_CLASS} mb-3`}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className={APP_FILTER_LABEL_CLASS}>Özet</p>
            {insights.sentiment && (
              <span className={`text-[12px] font-bold ${
                insights.sentiment === 'negative' ? 'text-rose-600'
                  : insights.sentiment === 'positive' ? 'text-emerald-600'
                    : 'text-[var(--muted)]'
              }`}
              >
                {SENTIMENT_LABELS[insights.sentiment] || insights.sentiment}
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed text-[var(--ink)]">{insights.summary}</p>
          {typeof insights.confidence === 'number' && insights.source === 'openai' && (
            <p className={`mt-2 ${APP_SUBLABEL_CLASS}`}>
              Güven: {Math.round(insights.confidence * 100)}%
              {learningStats?.exampleCount > 0 && ` · ${learningStats.exampleCount} öğrenilmiş örnek`}
            </p>
          )}
        </div>
      )}

      {insights?.primaryReply && (
        <div className={`${APP_OMNI_SECTION_CLASS} mb-3`}>
          <p className={`mb-2 flex items-center gap-1 ${APP_FILTER_LABEL_CLASS}`}>
            <Bot className="h-3 w-3" /> Önerilen yanıt
          </p>
          <p className="mb-2 text-xs leading-relaxed text-[var(--ink)]">{insights.primaryReply}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onApplySuggestion?.(insights.primaryReply)}
              className="btn-ghost !px-2.5 !py-1.5 text-[12px] font-bold"
            >
              Düzenle
            </button>
            <button
              type="button"
              onClick={() => onSendPrimary?.(insights.primaryReply)}
              className={`${BTN_SUCCESS} inline-flex items-center gap-1 !px-2.5 !py-1.5 text-[12px]`}
            >
              <Send className="h-3 w-3" /> Hemen gönder
            </button>
            <button
              type="button"
              onClick={() => onFeedback?.({ suggestion: insights.primaryReply, rating: 'up' })}
              className="icon-btn !h-8 !w-8 !rounded-[10px] text-emerald-600"
              title="İyi yanıt"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onFeedback?.({ suggestion: insights.primaryReply, rating: 'down' })}
              className="icon-btn !h-8 !w-8 !rounded-[10px] text-rose-600"
              title="Kötü yanıt"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {insights?.replySuggestions?.length > 1 && (
        <div className="mb-3">
          <p className={`mb-2 flex items-center gap-1 ${APP_FILTER_LABEL_CLASS}`}>
            <MessageSquare className="h-3 w-3" /> Alternatif cevaplar
          </p>
          <div className="space-y-1">
            {insights.replySuggestions
              .filter((s) => s !== insights.primaryReply)
              .map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onApplySuggestion?.(suggestion)}
                  className="glass-inset glass-inset-hover w-full rounded-[12px] px-3 py-2 text-left text-xs font-semibold text-[var(--ink)]"
                >
                  {suggestion}
                </button>
              ))}
          </div>
        </div>
      )}

      {insights?.actions?.length > 0 && (
        <div>
          <p className={`mb-2 ${APP_FILTER_LABEL_CLASS}`}>Aksiyon Önerileri</p>
          <div className="space-y-1">
            {insights.actions.map((action) => (
              <div
                key={action.type}
                className="glass-inset flex items-start gap-2 rounded-[12px] px-3 py-2"
              >
                {action.type === 'quote' ? (
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                ) : (
                  <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                )}
                <div>
                  <p className="text-xs font-extrabold text-[var(--ink)]">{action.label}</p>
                  {action.path && <p className={APP_SUBLABEL_CLASS}>{action.path}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
