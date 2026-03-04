export function stripMarkdown(md: string): string {
  if (!md || typeof md !== 'string') return ''
  let s = md
  s = s.replace(/```[\s\S]*?```/g, ' ')
  s = s.replace(/`[^`]+`/g, ' ')
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  s = s.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
  s = s.replace(/^#+\s+/gm, ' ')
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1')
  s = s.replace(/__([^_]+)__/g, '$1')
  s = s.replace(/\*([^*]+)\*/g, '$1')
  s = s.replace(/_([^_]+)_/g, '$1')
  s = s.replace(/~~([^~]+)~~/g, '$1')
  s = s.replace(/^\s*[-*+]\s+/gm, ' ')
  s = s.replace(/^\s*\d+\.\s+/gm, ' ')
  s = s.replace(/^\s*>/gm, ' ')
  s = s.replace(/\n+/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  return s
}
