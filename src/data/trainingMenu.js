import { visibleCustomerSubMenus } from './customerMenu'
import { expensesSubMenus } from './expensesMenu'
import { treasurySubMenus } from './treasuryMenu'
import { stockSubMenus } from './stockMenu'
import { visibleProcessSubMenus } from './processMenu'
import { hrSubMenus } from './hrMenu'
import { fieldSalesSubMenus } from './fieldSalesMenu'
import { projectsSubMenus } from './projectsMenu'
import { settingsSubMenus } from './settingsMenu'

function mapMenuItems(items = []) {
  return items.map((item) => ({
    label: item.label,
    path: item.path,
    videoId: item.videoId || '',
  }))
}

/** Sol menü yapısıyla eşleşen eğitim bölümleri. videoId doldurulunca doğrudan YouTube oynatılır. */
export const TRAINING_SECTIONS = [
  {
    id: 'dashboard',
    title: 'Güncel Durum',
    items: [{ label: 'Güncel Durum Paneli', path: '/', videoId: '' }],
  },
  {
    id: 'erp',
    title: 'ERP',
    items: [
      ...mapMenuItems(visibleCustomerSubMenus),
      ...mapMenuItems(visibleProcessSubMenus),
      ...mapMenuItems(expensesSubMenus),
      ...mapMenuItems(treasurySubMenus),
      ...mapMenuItems(stockSubMenus),
      ...mapMenuItems(projectsSubMenus),
    ],
  },

  {
    id: 'crm',
    title: 'CRM',
    items: [
      ...mapMenuItems(fieldSalesSubMenus),
      { label: 'Mesaj Merkezi', path: '/mesajlar', videoId: '' },
      { label: 'Ajanda', path: '/crm', videoId: '' },
    ],
  },
  {
    id: 'hr',
    title: 'İK',
    items: mapMenuItems(hrSubMenus),
  },
  {
    id: 'logistics',
    title: 'LOJİSTİK',
    items: [{ label: 'Lojistik', path: '/lojistik', videoId: '' }],
  },
  {
    id: 'tools',
    title: 'Diğer Modüller',
    items: mapMenuItems([
      { label: 'Kurye Takip', path: '/kurye-takip' },
      { label: 'Pos', path: '/shopping' },
      { label: 'Bayi Yönetimi', path: '/bayi' },
      { label: 'E-Fatura', path: '/efatura' },
      { label: 'Raporlar', path: '/raporlar' },
    ]),
  },
  {
    id: 'settings',
    title: 'Ayarlar',
    items: mapMenuItems(settingsSubMenus),
  },
]

export function getTrainingVideoUrl(item) {
  const videoId = String(item?.videoId || '').trim()
  if (videoId) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
  }
  const query = encodeURIComponent(`Bach CRM ${item?.label || 'eğitim'} kullanım`)
  return `https://www.youtube.com/results?search_query=${query}`
}

export function openTrainingVideo(item) {
  window.open(getTrainingVideoUrl(item), '_blank', 'noopener,noreferrer')
}
