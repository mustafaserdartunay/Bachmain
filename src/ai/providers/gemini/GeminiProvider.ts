import { AbstractAiProvider, type AbstractProviderDeps } from '../AbstractProvider'
import type { AiProviderCapabilities, AiProviderChatInput, AiProviderChatResult } from '../../types/provider'
import { assertOkJson } from '../../services/FetchHttpClient'
import { jsonError } from '../../errors/errorFactory'

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }
}

export class GeminiProvider extends AbstractAiProvider {
  readonly id = 'gemini' as const

  constructor(deps: AbstractProviderDeps) {
    super(deps)
  }

  get capabilities(): AiProviderCapabilities {
    return { chat: true, stream: true, tools: false }
  }

  protected async doChat(input: AiProviderChatInput, apiKey: string): Promise<AiProviderChatResult> {
    const contents = input.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
    const systemInstruction = input.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n')

    const url = `${this.baseUrl}/models/${encodeURIComponent(input.model)}:generateContent?key=${encodeURIComponent(apiKey)}`
    const response = await this.http.request({
      url,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction
          ? { parts: [{ text: systemInstruction }] }
          : undefined,
        generationConfig: {
          temperature: input.temperature,
          maxOutputTokens: input.maxTokens,
        },
      }),
      signal: input.signal,
    })

    const data = assertOkJson(response, this.id, (text) => JSON.parse(text) as GeminiResponse)
    const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
    if (!content) {
      throw jsonError('Gemini response missing text', undefined, this.id)
    }
    const promptTokens = data.usageMetadata?.promptTokenCount ?? 0
    const completionTokens = data.usageMetadata?.candidatesTokenCount ?? 0
    return {
      id: `gemini-${Date.now()}`,
      providerId: this.id,
      model: input.model,
      content,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: data.usageMetadata?.totalTokenCount ?? promptTokens + completionTokens,
      },
      finishReason: data.candidates?.[0]?.finishReason === 'MAX_TOKENS' ? 'length' : 'stop',
      raw: data,
    }
  }
}
