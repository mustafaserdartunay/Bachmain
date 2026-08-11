/** GEO / Knowledge content types */

export type GeoFaq = { q: string; a: string }

export type GeoSection = {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export type KnowledgeGuide = {
  slug: string
  category: string
  title: string
  description: string
  focusKeyword: string
  modulePath: string
  readingMinutes: number
  sections: GeoSection[]
  faqs: GeoFaq[]
  relatedSlugs: string[]
  glossaryTerms: string[]
  updatedAt: string
}

export type BlogTopicPlan = {
  title: string
  slug: string
  description: string
  focusKeyword: string
  metaDescription: string
  category: string
  relatedModules: string[]
  outline: string[]
}

export type HelpArticle = {
  slug: string
  module: string
  title: string
  description: string
  steps: Array<{ title: string; body: string }>
  relatedPaths: Array<{ label: string; path: string }>
}

export type GlossaryTerm = {
  term: string
  slug: string
  definition: string
  relatedGuide?: string
  relatedModule?: string
}

export type AcademyLesson = {
  id: string
  title: string
  level: 'Başlangıç' | 'Orta' | 'İleri'
  duration: string
  module: string
  summary: string
  href: string
}

export type DocPage = {
  slug: string
  title: string
  description: string
  sections: GeoSection[]
}
