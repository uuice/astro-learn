import pinyinModule from 'pinyin'
const pinyin = typeof pinyinModule === 'function' ? pinyinModule : (pinyinModule as { default: typeof pinyinModule }).default
import lodash from 'lodash'
const { escapeRegExp } = lodash
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid'


// CLI 专用的 namespace UUID
export const DEFAULT_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'

// 默认作者相关常量
export const DEFAULT_AUTHOR_ALIAS = 'default'


// 生成随机 UUID (v4)
export function generateUUID(): string {
  return uuidv4()
}

// 生成基于名称的 UUID (v5) - 支持 namespace
export function generateNamespaceUUID(name: string, namespace?: string): string {
  return uuidv5(name, namespace || DEFAULT_NAMESPACE)
}


// 生成文章 ID（基于标题或别名）
export function generatePostId(title: string, alias?: string): string {
  const seed = alias || title
  return generateNamespaceUUID(`post:${seed}`)
}


// 生成页面 ID（基于标题或别名）
export function generatePageId(title: string, alias?: string): string {
  const seed = alias || title
  return generateNamespaceUUID(`page:${seed}`)
}

// 生成作者 ID（基于名称）
export function generateAuthorId(name: string): string {
  return generateNamespaceUUID(`author:${name}`)
}

export function generateCategoryId(title: string): string {
  return generateNamespaceUUID(`category:${title}`)
}

export function generateTagId(title: string): string {
  return generateNamespaceUUID(`tag:${title}`)
}

// 格式化日期
export function formatDate(date?: Date): string {
  const d = date || new Date()
  return d.toISOString().split('T')[0] + ' ' + d.toTimeString().split(' ')[0]
}

// 中文转拼音用于 URL
export function titleToUrl(title: string): string {
  if (!title) return 'untitled'

  // 检查是否包含中文字符
  if (/[\u4e00-\u9fa5]/.test(title)) {
    // 使用 pinyin 库将中文转换为拼音，按字符逐一转换
    const pinyinResult = pinyin(title, {
      style: pinyin.STYLE_NORMAL, // 普通风格，不带声调
      segment: true, // 启用分词
      heteronym: false // 不返回多音字的所有读音
    })

    // 将拼音数组扁平化并用连字符连接
    let url = pinyinResult.flat().join('-')

    // 处理中英文混合的情况，在中文字符和英文字符之间添加连字符
    url = url
      .replace(/([a-zA-Z0-9]+)/g, (match, p1) => {
        // 保持数字字母组合的完整性
        return p1.toLowerCase()
      })
      .replace(/[^a-zA-Z0-9\s-]/g, '') // 移除特殊字符，保留字母、数字、空格和连字符
      .replace(/\s+/g, '-')           // 空格转连字符
      .replace(/-+/g, '-')            // 多个连字符合并为一个
      .replace(/^-|-$/g, '')          // 移除开头和结尾的连字符
      .toLowerCase()

    return url || 'untitled'
  } else {
    // 如果没有中文，直接处理英文
    return title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-')           // 空格转连字符
      .replace(/-+/g, '-')            // 多个连字符合并为一个
      .replace(/^-|-$/g, '')          // 移除开头和结尾的连字符
      .trim() || 'untitled'
  }
}

// 统计符号数量
export function symbolsCount(text: string): number {
// Remove HTML tags
const strippedText = text.replace(/<[^>]+>/g, '')

// Remove whitespace and invisible characters
const cleanedText = strippedText.replace(
  /[\s\u200b-\u200f\u2028-\u202f\u205f-\u206f\ufeff]+/g,
  ''
)
// Count the number of characters in the cleaned text
return cleanedText.length
}

// 提取摘要
export function generateExcerpt(content: string, maxLength: number = 200): string {
  const stripped = content.replace(/<[^>]*>/g, '') // 移除 HTML 标签
  return stripped.length > maxLength ?
    stripped.substring(0, maxLength) + '...' :
    stripped
}


/**
 * Highlight matched keyword in text with <mark> tag
 */
function highlightText(text: string, keyword: string): string {
  if (!text || !keyword) return text
  const pattern = keyword.split(/\s+/).filter(Boolean).map(escapeRegExp).join('|')
  return text.replace(new RegExp(pattern, 'gi'), (match) => `<mark>${match}</mark>`)
} 

