export const helpCommand = () => {
  // ANSI color codes
  const colors = [
    '\x1b[31m', // Red
    '\x1b[32m', // Green
    '\x1b[33m', // Yellow
    '\x1b[34m', // Blue
    '\x1b[35m', // Magenta
    '\x1b[36m', // Cyan
    '\x1b[91m', // Bright Red
    '\x1b[92m', // Bright Green
    '\x1b[93m', // Bright Yellow
    '\x1b[94m', // Bright Blue
    '\x1b[95m', // Bright Magenta
    '\x1b[96m'  // Bright Cyan
  ]
  const reset = '\x1b[0m'

  const helpText = `
CLI - 基于 Bun 的静态博客生成器 | Static blog generator powered by Bun

用法 / Usage:
  cli <command> [options]

命令 / Commands:
  new <type> <title>      创建新的文章、页面或作者 | Create new post, page or author
    类型 / Types: post, page, author
    选项 / Options:
      -p, --path <path>      指定子目录路径 | Specify subdirectory path
      -e, --extension <ext>  文件扩展名 (md, mdx) 默认 md | Extension (default: md)
  version [update_type]   显示或更新版本号 | Show or bump version
    update_type: patch(修复) | minor(新功能) | major(破坏性更新)
  help                    显示帮助 | Show help

选项 / Options:
  -h, --help              显示帮助 | Show help
  -v, --version           显示版本 | Show version

示例 / Examples:
  创建内容 / Create content:
    cli new post "Hello World"
    cli new post "Vue3 入门" -p "frontend"
    cli new page "About Me"
    cli new page "关于" -p "info"
    cli new page "MDX Demo" -e mdx
    cli new author "John Doe"
  版本 / Version:
    cli version            # 显示当前版本 | Show current version
    cli version patch      # 0.0.1 → 0.0.2 (修复) | Patch bump
    cli version minor      # 0.0.1 → 0.1.0 (新功能) | Minor bump
    cli version major      # 0.0.1 → 1.0.0 (破坏性) | Major bump
  其他 / Other:
    cli help
    cli -h
    cli -v
  `

  // Print each line with a different color
  const lines = helpText.trim().split('\n')
  for (let i = 0; i < lines.length; i++) {
    const color = colors[i % colors.length]
    console.log(`${color}${lines[i]}${reset}`)
  }
}
