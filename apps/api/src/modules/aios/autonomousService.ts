import { listProviders } from './gateway.js'
import {
  SUGGESTION_SEEDS,
  buildBusinessHealthScores,
  buildEveningReport,
  buildMorningReport,
  buildPredictiveRisks,
  buildSystemHealthSnapshot,
  getAutonomousCatalog,
  runScenarioSandbox,
} from './autonomousCatalog.js'
import { AppError } from '../../shared/errors.js'

/** In-memory learning loop per company (AC-0). Persist to DB in AC-1. */
const feedbackByCompany = new Map<
  string,
  Record<string, { decision: string; note?: string; at: string }>
>()

export async function autonomousOverview(_companyId: string) {
  const providers = listProviders()
  const scores = buildBusinessHealthScores()
  const system = buildSystemHealthSnapshot()
  const risks = buildPredictiveRisks()
  const feedback = feedbackByCompany.get(_companyId) || {}

  const suggestions = SUGGESTION_SEEDS.map((s) => ({
    ...s,
    feedback: feedback[s.id] || null,
    status: feedback[s.id]?.decision || 'open',
  })).filter((s) => s.status !== 'reject')

  return {
    version: 'AC-0',
    principle: 'Assist decisions — never uncontrolled high-risk writes.',
    scores,
    systemHealth: system,
    risks,
    suggestions,
    optimizations: getAutonomousCatalog().optimizations,
    pendingApprovals: Object.values(feedback).filter((f) => f.decision === 'accept' && false)
      .length,
    providersConfigured: providers.filter((p) => p.configured).length,
    multiCompany: { mode: 'single', note: 'Consolidate view lands in AC-2' },
    catalog: getAutonomousCatalog(),
  }
}

export function autonomousMorningReport() {
  return buildMorningReport()
}

export function autonomousEveningReport() {
  return buildEveningReport()
}

export function autonomousSuggestionFeedback(
  companyId: string,
  suggestionId: string,
  decision: 'accept' | 'reject' | 'edit',
  note?: string,
) {
  const seed = SUGGESTION_SEEDS.find((s) => s.id === suggestionId)
  if (!seed) throw new AppError('NOT_FOUND', 'Öneri bulunamadı', 404)
  if (!['accept', 'reject', 'edit'].includes(decision)) {
    throw new AppError('VALIDATION', 'decision accept|reject|edit olmalı', 400)
  }
  const map = feedbackByCompany.get(companyId) || {}
  map[suggestionId] = { decision, note: note || undefined, at: new Date().toISOString() }
  feedbackByCompany.set(companyId, map)
  return {
    suggestionId,
    decision,
    note: note || null,
    learning: 'Feedback kaydedildi — sonraki öneriler bu şirkete göre ayarlanacak (AC-0 memory).',
    explainWhy: seed.why,
  }
}

export function autonomousRunScenario(scenarioId: string) {
  const result = runScenarioSandbox(scenarioId)
  if (!result) throw new AppError('NOT_FOUND', 'Senaryo bulunamadı', 404)
  return result
}
