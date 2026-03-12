export interface AdminNavItem {
  title: string
  url: string
}

export const adminNav: AdminNavItem[] = [
  { title: '评论', url: '/admin/comments' },
  { title: '数据', url: '/admin/content' },
  { title: '短链接', url: '/admin/shortlinks' },
]
