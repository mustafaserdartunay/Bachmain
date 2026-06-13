/** WhatsApp Business Cloud API service layer */
const BASE = 'https://graph.facebook.com/v19.0'

export const whatsappService = {
  channel: 'whatsapp',
  async sendMessage({ phoneNumberId, accessToken, to, text, mediaUrl, type = 'text' }) {
    return {
      endpoint: `${BASE}/${phoneNumberId}/messages`,
      payload: {
        messaging_product: 'whatsapp',
        to,
        type,
        ...(type === 'text' ? { text: { body: text } } : { [type]: { link: mediaUrl } }),
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  },
  verifyWebhook({ mode, token, verifyToken }) {
    return mode === 'subscribe' && token === verifyToken
  },
}
