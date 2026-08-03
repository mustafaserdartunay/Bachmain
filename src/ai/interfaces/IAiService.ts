import type { AiCompletionRequest, AiCompletionResponse, AiStreamChunk } from '../types/messages'

export interface IAiService {
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>
  stream(request: AiCompletionRequest): AsyncIterable<AiStreamChunk>
}
