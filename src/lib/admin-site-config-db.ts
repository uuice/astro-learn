import { join } from 'node:path'
import { mkdirSync, existsSync } from 'node:fs'
import { JSONFilePreset } from 'lowdb/node'

export interface ConfigItem {
  key: string
  value: unknown
  type: 'string' | 'json'
  description?: string
}

export interface AdminNavItem {
  title: string
  url: string
}

interface SiteConfigData {
  configs: ConfigItem[]
}

const defaultData: SiteConfigData = {
  configs: [
    {
      key: 'adminNav',
      value: [
        { title: '评论', url: '/admin/comments' },
        { title: '数据', url: '/admin/content' },
        { title: '短链接', url: '/admin/shortlinks' },
        { title: '配置', url: '/admin/config' },
      ],
      type: 'json',
      description: '管理后台导航菜单配置',
    },
  ],
}

function getDbPath(): string {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'admin-site-config.json')
}

let dbPromise: Promise<Awaited<ReturnType<typeof JSONFilePreset<SiteConfigData>>>> | null = null

async function getDb() {
  if (!dbPromise) {
    dbPromise = JSONFilePreset<SiteConfigData>(getDbPath(), defaultData)
  }
  return dbPromise
}

export async function getAllConfigs(): Promise<ConfigItem[]> {
  const db = await getDb()
  return db.data.configs
}

export async function getConfig(key: string): Promise<ConfigItem | undefined> {
  const db = await getDb()
  return db.data.configs.find((c) => c.key === key)
}

export async function getConfigValue<T = unknown>(key: string): Promise<T | undefined> {
  const config = await getConfig(key)
  if (!config) return undefined
  return config.value as T
}

export async function setConfig(item: ConfigItem): Promise<void> {
  const db = await getDb()
  const index = db.data.configs.findIndex((c) => c.key === item.key)
  if (index >= 0) {
    db.data.configs[index] = item
  } else {
    db.data.configs.push(item)
  }
  await db.write()
}

export async function deleteConfig(key: string): Promise<boolean> {
  const db = await getDb()
  const index = db.data.configs.findIndex((c) => c.key === key)
  if (index >= 0) {
    db.data.configs.splice(index, 1)
    await db.write()
    return true
  }
  return false
}

const defaultAdminNav: AdminNavItem[] = [
  { title: '评论', url: '/admin/comments' },
  { title: '数据', url: '/admin/content' },
  { title: '短链接', url: '/admin/shortlinks' },
  { title: '配置', url: '/admin/config' },
]

export async function getAdminNav(): Promise<AdminNavItem[]> {
  const nav = await getConfigValue<AdminNavItem[]>('adminNav')
  return nav ?? defaultAdminNav
}
