import type { APIRoute } from 'astro'
import { getAdminToken, setAdminToken } from '../../../lib/admin-token-db'

export const prerender = false

export const POST: APIRoute = async ({ request, session }) => {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), { status: 400 })
  }
  let body: { token?: string; isSetup?: boolean }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const token = body.token?.trim()
  if (!token) {
    return new Response(JSON.stringify({ error: 'token is required' }), { status: 400 })
  }

  const adminToken = await getAdminToken()

  if (body.isSetup) {
    if (adminToken) {
      return new Response(JSON.stringify({ error: 'Token already set' }), { status: 409 })
    }
    const ok = await setAdminToken(token)
    if (!ok) {
      return new Response(JSON.stringify({ error: 'Failed to set token' }), { status: 500 })
    }
    await session?.set('adminLoggedIn', true)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!adminToken || token !== adminToken) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 })
  }

  await session?.set('adminLoggedIn', true)
  console.log('[login] session set adminLoggedIn=true, session exists:', !!session)
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
