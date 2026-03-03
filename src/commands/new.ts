import { join } from 'path'
import { mkdir, stat, writeFile } from 'fs/promises'
import { formatDate, generateAuthorId, generatePageId, generatePostId } from '@utils/index'
import { AuthorTemplate, PageTemplate, PostTemplate } from '@templates/index'

export interface NewCommandOptions {
  path?: string
  extension?: string
}

export async function newCommand(type: string, title: string, options: NewCommandOptions = {}) {
  if (!type || !title) {
    throw new Error('Type and title are required')
  }

  const { path: subPath = '', extension = 'md' } = options
  const currentTime = formatDate()

  // Validate extension
  if (extension !== 'md' && extension !== 'mdx') {
    throw new Error(`Unknown extension: ${extension}. Supported extensions: md, mdx`)
  }

  switch (type.toLowerCase()) {
    case 'post':
      await createPost(title, subPath, currentTime, extension)
      break
    case 'page':
      await createPage(title, subPath, currentTime, extension)
      break
    case 'author':
      await createAuthor(title, subPath, currentTime, extension)
      break
    default:
      throw new Error(`Unknown type: ${type}. Supported types: post, page, author`)
  }
}

async function createPost(title: string, subPath: string, currentTime: string, extension: string) {
  const postId = generatePostId(title)
  const sourcePath = process.cwd()
  const postDir = join(sourcePath, 'src', 'content', 'blog', subPath)
  const postPath = join(postDir, `${title}.${extension}`)

  await ensureDirectoryExists(postDir)
  await checkFileNotExists(postPath, 'post', title)

  const content = PostTemplate({
    id: postId,
    title,
    created_time: currentTime,
    updated_time: currentTime
  })

  await writeFile(postPath, content, 'utf-8')
  console.log(`✅ Post "${title}" created successfully at ${postPath}`)
}

async function createPage(title: string, subPath: string, currentTime: string, extension: string) {
  const pageId = generatePageId(title)
  const sourcePath = process.cwd()
  const pageDir = join(sourcePath, 'src', 'content', 'page', subPath)
  const pagePath = join(pageDir, `${title}.${extension}`)

  await ensureDirectoryExists(pageDir)
  await checkFileNotExists(pagePath, 'page', title)

  const content = PageTemplate({
    id: pageId,
    title,
    created_time: currentTime,
    updated_time: currentTime
  })

  await writeFile(pagePath, content, 'utf-8')
  console.log(`✅ Page "${title}" created successfully at ${pagePath}`)
}

async function createAuthor(title: string, subPath: string, currentTime: string, extension: string) {
  const authorId = generateAuthorId(title)
  const sourcePath = process.cwd()
  const authorDir = join(sourcePath, 'src', 'content', 'author', subPath)
  const authorPath = join(authorDir, `${title}.${extension}`)

  await ensureDirectoryExists(authorDir)
  await checkFileNotExists(authorPath, 'author', title)

  const content = AuthorTemplate({
    id: authorId,
    title,
    created_time: currentTime,
    updated_time: currentTime
  })

  await writeFile(authorPath, content, 'utf-8')
  console.log(`✅ Author "${title}" created successfully at ${authorPath}`)
}

async function ensureDirectoryExists(dirPath: string) {
  try {
    await stat(dirPath)
  } catch {
    await mkdir(dirPath, { recursive: true })
  }
}

async function checkFileNotExists(filePath: string, type: string, title: string) {
  try {
    await stat(filePath)
    throw new Error(`${type} "${title}" already exists at ${filePath}`)
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      throw error
    }
  }
}
