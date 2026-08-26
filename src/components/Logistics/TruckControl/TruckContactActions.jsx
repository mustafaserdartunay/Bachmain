import { MessageCircle, Phone } from 'lucide-react'
import { telHref, whatsappHref as waHref } from '../../../utils/truckControlCenter'
import { YF_TEXT_CLASS } from '../../../utils/dashboardDesign'

export default function TruckContactActions({ phone, name = '', context = '' }) {
  const tel = telHref(phone)
  const wa = waHref(phone, context)
  if (!tel && !wa) {
    return <span className={YF_TEXT_CLASS}>İletişim bilgisi yok</span>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {tel ? (
        <a href={tel} className="tcc-map-chip inline-flex items-center gap-1 no-underline">
          <Phone className="h-3.5 w-3.5" />
          Ara
        </a>
      ) : null}
      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="tcc-map-chip inline-flex items-center gap-1 no-underline"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>
      ) : null}
      {tel ? (
        <a href={tel} className="tcc-map-chip inline-flex items-center gap-1 no-underline">
          Mesaj
        </a>
      ) : null}
      {name ? null : null}
    </div>
  )
}
