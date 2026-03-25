import {
  cloneDeep,
  filter,
  find,
  findIndex,
  matches,
  orderBy,
  remove,
} from 'lodash'
import type { Low } from 'lowdb'
import type { z } from 'zod'
import { getJsonDb } from './connection.js'
import { OrmValidationError } from './errors.js'
import { ModelQuery } from './query.js'
import type { FindOptions, InferDoc } from './types.js'

export type { FindOptions, InferDoc } from './types.js'

export interface CreateModelOptions<TSchema extends z.ZodObject<z.ZodRawShape>> {
  /** Zod 对象 schema，需包含与 idField 对应的主键字段（默认 `id: z.string()`） */
  schema: TSchema
  /** 相对 `data/` 的文件名，如 `comments.json` */
  fileName: string
  /** JSON 根下的数组 key，如 `comments`（与 schema 字段无关） */
  collectionKey: string
  /** 主键字段名，默认 `id` */
  idField?: string
  /** 新建文档时生成主键，未传主键时使用 */
  generateId?: () => string
}

/** 新建文档入参：除主键外必填；主键可省略 */
export type CreateInput<TSchema extends z.ZodObject<z.ZodRawShape>> = Omit<
  InferDoc<TSchema>,
  'id'
> & { id?: string }

type DbShape<TSchema extends z.ZodObject<z.ZodRawShape>> = Record<
  string,
  InferDoc<TSchema>[]
>

/* eslint-disable no-unused-vars -- 接口签名中的参数名仅作文档 */
export interface Model<TSchema extends z.ZodObject<z.ZodRawShape>> {
  readonly schema: TSchema
  readonly fileName: string
  readonly collectionKey: string
  readonly idField: string

  find: (
    filter?: Partial<InferDoc<TSchema>>,
    initialOptions?: FindOptions
  ) => ModelQuery<TSchema>

  /** 同一 JSON 文件的 lowdb 单例，便于 `db.update(data => { ... })` 等链式写法 */
  getDb: () => Promise<Low<DbShape<TSchema>>>

  findOne: (filter: Partial<InferDoc<TSchema>>) => Promise<InferDoc<TSchema> | null>
  findById: (id: string) => Promise<InferDoc<TSchema> | null>
  create: (data: CreateInput<TSchema>) => Promise<InferDoc<TSchema>>
  insertMany: (docs: CreateInput<TSchema>[]) => Promise<InferDoc<TSchema>[]>
  updateOne: (
    filter: Partial<InferDoc<TSchema>>,
    update: Partial<InferDoc<TSchema>>
  ) => Promise<{ matched: boolean; modified: boolean }>
  updateMany: (
    filter: Partial<InferDoc<TSchema>>,
    update: Partial<InferDoc<TSchema>>
  ) => Promise<{ matched: number; modified: number }>
  deleteOne: (filter: Partial<InferDoc<TSchema>>) => Promise<boolean>
  deleteMany: (filter: Partial<InferDoc<TSchema>>) => Promise<number>
  countDocuments: (filter?: Partial<InferDoc<TSchema>>) => Promise<number>
  exists: (filter: Partial<InferDoc<TSchema>>) => Promise<boolean>
}
/* eslint-enable no-unused-vars */

function applyFindOptions<T>(rows: T[], options?: FindOptions): T[] {
  let result = cloneDeep(rows)
  if (options?.sort && Object.keys(options.sort).length > 0) {
    const keys = Object.keys(options.sort)
    const orders = keys.map((k) => (options.sort![k] === -1 ? 'desc' : 'asc'))
    result = orderBy(result, keys, orders)
  }
  const skip = options?.skip ?? 0
  const limit = options?.limit
  if (skip > 0 || limit !== undefined) {
    const end = limit !== undefined ? skip + limit : undefined
    result = result.slice(skip, end)
  }
  return result
}

function wrapZod<TSchema extends z.ZodObject<z.ZodRawShape>>(
  schema: TSchema,
  fn: () => InferDoc<TSchema>
): InferDoc<TSchema> {
  try {
    return schema.parse(fn()) as InferDoc<TSchema>
  } catch (e) {
    if (e && typeof e === 'object' && 'issues' in e) {
      throw new OrmValidationError('Schema validation failed', e as z.ZodError)
    }
    throw e
  }
}

/**
 * 创建「集合」模型：lowdb 单文件 + Zod 校验 + lodash 查询/更新。
 * 用法类似 Mongoose Model（无连接池、无索引，适合本项目的 JSON 存储）。
 *
 * 约定：主键字段默认为 `id`；若使用其它字段名，请同时调整 schema 与 `idField`，
 * 此时 `CreateInput` 仍以 `id` 为可选字段的类型辅助，请以 schema 为准。
 */
export function createModel<TSchema extends z.ZodObject<z.ZodRawShape>>(
  options: CreateModelOptions<TSchema>
): Model<TSchema> {
  const {
    schema,
    fileName,
    collectionKey,
    idField = 'id',
    generateId = () => `_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
  } = options

  type Doc = InferDoc<TSchema>

  const defaultData = { [collectionKey]: [] } as Record<string, Doc[]>
  const partialSchema = schema.partial()

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

  async function writeRows(
    // eslint-disable-next-line no-unused-vars -- 回调类型参数名
    mutate: (rows: Doc[]) => void
  ): Promise<void> {
    const db = await openDb()
    await db.update((data) => {
      const d = data as Record<string, Doc[]>
      if (!Array.isArray(d[collectionKey])) {
        d[collectionKey] = []
      }
      mutate(d[collectionKey] as Doc[])
    })
  }

  async function findImpl(
    filterObj?: Partial<Doc>,
    findOptions?: FindOptions
  ): Promise<Doc[]> {
    const rows = await readRows()
    const matched = filterObj
      ? filter(rows, matches(filterObj as object))
      : rows
    return applyFindOptions(matched, findOptions) as Doc[]
  }

  const model: Model<TSchema> = {
    schema,
    fileName,
    collectionKey,
    idField,

    find(filterObj, initialOptions) {
      return new ModelQuery<TSchema>(findImpl, filterObj, initialOptions)
    },

    getDb: () => openDb() as Promise<Low<DbShape<TSchema>>>,

    async findOne(filterObj) {
      const rows = await readRows()
      const doc = find(rows, matches(filterObj as object))
      return doc ? (cloneDeep(doc) as Doc) : null
    },

    async findById(id) {
      return model.findOne({ [idField]: id } as Partial<Doc>)
    },

    async create(data) {
      const id =
        (data as Record<string, unknown>)[idField] != null
          ? String((data as Record<string, unknown>)[idField])
          : generateId()
      const raw = { ...(data as object), [idField]: id } as Doc
      const doc = wrapZod(schema, () => raw)

      await writeRows((rows) => {
        rows.push(doc)
      })
      return cloneDeep(doc)
    },

    async insertMany(docs) {
      const out: Doc[] = []
      for (const d of docs) {
        const id =
          (d as Record<string, unknown>)[idField] != null
            ? String((d as Record<string, unknown>)[idField])
            : generateId()
        const raw = { ...(d as object), [idField]: id } as Doc
        out.push(wrapZod(schema, () => raw))
      }
      await writeRows((rows) => {
        rows.push(...out)
      })
      return out.map((d) => cloneDeep(d))
    },

    async updateOne(filterObj, update) {
      let matched = false
      let modified = false
      await writeRows((rows) => {
        const idx = findIndex(rows, matches(filterObj as object))
        if (idx === -1) return
        matched = true
        const prev = cloneDeep(rows[idx])
        const merged = { ...rows[idx], ...update } as Doc
        const next = partialSchema.parse(merged) as Doc
        if (JSON.stringify(prev) !== JSON.stringify(next)) {
          modified = true
          rows[idx] = next
        }
      })
      return { matched, modified }
    },

    async updateMany(filterObj, update) {
      let matched = 0
      let modified = 0
      await writeRows((rows) => {
        for (let i = 0; i < rows.length; i++) {
          if (!matches(filterObj as object)(rows[i])) continue
          matched++
          const prev = cloneDeep(rows[i])
          const merged = { ...rows[i], ...update } as Doc
          const next = partialSchema.parse(merged) as Doc
          if (JSON.stringify(prev) !== JSON.stringify(next)) {
            modified++
            rows[i] = next
          }
        }
      })
      return { matched, modified }
    },

    async deleteOne(filterObj) {
      let deleted = false
      await writeRows((rows) => {
        const n = remove(rows, matches(filterObj as object))
        deleted = n.length > 0
      })
      return deleted
    },

    async deleteMany(filterObj) {
      let count = 0
      await writeRows((rows) => {
        const n = remove(rows, matches(filterObj as object))
        count = n.length
      })
      return count
    },

    async countDocuments(filterObj) {
      const rows = await readRows()
      if (!filterObj) return rows.length
      return filter(rows, matches(filterObj as object)).length
    },

    async exists(filterObj) {
      const rows = await readRows()
      return find(rows, matches(filterObj as object)) !== undefined
    },
  }

  return model
}
