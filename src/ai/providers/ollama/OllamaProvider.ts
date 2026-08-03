import { AbstractAiProvider, type AbstractProviderDeps } from '../AbstractProvider'
import type { AiProviderCapabilities, AiProviderChatInput, AiProviderChatResult } from '../../types/provider'
import { assertOkJson } from '../../services/FetchHttpClient'
import { jsonError } from '../../errors/errorFactory'

type OllamaResponse = {
  model?: string
  message?: { content?: string }
  done_reason?: string
  prompt_eval_count?: number
  eval_count?: number
}

export class OllamaProvider extends AbstractAiProvider {
  readonly id = 'ollama' as const

  constructor(deps: AbstractProviderDeps) {
    super(deps)
  }

  get capabilities(): AiProviderCapabilities {
    return { chat: true, stream: true, tools: false }
  }

  override async isConfigured(): Promise<boolean> {
    // Local Ollama often needs no API key.
    const key = await this.secretStore.getApiKey(this.id)
    return key !== null || Boolean(this.baseUrl)
  }

  protected override async requireApiKey(): Promise<string> {
    const key = await this.secretStore.getApiKey(this.id)
    return key ?? ''
  }

  protected async doChat(input: AiProviderChatInput, apiKey: string): Promise<AiProviderChatResult> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`

    const response = await this.http.request({
      url: `${this.baseUrl}/api/chat`,
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: input.model,
        stream: false,
        options: {
          temperature: input.temperature,
          num_predict: input.maxTokens,
        },
        messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
      signal: input.signal,
    })

    const data = assertOkJson(response, this.id, (text) => JSON.parse(text) as OllamaResponse)
    const content = data.message?.content
    if (typeof content !== 'string') {
      throw jsonError('Ollama response missing content', undefined, this.id)
    }
    const promptTokens = data.prompt_eval_count ?? 0
    const completionTokens = data.eval_count ?? 0
    return {
      id: `ollama-${Date.now()}`,
      providerId: this.id,
      model: data.model ?? input.model,
      content,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      finishReason: data.done_reason === 'length' ? 'length' : 'stop',
      raw: data,
    }
  }
}
