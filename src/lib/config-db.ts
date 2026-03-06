import { join } from 'node:path'
import { mkdirSync, existsSync } from 'node:fs'
import { JSONFilePreset } from 'lowdb/node'

interface ConfigData {
  adminToken: string
}

const defaultData: ConfigData = { adminToken: '' }

function getConfigPath(): string {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'config.json')
}

let dbPromise: Promise<Awaited<ReturnType<typeof JSONFilePreset<ConfigData>>>> | null = null

async function getConfigDb() {
  if (!dbPromise) {
    dbPromise = JSONFilePreset<ConfigData>(getConfigPath(), defaultData)
  }
  return dbPromise
}

export async function getConfig(): Promise<ConfigData> {
  const db = await getConfigDb()
  return { adminToken: db.data.adminToken ?? '' }
}

export async function setAdminToken(token: string): Promise<boolean> {
  const db = await getConfigDb()
  if (db.data.adminToken && db.data.adminToken.length > 0) return false
  db.data.adminToken = token.trim()
  await db.write()
  return true
}

export async function getAdminToken(): Promise<string> {
  const config = await getConfig()
  return config.adminToken || ''
}
