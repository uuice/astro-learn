import { createSignal, createEffect, onMount, onCleanup, Show, For } from 'solid-js'
import { Portal } from 'solid-js/web'

type ConfigItem = {
  key: string
  value: unknown
  type: 'string' | 'json'
  description?: string
}

type EditFormData = {
  key: string
  value: string
  type: 'string' | 'json'
  description?: string
}

function valueToString(value: unknown, type: 'string' | 'json'): string {
  if (type === 'json') {
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  }
  return String(value ?? '')
}

function displayValue(value: unknown): string {
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

export default function SiteConfigAdmin() {
  const [configs, setConfigs] = createSignal<ConfigItem[]>([])
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal('')
  const [editItem, setEditItem] = createSignal<EditFormData | null>(null)
  const [isNew, setIsNew] = createSignal(false)
  const [saving, setSaving] = createSignal(false)

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/site-config')
      if (!res.ok) throw new Error('加载失败')
      const json = await res.json()
      setConfigs(json.data)
    } catch {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }

  onMount(() => {
    void load()
  })

  createEffect(() => {
    if (!editItem()) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    onCleanup(() => {
      document.body.style.overflow = prev
    })
  })

  const handleSave = async () => {
    const current = editItem()
    if (!current) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(current),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || '保存失败')
        return
      }
      setEditItem(null)
      setIsNew(false)
      void load()
    } catch {
      setError('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm(`确定删除配置 "${key}" 吗？`)) return
    try {
      const res = await fetch(`/api/admin/site-config?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error || '删除失败')
        return
      }
      void load()
    } catch {
      setError('删除失败')
    }
  }

  const openNew = () => {
    setEditItem({ key: '', value: '', type: 'string', description: '' })
    setIsNew(true)
  }

  const openEdit = (item: ConfigItem) => {
    setEditItem({
      key: item.key,
      value: valueToString(item.value, item.type),
      type: item.type,
      description: item.description,
    })
    setIsNew(false)
  }

  const formatJson = () => {
    const current = editItem()
    if (!current || current.type !== 'json') return
    try {
      const parsed = JSON.parse(current.value)
      setEditItem({ ...current, value: JSON.stringify(parsed, null, 2) })
    } catch {
      setError('JSON 格式无效，无法格式化')
    }
  }

  const closeModal = () => {
    setEditItem(null)
    setIsNew(false)
    setError('')
  }

  return (
    <div class="comment-admin">
      <div class="comment-block-title"># 站点配置</div>

      <div class="comment-admin-toolbar" style="flex-wrap:wrap;gap:0.5rem;">
        <button type="button" class="comment-submit" onClick={openNew}>
          新建配置
        </button>
        <button type="button" class="comment-submit" onClick={() => void load()} disabled={loading()} style="margin-left:auto;">
          {loading() ? '加载中...' : '刷新'}
        </button>
      </div>

      <Show when={error() && !editItem()}>
        {(message) => <p class="comment-error">{message()}</p>}
      </Show>

      {loading() ? (
        <p class="comment-muted">加载中...</p>
      ) : configs().length === 0 ? (
        <p class="comment-muted">暂无配置</p>
      ) : (
        <ul class="comment-admin-list">
          <For each={configs()}>{(item) => {
            const valueStr = displayValue(item.value)
            return (
              <li class="comment-admin-item">
                <div class="comment-admin-item-meta">
                  <span class="comment-symbol config-key">{item.key}</span>
                  <span class={`config-type config-type-${item.type}`}>
                    {item.type === 'json' ? 'JSON' : 'STR'}
                  </span>
                  {item.description && (
                    <>
                      <span class="comment-sep">·</span>
                      <span class="comment-muted">{item.description}</span>
                    </>
                  )}
                </div>
                <div class="config-value-preview">
                  <code>{valueStr.length > 80 ? valueStr.slice(0, 80) + '...' : valueStr}</code>
                </div>
                <div class="comment-admin-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" class="comment-admin-approve" onClick={() => openEdit(item)}>
                    编辑
                  </button>
                  <button type="button" class="comment-admin-delete" onClick={() => handleDelete(item.key)}>
                    删除
                  </button>
                </div>
              </li>
            )
          }}</For>
        </ul>
      )}
      <Show when={editItem()}>
        {(current) => (
          <Portal>
            <div class="config-modal-overlay" onClick={closeModal} role="presentation">
              <div class="config-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div class="config-modal-header">
                  <span class="comment-symbol">{isNew() ? '+ 新建配置' : '✎ 编辑配置'}</span>
                  <button type="button" class="config-modal-close" onClick={closeModal}>×</button>
                </div>
                <div class="config-modal-body">
                  <div class="config-field">
                    <label class="config-label">配置键</label>
                    <input
                      type="text"
                      value={current().key}
                      onInput={(e) => setEditItem({ ...current(), key: e.currentTarget.value })}
                      disabled={!isNew()}
                      placeholder="例如: adminNav"
                    />
                  </div>
                  <div class="config-field">
                    <label class="config-label">类型</label>
                    <select
                      value={current().type}
                      onChange={(e) => setEditItem({ ...current(), type: e.currentTarget.value as 'string' | 'json' })}
                    >
                      <option value="string">字符串</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                  <div class="config-field">
                    <label class="config-label">
                      值
                      <Show when={current().type === 'json'}>
                        <button type="button" class="config-format-btn" onClick={formatJson}>
                          格式化
                        </button>
                      </Show>
                    </label>
                    <textarea
                      value={current().value}
                      onInput={(e) => setEditItem({ ...current(), value: e.currentTarget.value })}
                      rows={current().type === 'json' ? 12 : 3}
                      placeholder={current().type === 'json' ? '输入有效的 JSON' : '输入配置值'}
                      class={current().type === 'json' ? 'config-json-input' : ''}
                    />
                  </div>
                  <div class="config-field">
                    <label class="config-label">描述（可选）</label>
                    <input
                      type="text"
                      value={current().description || ''}
                      onInput={(e) => setEditItem({ ...current(), description: e.currentTarget.value })}
                      placeholder="配置说明"
                    />
                  </div>
                  <Show when={error()}>{(message) => <p class="comment-error">{message()}</p>}</Show>
                  <div class="config-actions">
                    <button type="button" class="comment-submit" onClick={handleSave} disabled={saving()}>
                      {saving() ? '保存中...' : '保存'}
                    </button>
                    <button type="button" class="config-cancel-btn" onClick={closeModal}>
                      取消
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Portal>
        )}
      </Show>
    </div>
  )
}
