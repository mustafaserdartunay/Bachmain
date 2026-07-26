/**
 * Explicit single-segment member API.
 * Vercel returns NOT_FOUND for multi-segment /api/.../.../id paths in this project,
 * so detail/extend must use /api/member?id=... and POST /api/member.
 */
import handler from './[...path].js'

export default handler
