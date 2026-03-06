import { useState, useEffect } from 'react'

export interface CommentItem {
  id: string
  postId: string
  parentId?: string
  author: string
  email?: string
  content: string
  status?: string
  createdAt: number
}

interface CommentProps {
  postId: string
}

function buildTree(list: CommentItem[]): { root: CommentItem; children: CommentItem[] }[] {
  const roots = list.filter((c) => !c.parentId).sort((a, b) => a.createdAt - b.createdAt)
  return roots.map((root) => ({
    root,
    children: list.filter((c) => c.parentId === root.id).sort((a, b) => a.createdAt - b.createdAt),
  }))
}

export default function Comment({ postId }: CommentProps) {
  const [list, setList] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [author, setAuthor] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')
  const [parentId, setParentId] = useState<string | null>(null)
  const [replyToAuthor, setReplyToAuthor] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [pendingNotice, setPendingNotice] = useState(false)

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`)
      const json = await res.json()
      if (res.ok) setList(json.data || [])
    } catch {
      setList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [postId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!author.trim() || !content.trim()) {
      setError('请填写昵称和内容')
      return
    }
    setSubmitting(true)
    setPendingNotice(false)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          parentId: parentId || undefined,
          author: author.trim(),
          email: email.trim() || undefined,
          content: content.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || '提交失败')
        return
      }
      setAuthor('')
      setEmail('')
      setContent('')
      setParentId(null)
      setReplyToAuthor(null)
      setPendingNotice(true)
      setTimeout(() => setPendingNotice(false), 5000)
      await fetchComments()
    } catch {
      setError('网络错误')
    } finally {
      setSubmitting(false)
    }
  }

  const startReply = (id: string, authorName: string) => {
    setParentId(id)
    setReplyToAuthor(authorName)
  }

  const cancelReply = () => {
    setParentId(null)
    setReplyToAuthor(null)
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const tree = buildTree(list)

  return (
    <div className="comment-block">
      <div className="comment-block-title"># 评论</div>
      {loading ? (
        <p className="comment-muted">加载中...</p>
      ) : (
        <ul className="comment-list">
          {tree.length === 0 ? (
            <li className="comment-muted">暂无评论</li>
          ) : (
            tree.map(({ root, children }) => (
              <li key={root.id} className="comment-thread">
                <div className="comment-item">
                  <div className="comment-item-meta">
                    <span className="comment-symbol">@</span> {root.author}
                    {root.email ? <span className="comment-email"> &lt;{root.email}&gt;</span> : null}
                    <span className="comment-sep">·</span>
                    <span className="comment-date">{formatDate(root.createdAt)}</span>
                    <button type="button" className="comment-reply-btn" onClick={() => startReply(root.id, root.author)}>
                      回复
                    </button>
                  </div>
                  <div className="comment-item-content">{root.content}</div>
                </div>
                {children.length > 0 ? (
                  <ul className="comment-replies">
                    {children.map((c) => (
                      <li key={c.id} className="comment-item comment-item-reply">
                        <div className="comment-item-meta">
                          <span className="comment-symbol">@</span> {c.author}
                          {c.email ? <span className="comment-email"> &lt;{c.email}&gt;</span> : null}
                          <span className="comment-reply-to"> 回复 @ {root.author}</span>
                          <span className="comment-sep">·</span>
                          <span className="comment-date">{formatDate(c.createdAt)}</span>
                          <button type="button" className="comment-reply-btn" onClick={() => startReply(root.id, c.author)}>
                            回复
                          </button>
                        </div>
                        <div className="comment-item-content">{c.content}</div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))
          )}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="comment-form">
        {pendingNotice ? <p className="comment-pending">评论已提交，待审核后显示</p> : null}
        {error ? <p className="comment-error">{error}</p> : null}
        {replyToAuthor ? (
          <p className="comment-replying">
            回复 @ {replyToAuthor}
            <button type="button" className="comment-cancel-reply" onClick={cancelReply}>
              取消
            </button>
          </p>
        ) : null}
        <div className="comment-form-row">
          <label className="comment-label">
            <span className="comment-symbol">@</span> 昵称
          </label>
          <input
            type="text"
            className="comment-input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="必填"
            maxLength={100}
          />
        </div>
        <div className="comment-form-row">
          <label className="comment-label">邮箱</label>
          <input
            type="email"
            className="comment-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="选填"
            maxLength={200}
          />
        </div>
        <div className="comment-form-row">
          <label className="comment-label">内容</label>
          <textarea
            className="comment-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="必填"
            rows={3}
            maxLength={2000}
          />
        </div>
        <button type="submit" className="comment-submit" disabled={submitting}>
          {submitting ? '提交中...' : '提交'}
        </button>
      </form>
    </div>
  )
}
