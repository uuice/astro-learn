---
id: b2c3d4e5-f6a7-8901-bcde-f12345678901
title: Markdown 扩展展示
alias: markdown-extensions-demo
categories:
  - 指南
tags:
  - Markdown
  - 扩展
  - directive
excerpt: 展示 Admonitions 提示框与 GitHub 仓库卡片的用法。
created_time: 2026-03-04
updated_time: 2026-03-04
published: true
---

本文展示新增的 Markdown 扩展：Admonitions 提示框 与 GitHub 仓库卡片。

## Admonitions 提示框

支持 `:::type` 或 GitHub 风格 `> [!TYPE]`。

### :::note

:::note
这是一段普通说明。
:::

### :::tip

:::tip
实用建议或小技巧。
:::

### :::important

:::important
重要信息强调。
:::

### :::caution

:::caution
需要留意的内容。
:::

### :::warning

:::warning
警示性内容。
:::

## GitHub 仓库卡片

与 Admonitions 相同的块形式（三行之间可加空行，与 Admonitions 一致）：

:::
github{repo="uuice/astro-learn"}
:::
