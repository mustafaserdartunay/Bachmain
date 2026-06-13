import { routeWebhook } from './handlers'

export function createWebhookRouter() {
  return {
    handle(channel, payload) {
      return routeWebhook(channel, payload)
    },
    verify(channel, headers) {
      const token = headers?.['x-hub-signature-256'] || headers?.['x-verify-token']
      return Boolean(token || channel)
    },
  }
}

export const webhookRouter = createWebhookRouter()
