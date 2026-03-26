import _ from 'lodash'
import { chain, cloneDeep } from 'lodash'
import type { List } from 'lodash'
import type { Low } from 'lowdb'
import type { z } from 'zod'
import { getJsonDb } from './connection.js'
import type { InferDoc } from './types.js'

export type { InferDoc } from './types.js'

export interface CreateModelOptions<TSchema extends z.ZodObject<z.ZodRawShape>> {
  /** Zod 对象 schema，写入前可用 `model.schema.parse(...)` 校验 */
  schema: TSchema
  /** 相对 `data/` 的文件名，如 `comments.json` */
  fileName: string
  /** JSON 根下的数组 key，如 `comments` */
  collectionKey: string
  /** 主键字段名，默认 `id`（仅作文档/约定，不参与自动 CRUD） */
  idField?: string
}

type DbShape<TSchema extends z.ZodObject<z.ZodRawShape>> = Record<
  string,
  InferDoc<TSchema>[]
>

export interface Model<TSchema extends z.ZodObject<z.ZodRawShape>> {
  readonly schema: TSchema
  readonly fileName: string
  readonly collectionKey: string
  readonly idField: string

  /** 同一 JSON 文件的 lowdb 单例；增删改在 `db.update` 里用 lodash 处理 `data[collectionKey]` */
  getDb: () => Promise<Low<DbShape<TSchema>>>

  /**
   * 当前集合数组的 lodash chain（基于内存快照，末尾 `.value()`）。
   * 持久化变更请用 `getDb().update`。
   */
  lodashChain: () => Promise<_.CollectionChain<InferDoc<TSchema>>>
}

/**
 * 创建集合模型：绑定 lowdb 文件 + Zod schema，查询用 `lodashChain()`，写库用 `getDb().update` + lodash。
 */
export function createModel<TSchema extends z.ZodObject<z.ZodRawShape>>(
  options: CreateModelOptions<TSchema>
): Model<TSchema> {
  const { schema, fileName, collectionKey, idField = 'id' } = options

  type Doc = InferDoc<TSchema>

  const defaultData = { [collectionKey]: [] } as Record<string, Doc[]>

  async function openDb(): Promise<Low<Record<string, Doc[]>>> {
    return getJsonDb<Record<string, Doc[]>>(fileName, defaultData as Record<string, Doc[]>)
  }

  async function readRows(): Promise<Doc[]> {
    const db = await openDb()
    const rows = db.data[collectionKey]
    if (!Array.isArray(rows)) {
      await db.update((data) => {
        const d = data as Record<string, Doc[]>
        d[collectionKey] = []
      })
      return []
    }
    return rows
  }

  return {
    schema,
    fileName,
    collectionKey,
    idField,
    getDb: () => openDb() as Promise<Low<DbShape<TSchema>>>,
    async lodashChain() {
      const rows = await readRows()
      return chain(cloneDeep(rows) as List<Doc>) as _.CollectionChain<Doc>
    },
  }
}
