import { Mail } from 'lucide-react'
import {
  MAIL_BILDIRIM_BUTTON_CLASS,
  MAIL_BILDIRIM_SENT_BUTTON_CLASS,
} from '../../utils/buttonStyles'

/**
 * Süreç aşamalarında müşteriye e-posta bildirimi göndermek için ortak buton.
 */
export default function MailNotifyButton({
  title = 'E-posta bildirimi gönder',
  onClick,
  sent = false,
  brand = false,
  showSentLabel = true,
  className = '',
}) {
  const frameClass = sent ? MAIL_BILDIRIM_SENT_BUTTON_CLASS : MAIL_BILDIRIM_BUTTON_CLASS

  if (brand) {
    return (
      <div className={`relative shrink-0 ${className}`}>
        <button
          type="button"
          onClick={onClick}
          title={title}
          className={`${frameClass} shrink-0 rounded-lg`}
        >
          <Mail className="h-3.5 w-3.5 text-current" />
        </button>
        {showSentLabel && sent && (
          <span className="pointer-events-none absolute left-1/2 top-full mt-0.5 -translate-x-1/2 whitespace-nowrap text-[6px] font-bold leading-none text-cyan-500">
            Gönderildi
          </span>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`${frameClass} shrink-0 rounded-lg ${className}`}
    >
      <Mail className="h-3.5 w-3.5 text-current" />
    </button>
  )
}
