import { join } from 'node:path'
import { mkdirSync, existsSync } from 'node:fs'
import { JSONFilePreset } from 'lowdb/node'
import type { Low } from 'lowdb'

/**
 * 按「绝对路径」缓存 Promise，保证同一 JSON 文件全局只打开一个 lowdb 实例，
 * 避免多处 `JSONFilePreset` 导致并发写或状态不一致。
 */
const dbCache = new Map<string, Promise<Low<unknown>>>()

/** 解析为 `process.cwd()/data/<fileName>`，并确保 `data` 目录存在。 */
export function resolveDataPath(fileName: string): string {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, fileName)
}

/**
 * 获取（并缓存）lowdb 实例。
 *
 * - `defaultData` **仅在磁盘上尚无该文件**时作为初始内容写入；已有文件则不会覆盖。
 * - 返回的 `db.data` 类型为 `Data`，更新请用 `db.update(fn)`（由 lowdb 负责落盘）。
 */
export async function getJsonDb<Data extends object>(
  fileName: string,
  defaultData: Data
): Promise<Low<Data>> {
  const path = resolveDataPath(fileName)
  if (!dbCache.has(path)) {
    dbCache.set(path, JSONFilePreset<Data>(path, defaultData) as Promise<Low<unknown>>)
  }
  return dbCache.get(path)! as Promise<Low<Data>>
}

/** 单测或需要换用另一份文件内容时可调用，使下次 `getJsonDb` 重新 `JSONFilePreset`。 */
export function clearJsonDbCache(): void {
  dbCache.clear()
}
