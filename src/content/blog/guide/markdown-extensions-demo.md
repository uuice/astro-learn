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
excerpt: 展示 Admonitions、GitHub 卡片、Details、Tabs、Steps、Quote 等 Markdown 扩展的用法。
created_time: 2026-03-04
updated_time: 2026-03-04
published: true
---

本文展示新增的 Markdown 扩展：Admonitions、GitHub 卡片、Details 折叠块、Tabs 分页、Steps 步骤、Quote 引用。

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

:::
github{repo="uuice/astro-learn"}
:::

## Details 折叠块

:::details 点击展开

这里是被折叠的内容。支持多段文字、列表等。

:::

或使用属性：`:::details{summary="自定义标题"}`

## Tabs 分页

:::tabs
:::tab{name="JavaScript"}
```js
console.log('Hello')
```
:::
:::tab{name="TypeScript"}
```ts
const x: string = 'Hello'
```
:::
:::

## Steps 步骤

:::steps

安装依赖 `pnpm install`

配置环境变量

启动项目 `pnpm dev`

:::

## Quote 带来源引用

:::quote{author="某某" source="《书名》"}

这是一段引用内容，下方会显示作者与出处。

:::
