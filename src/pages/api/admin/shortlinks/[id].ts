import type { APIRoute } from 'astro'
import { deleteShortlink } from '../../../../lib/shortlinks-db'
import { getAdminToken } from '../../../../lib/config-db'

export const prerender = false

async function checkAuth(url: URL): Promise<boolean> {
  const token = url.searchParams.get('token')
  const adminToken = await getAdminToken()
  return !!(token && adminToken && token === adminToken)
}

export const DELETE: APIRoute = async ({ params, url }) => {
  if (!(await checkAuth(url))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
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
