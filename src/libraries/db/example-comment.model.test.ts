import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { clearJsonDbCache } from './connection.js'
import {
  EXAMPLE_COMMENT_DB_FILE,
  exampleCommentCountAndExists,
  exampleCommentCreate,
  exampleCommentDeleteManyByPost,
  exampleCommentDeleteOne,
  exampleCommentFindApprovedSortedLimited,
  exampleCommentFindById,
  exampleCommentFindOneApproved,
  exampleCommentFindQueryChain,
  exampleCommentInsertMany,
  exampleCommentLodashChain,
  exampleCommentLodashChainWithPredicate,
  exampleCommentRawLowdbUpdate,
  exampleCommentUpdateMany,
  exampleCommentUpdateOne,
  runCommentModelExamples,
} from './example-comment.model.js'

function dataPath(): string {
  return join(process.cwd(), 'data', EXAMPLE_COMMENT_DB_FILE)
}

function resetExampleDbFile(): void {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const p = dataPath()
  clearJsonDbCache()
  writeFileSync(p, JSON.stringify({ comments: [] }, null, 0), 'utf8')
  clearJsonDbCache()
}

describe('example-comment.model（lowdb + lodash + lodashChain）', () => {
  beforeEach(() => {
    resetExampleDbFile()
  })

  afterAll(() => {
    resetExampleDbFile()
  })

  it('create：生成 id 且字段合法', async () => {
    const doc = await exampleCommentCreate()
    expect(doc.id).toBeTruthy()
    expect(doc.status).toBe('pending')
    expect(doc.author).toBe('alice')
  })

  it('findById / findOne（lodash chain）', async () => {
    const doc = await exampleCommentCreate()
    const byId = await exampleCommentFindById(doc.id)
    expect(byId?.id).toBe(doc.id)

    const one = await exampleCommentFindOneApproved()
    expect(one).toBeNull()

    await exampleCommentUpdateOne(doc.id)
    const one2 = await exampleCommentFindOneApproved()
    expect(one2?.status).toBe('approved')
  })

  it('insertMany 与 count / exists', async () => {
    await exampleCommentInsertMany()
    const { total, approved, hasBob } = await exampleCommentCountAndExists()
    expect(total).toBe(2)
    expect(approved).toBe(1)
    expect(hasBob).toBe(true)
  })

  it('lodashChain：filter / orderBy / take', async () => {
    await exampleCommentInsertMany()
    const list = await exampleCommentFindQueryChain()
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((c) => c.postId === 'demo-post' && c.status === 'pending')).toBe(true)
  })

  it('lodashChain：filter / sort / take 限制条数', async () => {
    await exampleCommentInsertMany()
    const approved = await exampleCommentFindApprovedSortedLimited()
    expect(approved.length).toBeLessThanOrEqual(5)
    expect(approved.every((c) => c.status === 'approved')).toBe(true)
  })

  it('updateOne / updateMany', async () => {
    const doc = await exampleCommentCreate()
    const r1 = await exampleCommentUpdateOne(doc.id)
    expect(r1.matched).toBe(true)
    expect(r1.modified).toBe(true)

    await exampleCommentInsertMany()
    const r2 = await exampleCommentUpdateMany()
    expect(r2.matched).toBeGreaterThan(0)
  })

  it('deleteOne / deleteMany', async () => {
    const doc = await exampleCommentCreate()
    expect(await exampleCommentDeleteOne(doc.id)).toBe(true)

    await exampleCommentInsertMany()
    const n = await exampleCommentDeleteManyByPost('demo-post')
    expect(n).toBeGreaterThan(0)
  })

  it('lodash.chain：map / uniq / filter', async () => {
    await exampleCommentInsertMany()
    const { uniqueAuthors, firstThreeContents } = await exampleCommentLodashChain()
    expect(Array.isArray(uniqueAuthors)).toBe(true)
    expect(Array.isArray(firstThreeContents)).toBe(true)

    const ids = await exampleCommentLodashChainWithPredicate()
    expect(Array.isArray(ids)).toBe(true)
  })

  it('getDb 手写 update 写入合法文档', async () => {
    const t = Date.now()
    const doc = {
      id: `raw_${t}`,
      postId: 'raw-post',
      author: 'raw',
      content: 'raw push',
      status: 'approved' as const,
      createdAt: t,
    }
    await exampleCommentRawLowdbUpdate(doc)
    const found = await exampleCommentFindById(doc.id)
    expect(found?.content).toBe('raw push')
  })

  it('runCommentModelExamples 整段流程可完成', async () => {
    const result = await runCommentModelExamples()
    expect(result.createdId).toBeTruthy()
    expect(typeof result.queryListLength).toBe('number')
    expect(result.counts.total).toBeGreaterThan(0)
    expect(Array.isArray(result.chainResult.uniqueAuthors)).toBe(true)
  })
})
