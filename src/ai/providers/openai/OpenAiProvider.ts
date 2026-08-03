import { AbstractAiProvider, type AbstractProviderDeps } from '../AbstractProvider'
import type { AiProviderCapabilities, AiProviderChatInput, AiProviderChatResult } from '../../types/provider'
import { assertOkJson } from '../../services/FetchHttpClient'
import { jsonError } from '../../errors/errorFactory'

type OpenAiChatResponse = {
  id?: string
  model?: string
  choices?: Array<{ message?: { content?: string }; finish_reason?: string }>
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
}

export class OpenAiProvider extends AbstractAiProvider {
  readonly id = 'openai' as const

  constructor(deps: AbstractProviderDeps) {
    super(deps)
  }

  get capabilities(): AiProviderCapabilities {
    return { chat: true, stream: true, tools: false }
  }

  protected async doChat(input: AiProviderChatInput, apiKey: string): Promise<AiProviderChatResult> {
    const response = await this.http.request({
      url: `${this.baseUrl}/chat/completions`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
      }),
      signal: input.signal,
    })

    const data = assertOkJson(response, this.id, (text) => JSON.parse(text) as OpenAiChatResponse)
    const content = data.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      throw jsonError('OpenAI response missing content', undefined, this.id)
    }
    const promptTokens = data.usage?.prompt_tokens ?? 0
    const completionTokens = data.usage?.completion_tokens ?? 0
    return {
      id: data.id ?? `openai-${Date.now()}`,
      providerId: this.id,
      model: data.model ?? input.model,
      content,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: data.usage?.total_tokens ?? promptTokens + completionTokens,
      },
      finishReason: data.choices?.[0]?.finish_reason === 'length' ? 'length' : 'stop',
      raw: data,
    }
  }
}
