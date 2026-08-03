import { AbstractAiProvider, type AbstractProviderDeps } from '../AbstractProvider'
import type { AiProviderCapabilities, AiProviderChatInput, AiProviderChatResult } from '../../types/provider'
import { assertOkJson } from '../../services/FetchHttpClient'
import { jsonError } from '../../errors/errorFactory'

type AnthropicResponse = {
  id?: string
  model?: string
  content?: Array<{ type?: string; text?: string }>
  usage?: { input_tokens?: number; output_tokens?: number }
  stop_reason?: string
}

export class AnthropicProvider extends AbstractAiProvider {
  readonly id = 'anthropic' as const

  constructor(deps: AbstractProviderDeps) {
    super(deps)
  }

  get capabilities(): AiProviderCapabilities {
    return { chat: true, stream: true, tools: false }
  }

  protected async doChat(input: AiProviderChatInput, apiKey: string): Promise<AiProviderChatResult> {
    const system = input.messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n')
    const messages = input.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }))

    const response = await this.http.request({
      url: `${this.baseUrl}/messages`,
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: input.model,
        max_tokens: input.maxTokens,
        temperature: input.temperature,
        system: system || undefined,
        messages,
      }),
      signal: input.signal,
    })

    const data = assertOkJson(response, this.id, (text) => JSON.parse(text) as AnthropicResponse)
    const content = data.content?.find((part) => part.type === 'text')?.text
    if (typeof content !== 'string') {
      throw jsonError('Anthropic response missing text', undefined, this.id)
    }
    const promptTokens = data.usage?.input_tokens ?? 0
    const completionTokens = data.usage?.output_tokens ?? 0
    return {
      id: data.id ?? `anthropic-${Date.now()}`,
      providerId: this.id,
      model: data.model ?? input.model,
      content,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      finishReason: data.stop_reason === 'max_tokens' ? 'length' : 'stop',
      raw: data,
    }
  }
}
