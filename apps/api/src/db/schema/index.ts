import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const planEnum = pgEnum('plan_code', ['free', 'basic', 'pro', 'enterprise'])
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'expired',
])
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'succeeded',
  'failed',
  'refunded',
])
export const ticketStatusEnum = pgEnum('ticket_status', [
  'open',
  'in_progress',
  'waiting_customer',
  'resolved',
  'closed',
])
export const platformRoleEnum = pgEnum('platform_role', [
  'none',
  'support',
  'billing',
  'superadmin',
])

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    fullName: text('full_name').notNull(),
    phone: text('phone'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    platformRole: platformRoleEnum('platform_role').default('none').notNull(),
    mfaEnabled: boolean('mfa_enabled').default(false).notNull(),
    mfaSecretEnc: text('mfa_secret_enc'),
    mfaBackupCodesHash: jsonb('mfa_backup_codes_hash').$type<string[]>().default([]),
    onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('users_email_uidx').on(t.email)],
)

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  taxNo: text('tax_no'),
  city: text('city'),
  country: text('country').default('TR'),
  status: text('status').default('active').notNull(),
  planCode: planEnum('plan_code').default('free').notNull(),
  ...timestamps,
}, (t) => [uniqueIndex('companies_slug_uidx').on(t.slug)])

export const companyMemberships = pgTable(
  'company_memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: text('role').default('owner').notNull(),
    isDefault: boolean('is_default').default(true).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('membership_company_user_uidx').on(t.companyId, t.userId),
    index('membership_user_idx').on(t.userId),
  ],
)

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').references(() => companies.id),
    code: text('code').notNull(),
    name: text('name').notNull(),
    isSystem: boolean('is_system').default(false).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('roles_company_code_uidx').on(t.companyId, t.code)],
)

export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    resource: text('resource').notNull(),
    action: text('action').notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('permissions_code_uidx').on(t.code)],
)

export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id),
    ...timestamps,
  },
  (t) => [uniqueIndex('role_perm_uidx').on(t.roleId, t.permissionId)],
)

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    userAgent: text('user_agent'),
    ip: text('ip'),
    ...timestamps,
  },
  (t) => [index('refresh_tokens_user_idx').on(t.userId)],
)

export const trustedDevices = pgTable(
  'trusted_devices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    deviceHash: text('device_hash').notNull(),
    label: text('label'),
    userAgent: text('user_agent'),
    ip: text('ip'),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('trusted_devices_user_hash_uidx').on(t.userId, t.deviceHash),
    index('trusted_devices_user_idx').on(t.userId),
  ],
)

export const mfaChallenges = pgTable(
  'mfa_challenges',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    challengeHash: text('challenge_hash').notNull(),
    purpose: text('purpose').default('login').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('mfa_challenges_user_idx').on(t.userId)],
)

export const emailTokens = pgTable('email_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  purpose: text('purpose').notNull(), // verify | reset
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  ...timestamps,
})

export const plans = pgTable(
  'plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: planEnum('code').notNull(),
    name: text('name').notNull(),
    monthlyPriceTry: integer('monthly_price_try').default(0).notNull(),
    maxUsers: integer('max_users').default(1).notNull(),
    features: jsonb('features').$type<Record<string, unknown>>().default({}).notNull(),
    stripePriceId: text('stripe_price_id'),
    iyzicoPlanCode: text('iyzico_plan_code'),
    active: boolean('active').default(true).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('plans_code_uidx').on(t.code)],
)

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id),
    status: subscriptionStatusEnum('status').default('trialing').notNull(),
    provider: text('provider'), // stripe | iyzico | manual
    providerCustomerId: text('provider_customer_id'),
    providerSubscriptionId: text('provider_subscription_id'),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('subscriptions_company_idx').on(t.companyId)],
)

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
    provider: text('provider').notNull(),
    providerPaymentId: text('provider_payment_id'),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').default('TRY').notNull(),
    status: paymentStatusEnum('status').default('pending').notNull(),
    raw: jsonb('raw').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('payments_company_idx').on(t.companyId)],
)

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    paymentId: uuid('payment_id').references(() => payments.id),
    number: text('number').notNull(),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').default('TRY').notNull(),
    pdfUrl: text('pdf_url'),
    issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('invoices_number_uidx').on(t.number)],
)

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    provider: text('provider').notNull(),
    eventId: text('event_id').notNull(),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('webhook_provider_event_uidx').on(t.provider, t.eventId)],
)

export const leads = pgTable(
  'leads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fullName: text('full_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    companyName: text('company_name'),
    companySize: text('company_size'),
    message: text('message'),
    source: text('source').default('demo').notNull(),
    status: text('status').default('pending').notNull(),
    companyId: uuid('company_id').references(() => companies.id),
    ...timestamps,
  },
  (t) => [index('leads_email_idx').on(t.email)],
)

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    contact: text('contact'),
    email: text('email'),
    phone: text('phone'),
    taxNo: text('tax_no'),
    city: text('city'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('customers_company_idx').on(t.companyId)],
)

export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    ...timestamps,
  },
  (t) => [index('suppliers_company_idx').on(t.companyId)],
)

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    parentId: uuid('parent_id'),
    ...timestamps,
  },
  (t) => [index('categories_company_idx').on(t.companyId)],
)

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    categoryId: uuid('category_id').references(() => categories.id),
    sku: text('sku'),
    name: text('name').notNull(),
    unit: text('unit').default('adet'),
    price: numeric('price', { precision: 14, scale: 2 }).default('0'),
    vatRate: integer('vat_rate').default(20),
    ...timestamps,
  },
  (t) => [index('products_company_idx').on(t.companyId)],
)

export const warehouses = pgTable(
  'warehouses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    code: text('code'),
    ...timestamps,
  },
  (t) => [index('warehouses_company_idx').on(t.companyId)],
)

export const stockMovements = pgTable(
  'stock_movements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    quantity: numeric('quantity', { precision: 14, scale: 3 }).notNull(),
    type: text('type').notNull(), // in | out | adjust
    note: text('note'),
    ...timestamps,
  },
  (t) => [index('stock_movements_company_idx').on(t.companyId)],
)

export const supportTickets = pgTable(
  'support_tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id),
    assignedToUserId: uuid('assigned_to_user_id').references(() => users.id),
    subject: text('subject').notNull(),
    status: ticketStatusEnum('status').default('open').notNull(),
    priority: text('priority').default('medium').notNull(),
    ...timestamps,
  },
  (t) => [index('tickets_company_status_idx').on(t.companyId, t.status)],
)

export const ticketMessages = pgTable(
  'ticket_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => supportTickets.id),
    authorUserId: uuid('author_user_id')
      .notNull()
      .references(() => users.id),
    body: text('body').notNull(),
    isStaff: boolean('is_staff').default(false).notNull(),
    ...timestamps,
  },
  (t) => [index('ticket_messages_ticket_idx').on(t.ticketId)],
)

export const liveConversations = pgTable(
  'live_conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    customerUserId: uuid('customer_user_id')
      .notNull()
      .references(() => users.id),
    agentUserId: uuid('agent_user_id').references(() => users.id),
    status: text('status').default('open').notNull(),
    ...timestamps,
  },
  (t) => [index('live_conversations_company_idx').on(t.companyId)],
)

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => liveConversations.id),
    authorUserId: uuid('author_user_id')
      .notNull()
      .references(() => users.id),
    body: text('body').notNull(),
    isStaff: boolean('is_staff').default(false).notNull(),
    ...timestamps,
  },
  (t) => [index('chat_messages_conversation_idx').on(t.conversationId)],
)

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    companyId: uuid('company_id').references(() => companies.id),
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    link: text('link'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    readAt: timestamp('read_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('notifications_user_idx').on(t.userId)],
)

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').references(() => companies.id),
    userId: uuid('user_id').references(() => users.id),
    action: text('action').notNull(),
    resource: text('resource'),
    resourceId: text('resource_id'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    device: text('device'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('activity_logs_company_created_idx').on(t.companyId, t.createdAt)],
)

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorUserId: uuid('actor_user_id').references(() => users.id),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    ip: text('ip'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
)

export const files = pgTable(
  'files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').references(() => companies.id),
    uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id),
    bucket: text('bucket').notNull(),
    key: text('key').notNull(),
    url: text('url').notNull(),
    mimeType: text('mime_type'),
    sizeBytes: integer('size_bytes'),
    ...timestamps,
  },
  (t) => [index('files_company_idx').on(t.companyId)],
)

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    keyHash: text('key_hash').notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('api_keys_company_idx').on(t.companyId)],
)

export const systemSettings = pgTable(
  'system_settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').references(() => companies.id),
    key: text('key').notNull(),
    value: jsonb('value').$type<unknown>().notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('settings_company_key_uidx').on(t.companyId, t.key)],
)

export const featureFlags = pgTable(
  'feature_flags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    key: text('key').notNull(),
    enabled: boolean('enabled').default(false).notNull(),
    description: text('description'),
    ...timestamps,
  },
  (t) => [uniqueIndex('feature_flags_key_uidx').on(t.key)],
)
