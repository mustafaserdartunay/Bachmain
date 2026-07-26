/**
 * Defense-in-depth: set Postgres GUC app.company_id inside a Drizzle transaction
 * so FORCE RLS policies in 0018_tenant_rls.sql can see the tenant.
 */
import { sql } from 'drizzle-orm'
import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { NodePgDatabase, NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import { db } from '../db/client.js'
import * as schema from '../db/schema/index.js'

type Schema = typeof schema
type Tx = PgTransaction<NodePgQueryResultHKT, Schema, ExtractTablesWithRelations<Schema>>
type Database = NodePgDatabase<Schema>

export async function withCompanyRls<T>(
  companyId: string,
  fn: (tx: Tx | Database) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.company_id', ${companyId}, true)`)
    return fn(tx)
  })
}
