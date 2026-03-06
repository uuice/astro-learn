import { join } from 'node:path'
import { mkdirSync, existsSync } from 'node:fs'
import { JSONFilePreset } from 'lowdb/node'

export type CommentStatus = 'pending' | 'approved'

export interface Comment {
  id: string
  postId: string
  parentId?: string
  author: string
  email?: string
  content: string
  status: CommentStatus
  createdAt: number
}

interface CommentsData {
  comments: Comment[]
}

const defaultData: CommentsData = { comments: [] }

function getDbPath(): string {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, 'comments.json')
}

let dbPromise: Promise<Awaited<ReturnType<typeof JSONFilePreset<CommentsData>>>> | null = null

export async function getCommentsDb() {
  if (!dbPromise) {
    dbPromise = JSONFilePreset<CommentsData>(getDbPath(), defaultData)
  }
  return dbPromise
}

function isApproved(c: Comment): boolean {
  return c.status === 'approved' || (c as Comment & { status?: string }).status === undefined
}

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  const db = await getCommentsDb()
  return db.data.comments
    .filter((c) => c.postId === postId && isApproved(c))
    .sort((a, b) => a.createdAt - b.createdAt)
}

export async function getAllComments(): Promise<Comment[]> {
  const db = await getCommentsDb()
  return [...db.data.comments].sort((a, b) => b.createdAt - a.createdAt)
}

export async function addComment(
  comment: Omit<Comment, 'id' | 'createdAt'> & { status?: CommentStatus }
): Promise<Comment> {
  const db = await getCommentsDb()
  const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const newComment: Comment = {
    ...comment,
    id,
    status: comment.status ?? 'pending',
    createdAt: Date.now(),
  }
  db.data.comments.push(newComment)
  await db.write()
  return newComment
}

export async function deleteComment(id: string): Promise<boolean> {
  const db = await getCommentsDb()
  const idx = db.data.comments.findIndex((c) => c.id === id)
  if (idx === -1) return false
  db.data.comments.splice(idx, 1)
  await db.write()
  return true
}

export async function approveComment(id: string): Promise<boolean> {
  const db = await getCommentsDb()
  const c = db.data.comments.find((x) => x.id === id)
  if (!c) return false
  c.status = 'approved'
  await db.write()
  return true
}
