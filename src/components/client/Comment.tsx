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

interface TreeNode {
  comment: CommentItem
  children: TreeNode[]
}

function buildTree(list: CommentItem[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []
  for (const c of list) map.set(c.id, { comment: c, children: [] })
  for (const c of list) {
    const node = map.get(c.id)!
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.comment.createdAt - b.comment.createdAt)
    nodes.forEach((n) => sortNodes(n.children))
  }
  sortNodes(roots)
  return roots
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
  const authorMap = new Map(list.map((c) => [c.id, c.author]))

  const renderNode = (node: TreeNode) => {
    const c = node.comment
    const parentAuthor = c.parentId ? authorMap.get(c.parentId) : null
    return (
      <li key={c.id} className={`comment-thread${c.parentId ? ' comment-item-reply' : ''}`}>
        <div className="comment-item">
          <div className="comment-item-meta">
            <span className="sym sym-at">@</span> {c.author}
            {c.email ? (
              <span className="comment-email">
                {' '}
                <span className="sym sym-chevron">&lt;</span>
                {c.email}
                <span className="sym sym-chevron">&gt;</span>
              </span>
            ) : null}
            {parentAuthor ? (
              <span className="comment-reply-to">
                {' '}
                <span className="sym sym-info">回复</span> <span className="sym sym-at">@</span> {parentAuthor}
              </span>
            ) : null}
            <span className="comment-sep">·</span>
            <span className="comment-date">{formatDate(c.createdAt)}</span>
            <button type="button" className="comment-reply-btn" onClick={() => startReply(c.id, c.author)}>
              回复
            </button>
          </div>
          <div className="comment-item-content">{c.content}</div>
        </div>
        {node.children.length > 0 ? (
          <ul className="comment-replies">
            {node.children.map(renderNode)}
          </ul>
        ) : null}
      </li>
    )
  }

  return (
    <div className="comment-block">
      <div className="comment-block-title">
        <span className="sym sym-hash">#</span> <span className="sym sym-keyword">评论</span>
      </div>
      {loading ? (
        <p className="comment-muted">
          <span className="sym sym-comment">//</span> 加载中...
        </p>
      ) : (
        <ul className="comment-list">
          {tree.length === 0 ? (
            <li className="comment-muted">
              <span className="sym sym-comment">//</span> 暂无评论
            </li>
          ) : (
            tree.map(renderNode)
          )}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="comment-form">
        {pendingNotice ? (
          <p className="comment-pending">
            <span className="sym sym-info">[INFO]</span> 评论已提交，待审核后显示
          </p>
        ) : null}
        {error ? <p className="comment-error">{error}</p> : null}
        {replyToAuthor ? (
          <p className="comment-replying">
            <span className="sym sym-info">回复</span> <span className="sym sym-at">@</span> {replyToAuthor}
            <button type="button" className="comment-cancel-reply" onClick={cancelReply}>
              取消
            </button>
          </p>
        ) : null}
        <div className="comment-form-row">
          <label className="comment-label">
            <span className="sym sym-at">@</span> <span className="sym sym-keyword">昵称</span>
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
          <label className="comment-label">
            <span className="sym sym-keyword">邮箱</span>
          </label>
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
          <label className="comment-label">
            <span className="sym sym-comment">内容</span>
          </label>
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
