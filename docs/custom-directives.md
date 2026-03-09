# Custom Markdown Directives

本项目的 Markdown / MDX 通过 **rehype-custom-directives** 一个插件，在 HTML 阶段统一处理 **Admonitions（提示框）** 和 **GitHub 仓库卡片**。

---

## Remark 和 Rehype 的区别

| 阶段 | 插件类型 | 处理的树 | 说明 |
|------|----------|----------|------|
| **Remark** | 工作在 **mdast**（Markdown AST） | 节点是 `paragraph`、`heading`、`text`、`emphasis` 等 Markdown 结构 | 在「Markdown 解析后、转成 HTML 前」运行，适合做基于段落/标题的替换、注入等。 |
| **Rehype** | 工作在 **hast**（HTML AST） | 节点是 `element`（如 `<p>`、`<div>`、`<blockquote>`）和 `text` | 在「已转成 HTML 树」后运行，适合基于标签和 DOM 结构的替换、增强。 |

**本项目的选择**：只使用 **rehype-custom-directives**，在 hast 上统一识别「看起来像指令的段落/块」（如 `<p>:::note</p>`、`<p>github{repo="..."}</p>`、`<blockquote>` 等），并替换为 Admonition 或 GitHub 卡片。这样逻辑集中在一个插件里，避免与 remark 重复，也便于维护；`rehype-raw` 仍保留，用于解析 Markdown 里可能存在的原始 HTML。

**流程简述**：Markdown 字符串 → 解析为 mdast → 转为 hast → **rehype-raw**（解析 raw HTML）→ **rehype-custom-directives**（识别指令并替换）→ 其他 rehype 插件 → 输出 HTML。

---

## 1. Admonitions（提示框）

支持两种写法：**块语法 `:::type`** 与 **GitHub 风格引用 `> [!TYPE]`**。

### 1.1 块语法 `:::type`

**类型**：`note` | `tip` | `important` | `caution` | `warning`。

**多行块（推荐）**：首行 `:::type`，中间内容，末行 `:::`。

```markdown
:::note
这是一段普通说明。
:::

:::tip
实用建议或小技巧。
:::

:::warning
警示性内容。
:::
```

**单段落**：同一段内写 `:::type 内容 :::` 也可识别。

```markdown
:::important 重要信息强调。 :::
```

中间可包含多段、列表、代码等；空行会拆成多个段落，均会保留在提示框内。

### 1.2 GitHub 风格 `> [!TYPE]`

与 GitHub Flavored Markdown 的 alert 语法一致：

```markdown
> [!NOTE]
> 这是一段普通说明。

> [!WARNING]
> 警示性内容。
```

`TYPE` 不区分大小写，支持：`NOTE`、`TIP`、`IMPORTANT`、`CAUTION`、`WARNING`。

### 1.3 样式类名

- 容器：`admonition admonition-{type}`，非 `note` 时追加 `bdm-{type}`（如 `bdm-tip`）。
- 标题：`bdm-title`。
- 具体样式见 `src/assets/styles/global.css` 中 `.admonition` 相关规则。

---

## 2. GitHub 仓库卡片

将 `owner/repo` 渲染为一块可点击的卡片（`.card-github`），展示仓库名、描述、stars/forks、语言等；数据来自 GitHub API，构建时拉取。

### 2.1 块形式（与 Admonitions 一致）

三行块：首行 `:::`，第二行 `github{repo="owner/repo"}`，第三行 `:::`。

```markdown
:::
github{repo="uuice/astro-learn"}
:::
```

**空行**：三行之间可以有空行，插件会跳过空段落再匹配，例如：

```markdown
:::

github{repo="uuice/astro-learn"}

:::
```

**单段落**：若三行被解析成一段（无空行时某些解析器会这样），也会识别为同一指令并渲染卡片。

### 2.2 单行形式（可选）

```markdown
::github{repo="owner/repo"}
```

仅当该行单独成段且未被当作代码（例如不在反引号内）时生效。

### 2.3 引号与格式

- `repo=` 后的值支持直引号 `"` 与弯引号 `"` `"`。
- 允许 `repo="owner/repo"` 或 `repo = "owner/repo"` 等少量空格。

### 2.4 卡片结构及样式

- 根元素：`<a class="card-github no-styling">`，失败时增加 `fetch-error`。
- 内部：`.gc-titlebar`（含 `.gc-owner`、`.gc-avatar`、`.gc-repo`）、`.gc-description`、`.gc-infobar`。
- 样式见 `src/assets/styles/global.css` 中 `.card-github` 及 `.gc-*`。
- API 失败时仍会输出可点击的占位卡片，文案为 “Unable to load repo info. Click to open.” 等。

---

## 3. 文件位置与配置

| 文件 | 说明 |
|------|------|
| `src/plugins/rehype-custom-directives.mjs` | 唯一自定义指令实现：Admonitions + GitHub 卡片（含 GitHub API 与 HAST 构建） |
| `astro.config.mjs` | `rehypeRaw`、`rehypeCustomDirectives` 的注册（markdown 与 MDX 共用） |
| `src/assets/styles/global.css` | `.admonition`、`.card-github`、`.gc-*` 等样式 |

更多示例可参考：`src/content/blog/guide/markdown-extensions-demo.md`。
