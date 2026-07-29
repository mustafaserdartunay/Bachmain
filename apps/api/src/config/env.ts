import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().default(2_592_000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_REDIRECT_URI: z.string().optional(),
  META_GRAPH_VERSION: z.string().default('v21.0'),
  META_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  META_WEBHOOK_APP_SECRET: z.string().optional(),
  AI_PROXY_SECRET: z.string().optional(),
  IYZICO_API_KEY: z.string().optional(),
  IYZICO_SECRET_KEY: z.string().optional(),
  IYZICO_WEBHOOK_SECRET: z.string().optional(),
  IYZICO_BASE_URL: z.string().default('https://sandbox-api.iyzipay.com'),
  APP_URL: z.string().default('https://uygulama.bachmain.com'),
  ADMIN_URL: z.string().default('https://yonetim.bachmain.com'),
  WEB_URL: z.string().default('https://bachmain.com'),
  API_PUBLIC_URL: z.string().default('http://127.0.0.1:8080'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('BACHMAIN <noreply@bachmain.com>'),
})

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Invalid environment: ${details}`)
  }
  const data = parsed.data
  if (data.NODE_ENV === 'production' && data.STRIPE_SECRET_KEY && !data.STRIPE_WEBHOOK_SECRET) {
    throw new Error(
      'Invalid environment: STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET_KEY is set',
    )
  }
  if (
    data.NODE_ENV === 'production' &&
    (data.IYZICO_API_KEY || data.IYZICO_SECRET_KEY) &&
    !data.IYZICO_WEBHOOK_SECRET
  ) {
    throw new Error(
      'Invalid environment: IYZICO_WEBHOOK_SECRET is required when iyzico keys are set in production',
    )
  }
  return data
}

export const env = loadEnv()

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((s) => s.trim())
  .filter(Boolean)
