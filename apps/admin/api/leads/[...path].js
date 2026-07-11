/**
 * Explicit /api/leads/* for Vercel multi-segment routing.
 */
import handler, { config as catchAllConfig } from '../[...path].js'

export const config = catchAllConfig
export default handler
