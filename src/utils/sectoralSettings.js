const STORAGE_KEY = 'bach-sectoral-settings-v1'

export const SECTORAL_CATEGORIES = [
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
            route: '/stok/baklava-kutu-maliyet-hesaplama',
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
