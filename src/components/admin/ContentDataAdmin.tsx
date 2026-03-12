import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

type ContentData = {
  posts: { id: string; data: Record<string, unknown> }[]
  pages: { id: string; data: Record<string, unknown> }[]
  authors: { id: string; data: Record<string, unknown> }[]
}

type Tab = 'posts' | 'pages' | 'authors'

const TABS: { key: Tab; label: string }[] = [
  { key: 'posts', label: '文章' },
  { key: 'pages', label: '页面' },
  { key: 'authors', label: '作者' },
]

export default function ContentDataAdmin() {
  const [data, setData] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('posts')
  const [detail, setDetail] = useState<{ id: string; data: Record<string, unknown> } | null>(null)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/content')
      if (!res.ok) throw new Error('加载失败')
      const json = await res.json()
      setData(json)
    } catch {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const list = data ? data[tab] : []
  const columns = tab === 'posts' ? ['title', 'url', 'published'] : tab === 'pages' ? ['title', 'alias', 'url'] : ['title', 'url']

  useEffect(() => {
    if (!detail) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [detail])

  const modalEl =
    typeof document !== 'undefined' &&
    detail &&
    createPortal(
      <div className="content-admin-modal-overlay" onClick={() => setDetail(null)} role="presentation">
        <div className="content-admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="content-admin-modal-header">
            <span>详情</span>
            <button type="button" className="content-admin-modal-close" onClick={() => setDetail(null)}>
              关闭
            </button>
          </div>
          <pre className="content-admin-modal-body">{JSON.stringify(detail, null, 2)}</pre>
        </div>
      </div>,
      document.body
    )

  if (loading) return <p className="content-admin-muted">加载中...</p>
  if (error) return <p className="content-admin-error">{error}</p>
  if (!data) return null

  return (
    <div className="content-data-admin">
      <div className="content-admin-tabs" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`content-admin-tab${tab === key ? ' content-admin-tab-active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label} ({data[key].length})
          </button>
        ))}
        <button
          type="button"
          className="comment-submit"
          onClick={load}
          disabled={loading}
          style={{ marginLeft: 'auto' }}
        >
          {loading ? '加载中...' : '刷新'}
        </button>
      </div>
      <div className="content-admin-table-wrap">
        <table className="content-admin-table">
          <thead>
            <tr>
              <th>id</th>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
              <th style={{ width: '80px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => (
              <tr key={row.id} onClick={() => setDetail(row)} className="content-admin-row">
                <td className="content-admin-id">{row.id}</td>
                {columns.map((col) => (
                  <td key={col}>{(row.data as Record<string, unknown>)[col]?.toString() ?? '-'}</td>
                ))}
                <td className="content-admin-detail-btn">详情</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalEl}
    </div>
  )
}
