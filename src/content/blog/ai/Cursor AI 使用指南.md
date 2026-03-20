---
id: 0a3ad0cf-b344-55df-a89c-46b69161f132
title: Cursor AI 使用指南
cover:
created_time: 2026-03-20 17:00:06
updated_time: 2026-03-20 17:00:06
categories:
  - ai
tags:
  - Cursor
  - AI
  - 编程助手
  - Rules
  - Skills
  - MCP
excerpt: 一份面向开发者的 Cursor AI 使用指南，涵盖 Chat、Composer、Rules、Commands、Skills、MCP、Subagent 与实用技巧。
published: true
---

Cursor 是基于 VS Code 的 AI 编程编辑器，内置多模型对话、代码补全与智能编辑能力。**Chat** 侧重问答与解释，**Agent（Composer）** 可执行多文件编辑、调用工具、委派子代理。本文介绍其核心功能与使用技巧。

<!-- more -->

## 核心功能概览

### 1. Chat（对话）

- **Cmd/Ctrl + L** 打开侧边栏对话
- 支持多轮对话、引用文件、追问上下文
- 可切换模型（Claude、GPT 等，取决于订阅）
- 适合：解释代码、写文档、排查问题、学习概念

### 2. Composer（多文件编辑）

- **Cmd/Ctrl + I** 打开 Composer
- 可跨多个文件进行增删改
- 支持 @ 引用文件、文件夹、符号
- 适合：重构、加功能、修 bug、批量修改

### 3. Inline Edit（行内编辑）

- 选中代码后按 **Cmd/Ctrl + K** 触发
- 在光标处直接修改当前文件
- 适合：小范围改写、补全、格式化

### 4. Tab 补全

- 输入时自动给出补全建议
- **Tab** 接受建议
- 适合：快速写样板代码、补全重复模式

## 引用与上下文

用好 `@` 能显著提升效果：

| 引用类型    | 示例                  | 用途                   |
| ----------- | --------------------- | ---------------------- |
| `@文件名`   | `@src/utils/index.ts` | 指定要分析/修改的文件  |
| `@文件夹`   | `@src/components/`    | 引用整个目录           |
| `@Codebase` | `@Codebase`           | 搜索整个代码库         |
| `@符号`     | `@function parseArgs` | 精确定位函数、类等     |
| `@Docs`     | `@Astro`              | 引用官方文档（需联网） |
| `@Web`      | `@Web`                | 搜索网络获取最新信息   |

在 Composer 中引用多个文件，可以让 AI 理解项目结构后再做修改。

## Rules（规则）

规则是简短的编码约定，让 AI 在对话中持续遵循你的项目规范。

### 配置位置

| 位置     | 路径                       | 作用范围 |
| -------- | -------------------------- | -------- |
| 项目规则 | `.cursor/rules/*.mdc`      | 当前项目 |
| 全局规则 | Cursor 设置 → Rules for AI | 所有项目 |

### 规则文件格式

```yaml
---
description: 规则描述（在规则选择器中显示）
globs: '**/*.ts' # 可选，仅匹配文件时生效
alwaysApply: true # 可选，true 表示每次对话都应用
---
# 规则内容
```

### 使用建议

- **alwaysApply: true**：适用于通用约定（技术栈、代码风格、目录结构）
- **globs**：适用于特定文件类型（如 `**/*.tsx` 的 React 规范）
- 保持规则简洁，单条规则控制在 50 行以内

## Commands（斜杠命令）

Commands 是 `/` 开头的快捷指令，可映射到特定 AI 动作或工具。

### 与 Skills 的关系

Cursor 2.4+ 中，**Skills** 是更推荐的方式：复杂工作流用 Skills，简单快捷操作用 Rules 或内置命令。可通过 `/migrate-to-skills` 将旧版 slash commands 迁移为 Skills。若任务单一、无需上下文隔离，用 slash command 或 Skill 均可；若需多步流程，优先 Skills。

### 常见用法

- 在 `.cursor/rules/` 中定义带斜杠模式的规则（或迁移为 Skills）
- 可映射到代码搜索、文件编辑、终端命令等
- 社区示例：`hamzafer/cursor-commands`（code-review、lint-fix、security-audit 等）

## Skills（技能）

Skills 是可复用的多步骤工作流，比 Rules 更详细，适合需要「按步骤执行」的任务。

### 概念

- **Rules**：短约束，每次对话自动带入
- **Skills**：长流程，按需用 `/skill-name` 或 `@skill-name` 调用

### 存储位置

| 类型   | 路径                       | 作用范围 |
| ------ | -------------------------- | -------- |
| 项目级 | `.cursor/skills/技能名/`   | 当前项目 |
| 用户级 | `~/.cursor/skills/技能名/` | 所有项目 |

兼容路径：`.agents/skills/`、`.claude/skills/`、`.codex/skills/` 等。

### 创建方式

1. 在 Chat 中输入 `/create-skill`，按提示创建
2. 手动创建：在 `.cursor/skills/your-skill-name/` 下添加 `SKILL.md`

### SKILL.md 结构

```markdown
---
name: skill-name
description: 简短描述，说明何时使用（Agent 据此决定是否调用）
---

# 技能名称

## 步骤

1. 第一步
2. 第二步
3. ...
```

### 使用方式

- 输入 `/技能名` 执行（如 `/write-tests`）
- 输入 `@技能名` 作为上下文附加到对话

### 何时用 Skills 而非 Rules

| 场景                         | 用 Rules | 用 Skills |
| ---------------------------- | -------- | --------- |
| 代码风格、命名规范           | ✅       |           |
| 部署流程、安全审计、多步重构 |          | ✅        |

## MCP（Model Context Protocol）

MCP 是 Cursor 连接外部工具与数据源的协议，让 AI 能调用数据库、API、文件系统等。

### 核心能力

- 连接数据库（MySQL、PostgreSQL 等）执行查询
- 调用外部 API 获取实时数据
- 集成 Google Drive、Notion、Figma 等
- 执行系统命令、读写文件

### 配置方式

在 `.cursor/mcp.json`（项目）或 `~/.cursor/mcp.json`（全局）中配置：

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "mcp-server"],
      "env": { "API_KEY": "your-key" }
    }
  }
}
```

### 传输方式

| 方式       | 环境       | 适用                   |
| ---------- | ---------- | ---------------------- |
| stdio      | 本地       | 单用户，Shell 命令启动 |
| SSE / HTTP | 本地或远程 | 多用户，需部署服务     |

### 使用建议

- 从 [Cursor Marketplace](https://cursor.com/marketplace) 或 [cursor.directory](https://cursor.directory) 安装现成 MCP 服务
- 敏感数据用环境变量传 API Key，不要硬编码
- 可在设置（Cmd/Ctrl + ,）→ Features → Model Context Protocol 中启用/禁用单个 MCP 服务
- 修改 `mcp.json` 后需**重启 Cursor** 才能生效

## Subagent（子代理）

子代理是专门化的 AI 助手，主 Agent 可将复杂任务委派给它们，在独立上下文中执行。

### 特点

- **上下文隔离**：子代理在单独上下文中运行，不占用主对话空间
- **并行执行**：可同时启动多个子代理处理不同任务
- **专业配置**：可为子代理指定提示词、工具权限和模型

### 内置子代理

| 类型        | 用途                                     |
| ----------- | ---------------------------------------- |
| **Explore** | 搜索、分析代码库（使用更快模型并行搜索） |
| **Bash**    | 执行 shell 命令（隔离冗长输出）          |
| **Browser** | 通过 MCP 控制浏览器（DOM 快照、截图）    |

### 自定义子代理

在 `.cursor/agents/`（项目）或 `~/.cursor/agents/`（用户）下创建 Markdown 文件。兼容路径：`.claude/agents/`、`.codex/agents/`。项目子代理优先于用户子代理。

```markdown
---
name: 子代理名称
description: 简短描述（Agent 据此决定是否自动委派）
model: inherit    # inherit | fast | 具体模型 ID
readonly: false    # true 时禁止写文件、执行有副作用的命令
is_background: false
---

具体提示词与工作流程
```

### 运行模式

| 模式 | 行为                             |
| ---- | -------------------------------- |
| 前台 | 阻塞直到子代理完成，立即返回结果 |
| 后台 | 立即返回，子代理在后台独立运行   |

### 调用方式

- **自动委派**：Agent 根据任务复杂度和子代理的 `description` 自动选择
- **显式调用**：在 Composer 中输入 `/子代理名 任务描述`（如 `/verifier 验证登录流程是否完成`）
- **并行执行**：可请求 Agent 同时启动多个子代理处理不同部分

### 何时用子代理 vs Skills

| 场景                               | 用子代理 | 用 Skills |
| ---------------------------------- | -------- | --------- |
| 需要上下文隔离、并行、多步专业能力 | ✅       |           |
| 单一用途、快速可重复、一次性任务   |          | ✅        |

> 子代理需 Cursor 2.4+，传统按请求计费套餐需启用 Max Mode。

## 实用技巧

1. **明确任务**：用清晰的中文或英文描述「要做什么」「输入输出」「约束条件」
2. **分步执行**：复杂任务拆成多步，每步验证后再继续
3. **善用引用**：把相关文件、类型定义、接口文档 @ 进来，减少幻觉
4. **迭代修正**：第一次结果不理想时，指出具体问题再让 AI 修改
5. **检查生成代码**：AI 可能漏掉边界情况，关键逻辑务必人工 review

## 快捷键速查

| 操作          | 快捷键               |
| ------------- | -------------------- |
| 打开 Chat     | Cmd/Ctrl + L         |
| 打开 Composer | Cmd/Ctrl + I         |
| 行内编辑      | Cmd/Ctrl + K         |
| 接受 Tab 补全 | Tab                  |
| 新建 Chat     | Cmd/Ctrl + Shift + L |

## 小结

Cursor 把 AI 深度集成进编辑流程：Chat 负责问答与解释，Composer 负责多文件编辑，Inline Edit 负责局部修改。Rules 提供持久化编码约定，Skills 提供可复用的多步工作流，Commands 提供快捷指令；MCP 连接外部工具与数据，Subagent 实现任务委派与并行执行。配合引用（@）和清晰的提示，可以显著提升日常开发效率。
