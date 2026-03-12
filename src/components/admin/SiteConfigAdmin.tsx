import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

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
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editItem, setEditItem] = useState<EditFormData | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!editItem) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [editItem])

  const handleSave = async () => {
    if (!editItem) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editItem),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || '保存失败')
        return
      }
      setEditItem(null)
      setIsNew(false)
      load()
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
      load()
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
    if (!editItem || editItem.type !== 'json') return
    try {
      const parsed = JSON.parse(editItem.value)
      setEditItem({ ...editItem, value: JSON.stringify(parsed, null, 2) })
    } catch {
      setError('JSON 格式无效，无法格式化')
    }
  }

  const closeModal = () => {
    setEditItem(null)
    setIsNew(false)
    setError('')
  }

  const modalEl =
    typeof document !== 'undefined' &&
    editItem &&
    createPortal(
      <div className="config-modal-overlay" onClick={closeModal} role="presentation">
        <div className="config-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="config-modal-header">
            <span className="comment-symbol">{isNew ? '+ 新建配置' : '✎ 编辑配置'}</span>
            <button type="button" className="config-modal-close" onClick={closeModal}>×</button>
          </div>
          <div className="config-modal-body">
            <div className="config-field">
              <label className="config-label">配置键</label>
              <input
                type="text"
                value={editItem.key}
                onChange={(e) => setEditItem({ ...editItem, key: e.target.value })}
                disabled={!isNew}
                placeholder="例如: adminNav"
              />
            </div>
            <div className="config-field">
              <label className="config-label">类型</label>
              <select
                value={editItem.type}
                onChange={(e) => setEditItem({ ...editItem, type: e.target.value as 'string' | 'json' })}
              >
                <option value="string">字符串</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div className="config-field">
              <label className="config-label">
                值
                {editItem.type === 'json' && (
                  <button type="button" className="config-format-btn" onClick={formatJson}>
                    格式化
                  </button>
                )}
              </label>
              <textarea
                value={editItem.value}
                onChange={(e) => setEditItem({ ...editItem, value: e.target.value })}
                rows={editItem.type === 'json' ? 12 : 3}
                placeholder={editItem.type === 'json' ? '输入有效的 JSON' : '输入配置值'}
                className={editItem.type === 'json' ? 'config-json-input' : ''}
              />
            </div>
            <div className="config-field">
              <label className="config-label">描述（可选）</label>
              <input
                type="text"
                value={editItem.description || ''}
                onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                placeholder="配置说明"
              />
            </div>
            {error && <p className="comment-error">{error}</p>}
            <div className="config-actions">
              <button type="button" className="comment-submit" onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
              <button type="button" className="config-cancel-btn" onClick={closeModal}>
                取消
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )

  return (
    <div className="comment-admin">
      <div className="comment-block-title"># 站点配置</div>

      <div className="comment-admin-toolbar" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <button type="button" className="comment-submit" onClick={openNew}>
          新建配置
        </button>
        <button type="button" className="comment-submit" onClick={load} disabled={loading} style={{ marginLeft: 'auto' }}>
          {loading ? '加载中...' : '刷新'}
        </button>
      </div>

      {error && !editItem ? <p className="comment-error">{error}</p> : null}

      {loading ? (
        <p className="comment-muted">加载中...</p>
      ) : configs.length === 0 ? (
        <p className="comment-muted">暂无配置</p>
      ) : (
        <ul className="comment-admin-list">
          {configs.map((item) => {
            const valueStr = displayValue(item.value)
            return (
              <li key={item.key} className="comment-admin-item">
                <div className="comment-admin-item-meta">
                  <span className="comment-symbol config-key">{item.key}</span>
                  <span className={`config-type config-type-${item.type}`}>
                    {item.type === 'json' ? 'JSON' : 'STR'}
                  </span>
                  {item.description && (
                    <>
                      <span className="comment-sep">·</span>
                      <span className="comment-muted">{item.description}</span>
                    </>
                  )}
                </div>
                <div className="config-value-preview">
                  <code>{valueStr.length > 80 ? valueStr.slice(0, 80) + '...' : valueStr}</code>
                </div>
                <div className="comment-admin-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="comment-admin-approve" onClick={() => openEdit(item)}>
                    编辑
                  </button>
                  <button type="button" className="comment-admin-delete" onClick={() => handleDelete(item.key)}>
                    删除
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {modalEl}
    </div>
  )
}
