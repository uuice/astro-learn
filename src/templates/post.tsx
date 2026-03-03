import { formatDate } from '@utils/index'

export interface PostTemplateProps {
  id: string
  title: string
  created_time?: string
  updated_time?: string
}

export function PostTemplate({ id, title, created_time, updated_time }: PostTemplateProps) {
  const currentTime = formatDate()

  return `---
id: ${id}
title: ${title}
cover:
created_time: ${created_time || currentTime}
updated_time: ${updated_time || currentTime}
categories:
tags:
excerpt:
published: true
---

`
}
