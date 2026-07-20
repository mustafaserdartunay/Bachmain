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
    kind: text('kind').notNull(), // model | tool | memory | approval
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
