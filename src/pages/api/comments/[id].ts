import type { APIRoute } from 'astro'
import { deleteComment, approveComment } from '../../../lib/comments-db'

export const prerender = false

function checkAuth(url: URL): boolean {
  const token = url.searchParams.get('token')
  const adminToken = import.meta.env.ADMIN_TOKEN || ''
  return !!(token && adminToken && token === adminToken)
}

export const DELETE: APIRoute = async ({ params, url }) => {
  if (!checkAuth(url)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  const id = params.id
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })
  }
  const ok = await deleteComment(id)
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Comment not found' }), { status: 404 })
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const PATCH: APIRoute = async ({ params, url }) => {
  if (!checkAuth(url)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  const id = params.id
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })
  }
  const ok = await approveComment(id)
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Comment not found' }), { status: 404 })
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
