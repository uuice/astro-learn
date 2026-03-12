import type { APIRoute } from 'astro'
import { getAllComments } from '../../../lib/comments-db'
import { checkAdminSession, unauthorizedResponse } from '../../../lib/admin-auth'

export const prerender = false

export const GET: APIRoute = async ({ session }) => {
  if (!(await checkAdminSession(session))) {
    return unauthorizedResponse()
  }
  const comments = await getAllComments()
  return new Response(JSON.stringify({ data: comments }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
