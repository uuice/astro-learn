---
name: astro-learn-dev
description: Guides development for the Astro-learn blog (Astro 5 SSR + React + MDX + Tailwind). Use when adding features, fixing bugs, or modifying pages, components, API routes, content collections, or admin in this repository.
---

# Astro-learn 项目开发规范

## 技术栈与运行方式

- **框架**: Astro 5，`output: 'server'`，适配器 `@astrojs/node`（mode: middleware）
- **UI**: React 19（仅交互组件）、Tailwind 4（`@tailwindcss/vite`）、`global.css`（CSS 变量 + 暗色 `class`）
- **内容**: `@astrojs/mdx`，Content Collections（glob/file loaders + Zod），博客在 `src/content/blog`，页面在 `src/content/page`，作者在 `src/content/author`，JSON 配置在 `src/content/json`
- **包管理**: pnpm（lockfile 为 pnpm-lock.yaml）
- **脚本**: `pnpm dev` / `pnpm build` / `pnpm preview`；ESLint 无分号 `semi: ['error', 'never']`（除 eslint.config.js 用分号）

## 目录与职责

| 路径 | 用途 |
|------|------|
| `src/pages/` | 页面与 API 路由；API 在 `src/pages/api/`，动态路由需 `export const prerender = false` |
| `src/layouts/` | `BlogLayout.astro`（前台）、`AdminLayout.astro` + `AdminLayout.tsx`（后台壳子） |
| `src/components/` | 公用组件；`client/` 下为 React 客户端组件，`admin/` 下为后台 React 组件 |
| `src/lib/` | 数据与鉴权：`comments-db`、`shortlinks-db`、`admin-token-db`、`admin-site-config-db`、`admin-auth` |
| `src/utils/` | 工具与派生数据：`index.ts`（titleToUrl、generatePostId/PageId/AuthorId/CategoryId/TagId、formatDate 等）、`derived-collections.ts`（分类/标签从文章派生） |
| `src/templates/` | CLI 用（如 `post.tsx` 生成文章 frontmatter） |
| `src/content.config.ts` | Content collection 定义与 schema（post、page、author、link、menu、setting、holiday、navigationWebsiteData） |
| `src/plugins/` | `remark-custom-directives.mjs`、`rehype-custom-directives.mjs` |
| `src/scripts/` | 前端脚本（如 `pjax.ts`、`search.ts`） |
| `src/types.ts` | 全局类型（ARTICLE、POST、PAGE、CATEGORY、TAG 等） |
| `data/` | lowdb 持久化（comments、shortlinks、admin 配置等），运行时生成 |

## 类型与路径别名

- 文章/页面/作者 ID 与 URL：用 `@utils/index` 的 `generatePostId`、`generatePageId`、`generateAuthorId`、`titleToUrl` 等，与 `content.config` 中 loader 的 `generateId` 一致
- 类型从 `src/types.ts` 或各模块导出引入；API 返回统一用 JSON，如 `{ data: T }` 或 `{ error: string }`
- 路径别名：`@/*` → `src/*`，`@utils/*` → `src/utils/*`，`@components/*`、`@layouts/*`、`@assets/*`、`@pages/*`、`@templates/*` 同理

## 前台页面约定

- 使用 `BlogLayout.astro`，传入 `title`；从 `getCollection('post', ...)` 取文章，用 `getDerivedFromPosts(posts)` 得到 categories/tags 与计数
- 站点名、菜单等来自 `getCollection('menu')`、`getCollection('setting')`；`lang="zh-CN"`
- 主题与色相：CSS 变量 `--header-bg`、`--border`、`--text`、`--accent`、`--hue`；暗色用 `class="dark"`，脚本内可读 `localStorage` 的 `theme` / `themeHue`

## API 路由约定

- 文件即路由，如 `src/pages/api/comments/index.ts` → `/api/comments`
- 使用 `APIRoute`，返回 `new Response(JSON.stringify(...), { headers: { 'Content-Type': 'application/json' } })`
- 需要服务端执行的 API 设置 `export const prerender = false`
- 校验请求体/查询参数后，再调用 `src/lib/*-db` 或业务逻辑；错误返回 4xx + `{ error: string }`

## 后台 Admin 约定

- 路由以 `/admin` 开头；鉴权在 `src/middleware.ts`（session `adminLoggedIn`），未登录重定向到 `/admin/login`
- 后台 API 在 `src/pages/api/admin/`，需校验管理员身份（如用 `admin-auth` 或 session）
- 后台页面用 `AdminLayout.astro` 包一层，内层用 `AdminLayout.tsx` 提供导航、主题、登出等

## 新增/修改内容集合

- 在 `src/content.config.ts` 中 `defineCollection`，用 `glob()` 或 `file()` loader，schema 用 Zod，需与 `src/types.ts` 或现有类型一致
- 文章 frontmatter 含 `title`、`alias`、`categories`、`tags`、`published`、`created_time`、`updated_time` 等，与 `baseSchema` / `withComputed` 一致；URL 由 `titleToUrl(alias || title)` 与 prefix 决定

## 新增 React 组件

- 仅在有交互时使用 React；放 `src/components/client/` 或 `src/components/admin/`
- 在 Astro 中通过 `client:load`（或其它 directive）引入；Props 与 TypeScript 接口保持一致

## 样式与主题

- 优先 Tailwind 工具类；全局/复杂样式放在 `src/assets/styles/global.css`
- 暗色与色相由 `document.documentElement.classList` 和 `--hue` 控制，与 `DarkModeToggle`、`ThemeColor` 等现有逻辑一致
- **页面样式与设计风格**须与现有一致，详见下一节

## 页面样式与设计风格

项目采用**终端/CLI 风格**的视觉语言，新页面与组件需遵循以下约定。

### 设计语言

- **主题**：像在终端里「敲命令、看输出」——导航用 `$`、`›`，区块标题用 `# export …`、`$ cd categories` 等拟终端文案；列表用等宽字体、行内符号（如 `@` 日期、`▸` 分类、`#` 标签）
- **色彩**：全部通过 CSS 变量，禁止硬编码色值。亮/暗色在 `:root` 与 `.dark` 中分别定义

### 色彩与字体变量（global.css）

- **颜色**：`--page-bg`、`--card-bg`、`--card-border`、`--text`、`--text-muted`、`--accent`、`--accent-2`/`--accent-3`、`--header-bg`、`--footer-bg`、`--border`；色相由 `--hue`（0–360）统一控制，亮暗主题用 oklch 区分
- **字号**：`--text-xs` ~ `--text-4xl`（0.75rem ~ 2.25rem）
- **圆角/阴影**：`--radius`、`--radius-sm`；`--shadow`、`--shadow-hover`
- **字体**：正文 `system-ui, PingFang SC, sans-serif`；终端/代码感用 `--font-mono`（ui-monospace, SF Mono, Fira Code 等）
- **动效**：`--duration-fast/normal/slow`、`--ease-out-soft`、`--ease-bounce`；尊重 `prefers-reduced-motion`

### 布局

- 主内容区：`max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 md:py-8`；主栏 + 侧栏用 `flex flex-col lg:flex-row gap-8 lg:gap-10`，侧栏 `w-64 shrink-0 hidden lg:block`，`sticky top-24`
- 主内容容器 id：`id="pjax-main"`，class 可带 `page-main`（`.page-main` 有段落/区块间距规则）

### 语义化样式类（优先复用）

| 类名 | 用途 |
|------|------|
| `section-card` | 卡片容器：白/暗底、边框、圆角、hover 时边框高亮与轻微上移 |
| `section-title` | 区块标题，内可放 `section-prompt`（如 `$`、`#`） |
| `code-label` | 终端风格小字：mono、`--text-xs`、`--text-muted` |
| `nav-link-cute` | 导航链接：下划线动画、hover 轻微位移 |
| `terminal-list` | 终端风格列表容器；列表项可用 `post-card-cute` 或 `terminal-item` |
| `terminal-list-sidebar` | 侧栏用终端列表（带行提示符 `line-prompt`） |
| `post-card-cute` | 文章卡片：拟 export 行 + 标题 + 元信息行（日期/分类/标签） |
| `back-to-top` | 返回顶部按钮样式 |
| `prose` / `markdown-body` | 正文排版（标题层级、链接下划线动画、引用、列表等已在 global.css 定义） |

### 内联样式约定

- 需要绑定设计 token 时用内联 `style="..."`，例如：`style="color:var(--text-muted)"`、`style="font-size:var(--text-xs);font-family:var(--font-mono)"`、`style="background:var(--header-bg);border-color:var(--border)"`
- 与 Tailwind 混用时，颜色/字体优先用上述变量，保持亮暗主题一致

### 动效

- 首屏区块入场：`animate-in` + `animate-in-delay-1` ~ `animate-in-delay-10`（fade-in-up，错开延迟）
- 交互动效：`transition-opacity`、`transition-colors`，时长用 `var(--duration-fast)` 等；hover 可配合 `translateY(-2px)`、边框/阴影变化

### 新增样式时

- 能复用现有类则不加新类；新类写在 `src/assets/styles/global.css`，使用现有 CSS 变量，并考虑 `.dark` 下的表现
- 新页面结构参考 `index.astro`：Banner → `intro-bubble`（code-label）→ `<section>` + `section-title` + `section-card` + `terminal-list` / `post-list` + PostCard

## 开发检查清单

- [ ] 新 API 需服务端执行时已设 `prerender = false`
- [ ] 新页面使用正确 layout（Blog 或 Admin）并传入所需 props
- [ ] 类型从 `src/types.ts` 或对应 lib 引入，无硬编码 ID/URL 逻辑（用 utils）
- [ ] 代码风格：无分号，ESLint 通过
- [ ] 中文注释/文案可接受；用户可见文案保持与现有风格一致（如「请填写昵称和内容」等）
- [ ] 页面样式：使用 CSS 变量与语义化类（section-card、code-label、terminal-list 等），保持终端/CLI 风格与亮暗主题一致
