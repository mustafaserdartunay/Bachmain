export const settingsSubMenus = [
  { label: 'Yönetici Ayarları', path: '/ayarlar', icon: 'user-cog' },
  { label: 'AI Ayarları', path: '/ayarlar/ai', icon: 'bot' },
  { label: 'OpenAI', path: '/ayarlar/ai/openai', icon: 'sparkles' },
  {
    label: 'Kurumsal Yapı',
    path: '/ayarlar/kurumsal-yapi',
    icon: 'building-2',
    moduleCode: 'multi_company',
  },
  { label: 'Güncel Durum', path: '/ayarlar/guncel-durum', icon: 'gauge' },
  { label: 'Vergi ve KDV Yönetimi', path: '/ayarlar/vergi-kdv', icon: 'percent' },
  { label: 'Sektörel Ayarlar', path: '/ayarlar/sektorel', icon: 'tags' },
  { label: 'Süreçler Yönetimi', path: '/ayarlar/etiketler', icon: 'git-branch' },
]
