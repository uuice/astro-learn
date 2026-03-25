import { join } from 'node:path'
import { mkdirSync, existsSync } from 'node:fs'
import { JSONFilePreset } from 'lowdb/node'
import type { Low } from 'lowdb'

/** 每个 JSON 文件对应一个 lowdb 实例（与现有 `data/*.json` 约定一致） */
const dbCache = new Map<string, Promise<Low<unknown>>>()

export function resolveDataPath(fileName: string): string {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, fileName)
}

/**
 * 获取（并缓存）lowdb 实例。`defaultData` 仅在首次创建文件时使用。
 */
export async function getJsonDb<Data extends Record<string, unknown[]>>(
  fileName: string,
  defaultData: Data
): Promise<Low<Data>> {
  const path = resolveDataPath(fileName)
  if (!dbCache.has(path)) {
    dbCache.set(path, JSONFilePreset<Data>(path, defaultData) as Promise<Low<unknown>>)
  }
  return dbCache.get(path)! as Promise<Low<Data>>
}

/** 测试或热重载时可清空缓存（一般不需要） */
export function clearJsonDbCache(): void {
  dbCache.clear()
}
