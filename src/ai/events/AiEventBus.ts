import type { AiProviderId } from '../constants/providers'

export type AiEventMap = {
  'completion:start': { providerId: AiProviderId }
  'completion:success': { providerId: AiProviderId; model: string; totalTokens: number }
  'completion:error': { providerId?: AiProviderId; code: string }
  'stream:start': { providerId: AiProviderId }
  'stream:end': { providerId: AiProviderId }
  'provider:registered': { providerId: AiProviderId }
}

export type AiEventName = keyof AiEventMap

type Handler<E extends AiEventName> = (payload: AiEventMap[E]) => void

export class AiEventBus {
  private readonly handlers = new Map<AiEventName, Set<Handler<AiEventName>>>()

  on<E extends AiEventName>(event: E, handler: Handler<E>): () => void {
    const set = this.handlers.get(event) ?? new Set()
    set.add(handler as Handler<AiEventName>)
    this.handlers.set(event, set)
    return () => set.delete(handler as Handler<AiEventName>)
  }

  emit<E extends AiEventName>(event: E, payload: AiEventMap[E]): void {
    const set = this.handlers.get(event)
    if (!set) return
    for (const handler of set) {
      handler(payload)
    }
  }

  clear(): void {
    this.handlers.clear()
  }
}
