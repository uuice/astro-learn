import { createSignal, onMount, For, Show } from 'solid-js'

interface ShortLinkItem {
  id: string
  slug: string
  url: string
  createdAt: number
}

export default function ShortlinksAdmin() {
  const [list, setList] = createSignal<ShortLinkItem[]>([])
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal('')
  const [url, setUrl] = createSignal('')
  const [slug, setSlug] = createSignal('')
  const [addLoading, setAddLoading] = createSignal(false)

  const load = async () => {
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
  }

  onMount(() => {
    void load()
  })

  const addLink = async (useCustomSlug: boolean) => {
    const targetUrl = url().trim()
    if (!targetUrl) {
      setError('请输入目标 URL')
      return
    }
    setError('')
    setAddLoading(true)
    try {
      const body =
        useCustomSlug && slug().trim()
          ? { url: targetUrl, slug: slug().trim() }
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
    <div class="comment-admin">
      <div class="comment-block-title"># 短链接管理</div>

      <div class="comment-admin-toolbar" style="flex-wrap:wrap;gap:0.5rem;">
        <input
          type="text"
          value={url()}
          onInput={(e) => setUrl(e.currentTarget.value)}
          placeholder="目标 URL"
          class="comment-admin-input"
          style="min-width:12rem;"
        />
        <input
          type="text"
          value={slug()}
          onInput={(e) => setSlug(e.currentTarget.value)}
          placeholder="自定义短码（留空自动生成）"
          class="comment-admin-input"
          style="min-width:10rem;"
        />
        <button
          type="button"
          class="comment-submit"
          onClick={() => addLink(false)}
          disabled={addLoading()}
        >
          {addLoading() ? '添加中...' : '生成短链接'}
        </button>
        <Show when={slug().trim()}>
          <button
            type="button"
            class="comment-submit"
            onClick={() => addLink(true)}
            disabled={addLoading()}
            style={{ opacity: 0.9 }}
          >
            使用自定义短码
          </button>
        </Show>
        <button
          type="button"
          class="comment-submit"
          onClick={() => void load()}
          disabled={loading()}
        >
          {loading() ? '加载中...' : '刷新'}
        </button>
      </div>

      <Show when={error()}>
        {(message) => <p class="comment-error">{message()}</p>}
      </Show>

      {list().length === 0 && !loading() ? (
        <p class="comment-muted">暂无短链接</p>
      ) : list().length > 0 ? (
        <ul class="comment-admin-list">
          <For each={list()}>
            {(s) => {
              return (
                <li class="comment-admin-item">
                  <div class="comment-admin-item-meta">
                    <span class="comment-symbol">/s/{s.slug}</span>
                    <span class="comment-sep">→</span>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="comment-admin-post"
                      style="word-break:break-all;"
                    >
                      {s.url}
                    </a>
                    <span class="comment-sep">·</span>
                    <span class="comment-date">{formatDate(s.createdAt)}</span>
                  </div>
                  <div
                    class="comment-admin-actions"
                    style={{ display: 'flex', gap: '0.5rem' }}
                  >
                    <button
                      type="button"
                      class="comment-admin-approve"
                      onClick={() => copyShortUrl(s)}
                    >
                      复制
                    </button>
                    <button
                      type="button"
                      class="comment-admin-delete"
                      onClick={() => remove(s.id)}
                    >
                      删除
                    </button>
                  </div>
                </li>
              )
            }}
          </For>
        </ul>
      ) : null}
    </div>
  )
}
