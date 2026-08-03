import type { AiCompletionRequest, AiCompletionResponse } from '../types/messages'

export type AiMiddlewareContext = {
  request: AiCompletionRequest
}

export type AiMiddleware = (
  context: AiMiddlewareContext,
  next: () => Promise<AiCompletionResponse>,
) => Promise<AiCompletionResponse>

export function composeMiddlewares(
  middlewares: readonly AiMiddleware[],
  terminal: (context: AiMiddlewareContext) => Promise<AiCompletionResponse>,
): (context: AiMiddlewareContext) => Promise<AiCompletionResponse> {
  return (context) => {
    let index = -1
    const dispatch = async (i: number): Promise<AiCompletionResponse> => {
      if (i <= index) {
        throw new Error('Ai middleware called next() multiple times')
      }
      index = i
      const middleware = middlewares[i]
      if (!middleware) return terminal(context)
      return middleware(context, () => dispatch(i + 1))
    }
    return dispatch(0)
  }
}
