import { join } from 'node:path'
import { mkdirSync, existsSync } from 'node:fs'
import { JSONFilePreset } from 'lowdb/node'

interface AdminTokenData {
  adminToken: string
}

const defaultData: AdminTokenData = { adminToken: '' }

function getDbPath(): string {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'admin-token-config.json')
}

let dbPromise: Promise<Awaited<ReturnType<typeof JSONFilePreset<AdminTokenData>>>> | null = null

async function getDb() {
  if (!dbPromise) {
    dbPromise = JSONFilePreset<AdminTokenData>(getDbPath(), defaultData)
  }
  return dbPromise
}

export async function getAdminToken(): Promise<string> {
  const db = await getDb()
  return db.data.adminToken ?? ''
}

export async function setAdminToken(token: string): Promise<boolean> {
  const db = await getDb()
  if (db.data.adminToken && db.data.adminToken.length > 0) return false
  db.data.adminToken = token.trim()
  await db.write()
  return true
}

export async function hasAdminToken(): Promise<boolean> {
  const token = await getAdminToken()
  return token.length > 0
}
