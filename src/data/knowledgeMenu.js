export const KNOWLEDGE_BASE = '/bilgi-merkezi'

export const knowledgeSubMenus = [
  { id: 'dashboard', label: 'Dashboard', path: KNOWLEDGE_BASE },
  { id: 'documents', label: 'Belgeler', path: `${KNOWLEDGE_BASE}?tab=documents` },
  { id: 'bank', label: 'Bilgi Bankası', path: `${KNOWLEDGE_BASE}?tab=bank` },
  { id: 'memory', label: 'AI Hafızası', path: `${KNOWLEDGE_BASE}?tab=memory` },
  { id: 'sop', label: 'İş Talimatları', path: `${KNOWLEDGE_BASE}?tab=sop` },
  { id: 'procedures', label: 'Prosedürler', path: `${KNOWLEDGE_BASE}?tab=procedures` },
  { id: 'faq', label: 'Sık Sorulan Sorular', path: `${KNOWLEDGE_BASE}?tab=faq` },
  { id: 'videos', label: 'Video Eğitimler', path: `${KNOWLEDGE_BASE}?tab=videos` },
  { id: 'wiki', label: 'Şirket Wiki', path: `${KNOWLEDGE_BASE}?tab=wiki` },
  { id: 'policies', label: 'Politikalar', path: `${KNOWLEDGE_BASE}?tab=policies` },
  { id: 'versions', label: 'Versiyonlar', path: `${KNOWLEDGE_BASE}?tab=versions` },
  { id: 'archive', label: 'Arşiv', path: `${KNOWLEDGE_BASE}?tab=archive` },
  { id: 'search', label: 'Arama', path: `${KNOWLEDGE_BASE}?tab=search` },
]

export function isKnowledgeRoute(pathname) {
  return pathname === KNOWLEDGE_BASE || pathname.startsWith(`${KNOWLEDGE_BASE}/`)
}
