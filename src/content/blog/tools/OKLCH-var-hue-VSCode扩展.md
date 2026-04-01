---
id: 4afe6b7f-b731-5c73-ab7c-e053e1b48c6d
title: OKLCH + var(--hue) 行内颜色预览（自用 VS Code 扩展）
alias: vscode-oklch-hue-preview
cover:
created_time: 2026-04-01 12:00:00
updated_time: 2026-04-01 14:30:00
categories:
  - tools
tags:
  - VS Code
  - Cursor
  - OKLCH
  - CSS
  - culori
excerpt: 介绍本仓库内 tools/oklch-hue-preview：在 CSS 里为 oklch(... var(--hue)) 提供与浏览器一致的行内色块预览，含安装方式与实现要点。
published: true
---

在 `global.css` 里用 **色相变量** 写主题时，常见写法是 `--hue: 250` 再配合 `oklch(L C var(--hue))`。编辑器自带的色块预览通常**无法解析** `var(--hue)`，第三段在静态分析里不是确定数值，就不会显示颜色。本文记录一个**本地 VS Code / Cursor 扩展**：在同一文件内读出 `--hue`，为整段 `oklch(...)` 注册颜色，效果接近浏览器 DevTools 里 **computed** 的 sRGB。

<!-- more -->

下面按 **「扩展在 VS Code 里做什么 → 怎么从文本里抠出 oklch → 怎么变成屏幕上的颜色」** 说明 `tools/oklch-hue-preview/src/extension.ts` 在干什么。

## 一、扩展在 VS Code 里做什么

VS Code 允许扩展注册 **`DocumentColorProvider`**：对当前文档里某段文字声明「这里对应一个颜色」，编辑器会在这些位置画**行内色块 / 色条**，并参与取色器等行为。

扩展在 **`activate`** 里调用 `vscode.languages.registerColorProvider(selector, provider)`：

- **`provideDocumentColors(document)`**（核心）：返回一组 `{ range, color }`，告诉编辑器「从 `range` 起点到终点这一整段文本，用 `color` 来预览」。这里 `range` 覆盖**整段** `oklch(...)`，所以色条会包住括号内全部内容。
- **`provideColorPresentations` 返回空数组**：不提供「用取色器改色并写回 CSS」的编辑，**只做预览**。
- **`selector`**：限定为磁盘上的 `css` / `scss` / `less` / `postcss` / `tailwindcss`，避免无关文件误触发。

也就是说：扩展不负责画 UI，只负责**往语言服务里交颜色 + 文本范围**；真正的色块由编辑器根据 `vscode.Color`（sRGB、0–1）绘制。

源码目录：**`tools/oklch-hue-preview/`**（esbuild 把 culori 打进单文件，打 VSIX 时用 `--no-dependencies`）。

## 二、怎么从文本里抠出 oklch

`provideDocumentColors` 拿到**整份文件字符串**后，分三步：

1. **`extractHueFromDocument(text)`**  
   用正则找**第一个** `--hue: <数字>;`，得到基准色相 `baseHue`（与同文件 `:root` 写法一致即可）。没有 `--hue` 则直接返回空数组，不注册任何颜色。

2. **`collectOklchCalls(text)`**  
   在全文里找子串 **`oklch(`**，再对 **`oklch(` 后面的第一个 `(`** 做**括号深度扫描**（`indexOfMatchingCloseParen`），找到与之配对的**最外层闭括号**，中间整段就是 `L C H` 的完整内容。  
   **不能用** `[^)]+` 去匹配第三段：像 `var(--hue)`、`calc(var(--hue) + 30)` 内部自带 `)`，简单正则会在第一个 `)` 处截断，第三段就错了。  
   对括号内字符串再用正则拆成：**两个数 L、C**，以及**第三段原始字符串 `hRaw`**（原样交给下一步）。

3. **`resolveHueComponent(hRaw, baseHue)`**  
   把第三段解析成**数值色相** `h`：支持纯数字、`var(--hue)` → `baseHue`、`calc(var(--hue) ± n)` → 加减。解析失败则跳过该条 `oklch`，不注册颜色。

## 三、怎么变成屏幕上的颜色

对每个成功解析的 `(L, C, h)`：

1. 构造 culori 对象 `{ mode: 'oklch', l, c, h }`。
2. 先 **`toGamut('rgb', 'oklch')`**：按 culori/CSS Color 4 思路把 Oklch **映射到 sRGB 色域内**，避免高 chroma 时直转出现**负通道**或 **&gt; 1**，与浏览器最终着色更一致。
3. 再 **`converter('rgb')`** 得到 `rgb` 模式下的 `r, g, b`。
4. **`vscode.Color`** 需要 **0–1 的 sRGB**；culori 多为 0–1，少数路径可能是 0–255，因此对每个通道做 `> 1` 时除以 255，再 **clamp 到 [0, 1]**。
5. **`new vscode.Color(r, g, b, alpha)`** 与第二步里算好的 **`Range`** 组成一条 `ColorInformation` 返回。

整体数据流可以记成：**文件全文 → 第一个 `--hue` → 扫描所有 `oklch(...)`（括号配对）→ 解析 L、C、H（含 var/calc）→ Oklch + 色域映射 → RGB → `vscode.Color` + 整段 `range` → 编辑器画色块**。

## 局限（有意简化）

- 只认**当前文件**里的 `--hue`**，不读其它样式表、不模拟 `.dark` 下另一套变量。
- 运行时脚本里 `setProperty('--hue', …)` 改动的值，编辑器**无法**知道。
- 第三段仅支持常见写法：**纯数字**、`var(--hue)`、`calc(var(--hue) ± n)`。

## 安装与打包

在仓库根目录：

```bash
cd tools/oklch-hue-preview
pnpm install
pnpm compile
pnpm package
```

生成 **`oklch-hue-preview-0.1.2.vsix`**（版本以该目录下 `package.json` 为准）。在 Cursor / VS Code 中：**命令面板** → **Extensions: Install from VSIX...** → 选择该文件 → **Reload Window**。

开发调试：用编辑器单独打开 **`tools/oklch-hue-preview`** 文件夹，**F5** 启动 Extension Development Host，在新窗口中再打开本仓库的 `src/assets/styles/global.css` 即可验证。

## 小结

这是给「**同文件 `--hue` + `oklch`**」场景用的**本地小工具**，不上架市场也能自用。若你也在用 OKLCH 主题 token，可对照 **`tools/oklch-hue-preview/README.md`** 与源码 **`src/extension.ts`** 按需改规则或版本号。
