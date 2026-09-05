/**
 * Brand logo for transactional emails.
 * Always embed via Resend CID (remote path → original bachmain-logo.png).
 */
export const LOGO_FILENAME = 'bachmain-logo.png'
export const LOGO_CONTENT_ID = 'bachmain-logo'
export const STUDIO_LOGO_FILENAME = 'bachmain-studio-logo.png'
export const STUDIO_LOGO_CONTENT_ID = 'bachmain-studio-logo'

/** Public CDN / web URL — 1024×125 official wordmark. */
export function publicLogoUrl() {
  const web = String(process.env.WEB_URL || 'https://bachmain.com').replace(/\/$/, '')
  return `${web}/assets/${LOGO_FILENAME}`
}

export function publicStudioLogoUrl() {
  const web = String(process.env.WEB_URL || 'https://bachmain.com').replace(/\/$/, '')
  return `${web}/assets/${STUDIO_LOGO_FILENAME}`
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

export function studioLogoAttachments() {
  return [
    {
      path: publicStudioLogoUrl(),
      filename: STUDIO_LOGO_FILENAME,
      content_id: STUDIO_LOGO_CONTENT_ID,
    },
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

export function studioLogoImgSrc() {
  return `cid:${STUDIO_LOGO_CONTENT_ID}`
}
