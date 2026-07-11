import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { seedData } from './seed.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_FILE = process.env.VERCEL
  ? path.join('/tmp', 'bachmain-admin-db.json')
  : path.join(__dirname, 'data', 'db.json')

let writeQueue = Promise.resolve()

export async function loadStore() {
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true })
    await fs.writeFile(DB_FILE, JSON.stringify(seedData, null, 2))
    return structuredClone(seedData)
  }
}

export async function saveStore(data) {
  writeQueue = writeQueue.then(() => fs.writeFile(DB_FILE, JSON.stringify(data, null, 2)))
  await writeQueue
  return data
}

export async function withStore(mutator) {
  const data = await loadStore()
  const result = await mutator(data)
  await saveStore(data)
  return result
}

export function newId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}
