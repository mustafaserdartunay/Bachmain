import { Drawer, Tabs } from '@bachmain/ui'
import { useState } from 'react'

const TABS = [
  { id: 'general', label: 'Genel' },
  { id: 'files', label: 'Dosyalar' },
  { id: 'messages', label: 'Mesajlar' },
  { id: 'history', label: 'Geçmiş' },
  { id: 'subtasks', label: 'Alt Görevler' },
  { id: 'comments', label: 'Yorumlar' },
  { id: 'activities', label: 'Aktiviteler' },
  { id: 'docs', label: 'İlişkili Belgeler' },
  { id: 'ai', label: 'Yapay Zeka' },
]

export default function ProcessItemDrawer({ item, open, onClose, onAiAction }) {
  const [tab, setTab] = useState('general')

  if (!item) return null

  return (
    <Drawer open={open} onClose={onClose} title={item.title || 'Kart detayı'} side="right" className="!w-[min(100vw,26rem)]">
      <div className="process-drawer">
        <Tabs
          items={TABS.map((t) => ({ value: t.id, label: t.label }))}
          value={tab}
          onChange={setTab}
        />
        <div className="process-drawer__body">
          {tab === 'general' && (
            <dl className="process-drawer__dl">
              <div><dt>Durum</dt><dd>{item.status || item.stageId || '—'}</dd></div>
              <div><dt>Firma</dt><dd>{item.company || '—'}</dd></div>
              <div><dt>Müşteri</dt><dd>{item.customer || '—'}</dd></div>
              <div><dt>Sorumlu</dt><dd>{item.assignee || '—'}</dd></div>
              <div><dt>Öncelik</dt><dd>{item.priority || '—'}</dd></div>
              <div><dt>Son tarih</dt><dd>{item.dueDate || '—'}</dd></div>
              <div><dt>İlerleme</dt><dd>{typeof item.progress === 'number' ? `%${item.progress}` : '—'}</dd></div>
              <div><dt>Etiket</dt><dd>{(item.tags || []).join(', ') || '—'}</dd></div>
            </dl>
          )}
          {tab === 'ai' && (
            <div className="process-drawer__ai">
              {[
                ['Özet oluştur', 'summary'],
                ['Sonraki adımı öner', 'next'],
                ['Risk analizi', 'risk'],
                ['Hatırlatma oluştur', 'remind'],
                ['Mail yaz', 'mail'],
                ['WhatsApp yaz', 'whatsapp'],
                ['Görev oluştur', 'task'],
              ].map(([label, action]) => (
                <button
                  key={action}
                  type="button"
                  className="process-btn process-btn--block"
                  onClick={() => onAiAction?.(action, item)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {tab !== 'general' && tab !== 'ai' && (
            <p className="process-empty">Bu sekme yakında bu modül verisine bağlanacak.</p>
          )}
        </div>
      </div>
    </Drawer>
  )
}
