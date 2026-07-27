/**
 * Brand logo for transactional emails.
 * Always embed via Resend CID (remote path → original bachmain-logo.png).
 */
export const LOGO_FILENAME = 'bachmain-logo.png'
export const LOGO_CONTENT_ID = 'bachmain-logo'

/** Public CDN / web URL — 1024×125 official wordmark. */
export function publicLogoUrl() {
  const web = String(process.env.WEB_URL || 'https://bachmain.com').replace(/\/$/, '')
  return `${web}/assets/${LOGO_FILENAME}`
}

/**
 * Resend inline attachment. Prefer remote `path` so serverless needs no local file.
 * @returns {Array<{filename:string,path:string,content_id:string}>}
 */
export function logoAttachments() {
  return [
    {
      path: publicLogoUrl(),
      filename: LOGO_FILENAME,
      content_id: LOGO_CONTENT_ID,
    },
  ]
}

/** HTML img src — CID matches attachment content_id. */
export function logoImgSrc() {
  return `cid:${LOGO_CONTENT_ID}`
}
