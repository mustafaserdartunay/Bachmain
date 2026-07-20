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

export const companies = pgTable(
  'companies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    taxNo: text('tax_no'),
    city: text('city'),
    country: text('country').default('TR'),
    status: text('status').default('active').notNull(),
    planCode: planEnum('plan_code').default('free').notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('companies_slug_uidx').on(t.slug)],
)

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
    externalId: text('external_id'),
    isActive: boolean('is_active').default(true).notNull(),
    version: integer('version').default(1).notNull(),
    branchId: uuid('branch_id'),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    ...timestamps,
  },
  (t) => [
    index('customers_company_idx').on(t.companyId),
    index('customers_company_deleted_idx').on(t.companyId, t.deletedAt),
    index('customers_tax_idx').on(t.companyId, t.taxNo),
  ],
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
    externalId: text('external_id'),
    isActive: boolean('is_active').default(true).notNull(),
    version: integer('version').default(1).notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
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
    externalId: text('external_id'),
    isActive: boolean('is_active').default(true).notNull(),
    version: integer('version').default(1).notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    ...timestamps,
  },
  (t) => [
    index('products_company_idx').on(t.companyId),
    index('products_sku_idx').on(t.companyId, t.sku),
  ],
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
    branchId: uuid('branch_id'),
    externalId: text('external_id'),
    isActive: boolean('is_active').default(true).notNull(),
    version: integer('version').default(1).notNull(),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
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

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorUserId: uuid('actor_user_id').references(() => users.id),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  ip: text('ip'),
  meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
  ...timestamps,
})

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

/* ─── MDM foundation (Master Data Management) ─── */

export const branches = pgTable(
  'branches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    code: text('code'),
    name: text('name').notNull(),
    city: text('city'),
    isActive: boolean('is_active').default(true).notNull(),
    version: integer('version').default(1).notNull(),
    externalId: text('external_id'),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    ...timestamps,
  },
  (t) => [
    index('branches_company_idx').on(t.companyId),
    uniqueIndex('branches_company_code_uidx').on(t.companyId, t.code),
  ],
)

export const mdmTags = pgTable(
  'mdm_tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    code: text('code').notNull(),
    label: text('label').notNull(),
    color: text('color'),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex('mdm_tags_company_code_uidx').on(t.companyId, t.code)],
)

export const mdmEntityTags = pgTable(
  'mdm_entity_tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => mdmTags.id),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('mdm_entity_tags_uidx').on(t.companyId, t.entityType, t.entityId, t.tagId),
    index('mdm_entity_tags_entity_idx').on(t.companyId, t.entityType, t.entityId),
  ],
)

export const mdmExternalIds = pgTable(
  'mdm_external_ids',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    provider: text('provider').notNull(),
    externalId: text('external_id').notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('mdm_external_provider_uidx').on(t.companyId, t.provider, t.externalId),
    index('mdm_external_entity_idx').on(t.companyId, t.entityType, t.entityId),
  ],
)

export const mdmRecordHistory = pgTable(
  'mdm_record_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    version: integer('version').notNull(),
    changedBy: uuid('changed_by').references(() => users.id),
    field: text('field'),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    snapshot: jsonb('snapshot').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('mdm_history_entity_idx').on(t.companyId, t.entityType, t.entityId, t.createdAt)],
)

export const mdmMergeJobs = pgTable(
  'mdm_merge_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    entityType: text('entity_type').notNull(),
    survivorId: uuid('survivor_id').notNull(),
    mergedIds: jsonb('merged_ids').$type<string[]>().default([]).notNull(),
    status: text('status').default('completed').notNull(),
    performedBy: uuid('performed_by').references(() => users.id),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('mdm_merge_company_idx').on(t.companyId, t.entityType)],
)

/** Workflow Engine (WF-0) — versioned graphs + runs + domain event outbox */
export const workflows = pgTable(
  'workflows',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status').default('draft').notNull(), // draft | published | archived
    publishedVersion: integer('published_version'),
    branchId: uuid('branch_id'),
    warehouseId: uuid('warehouse_id'),
    roleCodes: jsonb('role_codes').$type<string[]>().default([]),
    packageCodes: jsonb('package_codes').$type<string[]>().default([]),
    triggerTypes: jsonb('trigger_types').$type<string[]>().default([]),
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    ...timestamps,
  },
  (t) => [
    index('workflows_company_idx').on(t.companyId, t.status),
    index('workflows_company_name_idx').on(t.companyId, t.name),
  ],
)

export const workflowVersions = pgTable(
  'workflow_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => workflows.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    version: integer('version').notNull(),
    graph: jsonb('graph')
      .$type<{ nodes: unknown[]; edges: unknown[] }>()
      .default({ nodes: [], edges: [] })
      .notNull(),
    changelog: text('changelog'),
    createdBy: uuid('created_by').references(() => users.id),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('workflow_versions_uidx').on(t.workflowId, t.version),
    index('workflow_versions_company_idx').on(t.companyId, t.workflowId),
  ],
)

export const workflowRuns = pgTable(
  'workflow_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workflowId: uuid('workflow_id')
      .notNull()
      .references(() => workflows.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    version: integer('version').notNull(),
    mode: text('mode').default('live').notNull(), // live | simulation
    status: text('status').default('running').notNull(), // running | completed | failed | cancelled
    triggerType: text('trigger_type'),
    triggerPayload: jsonb('trigger_payload').$type<Record<string, unknown>>().default({}),
    error: text('error'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    durationMs: integer('duration_ms'),
    ...timestamps,
  },
  (t) => [
    index('workflow_runs_workflow_idx').on(t.workflowId, t.startedAt),
    index('workflow_runs_company_idx').on(t.companyId, t.startedAt),
  ],
)

export const workflowRunSteps = pgTable(
  'workflow_run_steps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    runId: uuid('run_id')
      .notNull()
      .references(() => workflowRuns.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    nodeId: text('node_id').notNull(),
    catalogId: text('catalog_id'),
    status: text('status').default('pending').notNull(), // pending | running | success | failed | skipped
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    durationMs: integer('duration_ms'),
    output: jsonb('output').$type<Record<string, unknown>>().default({}),
    error: text('error'),
    ...timestamps,
  },
  (t) => [index('workflow_run_steps_run_idx').on(t.runId)],
)

export const workflowEvents = pgTable(
  'workflow_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
    status: text('status').default('pending').notNull(), // pending | processed | failed
    processedAt: timestamp('processed_at', { withTimezone: true }),
    error: text('error'),
    ...timestamps,
  },
  (t) => [
    index('workflow_events_company_idx').on(t.companyId, t.createdAt),
    index('workflow_events_status_idx').on(t.companyId, t.status, t.eventType),
  ],
)

/** AI Operating System (AIOS-0) */
export const aiosAgentConfigs = pgTable(
  'aios_agent_configs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    agentId: text('agent_id').notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    modelProvider: text('model_provider'),
    modelId: text('model_id'),
    costLimitUsd: numeric('cost_limit_usd', { precision: 12, scale: 4 }),
    modules: jsonb('modules').$type<string[]>().default([]),
    permissions: jsonb('permissions').$type<string[]>().default([]),
    workHours: jsonb('work_hours').$type<Record<string, unknown>>().default({}),
    memoryEnabled: boolean('memory_enabled').default(true).notNull(),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [uniqueIndex('aios_agent_configs_uidx').on(t.companyId, t.agentId)],
)

export const aiosRuns = pgTable(
  'aios_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    agentId: text('agent_id').notNull(),
    userId: uuid('user_id').references(() => users.id),
    provider: text('provider'),
    model: text('model'),
    status: text('status').default('running').notNull(), // running | completed | failed | awaiting_approval
    promptTokens: integer('prompt_tokens').default(0),
    completionTokens: integer('completion_tokens').default(0),
    estimatedCostUsd: numeric('estimated_cost_usd', { precision: 12, scale: 6 }),
    durationMs: integer('duration_ms'),
    requiresApproval: boolean('requires_approval').default(false).notNull(),
    error: text('error'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('aios_runs_company_idx').on(t.companyId, t.startedAt),
    index('aios_runs_agent_idx').on(t.companyId, t.agentId),
  ],
)

export const aiosRunSteps = pgTable(
  'aios_run_steps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    runId: uuid('run_id')
      .notNull()
      .references(() => aiosRuns.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    kind: text('kind').notNull(), // model | tool | memory | approval | orchestrator
    name: text('name'),
    status: text('status').default('success').notNull(),
    durationMs: integer('duration_ms'),
    input: jsonb('input').$type<Record<string, unknown>>().default({}),
    output: jsonb('output').$type<Record<string, unknown>>().default({}),
    error: text('error'),
    ...timestamps,
  },
  (t) => [index('aios_run_steps_run_idx').on(t.runId)],
)

export const aiosApprovals = pgTable(
  'aios_approvals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    runId: uuid('run_id').references(() => aiosRuns.id),
    toolId: text('tool_id').notNull(),
    agentId: text('agent_id'),
    requestedBy: uuid('requested_by').references(() => users.id),
    status: text('status').default('pending').notNull(), // pending | approved | rejected
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
    decidedBy: uuid('decided_by').references(() => users.id),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    reason: text('reason'),
    ...timestamps,
  },
  (t) => [index('aios_approvals_company_idx').on(t.companyId, t.status, t.createdAt)],
)

export const aiosMemory = pgTable(
  'aios_memory',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    scope: text('scope').default('company').notNull(), // company | user | agent | module
    scopeId: text('scope_id'),
    key: text('key').notNull(),
    value: jsonb('value').$type<Record<string, unknown>>().default({}),
    sensitivity: text('sensitivity').default('internal').notNull(), // public | internal | restricted
    createdBy: uuid('created_by').references(() => users.id),
    ...timestamps,
  },
  (t) => [index('aios_memory_company_idx').on(t.companyId, t.scope, t.key)],
)

export const aiosSchedules = pgTable(
  'aios_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    agentId: text('agent_id').notNull(),
    cadence: text('cadence').notNull(), // once | hourly | daily | weekly | monthly | event
    cronExpr: text('cron_expr'),
    eventType: text('event_type'),
    enabled: boolean('enabled').default(true).notNull(),
    nextRunAt: timestamp('next_run_at', { withTimezone: true }),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('aios_schedules_company_idx').on(t.companyId, t.enabled)],
)

/** Knowledge Platform (KP-0) */
export const knowledgeDocuments = pgTable(
  'knowledge_documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    title: text('title').notNull(),
    docType: text('doc_type').default('txt').notNull(), // pdf | docx | md | …
    category: text('category').default('general').notNull(), // policy | sop | faq | wiki | …
    language: text('language').default('tr'),
    status: text('status').default('indexed').notNull(), // draft | processing | indexed | ocr_pending | archived
    summary: text('summary'),
    keywords: jsonb('keywords').$type<string[]>().default([]),
    tags: jsonb('tags').$type<string[]>().default([]),
    currentVersion: integer('current_version').default(1).notNull(),
    branchId: uuid('branch_id'),
    warehouseId: uuid('warehouse_id'),
    departmentId: text('department_id'),
    roleCodes: jsonb('role_codes').$type<string[]>().default([]),
    sourceModule: text('source_module'),
    mimeType: text('mime_type'),
    byteSize: integer('byte_size'),
    ocrStatus: text('ocr_status').default('none'), // none | pending | done | failed
    indexStatus: text('index_status').default('pending'), // pending | ready | stale | failed
    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    ...timestamps,
  },
  (t) => [
    index('knowledge_docs_company_idx').on(t.companyId, t.status),
    index('knowledge_docs_category_idx').on(t.companyId, t.category),
  ],
)

export const knowledgeVersions = pgTable(
  'knowledge_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => knowledgeDocuments.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    version: integer('version').notNull(),
    contentText: text('content_text').default('').notNull(),
    changelog: text('changelog'),
    createdBy: uuid('created_by').references(() => users.id),
    ...timestamps,
  },
  (t) => [uniqueIndex('knowledge_versions_uidx').on(t.documentId, t.version)],
)

export const knowledgeChunks = pgTable(
  'knowledge_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => knowledgeDocuments.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    version: integer('version').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    tokens: jsonb('tokens').$type<string[]>().default([]),
    /** KP-0 stub vector; KP-2 → pgvector */
    embedding: jsonb('embedding').$type<number[]>().default([]),
    ...timestamps,
  },
  (t) => [
    index('knowledge_chunks_doc_idx').on(t.documentId, t.version),
    index('knowledge_chunks_company_idx').on(t.companyId),
  ],
)

export const knowledgeLinks = pgTable(
  'knowledge_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => knowledgeDocuments.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    entityType: text('entity_type').notNull(), // customer | quote | order | production | warehouse | invoice | logistics | task
    entityId: text('entity_id').notNull(),
    label: text('label'),
    ...timestamps,
  },
  (t) => [
    index('knowledge_links_doc_idx').on(t.documentId),
    index('knowledge_links_entity_idx').on(t.companyId, t.entityType, t.entityId),
  ],
)

export const knowledgeFaq = pgTable(
  'knowledge_faq',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    tags: jsonb('tags').$type<string[]>().default([]),
    documentId: uuid('document_id').references(() => knowledgeDocuments.id),
    ...timestamps,
  },
  (t) => [index('knowledge_faq_company_idx').on(t.companyId)],
)

export const knowledgeSearchLog = pgTable(
  'knowledge_search_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    userId: uuid('user_id').references(() => users.id),
    query: text('query').notNull(),
    hitCount: integer('hit_count').default(0),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('knowledge_search_log_company_idx').on(t.companyId, t.createdAt)],
)

/** Digital Twin (DT-0) — preferences + KPI snapshots (visualization layer) */
export const twinPreferences = pgTable(
  'twin_preferences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    enable3d: boolean('enable_3d').default(false).notNull(),
    defaultView: text('default_view').default('factory').notNull(),
    layout: jsonb('layout').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [uniqueIndex('twin_preferences_company_uidx').on(t.companyId)],
)

export const twinSnapshots = pgTable(
  'twin_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    kind: text('kind').default('overview').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
    sampledAt: timestamp('sampled_at', { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (t) => [index('twin_snapshots_company_idx').on(t.companyId, t.sampledAt)],
)

/** Commerce Platform (GC-0) — channels, listings, price rules, order inbox, stock sync */
export const commerceChannels = pgTable(
  'commerce_channels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    channelKey: text('channel_key').notNull(), // amazon | trendyol | b2b | …
    name: text('name').notNull(),
    status: text('status').default('disconnected').notNull(), // disconnected | connected | error | syncing
    credentialsRef: text('credentials_ref'),
    config: jsonb('config').$type<Record<string, unknown>>().default({}),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('commerce_channels_company_key_uidx').on(t.companyId, t.channelKey),
    index('commerce_channels_company_idx').on(t.companyId, t.status),
  ],
)

export const commerceListings = pgTable(
  'commerce_listings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => commerceChannels.id),
    productId: text('product_id').notNull(), // MDM / ERP product id (SoT external)
    sku: text('sku'),
    externalId: text('external_id'),
    status: text('status').default('draft').notNull(), // draft | published | paused | error
    title: text('title'),
    price: numeric('price', { precision: 18, scale: 4 }),
    currency: text('currency').default('TRY'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    index('commerce_listings_company_idx').on(t.companyId, t.status),
    index('commerce_listings_product_idx').on(t.companyId, t.productId),
    uniqueIndex('commerce_listings_channel_product_uidx').on(t.channelId, t.productId),
  ],
)

export const commercePriceRules = pgTable(
  'commerce_price_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    priority: integer('priority').default(100).notNull(),
    active: boolean('active').default(true).notNull(),
    scope: text('scope').default('global').notNull(), // global | customer | dealer | country | currency | campaign | min_order
    customerId: text('customer_id'),
    dealerId: text('dealer_id'),
    countryCode: text('country_code'),
    currency: text('currency'),
    productId: text('product_id'),
    minQty: integer('min_qty'),
    adjustmentType: text('adjustment_type').default('percent').notNull(), // percent | fixed | override
    adjustmentValue: numeric('adjustment_value', { precision: 18, scale: 4 }).notNull(),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('commerce_price_rules_company_idx').on(t.companyId, t.active, t.priority)],
)

export const commerceOrdersInbox = pgTable(
  'commerce_orders_inbox',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    channelId: uuid('channel_id').references(() => commerceChannels.id),
    channelKey: text('channel_key').notNull(),
    externalOrderId: text('external_order_id').notNull(),
    status: text('status').default('received').notNull(), // received | risk_review | promoted | rejected | error
    currency: text('currency').default('TRY'),
    totalAmount: numeric('total_amount', { precision: 18, scale: 4 }),
    customerName: text('customer_name'),
    customerEmail: text('customer_email'),
    lines: jsonb('lines').$type<Record<string, unknown>[]>().default([]),
    rawPayload: jsonb('raw_payload').$type<Record<string, unknown>>().default({}),
    riskScore: integer('risk_score').default(0),
    erpOrderId: text('erp_order_id'),
    promotedAt: timestamp('promoted_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('commerce_orders_inbox_ext_uidx').on(t.companyId, t.channelKey, t.externalOrderId),
    index('commerce_orders_inbox_company_idx').on(t.companyId, t.status),
  ],
)

export const commerceStockSyncJobs = pgTable(
  'commerce_stock_sync_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    channelKey: text('channel_key'), // null = all
    status: text('status').default('queued').notNull(), // queued | running | done | failed
    productsTouched: integer('products_touched').default(0),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('commerce_stock_sync_jobs_company_idx').on(t.companyId, t.status)],
)

export const commerceProductI18n = pgTable(
  'commerce_product_i18n',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    productId: text('product_id').notNull(),
    locale: text('locale').notNull(), // tr | en | de | …
    title: text('title'),
    description: text('description'),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    keywords: jsonb('keywords').$type<string[]>().default([]),
    altText: text('alt_text'),
    techSpecs: text('tech_specs'),
    marketingCopy: text('marketing_copy'),
    socialCopy: text('social_copy'),
    merchantFeed: text('merchant_feed'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('commerce_product_i18n_uidx').on(t.companyId, t.productId, t.locale),
    index('commerce_product_i18n_product_idx').on(t.companyId, t.productId),
  ],
)

/** AI Growth Center (AG-0) */
export const growthLeads = pgTable(
  'growth_leads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    source: text('source').notNull(), // web_form | qr | ocr | phone | whatsapp | instagram | facebook | linkedin | api
    name: text('name'),
    email: text('email'),
    phone: text('phone'),
    companyName: text('company_name'),
    message: text('message'),
    status: text('status').default('new').notNull(), // new | scored | warm | hot | cold | converted | discarded
    score: integer('score').default(0),
    temperature: text('temperature').default('cold'), // hot | warm | cold
    purchaseProbability: numeric('purchase_probability', { precision: 5, scale: 2 }),
    estimatedRevenue: numeric('estimated_revenue', { precision: 18, scale: 2 }),
    customerId: text('customer_id'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    index('growth_leads_company_idx').on(t.companyId, t.status),
    index('growth_leads_source_idx').on(t.companyId, t.source),
  ],
)

export const growthCampaigns = pgTable(
  'growth_campaigns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    channel: text('channel').default('multi').notNull(), // email | whatsapp | sms | ads | social | multi
    status: text('status').default('draft').notNull(), // draft | scheduled | running | paused | done
    budget: numeric('budget', { precision: 18, scale: 2 }),
    currency: text('currency').default('TRY'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('growth_campaigns_company_idx').on(t.companyId, t.status)],
)

export const growthContentAssets = pgTable(
  'growth_content_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    kind: text('kind').notNull(), // blog | product | social | ads | email | landing
    locale: text('locale').default('tr').notNull(),
    title: text('title'),
    body: text('body'),
    status: text('status').default('draft').notNull(), // draft | review | approved | published
    channelTargets: jsonb('channel_targets').$type<string[]>().default([]),
    parentId: uuid('parent_id'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    createdBy: uuid('created_by').references(() => users.id),
    ...timestamps,
  },
  (t) => [
    index('growth_content_company_idx').on(t.companyId, t.kind, t.status),
    index('growth_content_locale_idx').on(t.companyId, t.locale),
  ],
)

export const growthSeoAudits = pgTable(
  'growth_seo_audits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    url: text('url'),
    score: integer('score').default(0),
    findings: jsonb('findings').$type<Record<string, unknown>[]>().default([]),
    recommendations: jsonb('recommendations').$type<string[]>().default([]),
    status: text('status').default('done').notNull(),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('growth_seo_audits_company_idx').on(t.companyId, t.createdAt)],
)

export const growthCompetitors = pgTable(
  'growth_competitors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    website: text('website'),
    notes: text('notes'),
    lastAnalysis: jsonb('last_analysis').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('growth_competitors_company_idx').on(t.companyId)],
)

export const growthFunnels = pgTable(
  'growth_funnels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    status: text('status').default('draft').notNull(),
    stages: jsonb('stages').$type<Record<string, unknown>[]>().default([]),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('growth_funnels_company_idx').on(t.companyId, t.status)],
)

export const growthChannelAccounts = pgTable(
  'growth_channel_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    channelKey: text('channel_key').notNull(), // instagram | google_ads | …
    name: text('name').notNull(),
    status: text('status').default('disconnected').notNull(),
    credentialsRef: text('credentials_ref'),
    config: jsonb('config').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('growth_channel_accounts_uidx').on(t.companyId, t.channelKey),
    index('growth_channel_accounts_company_idx').on(t.companyId, t.status),
  ],
)

export const growthAuditLog = pgTable(
  'growth_audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    action: text('action').notNull(),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    actorUserId: uuid('actor_user_id').references(() => users.id),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('growth_audit_log_company_idx').on(t.companyId, t.createdAt)],
)

/** Commerce GC-1 — returns, subscriptions, shipping, payments, AI order analyses */
export const commerceReturns = pgTable(
  'commerce_returns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    orderRef: text('order_ref').notNull(),
    kind: text('kind').default('return').notNull(), // return | exchange | service | warranty
    status: text('status').default('open').notNull(), // open | approved | rejected | completed
    reason: text('reason'),
    channelKey: text('channel_key'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('commerce_returns_company_idx').on(t.companyId, t.status)],
)

export const commerceSubscriptions = pgTable(
  'commerce_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    customerRef: text('customer_ref').notNull(),
    productId: text('product_id').notNull(),
    status: text('status').default('active').notNull(), // active | paused | cancelled | past_due
    interval: text('interval').default('month').notNull(), // week | month | year
    amount: numeric('amount', { precision: 18, scale: 4 }),
    currency: text('currency').default('TRY'),
    nextRenewalAt: timestamp('next_renewal_at', { withTimezone: true }),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('commerce_subscriptions_company_idx').on(t.companyId, t.status)],
)

export const commerceShipments = pgTable(
  'commerce_shipments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    orderRef: text('order_ref').notNull(),
    carrier: text('carrier').notNull(),
    trackingNo: text('tracking_no'),
    status: text('status').default('created').notNull(), // created | labeled | in_transit | delivered | failed
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('commerce_shipments_company_idx').on(t.companyId, t.status)],
)

export const commercePaymentIntents = pgTable(
  'commerce_payment_intents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    orderRef: text('order_ref'),
    provider: text('provider').notNull(), // stripe | iyzico | …
    amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
    currency: text('currency').default('TRY').notNull(),
    status: text('status').default('pending').notNull(), // pending | succeeded | failed | refunded
    externalId: text('external_id'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('commerce_payments_company_idx').on(t.companyId, t.status)],
)

export const commerceOrderAnalyses = pgTable(
  'commerce_order_analyses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    inboxId: uuid('inbox_id').references(() => commerceOrdersInbox.id),
    orderRef: text('order_ref'),
    riskScore: integer('risk_score').default(0),
    fraudScore: integer('fraud_score').default(0),
    stockRisk: integer('stock_risk').default(0),
    deliveryRisk: integer('delivery_risk').default(0),
    repeatOrder: boolean('repeat_order').default(false),
    flags: jsonb('flags').$type<string[]>().default([]),
    summary: text('summary'),
    recommendation: text('recommendation'), // promote | hold | reject
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('commerce_order_analyses_company_idx').on(t.companyId, t.createdAt)],
)

export const commerceCoupons = pgTable(
  'commerce_coupons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    code: text('code').notNull(),
    discountType: text('discount_type').default('percent').notNull(),
    discountValue: numeric('discount_value', { precision: 18, scale: 4 }).notNull(),
    active: boolean('active').default(true).notNull(),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [uniqueIndex('commerce_coupons_code_uidx').on(t.companyId, t.code)],
)

/** MES (MES-0) — additive manufacturing execution layer */
export const mesWorkCenters = pgTable(
  'mes_work_centers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    code: text('code').notNull(),
    name: text('name').notNull(),
    kind: text('kind').default('machine').notNull(), // machine | cell | line
    status: text('status').default('idle').notNull(), // idle | running | down | maintenance
    capacityPerHour: numeric('capacity_per_hour', { precision: 12, scale: 2 }),
    oee: numeric('oee', { precision: 5, scale: 2 }),
    energyKw: numeric('energy_kw', { precision: 12, scale: 2 }),
    operatorId: uuid('operator_id'),
    photoUrl: text('photo_url'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('mes_work_centers_code_uidx').on(t.companyId, t.code),
    index('mes_work_centers_company_idx').on(t.companyId, t.status),
  ],
)

export const mesOperators = pgTable(
  'mes_operators',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    code: text('code').notNull(),
    name: text('name').notNull(),
    status: text('status').default('available').notNull(), // available | busy | off
    userId: uuid('user_id').references(() => users.id),
    skills: jsonb('skills').$type<string[]>().default([]),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('mes_operators_code_uidx').on(t.companyId, t.code),
    index('mes_operators_company_idx').on(t.companyId, t.status),
  ],
)

export const mesShifts = pgTable(
  'mes_shifts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    startTime: text('start_time').notNull(), // HH:mm
    endTime: text('end_time').notNull(),
    active: boolean('active').default(true).notNull(),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('mes_shifts_company_idx').on(t.companyId, t.active)],
)

export const mesBoms = pgTable(
  'mes_boms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    productId: text('product_id').notNull(),
    name: text('name').notNull(),
    version: text('version').default('1').notNull(),
    status: text('status').default('active').notNull(),
    lines: jsonb('lines').$type<Record<string, unknown>[]>().default([]),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('mes_boms_company_idx').on(t.companyId, t.productId)],
)

export const mesRoutings = pgTable(
  'mes_routings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    productId: text('product_id').notNull(),
    name: text('name').notNull(),
    operations: jsonb('operations').$type<Record<string, unknown>[]>().default([]),
    status: text('status').default('active').notNull(),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('mes_routings_company_idx').on(t.companyId, t.productId)],
)

export const mesEvents = pgTable(
  'mes_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    productionJobId: text('production_job_id'),
    workCenterId: uuid('work_center_id').references(() => mesWorkCenters.id),
    operatorId: uuid('operator_id').references(() => mesOperators.id),
    action: text('action').notNull(), // start | pause | resume | finish | scrap | qc_call | photo | barcode
    qtyGood: integer('qty_good').default(0),
    qtyScrap: integer('qty_scrap').default(0),
    note: text('note'),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    index('mes_events_company_idx').on(t.companyId, t.createdAt),
    index('mes_events_job_idx').on(t.companyId, t.productionJobId),
  ],
)

export const mesScrap = pgTable(
  'mes_scrap',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    productionJobId: text('production_job_id'),
    workCenterId: uuid('work_center_id').references(() => mesWorkCenters.id),
    operatorId: uuid('operator_id').references(() => mesOperators.id),
    productId: text('product_id'),
    qty: integer('qty').default(1).notNull(),
    reason: text('reason'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('mes_scrap_company_idx').on(t.companyId, t.createdAt)],
)

export const mesMaintenance = pgTable(
  'mes_maintenance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    workCenterId: uuid('work_center_id').references(() => mesWorkCenters.id),
    kind: text('kind').default('preventive').notNull(), // preventive | periodic | breakdown | ai
    status: text('status').default('open').notNull(), // open | in_progress | done
    title: text('title').notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('mes_maintenance_company_idx').on(t.companyId, t.status)],
)

export const mesOeeSamples = pgTable(
  'mes_oee_samples',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    workCenterId: uuid('work_center_id').references(() => mesWorkCenters.id),
    availability: numeric('availability', { precision: 5, scale: 2 }),
    performance: numeric('performance', { precision: 5, scale: 2 }),
    quality: numeric('quality', { precision: 5, scale: 2 }),
    oee: numeric('oee', { precision: 5, scale: 2 }),
    sampledAt: timestamp('sampled_at', { withTimezone: true }).defaultNow().notNull(),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('mes_oee_samples_company_idx').on(t.companyId, t.sampledAt)],
)

/** Financial Suite (FS-0) — GL projection layer; does not replace treasury SoT */
export const financeAccounts = pgTable(
  'finance_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    code: text('code').notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(), // asset | liability | equity | revenue | expense
    currency: text('currency').default('TRY'),
    parentCode: text('parent_code'),
    active: boolean('active').default(true).notNull(),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('finance_accounts_code_uidx').on(t.companyId, t.code),
    index('finance_accounts_company_idx').on(t.companyId, t.type),
  ],
)

export const financeJournals = pgTable(
  'finance_journals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    branchId: uuid('branch_id'),
    journalNo: text('journal_no').notNull(),
    status: text('status').default('draft').notNull(), // draft | posted | void
    source: text('source').default('manual').notNull(), // manual | treasury | invoice | expense | mes | commerce
    currency: text('currency').default('TRY'),
    memo: text('memo'),
    treasuryMovementId: text('treasury_movement_id'),
    invoiceId: text('invoice_id'),
    orderId: text('order_id'),
    productionJobId: text('production_job_id'),
    customerId: text('customer_id'),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('finance_journals_no_uidx').on(t.companyId, t.journalNo),
    index('finance_journals_company_idx').on(t.companyId, t.status),
  ],
)

export const financeJournalLines = pgTable(
  'finance_journal_lines',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    journalId: uuid('journal_id')
      .notNull()
      .references(() => financeJournals.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    accountCode: text('account_code').notNull(),
    debit: numeric('debit', { precision: 18, scale: 4 }).default('0'),
    credit: numeric('credit', { precision: 18, scale: 4 }).default('0'),
    currency: text('currency').default('TRY'),
    memo: text('memo'),
    ...timestamps,
  },
  (t) => [index('finance_journal_lines_journal_idx').on(t.journalId)],
)

export const financeBudgets = pgTable(
  'finance_budgets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    year: integer('year').notNull(),
    status: text('status').default('draft').notNull(),
    currency: text('currency').default('TRY'),
    lines: jsonb('lines').$type<Record<string, unknown>[]>().default([]),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('finance_budgets_company_idx').on(t.companyId, t.year)],
)

export const financeCostEntries = pgTable(
  'finance_cost_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    dimension: text('dimension').notNull(), // product | order | machine | operator | customer
    dimensionId: text('dimension_id').notNull(),
    amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
    currency: text('currency').default('TRY'),
    productionJobId: text('production_job_id'),
    memo: text('memo'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('finance_cost_entries_company_idx').on(t.companyId, t.dimension)],
)

export const financeAssets = pgTable(
  'finance_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    code: text('code').notNull(),
    name: text('name').notNull(),
    status: text('status').default('active').notNull(),
    acquisitionCost: numeric('acquisition_cost', { precision: 18, scale: 4 }),
    currency: text('currency').default('TRY'),
    acquiredAt: timestamp('acquired_at', { withTimezone: true }),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [uniqueIndex('finance_assets_code_uidx').on(t.companyId, t.code)],
)

export const financeReconciliations = pgTable(
  'finance_reconciliations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    bankAccountRef: text('bank_account_ref').notNull(),
    status: text('status').default('open').notNull(), // open | matched | closed
    statementDate: timestamp('statement_date', { withTimezone: true }),
    matchedCount: integer('matched_count').default(0),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('finance_reconciliations_company_idx').on(t.companyId, t.status)],
)

/** Customer Experience Cloud — projection / insight layer (docs/85). Master customer stays CRM SoT. */
export const cxcPipelineStages = pgTable(
  'cxc_pipeline_stages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    code: text('code').notNull(),
    label: text('label').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    color: text('color'),
    isWon: boolean('is_won').default(false).notNull(),
    isLost: boolean('is_lost').default(false).notNull(),
    active: boolean('active').default(true).notNull(),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('cxc_pipeline_stages_code_uidx').on(t.companyId, t.code),
    index('cxc_pipeline_stages_company_idx').on(t.companyId, t.sortOrder),
  ],
)

export const cxcOpportunities = pgTable(
  'cxc_opportunities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    customerId: text('customer_id').notNull(),
    title: text('title').notNull(),
    stageCode: text('stage_code').notNull(),
    amount: numeric('amount', { precision: 18, scale: 4 }).default('0'),
    currency: text('currency').default('TRY'),
    ownerId: text('owner_id'),
    source: text('source'),
    probability: integer('probability').default(0),
    expectedCloseAt: timestamp('expected_close_at', { withTimezone: true }),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    index('cxc_opportunities_company_idx').on(t.companyId, t.stageCode),
    index('cxc_opportunities_customer_idx').on(t.companyId, t.customerId),
  ],
)

export const cxcTimelineEvents = pgTable(
  'cxc_timeline_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    customerId: text('customer_id').notNull(),
    kind: text('kind').notNull(), // call | whatsapp | email | quote | order | task | note | meeting | support | invoice | payment | production | warehouse | delivery | visit
    title: text('title').notNull(),
    summary: text('summary'),
    sourceRef: text('source_ref'),
    sourceModule: text('source_module'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    index('cxc_timeline_events_customer_idx').on(t.companyId, t.customerId, t.occurredAt),
    index('cxc_timeline_events_kind_idx').on(t.companyId, t.kind),
  ],
)

export const cxcHealthScores = pgTable(
  'cxc_health_scores',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    customerId: text('customer_id').notNull(),
    score: integer('score').default(50).notNull(),
    factors: jsonb('factors').$type<Record<string, unknown>>().default({}),
    churnRisk: text('churn_risk').default('medium'),
    computedAt: timestamp('computed_at', { withTimezone: true }),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [uniqueIndex('cxc_health_scores_customer_uidx').on(t.companyId, t.customerId)],
)

export const cxcLoyalty = pgTable(
  'cxc_loyalty',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    customerId: text('customer_id').notNull(),
    tier: text('tier').default('bronze').notNull(), // bronze | silver | gold | platinum | vip
    points: integer('points').default(0).notNull(),
    discountPct: numeric('discount_pct', { precision: 8, scale: 2 }).default('0'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [uniqueIndex('cxc_loyalty_customer_uidx').on(t.companyId, t.customerId)],
)

export const cxcSupportTickets = pgTable(
  'cxc_support_tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    customerId: text('customer_id').notNull(),
    subject: text('subject').notNull(),
    channel: text('channel').default('portal').notNull(), // whatsapp | email | phone | portal
    priority: text('priority').default('normal').notNull(),
    status: text('status').default('open').notNull(),
    slaDueAt: timestamp('sla_due_at', { withTimezone: true }),
    aiSummary: text('ai_summary'),
    portalTicketRef: text('portal_ticket_ref'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    index('cxc_support_tickets_company_idx').on(t.companyId, t.status),
    index('cxc_support_tickets_customer_idx').on(t.companyId, t.customerId),
  ],
)

export const cxcAiInsights = pgTable(
  'cxc_ai_insights',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    customerId: text('customer_id'),
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('cxc_ai_insights_company_idx').on(t.companyId, t.kind)],
)

export const cxcNextActions = pgTable(
  'cxc_next_actions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    customerId: text('customer_id').notNull(),
    action: text('action').notNull(),
    reason: text('reason'),
    priority: integer('priority').default(50).notNull(),
    status: text('status').default('pending').notNull(),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('cxc_next_actions_company_idx').on(t.companyId, t.status)],
)

/** Enterprise Document Platform — dual-write ready (docs/87). Client stores remain SoT in DP-0. */
export const docTemplates = pgTable(
  'doc_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    docType: text('doc_type').default('generic').notNull(),
    status: text('status').default('draft').notNull(),
    pageSize: text('page_size').default('A4'),
    orientation: text('orientation').default('portrait'),
    locale: text('locale').default('tr'),
    version: integer('version').default(1).notNull(),
    design: jsonb('design').$type<Record<string, unknown>>().default({}),
    sourceModule: text('source_module'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('doc_templates_company_idx').on(t.companyId, t.docType, t.status)],
)

export const docLabels = pgTable(
  'doc_labels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    widthMm: numeric('width_mm', { precision: 10, scale: 2 }).notNull(),
    heightMm: numeric('height_mm', { precision: 10, scale: 2 }).notNull(),
    labelKind: text('label_kind').default('product').notNull(),
    design: jsonb('design').$type<Record<string, unknown>>().default({}),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('doc_labels_company_idx').on(t.companyId, t.labelKind)],
)

export const docPrintProfiles = pgTable(
  'doc_print_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    brand: text('brand'),
    deviceClass: text('device_class').default('laser').notNull(),
    target: text('target').default('browser').notNull(),
    paper: text('paper').default('A4'),
    settings: jsonb('settings').$type<Record<string, unknown>>().default({}),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('doc_print_profiles_company_idx').on(t.companyId, t.deviceClass)],
)

export const docPrintJobs = pgTable(
  'doc_print_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    templateId: text('template_id'),
    docType: text('doc_type'),
    sourceRef: text('source_ref'),
    status: text('status').default('queued').notNull(),
    output: text('output').default('pdf'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('doc_print_jobs_company_idx').on(t.companyId, t.status)],
)

export const docAssets = pgTable(
  'doc_assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    kind: text('kind').default('image').notNull(),
    url: text('url'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('doc_assets_company_idx').on(t.companyId, t.kind)],
)

export const docFonts = pgTable(
  'doc_fonts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    family: text('family').notNull(),
    source: text('source').default('system').notNull(),
    weights: jsonb('weights').$type<unknown[]>().default([]),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [uniqueIndex('doc_fonts_family_uidx').on(t.companyId, t.family)],
)

export const docAiDesigns = pgTable(
  'doc_ai_designs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    prompt: text('prompt').notNull(),
    docType: text('doc_type').default('generic'),
    status: text('status').default('draft').notNull(),
    result: jsonb('result').$type<Record<string, unknown>>().default({}),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('doc_ai_designs_company_idx').on(t.companyId, t.status)],
)

export const docMarketplaceItems = pgTable(
  'doc_marketplace_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').references(() => companies.id),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    sector: text('sector'),
    locale: text('locale').default('tr'),
    premium: boolean('premium').default(false).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [uniqueIndex('doc_marketplace_items_slug_uidx').on(t.slug)],
)

/** Enterprise Analytics Platform — layout/KPI projection (docs/89). No parallel ledgers. */
export const analyticsDashboards = pgTable(
  'analytics_dashboards',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    kind: text('kind').default('custom').notNull(),
    layout: jsonb('layout').$type<unknown[]>().default([]),
    isDefault: boolean('is_default').default(false).notNull(),
    roleScope: text('role_scope'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('analytics_dashboards_slug_uidx').on(t.companyId, t.slug),
    index('analytics_dashboards_company_idx').on(t.companyId, t.kind),
  ],
)

export const analyticsKpis = pgTable(
  'analytics_kpis',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    code: text('code').notNull(),
    label: text('label').notNull(),
    source: text('source').default('custom').notNull(),
    formula: text('formula'),
    unit: text('unit').default('number'),
    target: numeric('target', { precision: 18, scale: 4 }),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [uniqueIndex('analytics_kpis_code_uidx').on(t.companyId, t.code)],
)

export const analyticsAlerts = pgTable(
  'analytics_alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    name: text('name').notNull(),
    kpiCode: text('kpi_code'),
    operator: text('operator').default('gt').notNull(),
    threshold: numeric('threshold', { precision: 18, scale: 4 }),
    channels: jsonb('channels').$type<unknown[]>().default([]),
    active: boolean('active').default(true).notNull(),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('analytics_alerts_company_idx').on(t.companyId, t.active)],
)

export const analyticsGoals = pgTable(
  'analytics_goals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    title: text('title').notNull(),
    scope: text('scope').default('company').notNull(),
    ownerRef: text('owner_ref'),
    targetValue: numeric('target_value', { precision: 18, scale: 4 }),
    actualValue: numeric('actual_value', { precision: 18, scale: 4 }),
    period: text('period'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('analytics_goals_company_idx').on(t.companyId, t.scope)],
)

export const analyticsOkrs = pgTable(
  'analytics_okrs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    objective: text('objective').notNull(),
    scope: text('scope').default('company').notNull(),
    ownerRef: text('owner_ref'),
    keyResults: jsonb('key_results').$type<unknown[]>().default([]),
    progressPct: integer('progress_pct').default(0),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('analytics_okrs_company_idx').on(t.companyId, t.scope)],
)

export const analyticsInsights = pgTable(
  'analytics_insights',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    headline: text('headline').notNull(),
    severity: text('severity').default('info').notNull(),
    domain: text('domain'),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('analytics_insights_company_idx').on(t.companyId, t.severity)],
)

export const analyticsForecasts = pgTable(
  'analytics_forecasts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    kind: text('kind').notNull(),
    horizon: text('horizon').default('30d'),
    value: numeric('value', { precision: 18, scale: 4 }),
    unit: text('unit').default('TRY'),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('analytics_forecasts_company_idx').on(t.companyId, t.kind)],
)

export const analyticsExports = pgTable(
  'analytics_exports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    format: text('format').default('csv').notNull(),
    status: text('status').default('queued').notNull(),
    source: text('source'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('analytics_exports_company_idx').on(t.companyId, t.status)],
)

/** Platform Core — module registry / jobs / health (docs/91). Domain tables stay in domains. */
export const platformModules = pgTable(
  'platform_modules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').references(() => companies.id),
    code: text('code').notNull(),
    label: text('label').notNull(),
    route: text('route'),
    apiPrefix: text('api_prefix'),
    entitlementCode: text('entitlement_code'),
    domain: text('domain').default('platform').notNull(),
    status: text('status').default('active').notNull(),
    version: text('version').default('2026'),
    dependencies: jsonb('dependencies').$type<unknown[]>().default([]),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('platform_modules_code_uidx').on(t.code),
    index('platform_modules_status_idx').on(t.status, t.domain),
  ],
)

export const platformJobs = pgTable(
  'platform_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').references(() => companies.id),
    name: text('name').notNull(),
    queue: text('queue').default('default').notNull(),
    status: text('status').default('queued').notNull(),
    priority: integer('priority').default(50).notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
    runAt: timestamp('run_at', { withTimezone: true }),
    attempts: integer('attempts').default(0).notNull(),
    lastError: text('last_error'),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('platform_jobs_status_idx').on(t.status, t.queue, t.priority)],
)

export const platformHealthSnapshots = pgTable(
  'platform_health_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    service: text('service').notNull(),
    status: text('status').default('unknown').notNull(),
    latencyMs: integer('latency_ms'),
    detail: jsonb('detail').$type<Record<string, unknown>>().default({}),
    checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [index('platform_health_service_idx').on(t.service, t.checkedAt)],
)

export const platformIntegrations = pgTable(
  'platform_integrations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').references(() => companies.id),
    code: text('code').notNull(),
    label: text('label').notNull(),
    kind: text('kind').default('api').notNull(),
    status: text('status').default('configured').notNull(),
    config: jsonb('config').$type<Record<string, unknown>>().default({}),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [uniqueIndex('platform_integrations_code_uidx').on(t.code)],
)

export const platformPlugins = pgTable(
  'platform_plugins',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    companyId: uuid('company_id').references(() => companies.id),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    kind: text('kind').default('widget').notNull(),
    status: text('status').default('available').notNull(),
    version: text('version').default('0.1.0'),
    payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
    meta: jsonb('meta').$type<Record<string, unknown>>().default({}),
    ...timestamps,
  },
  (t) => [uniqueIndex('platform_plugins_slug_uidx').on(t.slug)],
)
