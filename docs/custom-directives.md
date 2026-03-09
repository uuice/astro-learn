# Custom Markdown Directives

本项目的 Markdown / MDX 使用两个自定义插件，在书写时支持 **Admonitions（提示框）** 和 **GitHub 仓库卡片**，无需额外依赖。

- **remark-custom-directives.mjs**：在 Markdown AST（mdast）阶段识别指令并输出 HTML 或占位结构。
- **rehype-custom-directives.mjs**：在 HTML AST（hast）阶段再次处理（含未在 remark 中替换的段落），并负责拉取 GitHub API、渲染完整的 `card-github` 卡片。

配置见 `astro.config.mjs`：`rehype-raw` 用于解析 remark 输出的原始 HTML，两个 custom-directives 插件在 markdown 与 MDX 的 pipeline 中均已启用。

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

## 3. 处理流程简述

1. **Markdown → mdast**：remark 解析；`remark-custom-directives` 识别上述指令，将 Admonitions 与 GitHub 块替换为对应 HTML（或占位）。
2. **mdast → hast**：Astro 默认的 remark-rehype 转换；remark 输出的原始 HTML 通过 **rehype-raw** 被解析为真正的节点。
3. **hast 处理**：`rehype-custom-directives` 再次扫描段落：
   - 若仍存在 “`:::` + `github{repo="..."}` + `:::`” 的段落（例如来自缓存或未在 remark 中替换），会请求 GitHub API 并生成完整的 `card-github` HAST；
   - 单段内的 GitHub 指令也会被识别并替换为同一卡片结构。

因此无论先经 remark 还是仅经 rehype，最终都能得到正确的 Admonitions 和 GitHub 卡片。

---

## 4. 文件位置与配置

| 文件 | 说明 |
|------|------|
| `src/plugins/remark-custom-directives.mjs` | Admonitions + GitHub 指令的 remark 实现 |
| `src/plugins/rehype-custom-directives.mjs` | Admonitions + GitHub 卡片的 rehype 实现（含 GitHub API 与 HAST 构建） |
| `astro.config.mjs` | `rehypeRaw`、`remarkCustomDirectives`、`rehypeCustomDirectives` 的注册 |
| `src/assets/styles/global.css` | `.admonition`、`.card-github`、`.gc-*` 等样式 |

更多示例可参考：`src/content/blog/guide/markdown-extensions-demo.md`。
