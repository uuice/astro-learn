#!/usr/bin/env bun

import { newCommand } from './commands/new.ts'
import { helpCommand } from './commands/help.ts'
import { versionCommand } from './commands/version.ts'

interface CLIOptions {
  [key: string]: string | boolean | number | undefined
}

async function parseArgs(args: string[]): Promise<{ command: string; subcommand?: string; args: string[]; options: CLIOptions }> {
  const result = {
    command: '',
    subcommand: undefined as string | undefined,
    args: [] as string[],
    options: {} as CLIOptions
  }

  let i = 0
  while (i < args.length) {
    const arg = args[i]

    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=', 2)
      result.options[key] = value !== undefined ? value : true
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1)
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        result.options[key] = args[++i]
      } else {
        result.options[key] = true
      }
    } else {
      if (!result.command) {
        result.command = arg
      } else if (!result.subcommand && ['post', 'page', 'author'].includes(arg)) {
        result.subcommand = arg
      } else {
        result.args.push(arg)
      }
    }
    i++
  }

  return result
}

async function main() {
  const args = process.argv.slice(2)
  console.log(args)

  if (args.length === 0) {
    helpCommand()
    return
  }

  const { command, subcommand, args: restArgs, options } = await parseArgs(args)

  if (options.help || options.h) {
    helpCommand()
    return
  }

  if (options.version || options.v) {
    versionCommand()
    return
  }

  try {
    switch (command) {
      case 'new': {
        if (!subcommand || restArgs.length === 0) {
          console.error('❌ Error: Type and title are required for new command')
          console.log('Usage: cli new <type> <title> [options]')
          console.log('Types: post, page, author')
          process.exit(1)
        }

        const title = restArgs[0]
        const newOptions = {
          path: (options.path || options.p) as string,
          extension: (options.extension || options.e) as string
        }

        await newCommand(subcommand, title, newOptions)
        break
      }

      case 'help':
        helpCommand()
        break

      default:
        console.error(`❌ 未知命令: ${command}`)
        helpCommand()
        process.exit(1)
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`❌ Error: ${errorMessage}`)
    process.exit(1)
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error('❌ 程序执行失败:', error)
    process.exit(1)
  })
}

export { main }
