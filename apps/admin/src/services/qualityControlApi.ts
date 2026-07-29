import { api } from '@/lib/api'

export type QualitySuite = 'all' | 'e2e' | 'api' | 'lighthouse' | 'load'
export type RunStatus = 'queued' | 'in_progress' | 'completed' | string

export interface QualityRun {
  id: number
  runNumber: number
  name: string
  event: string
  status: RunStatus
  conclusion: string | null
  branch: string
  commit: string
  actor: string
  createdAt: string
  updatedAt: string
  startedAt: string
  htmlUrl: string
}

export interface QualityRunsResponse {
  configured: boolean
  repository: string
  workflow: string
  ref?: string
  runs: QualityRun[]
}

export interface QualityJob {
  id: number
  name: string
  status: RunStatus
  conclusion: string | null
  startedAt: string
  completedAt: string | null
  htmlUrl: string
  failedSteps: { name: string; number: number }[]
}

export interface QualityArtifact {
  id: number
  name: string
  size: number
  expired: boolean
  expiresAt: string
  reportUrl: string
  downloadUrl: string
}

export interface QualityRunDetail {
  run: QualityRun
  jobs: QualityJob[]
  artifacts: QualityArtifact[]
}

export const qualityControlApi = {
  list: () => api.get<QualityRunsResponse>('/quality'),
  detail: (runId: number) =>
    api.get<QualityRunDetail>(`/quality?op=detail&runId=${encodeURIComponent(runId)}`),
  dispatch: (suite: QualitySuite, heavy = false) =>
    api.post<{ ok: true; message: string; suite: QualitySuite; heavy: boolean }>('/quality', {
      suite,
      heavy,
    }),
}
