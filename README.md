# Astro-learn

基于 **Astro 5** 构建的技术博客，支持 SSR、Content Collections、MDX、评论、短链接与后台管理。

## 技术栈

- **Astro 5** — 主框架，SSR 模式（`output: 'server'`）
- **适配器** — `@astrojs/node`（middleware 模式）
- **UI** — React 19 + Vue 3（交互组件）；静态页面用 `.astro`
- **样式** — Tailwind 4（`@tailwindcss/vite`）
- **内容** — `@astrojs/mdx`，Content Collections（glob/file + Zod）
- **数据** — lowdb，持久化到 `data/` 目录
- **包管理** — pnpm

## 项目结构

```
/
├── public/                 # 静态资源
├── src/
│   ├── assets/             # 样式、字体等
│   ├── components/         # Astro / React / Vue 组件
│   │   ├── client/         # 客户端交互组件（React）
│   │   ├── vue/            # Vue 组件
│   │   └── admin/          # 后台管理组件
│   ├── content/            # Content Collections
│   │   ├── blog/           # 文章
│   │   ├── page/           # 页面（关于等）
│   │   ├── author/         # 作者
│   │   ├── json/           # link、menu、setting 等 JSON
│   └── ...
├── data/                   # lowdb 数据（运行时生成）
├── astro.config.mjs
├── server.mjs              # Node 服务入口
└── package.json
```

## 命令

| 命令                   | 说明                              |
| ---------------------- | --------------------------------- |
| `pnpm install`         | 安装依赖                          |
| `pnpm dev`             | 本地开发（默认 `localhost:4321`） |
| `pnpm build`           | 构建生产版本到 `./dist/`          |
| `pnpm preview`         | 预览构建结果                      |
| `pnpm start`           | 启动生产服务（`node server.mjs`） |
| `pnpm run pack`        | 打包 dist + server 为 tar.gz      |
| `pnpm run pack:build`  | 构建 + 打包                       |
| `pnpm run lint`        | ESLint 检查并修复                 |
| `pnpm run pm2:start`   | 使用 PM2 启动                     |
| `pnpm run pm2:restart` | PM2 重启                          |

## 功能概览

- **博客** — 首页、归档、分类、标签、搜索（FlexSearch）
- **页面** — 关于、友链、类库导航
- **评论** — lowdb 存储，后台审核
- **短链接** — `/s/{slug}` 跳转，后台管理
- **后台** — `/admin`（评论、短链接、站点配置、内容数据）
- **主题** — 亮/暗模式、色相调节
- **RSS / Sitemap** — 自动生成

## 部署

- **Docker**：详见 [DOCKER.md](./DOCKER.md)
- **PM2**：`pnpm build && pnpm run pm2:start`

## 开发

- 路径别名：`@/*`、`@components/*`、`@layouts/*`、`@utils/*` 等
- 无分号；TypeScript strict
- 后台需先配置 Token（首次登录用 token，持久化到 `data/admin-token-config.json`）

## 致谢

- [Astro](https://astro.build)
- 开源社区
