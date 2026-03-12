import type { APIRoute } from 'astro'
import { getAllShortlinks, addShortlink } from '../../../lib/shortlinks-db'
import { checkAdminSession, unauthorizedResponse } from '../../../lib/admin-auth'

export const prerender = false

export const GET: APIRoute = async ({ session }) => {
  if (!(await checkAdminSession(session))) {
    return unauthorizedResponse()
  }
  const list = await getAllShortlinks()
  return new Response(JSON.stringify({ data: list }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request, session }) => {
  if (!(await checkAdminSession(session))) {
    return unauthorizedResponse()
  }
  if (request.headers.get('content-type')?.includes('application/json') === false) {
    return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
      status: 400,
    })
  }
  let body: { slug?: string; url?: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }
  const { slug, url: targetUrl } = body
  if (!targetUrl?.trim()) {
    return new Response(JSON.stringify({ error: 'url is required' }), { status: 400 })
  }
  try {
    const link = slug?.trim()
      ? await addShortlink({ slug: slug.trim(), url: targetUrl.trim() })
      : await addShortlink({ url: targetUrl.trim() })
    return new Response(JSON.stringify({ data: link }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to add shortlink'
    return new Response(JSON.stringify({ error: msg }), { status: 400 })
  }
}
