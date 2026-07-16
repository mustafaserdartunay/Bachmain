import { customerSubMenus } from './customerMenu'
import { expensesSubMenus } from './expensesMenu'
import { treasurySubMenus } from './treasuryMenu'
import { stockSubMenus } from './stockMenu'
import { processSubMenus } from './processMenu'
import { hrSubMenus } from './hrMenu'
import { fieldSalesSubMenus } from './fieldSalesMenu'
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
    id: 'sales',
    title: 'Satışlar',
    items: mapMenuItems(customerSubMenus),
  },
  {
    id: 'expenses',
    title: 'Giderler',
    items: mapMenuItems(expensesSubMenus),
  },
  {
    id: 'treasury',
    title: 'Nakit',
    items: mapMenuItems(treasurySubMenus),
  },
  {
    id: 'stock',
    title: 'Stok',
    items: mapMenuItems(stockSubMenus),
  },
  {
    id: 'process',
    title: 'Süreç Yönetimi',
    items: mapMenuItems(processSubMenus),
  },
  {
    id: 'crm',
    title: 'CRM',
    items: [{ label: 'CRM Merkezi', path: '/crm', videoId: '' }],
  },
  {
    id: 'hr',
    title: 'İnsan Kaynakları',
    items: mapMenuItems(hrSubMenus),
  },
  {
    id: 'field-sales',
    title: 'Saha Satış',
    items: mapMenuItems(fieldSalesSubMenus),
  },
  {
    id: 'tools',
    title: 'Diğer Modüller',
    items: mapMenuItems([
      { label: 'Kurye Takip', path: '/kurye-takip' },
      { label: 'Yeni Proje', path: '/projeler/yeni' },
      { label: 'Pos', path: '/shopping' },
      { label: 'Bayi Yönetimi', path: '/bayi' },
      { label: 'Mesaj Merkezi', path: '/mesajlar' },
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
