import type { APIRoute } from 'astro'
import { hasAdminToken } from '../../../lib/admin-token-db'

export const prerender = false

export const GET: APIRoute = async () => {
  const hasToken = await hasAdminToken()
  return new Response(
    JSON.stringify({ hasToken }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
