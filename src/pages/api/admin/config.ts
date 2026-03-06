import type { APIRoute } from 'astro'
import { getConfig, setAdminToken } from '../../../lib/config-db'

export const prerender = false

export const GET: APIRoute = async () => {
  const config = await getConfig()
  return new Response(
    JSON.stringify({ hasToken: !!(config.adminToken && config.adminToken.length > 0) }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

export const POST: APIRoute = async ({ request }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), { status: 400 })
  }
  let body: { token?: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }
  const token = body.token?.trim()
  if (!token) {
    return new Response(JSON.stringify({ error: 'token is required' }), { status: 400 })
  }
  const ok = await setAdminToken(token)
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Token already set' }), { status: 409 })
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
