import type { APIRoute } from 'astro'
import { getCommentsByPostId, addComment, getAllComments } from '../../../lib/comments-db'

export const prerender = false

export const GET: APIRoute = async ({ url }) => {
  const postId = url.searchParams.get('postId')
  const token = url.searchParams.get('token')
  const adminToken = import.meta.env.ADMIN_TOKEN || ''
  if (postId) {
    const comments = await getCommentsByPostId(postId)
    return new Response(JSON.stringify({ data: comments }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (token && adminToken && token === adminToken) {
    const comments = await getAllComments()
    return new Response(JSON.stringify({ data: comments }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return new Response(JSON.stringify({ error: 'Missing postId or invalid token' }), { status: 400 })
}

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get('content-type')?.includes('application/json') === false) {
    return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), { status: 400 })
  }
  let body: { postId?: string; parentId?: string; author?: string; email?: string; content?: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }
  const { postId, parentId, author, content } = body
  if (!postId || !author?.trim() || !content?.trim()) {
    return new Response(JSON.stringify({ error: 'postId, author and content are required' }), { status: 400 })
  }
  const comment = await addComment({
    postId: String(postId),
    parentId: parentId ? String(parentId).slice(0, 50) : undefined,
    author: author.trim().slice(0, 100),
    email: body.email?.trim().slice(0, 200) || undefined,
    content: content.trim().slice(0, 2000),
    status: 'pending',
  })
  return new Response(JSON.stringify({ data: comment }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}
