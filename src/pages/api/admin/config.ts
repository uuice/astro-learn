import type { APIRoute } from 'astro'
import { getConfig } from '../../../lib/config-db'

export const prerender = false

export const GET: APIRoute = async () => {
  const config = await getConfig()
  return new Response(
    JSON.stringify({ hasToken: !!(config.adminToken && config.adminToken.length > 0) }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
