import { createSignal, onMount, For, Show } from 'solid-js'

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
  const [list, setList] = createSignal<CommentItem[]>([])
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal('')

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/comments')
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
  }

  onMount(() => {
    void load()
  })

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' })
      if (res.ok) setList((prev) => prev.filter((c) => c.id !== id))
    } catch {}
  }

  const approve = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/comments/${id}`, { method: 'PATCH' })
      if (res.ok) setList((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'approved' as const } : c)))
    } catch {}
  }

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN')
  }

  return (
    <div class="comment-admin">
      <div class="comment-block-title"># 评论管理</div>
      <div class="comment-admin-toolbar">
        <button type="button" class="comment-submit" onClick={load} disabled={loading()}>
          {loading() ? '加载中...' : '刷新'}
        </button>
      </div>
      <Show when={error()}>{(message) => <p class="comment-error">{message()}</p>}</Show>
      {list().length === 0 && !loading() ? (
        <p class="comment-muted">暂无数据</p>
      ) : list().length > 0 ? (
        <ul class="comment-admin-list">
          <For each={list()}>{(c) => (
            <li class="comment-admin-item">
              <div class="comment-admin-item-meta">
                <span class="comment-symbol">@</span> {c.author}
                {c.email ? <span class="comment-email"> &lt;{c.email}&gt;</span> : null}
                <span class="comment-sep">·</span>
                <span class="comment-date">{formatDate(c.createdAt)}</span>
                <span class="comment-sep">·</span>
                <span class={`comment-admin-status comment-admin-status-${c.status}`}>
                  {c.status === 'pending' ? '待审核' : '已通过'}
                </span>
                <span class="comment-sep">·</span>
                <span class="comment-admin-post">{c.postId}</span>
              </div>
              {c.parentId ? <span class="comment-admin-parent">回复 {c.parentId}</span> : null}
              <div class="comment-item-content">{c.content}</div>
              <div class="comment-admin-actions">
                {c.status === 'pending' ? (
                  <button type="button" class="comment-admin-approve" onClick={() => approve(c.id)}>
                    通过
                  </button>
                ) : null}
                <button type="button" class="comment-admin-delete" onClick={() => remove(c.id)}>
                  删除
                </button>
              </div>
            </li>
          )}</For>
        </ul>
      ) : null}
    </div>
  )
}
