import { useState, useEffect, useCallback } from 'react'

interface ShortLinkItem {
  id: string
  slug: string
  url: string
  createdAt: number
}

export default function ShortlinksAdmin() {
  const [list, setList] = useState<ShortLinkItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [url, setUrl] = useState('')
  const [slug, setSlug] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/shortlinks')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || '加载失败')
        setList([])
        return
      }
      setList(json.data || [])
    } catch {
      setError('网络错误')
      setList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addLink = async (useCustomSlug: boolean) => {
    const targetUrl = url.trim()
    if (!targetUrl) {
      setError('请输入目标 URL')
      return
    }
    setError('')
    setAddLoading(true)
    try {
      const body = useCustomSlug && slug.trim()
        ? { url: targetUrl, slug: slug.trim() }
        : { url: targetUrl }
      const res = await fetch('/api/admin/shortlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || '添加失败')
        return
      }
      setList((prev) => [json.data, ...prev])
      setUrl('')
      setSlug('')
    } catch {
      setError('网络错误')
    } finally {
      setAddLoading(false)
    }
  }

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/shortlinks/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) setList((prev) => prev.filter((s) => s.id !== id))
    } catch {}
  }

  const copyShortUrl = (s: ShortLinkItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const shortUrl = `${origin}/s/${s.slug}`
    navigator.clipboard?.writeText(shortUrl).catch(() => {})
  }

  const formatDate = (ts: number) => new Date(ts).toLocaleString('zh-CN')

  return (
    <div className="comment-admin">
      <div className="comment-block-title"># 短链接管理</div>

      <div className="comment-admin-toolbar" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="目标 URL"
          className="comment-admin-input"
          style={{ minWidth: '12rem' }}
        />
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="自定义短码（留空自动生成）"
          className="comment-admin-input"
          style={{ minWidth: '10rem' }}
        />
        <button
          type="button"
          className="comment-submit"
          onClick={() => addLink(false)}
          disabled={addLoading}
        >
          {addLoading ? '添加中...' : '生成短链接'}
        </button>
        {slug.trim() ? (
          <button
            type="button"
            className="comment-submit"
            onClick={() => addLink(true)}
            disabled={addLoading}
            style={{ opacity: 0.9 }}
          >
            使用自定义短码
          </button>
        ) : null}
        <button type="button" className="comment-submit" onClick={load} disabled={loading}>
          {loading ? '加载中...' : '刷新'}
        </button>
      </div>

      {error ? <p className="comment-error">{error}</p> : null}

      {list.length === 0 && !loading ? (
        <p className="comment-muted">暂无短链接</p>
      ) : list.length > 0 ? (
        <ul className="comment-admin-list">
          {list.map((s) => {
            const shortUrl =
              typeof window !== 'undefined'
                ? `${window.location.origin}/s/${s.slug}`
                : `/s/${s.slug}`
            return (
              <li key={s.id} className="comment-admin-item">
                <div className="comment-admin-item-meta">
                  <span className="comment-symbol">/s/{s.slug}</span>
                  <span className="comment-sep">→</span>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="comment-admin-post"
                    style={{ wordBreak: 'break-all' }}
                  >
                    {s.url}
                  </a>
                  <span className="comment-sep">·</span>
                  <span className="comment-date">{formatDate(s.createdAt)}</span>
                </div>
                <div className="comment-admin-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="comment-admin-approve"
                    onClick={() => copyShortUrl(s)}
                  >
                    复制
                  </button>
                  <button
                    type="button"
                    className="comment-admin-delete"
                    onClick={() => remove(s.id)}
                  >
                    删除
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
