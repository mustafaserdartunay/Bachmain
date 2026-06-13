/** TikTok Business Leads API service layer */
const BASE = 'https://business-api.tiktok.com/open_api/v1.3'

export const tiktokService = {
  channel: 'tiktok',
  async fetchLeads({ advertiserId, accessToken }) {
    return {
      endpoint: `${BASE}/lead/get/`,
      params: { advertiser_id: advertiserId },
      headers: { 'Access-Token': accessToken },
    }
  },
  async replyLead({ leadId, message, accessToken }) {
    return {
      endpoint: `${BASE}/lead/reply/`,
      payload: { lead_id: leadId, message },
      headers: { 'Access-Token': accessToken },
    }
  },
}
