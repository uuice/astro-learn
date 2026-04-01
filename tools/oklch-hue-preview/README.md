# OKLCH + var(--hue) Preview（本地扩展）

在 **同一文件** 里读取 `--hue: <数字>;`，为 `oklch(l c var(--hue))` 与 `oklch(l c calc(var(--hue) + n))` 注册颜色，让 VS Code / Cursor 显示色块并可用取色器。

## 局限

- 只解析**当前文件**里**第一个** `--hue:`，不模拟 `.dark`、不读其它文件、不管运行时 `setProperty` 改的 hue。
- 未覆盖 `none`、`<angle>` 等语法。

## 打包安装（推荐）

```bash
cd tools/oklch-hue-preview
pnpm install
pnpm compile
pnpm package
```

会在当前目录生成 **`oklch-hue-preview-0.1.2.vsix`**（版本号以 `package.json` 为准）。

**0.1.2**：对 oklch 先做 **sRGB 色域映射**再显示，与浏览器 DevTools 里 `computed` 的 sRGB 一致（高彩度色如 `--accent` 之前会因负通道与浏览器不一致）。

在 Cursor / VS Code：**命令面板** → `Extensions: Install from VSIX...` → 选上述 `.vsix` → 重载窗口。

## 开发调试（不装 VSIX）

用 Cursor / VS Code **打开文件夹** `tools/oklch-hue-preview`，按 **F5**（或 Run → Start Debugging）会启动 **Extension Development Host**；在新窗口里 **文件 → 打开文件夹** 选本仓库 `astro-learn`，再打开 `src/assets/styles/global.css`，应能看到 `oklch(... var(--hue))` 行内色块。

## 与项目 `global.css`

`:root { --hue: 250; }` 与 `oklch(0.98 0.008 var(--hue))` 同文件时即可预览。

## 若仍无效果

1. **卸载旧版再装** 最新 **`oklch-hue-preview-0.1.2.vsix`**（0.1.0 正则问题；0.1.2 色域与浏览器对齐）。
2. 看编辑器**右下角语言模式**是否为 **CSS**（或 PostCSS）；若是 **Plain Text**，点一下改成 CSS。
3. 确认文件里**同一文件**存在 `--hue: 数字;`（与 `oklch` 同文件）。
