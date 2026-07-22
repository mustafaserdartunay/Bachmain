export default function BachySpeechBubble({ text, onClose }) {
  if (!text) return null
  return (
    <div className="pointer-events-auto relative mb-2 max-w-[16rem] rounded-2xl border border-ds-border bg-ds-surface px-3 py-2 text-left shadow-ds-md">
      <p className="text-ds-small leading-snug text-ds-ink">{text}</p>
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ds-surface-muted text-[10px] text-ds-muted"
      >
        ×
      </button>
      <span className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-ds-border bg-ds-surface" />
    </div>
  )
}
