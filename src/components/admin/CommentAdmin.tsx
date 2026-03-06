import { useState, useEffect, useCallback } from 'react'

const TOKEN_KEY = 'comment_admin_token'

function getStoredToken(): string {
  if (typeof sessionStorage === 'undefined') return ''
  try {
    return sessionStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

interface CommentItem {
  id: string
  postId: string
  parentId?: string
  author: string
  email?: string
  content: string
  status: string
  createdAt: number
}

export default function CommentAdmin() {
  const [token, setToken] = useState('')
  const [list, setList] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setToken(getStoredToken())
    const onSaved = () => setToken(getStoredToken())
    window.addEventListener('admin-token-saved', onSaved)
    return () => window.removeEventListener('admin-token-saved', onSaved)
  }, [])

  const load = useCallback(async () => {
    const t = getStoredToken().trim()
    if (!t) {
      setError('请先在顶部输入 Token 并保存')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/comments?token=${encodeURIComponent(t)}`)
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
    if (getStoredToken().trim()) load()
  }, [load])

  const remove = async (id: string) => {
    const t = getStoredToken().trim()
    if (!t) return
    try {
      const res = await fetch(`/api/comments/${id}?token=${encodeURIComponent(t)}`, { method: 'DELETE' })
      if (res.ok) setList((prev) => prev.filter((c) => c.id !== id))
    } catch {}
  }

  const approve = async (id: string) => {
    const t = getStoredToken().trim()
    if (!t) return
    try {
      const res = await fetch(`/api/comments/${id}?token=${encodeURIComponent(t)}`, { method: 'PATCH' })
      if (res.ok) setList((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'approved' as const } : c)))
    } catch {}
  }

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN')
  }

  return (
    <div className="comment-admin">
      <div className="comment-block-title"># 评论管理</div>
      <div className="comment-admin-toolbar">
        <button type="button" className="comment-submit" onClick={load} disabled={loading}>
          {loading ? '加载中...' : '加载'}
        </button>
      </div>
      {error ? <p className="comment-error">{error}</p> : null}
      {!token.trim() ? <p className="comment-muted">请先在顶部输入 Token 并保存</p> : null}
      {list.length === 0 && !loading && token.trim() ? (
        <p className="comment-muted">暂无数据</p>
      ) : list.length > 0 ? (
        <ul className="comment-admin-list">
          {list.map((c) => (
            <li key={c.id} className="comment-admin-item">
              <div className="comment-admin-item-meta">
                <span className="comment-symbol">@</span> {c.author}
                {c.email ? <span className="comment-email"> &lt;{c.email}&gt;</span> : null}
                <span className="comment-sep">·</span>
                <span className="comment-date">{formatDate(c.createdAt)}</span>
                <span className="comment-sep">·</span>
                <span className={`comment-admin-status comment-admin-status-${c.status}`}>
                  {c.status === 'pending' ? '待审核' : '已通过'}
                </span>
                <span className="comment-sep">·</span>
                <span className="comment-admin-post">{c.postId}</span>
              </div>
              {c.parentId ? <span className="comment-admin-parent">回复 {c.parentId}</span> : null}
              <div className="comment-item-content">{c.content}</div>
              <div className="comment-admin-actions">
                {c.status === 'pending' ? (
                  <button type="button" className="comment-admin-approve" onClick={() => approve(c.id)}>
                    通过
                  </button>
                ) : null}
                <button type="button" className="comment-admin-delete" onClick={() => remove(c.id)}>
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
