export type AiHttpRequest = {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Readonly<Record<string, string>>
  body?: string
  signal?: AbortSignal
  timeoutMs?: number
}

export type AiHttpResponse = {
  status: number
  ok: boolean
  text: string
  headers: Readonly<Record<string, string>>
}

export interface IHttpClient {
  request(input: AiHttpRequest): Promise<AiHttpResponse>
}
