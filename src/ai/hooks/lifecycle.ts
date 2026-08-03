/**
 * Headless lifecycle hooks (not React).
 * Call sites can register teardown to avoid leaks.
 */

export type AiLifecycleHook = () => void | Promise<void>

export class AiLifecycle {
  private readonly disposers: AiLifecycleHook[] = []

  onDispose(hook: AiLifecycleHook): void {
    this.disposers.push(hook)
  }

  async dispose(): Promise<void> {
    const hooks = [...this.disposers].reverse()
    this.disposers.length = 0
    for (const hook of hooks) {
      await hook()
    }
  }
}
