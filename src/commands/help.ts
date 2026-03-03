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

  // Split help text into lines
  const helpText = `
CLI - 基于 Bun 的静态博客生成器

用法:
  cli <command> [options]

命令:
  new <type> <title>      创建新的文章、页面或作者
    类型: post, page, author
    选项:
      -p, --path <path>      指定子目录路径
      -e, --extension <ext>  指定文件扩展名 (md, mdx) 默认: md
  help                    显示帮助信息

选项:
  -p, --port <port>       服务器端口 (默认: 3060）
  -w, --watch             监听文件变化
  -h, --help              显示帮助信息
  -v, --version           显示版本信息

示例:
  cli new post "Hello World"
  cli new page "About Me" -p "info"
  cli new author "John Doe"
  cli new page "MDX Demo" -e "mdx"
  `

  // Print each line with a different color
  const lines = helpText.trim().split('\n')
  for (let i = 0; i < lines.length; i++) {
    const color = colors[i % colors.length]
    console.log(`${color}${lines[i]}${reset}`)
  }
}
