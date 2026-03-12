import type { APIRoute } from 'astro'
import { deleteShortlink } from '../../../../lib/shortlinks-db'
import { checkAdminSession, unauthorizedResponse } from '../../../../lib/admin-auth'

export const prerender = false

export const DELETE: APIRoute = async ({ params, session }) => {
  if (!(await checkAdminSession(session))) {
    return unauthorizedResponse()
  }
  const id = params.id
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })
  }
  const ok = await deleteShortlink(id)
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Shortlink not found' }), { status: 404 })
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
