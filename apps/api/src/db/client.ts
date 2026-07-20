import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { env } from '../config/env.js'
import * as schema from './schema/index.js'

const isNeon = /neon\.tech|sslmode=require/i.test(env.DATABASE_URL)
const useSsl = env.NODE_ENV === 'production' || isNeon || process.env.DATABASE_SSL === 'true'

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  ssl: useSsl ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
})

export const db = drizzle(pool, { schema })
export type Db = typeof db
