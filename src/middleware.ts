import { defineMiddleware, sequence } from "astro:middleware"

const adminAuth = defineMiddleware(async (context, next) => {
  const { pathname } = context.url

  // 只处理 /admin 页面路由，排除 /api/admin API 路由
  if (pathname.startsWith('/admin') && !pathname.startsWith('/api/')) {
    const isLoggedIn = await context.session?.get('adminLoggedIn')
    console.log(`[middleware] pathname: ${pathname}, isLoggedIn: ${isLoggedIn}, session exists: ${!!context.session}`)

    if (pathname === '/admin/login') {
      if (isLoggedIn) {
        console.log('[middleware] redirecting to /admin (already logged in)')
        return context.redirect('/admin')
      }
    } else {
      if (!isLoggedIn) {
        console.log('[middleware] redirecting to /admin/login (not logged in)')
        return context.redirect('/admin/login')
      }
    }
  }

  return next()
})

export const onRequest = sequence(adminAuth)
