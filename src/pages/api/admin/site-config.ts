import type { APIRoute } from 'astro'
import { getAllConfigs, getConfig, setConfig, deleteConfig, type ConfigItem } from '../../../lib/admin-site-config-db'
import { checkAdminSession, unauthorizedResponse } from '../../../lib/admin-auth'

export const prerender = false

export const GET: APIRoute = async ({ session, url }) => {
  if (!(await checkAdminSession(session))) {
    return unauthorizedResponse()
  }
  const key = url.searchParams.get('key')
  if (key) {
    const config = await getConfig(key)
    if (!config) {
      return new Response(JSON.stringify({ error: '配置不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ data: config }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const configs = await getAllConfigs()
  return new Response(JSON.stringify({ data: configs }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request, session }) => {
  if (!(await checkAdminSession(session))) {
    return unauthorizedResponse()
  }
  try {
    const body = await request.json() as ConfigItem
    if (!body.key || typeof body.key !== 'string') {
      return new Response(JSON.stringify({ error: '配置键不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (body.type !== 'string' && body.type !== 'json') {
      return new Response(JSON.stringify({ error: '配置类型无效' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    let finalValue: unknown = body.value
    if (body.type === 'json' && typeof body.value === 'string') {
      try {
        finalValue = JSON.parse(body.value)
      } catch {
        return new Response(JSON.stringify({ error: 'JSON 格式无效' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
    await setConfig({
      key: body.key.trim(),
      value: finalValue,
      type: body.type,
      description: body.description?.trim(),
    })
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: '请求格式错误' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const DELETE: APIRoute = async ({ url, session }) => {
  if (!(await checkAdminSession(session))) {
    return unauthorizedResponse()
  }
  const key = url.searchParams.get('key')
  if (!key) {
    return new Response(JSON.stringify({ error: '缺少配置键' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const deleted = await deleteConfig(key)
  if (!deleted) {
    return new Response(JSON.stringify({ error: '配置不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
