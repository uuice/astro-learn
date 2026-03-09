---
id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
title: Markdown 语法与样式展示
alias: markdown-demo
categories:
  - 指南
tags:
  - Markdown
  - 语法
  - 样式
excerpt: 本文展示尽可能多的 Markdown 语法和样式，包括标题、段落、列表、代码块、表格、脚注等，便于调试和预览。
created_time: 2026-03-04
updated_time: 2026-03-04
published: true
---

本文用于展示 Markdown 的各类语法及渲染效果。

## 标题 Heading

# H1 一级标题

## H2 二级标题

### H3 三级标题

#### H4 四级标题

##### H5 五级标题

###### H6 六级标题

## 段落与强调 Paragraph & Emphasis

这是普通段落。可以包含多行文本，段落之间用空行分隔。

**粗体 Bold**、_斜体 Italic_、**_粗斜体 Bold Italic_**。

~~删除线 Strikethrough~~。

行内 `code` 代码。

## 列表 List

### 无序列表

- 项目一
- 项目二
  - 子项目 2.1
  - 子项目 2.2
- 项目三

### 有序列表

1. 第一项
2. 第二项
3. 第三项

### 任务列表

- [x] 已完成任务
- [x] 已读文档
- [ ] 待办事项一
- [ ] 待办事项二

## 链接与图片 Link & Image

[文字链接到 Astro](https://astro.build)。

自动链接：https://github.com

图片语法（占位）：

![图片 alt 文本](https://placehold.co/400x200/eee/999?text=Placeholder+Image)

## 引用 Blockquote

> 这是一段引用。
> 可以跨多行。

> 嵌套引用
>
> > 第二层引用

## 分割线 Horizontal Rule

---

## 代码块 Code Block

### JavaScript

```js
function greet(name) {
  return `Hello, ${name}!`
}
console.log(greet('Markdown'))
```

### TypeScript

```ts
interface User {
  id: number
  name: string
}
const user: User = { id: 1, name: 'Alice' }
```

### JSON

```json
{
  "name": "astro-learn",
  "version": "1.0.0"
}
```

### Shell

```bash
pnpm install
pnpm run dev
```

### HTML

```html
<div class="container">
  <p>Hello World</p>
</div>
```

### CSS

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
}
```

### Markdown

```markdown
## Hello

- list item
  **bold**
```

## 表格 Table

| 语法         | 说明     |
| ------------ | -------- |
| `#`          | 一级标题 |
| `##`         | 二级标题 |
| `**text**`   | 粗体     |
| `*text*`     | 斜体     |
| `` `code` `` | 行内代码 |

| 左对齐 |  居中  | 右对齐 |
| :----- | :----: | -----: |
| left   | center |  right |
| a      |   b    |      c |

## 脚注 Footnote

这是一段包含脚注[^1]的文本，还有第二个脚注[^2]。

[^1]: 第一个脚注的内容。

[^2]: 第二个脚注可以写更长的说明，支持多行。

## HTML 标签（若支持）

<details>
<summary>点击展开</summary>

这里是被折叠的内容。

</details>

## 转义字符 Escape

\* 反斜杠转义 \# \[ \] \( \) \! \` \_

## 换行与空格

行尾两个空格  
强制换行。

## 总结

以上涵盖了常用 Markdown 语法：标题、段落、强调、列表、链接、图片、引用、分割线、代码块、表格、任务列表、脚注等。
