import {
  createSignal,
  createMemo,
  createEffect,
  For,
  Show,
  type JSX,
} from 'solid-js'

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
  const [list, setList] = createSignal<CommentItem[]>([])
  const [loading, setLoading] = createSignal(true)
  const [author, setAuthor] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [content, setContent] = createSignal('')
  const [parentId, setParentId] = createSignal<string | null>(null)
  const [replyToAuthor, setReplyToAuthor] = createSignal<string | null>(null)
  const [submitting, setSubmitting] = createSignal(false)
  const [error, setError] = createSignal('')
  const [pendingNotice, setPendingNotice] = createSignal(false)

  const fetchComments = async () => {
    try {
      const res = await fetch(
        `/api/comments?postId=${encodeURIComponent(postId)}`,
      )
      const json = await res.json()
      if (res.ok) setList(json.data || [])
    } catch {
      setList([])
    } finally {
      setLoading(false)
    }
  }

  createEffect(() => {
    postId
    void fetchComments()
  })

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError('')
    if (!author().trim() || !content().trim()) {
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
          parentId: parentId() || undefined,
          author: author().trim(),
          email: email().trim() || undefined,
          content: content().trim(),
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
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const tree = createMemo(() => buildTree(list()))
  const authorMap = createMemo(
    () => new Map(list().map((c) => [c.id, c.author])),
  )

  const renderNode = (node: TreeNode): JSX.Element => {
    const c = node.comment
    const parentAuthor = c.parentId ? authorMap().get(c.parentId) : null
    return (
      <li class={`comment-thread${c.parentId ? ' comment-item-reply' : ''}`}>
        <div class="comment-item">
          <div class="comment-item-meta">
            {c.author}
            {c.email ? (
              <span class="comment-email">
                {' '}
                <span>&lt;</span>
                {c.email}
                <span>&gt;</span>
              </span>
            ) : null}
            {parentAuthor ? (
              <span class="comment-reply-to"> 回复 {parentAuthor}</span>
            ) : null}
            <span class="comment-sep">·</span>
            <span class="comment-date">{formatDate(c.createdAt)}</span>
            <button
              type="button"
              class="comment-reply-btn"
              onClick={() => startReply(c.id, c.author)}
            >
              回复
            </button>
          </div>
          <div class="comment-item-content">{c.content}</div>
        </div>
        <Show when={node.children.length > 0}>
          <ul class="comment-replies">
            <For each={node.children}>{renderNode}</For>
          </ul>
        </Show>
      </li>
    )
  }

  return (
    <div class="comment-block">
      <div class="comment-block-title">评论</div>
      {loading() ? (
        <p class="comment-muted">加载中...</p>
      ) : (
        <ul class="comment-list">
          {tree().length === 0 ? (
            <li class="comment-muted">暂无评论</li>
          ) : (
            <For each={tree()}>{renderNode}</For>
          )}
        </ul>
      )}
      <form onSubmit={handleSubmit} class="comment-form">
        <Show when={pendingNotice()}>
          <p class="comment-pending">评论已提交，待审核后显示</p>
        </Show>
        <Show when={error()}>
          {(message) => <p class="comment-error">{message()}</p>}
        </Show>
        <Show when={replyToAuthor()}>
          <p class="comment-replying">
            回复 {replyToAuthor()}
            <button
              type="button"
              class="comment-cancel-reply"
              onClick={cancelReply}
            >
              取消
            </button>
          </p>
        </Show>
        <div class="comment-form-row">
          <label class="comment-label">昵称</label>
          <input
            type="text"
            class="comment-input"
            value={author()}
            onInput={(e) => setAuthor(e.currentTarget.value)}
            placeholder="必填"
            maxLength={100}
          />
        </div>
        <div class="comment-form-row">
          <label class="comment-label">邮箱</label>
          <input
            type="email"
            class="comment-input"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            placeholder="选填"
            maxLength={200}
          />
        </div>
        <div class="comment-form-row">
          <label class="comment-label">内容</label>
          <textarea
            class="comment-textarea"
            value={content()}
            onInput={(e) => setContent(e.currentTarget.value)}
            placeholder="必填"
            rows={3}
            maxLength={2000}
          />
        </div>
        <button type="submit" class="comment-submit" disabled={submitting()}>
          {submitting() ? '提交中...' : '提交'}
        </button>
      </form>
    </div>
  )
}
