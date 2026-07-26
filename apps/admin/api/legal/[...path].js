/**
 * Explicit /api/legal/* for Vercel multi-segment reliability.
 */
import handler from '../[...path].js'

export default handler
