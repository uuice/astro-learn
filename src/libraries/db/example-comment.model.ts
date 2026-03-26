/**
 * 评论集合示例（数据在 `data/comments-orm-example.json`，与业务 `comments.json` 隔离）。
 * 约定：增删改查通过 `getDb().update` + lodash；只读聚合用 `lodashChain()`。
 */
import { z } from 'zod'
import { createModel } from './model.js'

export const CommentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  parentId: z.string().optional(),
  author: z.string(),
  email: z.string().optional(),
  content: z.string(),
  status: z.enum(['pending', 'approved']),
  createdAt: z.number(),
})

export const EXAMPLE_COMMENT_DB_FILE = 'comments-orm-example.json'

export const CommentModel = createModel({
  schema: CommentSchema,
  fileName: EXAMPLE_COMMENT_DB_FILE,
  collectionKey: 'comments',
  idField: 'id',
})

function newId() {
  return `_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

// ─── 增 ─────────────────────────────────────────────────────────────

export async function exampleCommentCreate() {
  const doc = CommentModel.schema.parse({
    id: newId(),
    postId: 'demo-post',
    author: 'alice',
    email: 'alice@example.com',
    content: '这是一条示例评论',
    status: 'pending',
    createdAt: Date.now(),
  })
  const db = await CommentModel.getDb()
  await db.update((data) => {
    const list = data.comments
    if (!Array.isArray(list)) {
      data.comments = [doc]
      return
    }
    list.push(doc)
  })
  return doc
}

export async function exampleCommentInsertMany() {
  const t = Date.now()
  const docs = [
    CommentModel.schema.parse({
      id: newId(),
      postId: 'demo-post',
      author: 'bob',
      content: '批量 1',
      status: 'pending',
      createdAt: t,
    }),
    CommentModel.schema.parse({
      id: newId(),
      postId: 'demo-post',
      author: 'carol',
      content: '批量 2',
      status: 'approved',
      createdAt: t + 1,
    }),
  ]
  const db = await CommentModel.getDb()
  await db.update((data) => {
    const list = data.comments
    if (!Array.isArray(list)) {
      data.comments = [...docs]
      return
    }
    list.push(...docs)
  })
  return docs
}

// ─── 查（lodash chain）──────────────────────────────────────────────

export async function exampleCommentFindById(id: string) {
  const ch = await CommentModel.lodashChain()
  return ch.find({ id } as z.infer<typeof CommentSchema>).value() ?? null
}

export async function exampleCommentFindOneApproved() {
  const ch = await CommentModel.lodashChain()
  return ch.find({ postId: 'demo-post', status: 'approved' }).value() ?? null
}

/** 已审核：按时间倒序，最多 5 条 */
export async function exampleCommentFindApprovedSortedLimited() {
  const ch = await CommentModel.lodashChain()
  return ch.filter({ status: 'approved' }).orderBy(['createdAt'], ['desc']).take(5).value()
}

/** 过滤 + 排序 + 分页 */
export async function exampleCommentFindQueryChain() {
  const ch = await CommentModel.lodashChain()
  return ch
    .filter((c) => c.postId === 'demo-post' && c.status === 'pending')
    .orderBy(['createdAt'], ['desc'])
    .take(20)
    .value()
}

export async function exampleCommentCountAndExists() {
  const rows = (await CommentModel.lodashChain()).value()
  const total = rows.length
  const approved = rows.filter((c) => c.status === 'approved').length
  const hasBob = rows.some((c) => c.author === 'bob')
  return { total, approved, hasBob }
}

export async function exampleCommentLodashChain() {
  const ch = await CommentModel.lodashChain()
  const uniqueAuthors = ch
    .filter({ postId: 'demo-post' })
    .orderBy(['createdAt'], ['desc'])
    .map('author')
    .uniq()
    .value()

  const ch2 = await CommentModel.lodashChain()
  const firstThreeContents = ch2
    .filter({ postId: 'demo-post' })
    .orderBy(['createdAt'], ['desc'])
    .map('content')
    .take(3)
    .value()

  return { uniqueAuthors, firstThreeContents }
}

export async function exampleCommentLodashChainWithPredicate() {
  const ch = await CommentModel.lodashChain()
  return ch
    .filter((c) => c.status === 'pending')
    .map('id')
    .value()
}

// ─── 改 ─────────────────────────────────────────────────────────────

export async function exampleCommentUpdateOne(id: string) {
  const db = await CommentModel.getDb()
  let matched = false
  let modified = false
  await db.update((data) => {
    const list = data.comments
    if (!Array.isArray(list)) return
    const idx = list.findIndex((c) => c.id === id)
    if (idx === -1) return
    matched = true
    const prev = JSON.stringify(list[idx])
    const next = { ...list[idx], status: 'approved' as const }
    if (prev !== JSON.stringify(next)) {
      modified = true
      list[idx] = CommentModel.schema.parse(next)
    }
  })
  return { matched, modified }
}

export async function exampleCommentUpdateMany() {
  const db = await CommentModel.getDb()
  let matched = 0
  let modified = 0
  await db.update((data) => {
    const list = data.comments
    if (!Array.isArray(list)) return
    for (let i = 0; i < list.length; i++) {
      const c = list[i]
      if (c.postId !== 'demo-post' || c.status !== 'pending') continue
      matched++
      const next = { ...c, status: 'approved' as const }
      if (JSON.stringify(c) !== JSON.stringify(next)) {
        modified++
        list[i] = CommentModel.schema.parse(next)
      }
    }
  })
  return { matched, modified }
}

// ─── 删 ─────────────────────────────────────────────────────────────

export async function exampleCommentDeleteOne(id: string) {
  const db = await CommentModel.getDb()
  let deleted = false
  await db.update((data) => {
    const list = data.comments
    if (!Array.isArray(list)) return
    const idx = list.findIndex((c) => c.id === id)
    if (idx === -1) return
    list.splice(idx, 1)
    deleted = true
  })
  return deleted
}

export async function exampleCommentDeleteManyByPost(postId: string) {
  const db = await CommentModel.getDb()
  let count = 0
  await db.update((data) => {
    const list = data.comments
    if (!Array.isArray(list)) return
    const next = list.filter((c) => c.postId !== postId)
    count = list.length - next.length
    data.comments = next
  })
  return count
}

// ─── lowdb 手写 push（与 create 类似）──────────────────────────────────

export async function exampleCommentRawLowdbUpdate(validDoc: z.infer<typeof CommentSchema>) {
  const parsed = CommentModel.schema.parse(validDoc)
  const db = await CommentModel.getDb()
  await db.update((data) => {
    const list = data.comments
    if (!Array.isArray(list)) {
      data.comments = []
      return
    }
    list.push(parsed)
  })
  return parsed
}

export async function runCommentModelExamples() {
  const created = await exampleCommentCreate()
  await exampleCommentInsertMany()

  const list = await exampleCommentFindQueryChain()
  const counts = await exampleCommentCountAndExists()
  const chainResult = await exampleCommentLodashChain()
  const ids = await exampleCommentLodashChainWithPredicate()

  await exampleCommentUpdateOne(created.id)
  const updateManyResult = await exampleCommentUpdateMany()

  await exampleCommentDeleteOne(created.id)
  const deletedN = await exampleCommentDeleteManyByPost('demo-post')

  return {
    createdId: created.id,
    queryListLength: list.length,
    counts,
    chainResult,
    pendingIdsSample: ids,
    updateManyResult,
    deletedManyCount: deletedN,
  }
}
