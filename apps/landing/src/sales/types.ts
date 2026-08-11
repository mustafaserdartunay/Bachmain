/** Sales / conversion content types */

export type SalesCta = {
  label: string
  href: string
  variant?: 'primary' | 'secondary' | 'gold'
  event?: string
}

export type SalesLanding = {
  slug: string
  path: string
  name: string
  eyebrow: string
  h1: string
  subhead: string
  problemTitle: string
  problemBody: string
  solutionTitle: string
  solutionBody: string
  features: Array<{ title: string; body: string }>
  advantages: string[]
  videoTitle: string
  videoNote: string
  screens: Array<{ title: string; caption: string }>
  faqs: Array<{ q: string; a: string }>
  relatedSectors: string[]
  knowledgePath: string
}

export type SectorPage = {
  slug: string
  name: string
  h1: string
  description: string
  challenges: string[]
  solutions: Array<{ title: string; body: string }>
  modules: Array<{ label: string; path: string }>
  outcomes: string[]
}

export type CaseStudy = {
  slug: string
  company: string
  sector: string
  title: string
  problem: string
  solution: string
  results: string[]
  metrics: Array<{ label: string; value: string }>
  relatedModules: string[]
}

export type ReferenceLogo = {
  name: string
  sector: string
  quote?: string
}
