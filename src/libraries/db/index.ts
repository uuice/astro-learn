/**
 * lowdb 封装入口（路径均在项目根 `data/` 下）。
 *
 * - `getJsonDb`：最底层单例，任意可 JSON 序列化的根对象。
 * - `createModel`：「根对象上某一 key 为**对象数组**」的集合（如 `{ comments: [...] }`）。
 * - `createObject`：「**整份文件就是一个根对象**」（如 `{ adminToken: '' }`、`{ configs: [...] }`）。
 *
 * 读：可用返回的 `lodashChain()`（内存快照）。写：一律 `getDb().then(db => db.update(...))`。
 */
export { getJsonDb, resolveDataPath, clearJsonDbCache } from './connection.js'
export { createModel, type CreateModelOptions, type Model } from './model.js'
export {
  createObject,
  type CreateObjectOptions,
  type InferObject,
  type ObjectStore,
} from './object.js'
export type { InferDoc } from './types.js'
