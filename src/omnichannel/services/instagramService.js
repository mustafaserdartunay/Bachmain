/** Instagram Messaging API service layer */
const BASE = 'https://graph.facebook.com/v19.0'

export const instagramService = {
  channel: 'instagram',
  async sendMessage({ pageId, accessToken, recipientId, text }) {
    return {
      endpoint: `${BASE}/${pageId}/messages`,
      payload: { recipient: { id: recipientId }, message: { text } },
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  },
}
