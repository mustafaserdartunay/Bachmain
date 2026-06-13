import WhatsAppBusinessIcon from './WhatsAppBusinessIcon'
import {
  WHATSAPP_BILDIRIM_BUTTON_CLASS,
  WHATSAPP_BILDIRIM_SENT_BUTTON_CLASS,
} from '../../utils/buttonStyles'

/**
 * Süreç aşamalarında müşteriye WhatsApp Business bildirimi göndermek için ortak buton.
 */
export default function WhatsAppNotifyButton({
  title = 'WhatsApp Business bildirimi gönder',
  onClick,
  sent = false,
  compact = false,
  brand = false,
  showSentLabel = true,
  size = 'md',
  className = '',
}) {
  const brandFrameClass = sent ? WHATSAPP_BILDIRIM_SENT_BUTTON_CLASS : WHATSAPP_BILDIRIM_BUTTON_CLASS

  const legacyIconButtonClass = sent
    ? 'relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-cyan-500 bg-transparent text-cyan-500 transition-colors hover:border-cyan-400 hover:text-cyan-400'
    : 'relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#25D366] bg-transparent text-[#25D366] transition-colors hover:border-[#20bd5a] hover:text-[#20bd5a]'

  if (brand || compact) {
    return (
      <div className={`relative shrink-0 ${className}`}>
        <button
          type="button"
          onClick={onClick}
          title={title}
          className={`${brandFrameClass} shrink-0 rounded-lg`}
        >
          <WhatsAppBusinessIcon className="h-3.5 w-3.5 text-current" />
        </button>
        {showSentLabel && sent && (
          <span className="pointer-events-none absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-[6px] font-bold leading-none text-cyan-500">
            Gönderildi
          </span>
        )}
      </div>
    )
  }

  const buttonSizeClass = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'

  return (
    <div className={`space-y-1 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`${legacyIconButtonClass} ${buttonSizeClass}`}
      >
        <WhatsAppBusinessIcon className="h-3 w-3 text-current" />
      </button>
      {showSentLabel && sent && (
        <p className="truncate px-0.5 text-center text-[8px] font-bold leading-tight text-cyan-500">
          Gönderildi
        </p>
      )}
    </div>
  )
}
