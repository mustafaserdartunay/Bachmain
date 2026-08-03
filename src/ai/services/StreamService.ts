import type { AiStreamChunk } from '../types/messages'

/** Streaming infrastructure helpers — no UI binding. */
export async function* mapTextToStreamChunks(
  id: string,
  text: string,
  chunkSize = 24,
): AsyncGenerator<AiStreamChunk> {
  if (!text) {
    yield { id, delta: '', done: true }
    return
  }
  for (let i = 0; i < text.length; i += chunkSize) {
    const delta = text.slice(i, i + chunkSize)
    const done = i + chunkSize >= text.length
    yield { id, delta, done }
  }
}

export async function collectStream(stream: AsyncIterable<AiStreamChunk>): Promise<string> {
  let out = ''
  for await (const chunk of stream) {
    out += chunk.delta
  }
  return out
}
