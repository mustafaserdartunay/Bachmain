import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { seedData } from './seed.mjs'
import { hasDatabase, loadPayload, savePayload, ensureSchema } from './db.mjs'
import { needsDemoPurge, purgeDemoData } from './purgeDemoData.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_FILE = process.env.VERCEL
  ? path.join('/tmp', 'bachmain-admin-db.json')
  : path.join(__dirname, 'data', 'db.json')

let writeQueue = Promise.resolve()
let warnedEphemeral = false

function warnIfEphemeral() {
  if (warnedEphemeral || hasDatabase() || !process.env.VERCEL) return
  warnedEphemeral = true
  console.warn(
    '[bachmain] DATABASE_URL missing on Vercel — using /tmp JSON (ephemeral). Membership will not survive cold starts.',
  )
}

async function loadFromFile() {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true })
    await fs.writeFile(DB_FILE, JSON.stringify(seedData, null, 2))
    return structuredClone(seedData)
  }
}

async function saveToFile(data) {
  writeQueue = writeQueue.then(() => fs.writeFile(DB_FILE, JSON.stringify(data, null, 2)))
  await writeQueue
  return data
}

async function scrubDemoIfNeeded(data) {
  if (!needsDemoPurge(data)) return data
  const result = purgeDemoData(data)
  if (result.changed) {
    console.info(
      `[bachmain] demo data purged: customers -${result.removedCustomers}, tickets -${result.removedTickets}`,
    )
    await saveStore(data)
  }
  return data
}

export async function loadStore() {
  warnIfEphemeral()
  let data
  if (hasDatabase()) {
    await ensureSchema()
    const payload = await loadPayload('main')
    if (payload && typeof payload === 'object') data = payload
    else {
      const seeded = structuredClone(seedData)
      await savePayload(seeded, 'main')
      data = seeded
    }
  } else {
    data = await loadFromFile()
  }

  data = await scrubDemoIfNeeded(data)

  try {
    const { seedBillingIfEmpty } = await import('./subscriptionService.mjs')
    seedBillingIfEmpty(data)
  } catch {
    // ignore seed errors on cold start
  }
  try {
    const { ensureAnnouncementsStore } = await import('./announcements.mjs')
    ensureAnnouncementsStore(data)
  } catch {
    // ignore seed errors on cold start
  }
  return data
}

export async function saveStore(data) {
  if (hasDatabase()) {
    await savePayload(data, 'main')
    return data
  }
  return saveToFile(data)
}

let storeWriteChain = Promise.resolve()

export async function withStore(mutator) {
  // Serialize mutations to avoid last-write-wins cross-tenant corruption.
  const run = storeWriteChain.then(async () => {
    const data = await loadStore()
    const result = await mutator(data)
    await saveStore(data)
    return result
  })
  // Keep chain alive even if a mutator fails
  storeWriteChain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

export function newId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export function storageBackend() {
  return hasDatabase() ? 'postgres' : process.env.VERCEL ? 'tmp-json' : 'file-json'
}
