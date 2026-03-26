import _ from 'lodash'
import { chain, cloneDeep } from 'lodash'
import type { Low } from 'lowdb'
import type { z } from 'zod'
import { getJsonDb } from './connection.js'

/**
 * JSON 根即一个对象，例如：
 * - `{ "adminToken": "" }`
 * - `{ "configs": [ ... ] }`
 *
 * Schema 的 **输出类型**须为 `object`（与 lowdb 根对象、`getJsonDb<Data extends object>` 一致）。
 * 不要用 `ZodTypeAny`：其 `output` 可能是 `unknown`，无法作为 `getJsonDb` 的泛型参数。
 */
export interface CreateObjectOptions<TSchema extends z.ZodType<object, unknown>> {
  /** 根对象整体结构的 Zod schema；合并/写入前可用 `store.schema.parse(whole)` */
  schema: TSchema
  /** 相对 `data/` 的文件名 */
  fileName: string
  /**
   * 磁盘上尚无该文件时写入的初始根对象，必须能通过 `schema` 校验。
   * 已存在文件时不会用其覆盖。
   */
  defaultData: z.output<TSchema>
}

/** `createObject` 的 schema 推断出的根对象类型。 */
export type InferObject<TSchema extends z.ZodType<object, unknown>> = z.output<TSchema>

export interface ObjectStore<TSchema extends z.ZodType<object, unknown>> {
  readonly schema: TSchema
  readonly fileName: string

  /** 该文件对应的 lowdb 单例；修改根级字段在 `db.update` 内完成 */
  getDb: () => Promise<Low<z.output<TSchema>>>

  /**
   * 对**整个** `db.data` 深拷贝后做 `_.chain`（`ObjectChain`）。
   * 适合对根对象做 `get`/`mapValues` 等；子数组上的过滤仍可用 lodash。
   * 持久化请用 `getDb().update`，勿依赖链上副作用。
   */
  lodashChain: () => Promise<_.ObjectChain<z.output<TSchema>>>
}

/**
 * 单文件、单根对象（非「collectionKey → 文档数组」模型）。
 * 多条同质文档且按集合 CRUD 的，请用 `createModel`。
 */
export function createObject<TSchema extends z.ZodType<object, unknown>>(
  options: CreateObjectOptions<TSchema>
): ObjectStore<TSchema> {
  const { schema, fileName, defaultData } = options
  type Data = z.output<TSchema>

  async function openDb(): Promise<Low<Data>> {
    return getJsonDb<Data>(fileName, defaultData)
  }

  return {
    schema,
    fileName,
    getDb: openDb,
    async lodashChain() {
      const db = await openDb()
      const snapshot = cloneDeep(db.data) as Data
      return chain(snapshot) as _.ObjectChain<Data>
    },
  }
}
