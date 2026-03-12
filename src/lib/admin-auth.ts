import type { AstroGlobal } from 'astro'

type Session = AstroGlobal['session']

export async function checkAdminSession(session: Session): Promise<boolean> {
  const isLoggedIn = await session?.get('adminLoggedIn')
  return !!isLoggedIn
}

export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
