import { MessageCircle, Send } from 'lucide-react'
import { whatsappMessages, statusBadgeMap } from '../../data/mockData'

export default function WhatsAppWidget() {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">WhatsApp Entegrasyonu</h3>
      </div>

      <div className="flex gap-1 mb-3">
        <button className="px-3 py-1 rounded-md text-xs bg-emerald-500/20 text-emerald-400">Gelen Mesajlar</button>
        <button className="px-3 py-1 rounded-md text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
          <Send className="w-3 h-3" /> Toplu Mesaj
        </button>
      </div>

      <div className="space-y-2">
        {whatsappMessages.map((msg, i) => (
          <div key={i} className="flex items-start gap-3 py-2 border-b border-dark-500/20 last:border-0">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-emerald-400">{msg.sender[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-300">{msg.sender}</p>
                <span className="text-[10px] text-gray-500">{msg.date}</span>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">{msg.message}</p>
            </div>
            <span className={`${statusBadgeMap[msg.status]} shrink-0`}>{msg.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
