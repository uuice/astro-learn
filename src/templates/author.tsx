import { formatDate } from '@utils/index'

export interface AuthorTemplateProps {
  id: string
  title: string
  created_time?: string
  updated_time?: string
}

export function AuthorTemplate({ id, title, created_time, updated_time }: AuthorTemplateProps) {
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
