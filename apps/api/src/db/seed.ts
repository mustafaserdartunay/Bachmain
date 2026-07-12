import { eq } from 'drizzle-orm'
import { db } from './client.js'
import { plans } from './schema/index.js'

const SEED_PLANS = [
  {
    code: 'free' as const,
    name: 'Free',
    monthlyPriceTry: 0,
    maxUsers: 1,
    features: { modules: ['crm_basic'], trialDays: 7 },
  },
  {
    code: 'basic' as const,
    name: 'Basic',
    monthlyPriceTry: 990,
    maxUsers: 5,
    features: { modules: ['crm', 'stock'] },
  },
  {
    code: 'pro' as const,
    name: 'Pro',
    monthlyPriceTry: 2490,
    maxUsers: 20,
    features: { modules: ['crm', 'stock', 'erp', 'ai'] },
  },
  {
    code: 'enterprise' as const,
    name: 'Enterprise',
    monthlyPriceTry: 0,
    maxUsers: 0,
    features: { modules: ['all'], sso: true },
  },
]

async function main() {
  for (const plan of SEED_PLANS) {
    const [existing] = await db.select().from(plans).where(eq(plans.code, plan.code)).limit(1)
    if (existing) {
      await db
        .update(plans)
        .set({
          name: plan.name,
          monthlyPriceTry: plan.monthlyPriceTry,
          maxUsers: plan.maxUsers,
          features: plan.features,
          active: true,
          updatedAt: new Date(),
        })
        .where(eq(plans.id, existing.id))
    } else {
      await db.insert(plans).values(plan)
    }
  }
  console.log('Plans seeded')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
