import { documentCenterSubMenus, DOCUMENT_CENTER_BASE } from './documentCenterMenu'

export const settingsSubMenus = [
  { label: 'Yönetici Ayarları', path: '/ayarlar' },
  { label: 'Güncel Durum', path: '/ayarlar/guncel-durum' },
  { label: 'Mesaj Merkezi Yönetimi', path: '/ayarlar/mesaj-merkezi' },
  { label: 'Vergi ve KDV Yönetimi', path: '/ayarlar/vergi-kdv' },
  { label: 'Sektörel Ayarlar', path: '/ayarlar/sektorel' },
  { label: 'Süreçler Yönetimi', path: '/ayarlar/etiketler' },
  ...documentCenterSubMenus.map((item) => ({
    ...item,
    label: item.path === DOCUMENT_CENTER_BASE ? 'Belge Merkezi' : item.label,
  })),
]
