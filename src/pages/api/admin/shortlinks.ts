import type { APIRoute } from 'astro'
import { getAllShortlinks, addShortlink } from '../../../lib/shortlinks-db'
import { getAdminToken } from '../../../lib/config-db'

export const prerender = false

async function checkToken(url: URL): Promise<string | null> {
  const token = url.searchParams.get('token')
  const adminToken = await getAdminToken()
  if (!token || !adminToken || token !== adminToken) return null
  return token
}

export const GET: APIRoute = async ({ url }) => {
  const token = await checkToken(url)
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  const list = await getAllShortlinks()
  return new Response(JSON.stringify({ data: list }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request, url }) => {
  const token = url.searchParams.get('token')
  const adminToken = await getAdminToken()
  if (!token || !adminToken || token !== adminToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
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
