import _ from 'lodash'
import { chain, cloneDeep } from 'lodash'
import type { List } from 'lodash'
import type { Low } from 'lowdb'
import type { z } from 'zod'
import { getJsonDb } from './connection.js'
import type { InferDoc } from './types.js'

export type { InferDoc } from './types.js'

/**
 * JSON 形态示例：`{ "comments": [ { "id": "...", ... }, ... ] }`
 * `collectionKey` 即根上的数组属性名；数组元素结构由 `schema` 描述。
 */
export interface CreateModelOptions<TSchema extends z.ZodObject<z.ZodRawShape>> {
  /** 单条文档的 Zod 对象 schema；写入前建议 `model.schema.parse(...)` */
  schema: TSchema
  /** 相对 `data/` 的文件名，如 `comments.json` */
  fileName: string
  /** 根对象上存放该集合的数组 key，如 `comments` */
  collectionKey: string
  /**
   * 业务上的主键字段名，默认 `id`。
   * 仅作类型/约定展示，本层不自动生成 id、不强制唯一校验。
   */
  idField?: string
}

/** lowdb `data` 在类型上视为「字符串 key → 文档数组」；实际只使用 `collectionKey` 对应那一项。 */
type DbShape<TSchema extends z.ZodObject<z.ZodRawShape>> = Record<
  string,
  InferDoc<TSchema>[]
>

export interface Model<TSchema extends z.ZodObject<z.ZodRawShape>> {
  readonly schema: TSchema
  readonly fileName: string
  readonly collectionKey: string
  readonly idField: string

  /** 与 `fileName` 对应的 lowdb 单例；持久化在 `db.update` 内改 `data[collectionKey]` */
  getDb: () => Promise<Low<DbShape<TSchema>>>

  /**
   * 仅针对 `collectionKey` 下**数组**做 `cloneDeep` 后再 `_.chain`（`CollectionChain`）。
   * 链上结果不落盘；写库必须用 `getDb().update`。
   *
   * 类型上把数组标成 `List<Doc>`，避免 `chain(数组)` 被 lodash 重载解析成 `ObjectChain`。
   */
  lodashChain: () => Promise<_.CollectionChain<InferDoc<TSchema>>>
}

/**
 * 集合模型：适用于「多行记录、根上为数组」的 JSON。
 * 若整文件只有一个配置对象（无「集合 key」），请用 `createObject`。
 */
export function createModel<TSchema extends z.ZodObject<z.ZodRawShape>>(
  options: CreateModelOptions<TSchema>
): Model<TSchema> {
  const { schema, fileName, collectionKey, idField = 'id' } = options

  type Doc = InferDoc<TSchema>

  /** 首次建库时只有空数组；种子数据需在业务层首次 `update` 写入。 */
  const defaultData = { [collectionKey]: [] } as Record<string, Doc[]>

  async function openDb(): Promise<Low<Record<string, Doc[]>>> {
    return getJsonDb<Record<string, Doc[]>>(fileName, defaultData as Record<string, Doc[]>)
  }

  /** 读出集合数组；若被损坏成非数组则先修正为空数组再返回。 */
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
