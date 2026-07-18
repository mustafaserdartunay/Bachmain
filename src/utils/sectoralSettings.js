const STORAGE_KEY = 'bach-sectoral-settings-v1'

export const SECTORAL_CATEGORIES = [
  {
    id: 'urun',
    label: 'Ürün',
    description: 'Ürün kartı alanları ve gelişmiş ürün özellikleri.',
    sections: [
      {
        id: 'form',
        label: 'ÜRÜN FORMU',
        description: 'Standart ürün girişine ek detay alanlarını yönetin.',
        modules: [
          {
            id: 'detailedProductFeatures',
            label: 'Detaylı Ürün Özellikleri',
            description: 'Açıkken ürün formunda koli/araç, üretim, maliyet satırları, bayi fiyatlandırma, medya galerisi ve web linkleri görünür. Kapalıyken yalnızca standart ürün bilgileri kalır.',
            toggleStyle: 'feature',
          },
        ],
      },
    ],
  },
  {
    id: 'ambalaj',
    label: 'Ambalaj',
    description: 'Ambalaj üretimi, matbaa ve maliyet modülleri.',
    sections: [
      {
        id: 'matbaa',
        label: 'MATBAA MAALİYET HESAPLAMA MODÜLÜ',
        description: 'Matbaa süreçleri ve maliyet araçları.',
        modules: [
          {
            id: 'baklavaCostCalculator',
            label: 'Baklava, Pasta, Turta, Donut, Kruvasan Kutuları Maaliyet Hesaplama',
            description: 'Onay verildiğinde menüde baklava, pasta, turta, donut ve kruvasan kutuları maaliyet hesaplama sayfası açılır.',
            route: '/stok/maliyet-hesaplama',
            toggleStyle: 'feature',
          },
        ],
      },
    ],
  },
]

function moduleKey(categoryId, sectionId, moduleId) {
  return `${categoryId}.${sectionId}.${moduleId}`
}

const defaultSettings = () => ({
  modules: Object.fromEntries(
    SECTORAL_CATEGORIES.flatMap((category) => (
      category.sections.flatMap((section) => (
        section.modules.map((module) => [moduleKey(category.id, section.id, module.id), false])
      ))
    )),
  ),
})

function migrateSectoralModules(modules) {
  const next = { ...modules }
  if (next['ambalaj.matbaa.costCalculator']) {
    if (next['ambalaj.matbaa.baklavaCostCalculator'] === undefined) {
      next['ambalaj.matbaa.baklavaCostCalculator'] = true
    }
    delete next['ambalaj.matbaa.costCalculator']
    delete next['ambalaj.matbaa.pastaCostCalculator']
  }
  return next
}

export function readSectoralSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      modules: migrateSectoralModules({
        ...defaultSettings().modules,
        ...(saved.modules || {}),
      }),
    }
  } catch {
    return defaultSettings()
  }
}

export function saveSectoralSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  window.dispatchEvent(new CustomEvent('bach:sectoral-settings-updated'))
}

export function isSectoralModuleEnabled(categoryId, sectionId, moduleId) {
  const settings = readSectoralSettings()
  return Boolean(settings.modules[moduleKey(categoryId, sectionId, moduleId)])
}

export function setSectoralModuleEnabled(categoryId, sectionId, moduleId, enabled) {
  const settings = readSectoralSettings()
  const next = {
    ...settings,
    modules: {
      ...settings.modules,
      [moduleKey(categoryId, sectionId, moduleId)]: Boolean(enabled),
    },
  }
  saveSectoralSettings(next)
  return next
}

export function isBaklavaCostCalculatorEnabled() {
  return isSectoralModuleEnabled('ambalaj', 'matbaa', 'baklavaCostCalculator')
}

export function isDetailedProductFeaturesEnabled() {
  return isSectoralModuleEnabled('urun', 'form', 'detailedProductFeatures')
}

export function isCostCalculatorEnabled() {
  return isBaklavaCostCalculatorEnabled()
}

export function findSectoralCategory(categoryId) {
  return SECTORAL_CATEGORIES.find((category) => category.id === categoryId) || null
}

export function findSectoralSection(categoryId, sectionId) {
  const category = findSectoralCategory(categoryId)
  return category?.sections.find((section) => section.id === sectionId) || null
}
