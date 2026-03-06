import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import remarkToc from 'remark-toc'
import rehypeSlug from 'rehype-slug'
import rehypePresetMinify from 'rehype-preset-minify'
import tailwindcss from '@tailwindcss/vite'
import node from '@astrojs/node'
import react from '@astrojs/react'

const rehypePluginsBase = [rehypeSlug]

export default defineConfig({
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
    remarkPlugins: [[remarkToc, { heading: '目录', maxDepth: 3 }]],
    rehypePlugins: [...rehypePluginsBase],
    gfm: true,
  },

  integrations: [mdx({
    syntaxHighlight: 'shiki',
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
    remarkPlugins: [[remarkToc, { heading: '目录', maxDepth: 3 }]],
    rehypePlugins: [...rehypePluginsBase, rehypePresetMinify],
    remarkRehype: { footnoteLabel: 'Footnotes' },
    gfm: true,
    extendMarkdownConfig: true,
  }), react()],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: node({
    mode: 'middleware',
  }),

  security: {
    checkOrigin: false,
  },
}) 