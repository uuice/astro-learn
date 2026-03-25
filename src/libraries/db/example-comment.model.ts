/**
 * 评论集合 ORM 示例（数据写入 `data/comments-orm-example.json`，与业务 `comments.json` 隔离）。
 * 以下为「用法说明 + 可调用示例函数」，按需 `import { exampleCommentCreate, ... }` 在脚本或路由里试跑。
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

/** 与测试共用，便于重置 `data/` 下文件 */
export const EXAMPLE_COMMENT_DB_FILE = 'comments-orm-example.json'

export const CommentModel = createModel({
  schema: CommentSchema,
  fileName: EXAMPLE_COMMENT_DB_FILE,
  collectionKey: 'comments',
  idField: 'id',
})

/*
 * ─── 增删改查与链式调用（摘录）────────────────────────────────────────
 *
 * 增
 *   await CommentModel.create({ postId, author, content, status: 'pending', createdAt: Date.now() })
 *   await CommentModel.insertMany([{ ... }, { ... }])
 *
 * 查
 *   await CommentModel.findById(id)
 *   await CommentModel.findOne({ postId: 'x', status: 'approved' })
 *   await CommentModel.find({ status: 'pending' }, { limit: 5 })
 *   await CommentModel.find({ postId: 'x' }).sort({ createdAt: -1 }).skip(0).limit(10)
 *   await CommentModel.countDocuments({ status: 'approved' })
 *   await CommentModel.exists({ author: 'bob' })
 *
 * 改
 *   await CommentModel.updateOne({ id }, { status: 'approved' })
 *   await CommentModel.updateMany({ postId: 'x' }, { status: 'approved' })
 *
 * 删
 *   await CommentModel.deleteOne({ id })
 *   await CommentModel.deleteMany({ postId: 'x' })
 *
 * lodash.chain（先执行查询，再对结果数组链式处理）
 *   const ch = await CommentModel.find({ status: 'pending' }).sort({ createdAt: -1 }).chain()
 *   const authors = ch.map('author').uniq().value()
 *
 * lowdb 单例（绕过 Model，直接改 JSON 根对象）
 *   const db = await CommentModel.getDb()
 *   await db.update((data) => { data.comments.push({ ... }) })
 */

// ─── 增 ─────────────────────────────────────────────────────────────

/** 创建一条待审核评论（id 自动生成） */
export async function exampleCommentCreate() {
  return CommentModel.create({
    postId: 'demo-post',
    author: 'alice',
    email: 'alice@example.com',
    content: '这是一条示例评论',
    status: 'pending',
    createdAt: Date.now(),
  })
}

/** 批量插入多条评论 */
export async function exampleCommentInsertMany() {
  const t = Date.now()
  return CommentModel.insertMany([
    {
      postId: 'demo-post',
      author: 'bob',
      content: '批量 1',
      status: 'pending',
      createdAt: t,
    },
    {
      postId: 'demo-post',
      author: 'carol',
      content: '批量 2',
      status: 'approved',
      createdAt: t + 1,
    },
  ])
}

// ─── 查 ─────────────────────────────────────────────────────────────

/** 按 id 查一条 */
export async function exampleCommentFindById(id: string) {
  return CommentModel.findById(id)
}

/** findOne：单条匹配 */
export async function exampleCommentFindOne() {
  return CommentModel.findOne({ postId: 'demo-post', status: 'approved' })
}

/**
 * ModelQuery 链式：where → sort → skip → limit，再 await 取数组
 */
export async function exampleCommentFindQueryChain() {
  return CommentModel.find({ postId: 'demo-post' })
    .where({ status: 'pending' })
    .sort({ createdAt: -1 })
    .skip(0)
    .limit(20)
}

/** 第二参数传初始分页（与链式 skip/limit 二选一组合使用） */
export async function exampleCommentFindWithInitialOptions() {
  return CommentModel.find({ status: 'approved' }, { sort: { createdAt: -1 }, limit: 5 })
}

/** count / exists */
export async function exampleCommentCountAndExists() {
  const total = await CommentModel.countDocuments()
  const approved = await CommentModel.countDocuments({ status: 'approved' })
  const hasBob = await CommentModel.exists({ author: 'bob' })
  return { total, approved, hasBob }
}

// ─── lodash.chain ────────────────────────────────────────────────────

/**
 * 先执行查询，再对结果用 `lodash.chain`：map / uniq / take / value
 */
export async function exampleCommentLodashChain() {
  const wrapped = await CommentModel.find({ postId: 'demo-post' })
    .sort({ createdAt: -1 })
    .chain()

  const uniqueAuthors = wrapped.map('author').uniq().value()
  const firstThreeContents = wrapped.map('content').take(3).value()
  return { uniqueAuthors, firstThreeContents }
}

/**
 * 过滤后再 map（iteratee 函数形式）
 */
export async function exampleCommentLodashChainWithPredicate() {
  const wrapped = await CommentModel.find().chain()
  const pendingIds = wrapped
    .filter((c) => c.status === 'pending')
    .map('id')
    .value()
  return pendingIds
}

// ─── 改 ─────────────────────────────────────────────────────────────

/** 按条件改一条 */
export async function exampleCommentUpdateOne(id: string) {
  return CommentModel.updateOne({ id }, { status: 'approved' })
}

/** 按条件批量改 */
export async function exampleCommentUpdateMany() {
  return CommentModel.updateMany({ postId: 'demo-post', status: 'pending' }, { status: 'approved' })
}

// ─── 删 ─────────────────────────────────────────────────────────────

/** 删一条 */
export async function exampleCommentDeleteOne(id: string) {
  return CommentModel.deleteOne({ id })
}

/** 按条件批量删（谨慎） */
export async function exampleCommentDeleteManyByPost(postId: string) {
  return CommentModel.deleteMany({ postId })
}

// ─── lowdb 单例 update ───────────────────────────────────────────────

/**
 * 直接使用 lowdb：与 Model 共用同一 `getDb()` 单例，适合自定义原子写入。
 * 若手写对象，需自行满足 CommentSchema 字段。
 */
export async function exampleCommentRawLowdbUpdate(validDoc: z.infer<typeof CommentSchema>) {
  const db = await CommentModel.getDb()
  await db.update((data) => {
    const list = data.comments
    if (!Array.isArray(list)) {
      data.comments = []
      return
    }
    list.push(validDoc)
  })
  return validDoc
}

// ─── 一键跑通（可选，用于本地脚本调试）────────────────────────────────

/** 顺序演示：插入 → 查询链 → 更新 → lodash chain → 删除（使用上面创建的 id） */
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
